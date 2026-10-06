(() => {
  'use strict';
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const artwork=TrainingCardTemplate.replace(/(<g[^>]*data-art="waves"[^>]*>)(<\/g>)/,'$1'+IDCardArtwork.waves()+'$2').replace(/(<g[^>]*data-art="rosette"[^>]*>)(<\/g>)/,'$1'+IDCardArtwork.rosette()+'$2');
  function prefixIds(svg,prefix){return svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replaceAll('url(#',`url(#${prefix}-`).replace(/(aria-labelledby|aria-describedby)="([^"]+)"/g,(_,attr,ids)=>`${attr}="${ids.split(' ').map(id=>prefix+'-'+id).join(' ')}"`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#${prefix}-${id}"`);}
  function values(card){
    const {gregorian:g,hijri:h,arabicDigits:a}=IDEngine;
    return {version:`رقم النسخة: ${a(card.version)}`,'arabic-name':card.name,'latin-name':card.latinName,'arabic-number':a(card.idNumber),'latin-number':card.idNumber,'hijri-birth':a(h(card.birthDate)),'gregorian-birth':g(card.birthDate),'hijri-expiry':a(h(card.expiryDate)),'gregorian-expiry':g(card.expiryDate),birthplace:card.birthPlace,'barcode-number':card.idNumber};
  }
  const description=card=>`نموذج تجريبي — ليست بطاقة هوية حقيقية. ${card.name}، الرقم ${card.idNumber}، تاريخ الانتهاء ${IDEngine.gregorian(card.expiryDate)}.`;
  function render(card,prefix='training'){
    const fields=values(card);
    let svg=artwork.replace(/(<text[^>]*data-field="([^"]+)"[^>]*>)[\s\S]*?(<\/text>)/g,(_,start,key,end)=>start+escape(fields[key])+end);
    svg=svg.replace(/<image[^>]*data-field="[^"]*"[^>]*\/>/g,tag=>tag.replace('/>',` href="${PortraitAssets[card.person.gender]}"/>`));
    svg=svg.replace(/(<g[^>]*data-art="barcode"[^>]*>)(<\/g>)/,(_,start,end)=>start+IDCardArtwork.barcode(card.idNumber)+end);
    svg=svg.replace(/(<desc[^>]*>)[\s\S]*?(<\/desc>)/,(_,start,end)=>start+escape(description(card))+end);
    return prefixIds(svg,prefix);
  }
  function fit(root){
    for(const [key,width,max,min] of [['arabic-name',740,28,19],['latin-name',736,20,13],['birthplace',137,23,17]]){
      const node=root.querySelector(`[data-field="${key}"]`);if(!node)continue;
      node.removeAttribute('textLength');node.removeAttribute('lengthAdjust');node.style.fontSize=`${max}px`;
      const measured=node.getComputedTextLength();if(measured>width)node.style.fontSize=`${Math.max(min,max*width/measured)}px`;
      if(node.getComputedTextLength()>width){node.setAttribute('textLength',width);node.setAttribute('lengthAdjust','spacingAndGlyphs');}
    }
  }
  function update(root,card){
    if(!root.querySelector('svg'))root.innerHTML=render(card);
    else{
      for(const [key,value] of Object.entries(values(card)))root.querySelector(`[data-field="${key}"]`).textContent=value;
      root.querySelector('[data-art="barcode"]').innerHTML=IDCardArtwork.barcode(card.idNumber);
      for(const key of ['portrait','ghost-portrait'])root.querySelector(`[data-field="${key}"]`).setAttribute('href',PortraitAssets[card.person.gender]);
      root.querySelector('desc').textContent=description(card);
    }
    fit(root);
  }
  globalThis.IDCardRenderer=Object.freeze({render,prefixIds,fit,update});
})();
