(() => {
  'use strict';
  function waves() {
    let paths = '';
    for (let row = 0; row < 55; row++) {
      const y = 115 + row * 7;
      let d = '';
      for (let x = -20; x <= 880; x += 8) {
        const offset = Math.sin(x / 135 + row * .016) * 35 + Math.sin(x / 320) * 21;
        d += `${x === -20 ? 'M' : 'L'}${x} ${(y + offset).toFixed(2)} `;
      }
      paths += `<path d="${d}" fill="none" stroke="${row < 30 ? '#b7aa64' : '#6e9f7d'}" stroke-width=".9" opacity=".35"/>`;
    }
    return paths;
  }
  function rosette() {
    let paths = '';
    for (let layer = 0; layer < 22; layer++) {
      let d = '';
      for (let step = 0; step <= 240; step++) {
        const theta = step * Math.PI / 120;
        const radius = 68 + layer * 4.8 + Math.sin(theta * 18) * (5 + layer * .16);
        const x = 439 + Math.cos(theta) * radius, y = 282 + Math.sin(theta) * radius;
        d += `${step === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      paths += `<path d="${d}Z" fill="none" stroke="#6c9e82" stroke-width=".65"/>`;
    }
    return paths;
  }
  function barcode(number) {
    // Deterministic visual stripes for this training card; the app does not scan them.
    const patterns = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
    const bits = '101' + [...number].map((digit, index) => index % 2 ? patterns[Number(digit)].replace(/[01]/g, bit => bit === '1' ? '0' : '1') : patterns[Number(digit)]).join('') + '101';
    const unit = 240 / bits.length;
    return [...bits].map((bit, index) => bit === '1' ? `<rect x="${(39 + index * unit).toFixed(3)}" y="465" width="${unit.toFixed(3)}" height="31"/>` : '').join('');
  }
  globalThis.IDCardArtwork = Object.freeze({waves, rosette, barcode});
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const svg = $('identity-card');
  const field = key => svg.querySelector(`[data-field="${key}"]`);
  const {gregorian, hijri, arabicDigits} = IDEngine;
  const engine = IDEngine.createEngine();
  const images = new Map(), photoCache = new Map();
  let current, generation = 0;
  svg.querySelector('[data-art="waves"]').innerHTML = waves();
  svg.querySelector('[data-art="rosette"]').innerHTML = rosette();
  function fitName(element, width, max, min) {
    element.removeAttribute('textLength');element.removeAttribute('lengthAdjust');
    element.setAttribute('font-size', max);
    const measured = element.getComputedTextLength();
    if (measured > width) element.setAttribute('font-size', Math.max(min, max * width / measured).toFixed(2));
    if (element.getComputedTextLength() > width) {element.setAttribute('textLength', width);element.setAttribute('lengthAdjust','spacingAndGlyphs');}
  }
  const loadImage = gender => {
    if (!images.has(gender)) images.set(gender, new Promise((resolve, reject) => {
      const image = new Image();image.onload = () => resolve(image);image.onerror = reject;image.src = PortraitAssets[gender];
    }));
    return images.get(gender);
  };
  async function portrait(data, mode) {
    const cacheKey = `${data.person.gender}-${data.portraitVariant}-${mode}`;
    if (photoCache.has(cacheKey)) return photoCache.get(cacheKey);
    const image = await loadImage(data.person.gender);
    const canvas = document.createElement('canvas');
    const pixel = mode === 'pixel';
    canvas.width = pixel ? 20 : 240;canvas.height = pixel ? 25 : 300;
    const context = canvas.getContext('2d');
    const crops = [[0,0,1,1],[.025,.02,.95,.95],[.01,.055,.98,.92],[.035,.035,.93,.95]];
    const [x,y,w,h] = crops[data.portraitVariant];
    context.drawImage(image, x*image.width, y*image.height, w*image.width, h*image.height, 0,0,canvas.width,canvas.height);
    const source = canvas.toDataURL(pixel ? 'image/png' : 'image/jpeg', .82);
    photoCache.set(cacheKey,source);return source;
  }
  async function updatePortrait(data) {
    const revision = ++generation;
    const mode = $('portrait-mode').value;
    const source = await portrait(data, mode);
    if (revision !== generation) return;
    for (const key of ['portrait','ghost-portrait']) {
      for (const element of document.querySelectorAll(`[data-field="${key}"]`)) {
        element.setAttribute('href',source);element.style.imageRendering = mode === 'pixel' ? 'pixelated' : 'auto';
        const zoom = element.closest('svg').id.startsWith('zoom-') ? 'zoom-' : '';
        element.setAttribute('filter', mode === 'pixel' ? 'none' : `url(#${zoom}${key === 'portrait' ? 'photo-soft' : 'ghost-soft'})`);
      }
    }
  }
  function render(data) {
    const text = {
      version:`رقم النسخة: ${arabicDigits(data.version)}`, 'arabic-name':data.name, 'latin-name':data.latinName,
      'arabic-number':arabicDigits(data.idNumber), 'latin-number':data.idNumber,
      'hijri-birth':arabicDigits(hijri(data.birthDate)), 'gregorian-birth':gregorian(data.birthDate),
      'hijri-expiry':arabicDigits(hijri(data.expiryDate)), 'gregorian-expiry':gregorian(data.expiryDate),
      birthplace:data.birthPlace, 'barcode-number':data.idNumber
    };
    Object.entries(text).forEach(([key,value]) => {field(key).textContent = value;});
    svg.querySelector('[data-art="barcode"]').innerHTML = barcode(data.idNumber);
    fitName(field('arabic-name'),740,28,21);fitName(field('latin-name'),736,20,14);fitName(field('birthplace'),137,23,18);
    $('card-svg-description').textContent = `نموذج تجريبي — ليست بطاقة هوية حقيقية. ${data.name}، الرقم التجريبي ${data.idNumber}، تاريخ الميلاد ${gregorian(data.birthDate)}، تاريخ الانتهاء ${gregorian(data.expiryDate)}، مكان الميلاد ${data.birthPlace}.`;
    const details = {'detail-name':data.name,'detail-number':data.idNumber,'detail-age':`${data.age} سنة`,'detail-gender':data.person.gender === 'female' ? 'أنثى' : 'ذكر',
      'detail-birth-greg':gregorian(data.birthDate),'detail-birth-hijri':hijri(data.birthDate),
      'detail-expiry-greg':gregorian(data.expiryDate),'detail-expiry-hijri':hijri(data.expiryDate),
      'detail-birthplace':data.birthPlace,'detail-ledger-name':data.person.ledgerName};
    Object.entries(details).forEach(([key,value]) => {$(key).textContent = value;});
    const validity = $('validity-label');validity.textContent = data.expired ? 'بطاقة منتهية' : 'بطاقة سارية';validity.classList.toggle('expired',data.expired);
    $('today-label').textContent = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(data.today);
    $('announcement').textContent = 'تم توليد هوية جديدة.';
    updatePortrait(data).catch(() => {$('announcement').textContent = 'تعذّر تحميل الصورة الشخصية. البيانات جاهزة للمراجعة.';});
  }
  function generate(event) {
    event?.preventDefault();
    current = engine.generate({gender:$('gender-mode').value === 'auto' ? undefined : $('gender-mode').value, expiryMode:$('expiry-mode').value});
    render(current);
  }
  function openZoom() {
    const clone = svg.cloneNode(true);
    const all = [clone,...clone.querySelectorAll('*')];
    for (const element of all) {
      for (const attribute of [...element.attributes]) {
        if (attribute.name === 'id') element.setAttribute(attribute.name, 'zoom-' + attribute.value);
        else if (attribute.value.includes('url(#')) element.setAttribute(attribute.name, attribute.value.replaceAll('url(#','url(#zoom-'));
        else if (attribute.name === 'href' && attribute.value.startsWith('#')) element.setAttribute('href','#zoom-' + attribute.value.slice(1));
        else if (['aria-labelledby','aria-describedby'].includes(attribute.name)) element.setAttribute(attribute.name,attribute.value.split(' ').map(id => 'zoom-' + id).join(' '));
      }
    }
    $('zoom-content').replaceChildren(clone);$('zoom-dialog').showModal();
  }
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const dark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : preference.matches;
  function themeLabel() {$('theme-button').setAttribute('aria-label',dark() ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');}
  $('theme-button').addEventListener('click', () => {const theme = dark() ? 'light' : 'dark';document.documentElement.dataset.theme = theme;try{localStorage.setItem('tuwaiq-theme',theme);}catch{}themeLabel();});
  preference.addEventListener('change',themeLabel);
  $('id-form').addEventListener('submit',generate);
  $('gender-mode').addEventListener('change',generate);$('expiry-mode').addEventListener('change',generate);
  $('portrait-mode').addEventListener('change', () => updatePortrait(current).catch(() => {$('announcement').textContent = 'تعذّر تحميل الصورة الشخصية.';}));
  $('zoom-button').addEventListener('click',openZoom);$('close-zoom').addEventListener('click', () => $('zoom-dialog').close());
  $('about-button').addEventListener('click', () => $('about-dialog').showModal());$('close-about').addEventListener('click', () => $('about-dialog').close());
  document.fonts.ready.then(() => {if(current){fitName(field('arabic-name'),740,28,21);fitName(field('latin-name'),736,20,14);fitName(field('birthplace'),137,23,18);}});
  themeLabel();generate();
})();
