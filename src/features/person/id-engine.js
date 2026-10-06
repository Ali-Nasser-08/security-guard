/* Synthetic Saudi-style training data. All dates are date-only UTC internally;
   the current day is read in Asia/Riyadh. No personal data or services are used. */
(() => {
  'use strict';
  const DAY = 86400000;
  const prefixes = Object.freeze(['101', '102', '111']);
  const birthplaces = Object.freeze(['الباحة', 'بلجرشي', 'المندق', 'العقيق', 'المخواة', 'قلوة', 'أبها', 'خميس مشيط', 'النماص', 'بيشة', 'جازان', 'صبيا', 'صامطة', 'نجران', 'شرورة', 'الرياض', 'جدة', 'مكة المكرمة', 'الطائف', 'الدمام', 'وادي الدواسر']);
  const arabicDigits = value => String(value).replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
  function riyadhToday(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {timeZone:'Asia/Riyadh', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
    const get = type => Number(parts.find(part => part.type === type).value);
    return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  }
  const dateOnly = date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  function shiftYears(date, years) {
    const year = date.getUTCFullYear() + years;
    const month = date.getUTCMonth();
    const day = Math.min(date.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    return new Date(Date.UTC(year, month, day));
  }
  function ageOn(birth, today) {
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
    return age;
  }
  const gregorian = date => [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear()].map((value, index) => String(value).padStart(index === 2 ? 4 : 2, '0')).join('/');
  const hijriFormatter = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura-nu-latn', {timeZone:'UTC', day:'2-digit', month:'2-digit', year:'numeric'});
  function hijri(date) {
    const parts = hijriFormatter.formatToParts(date);
    const get = type => parts.find(part => part.type === type).value;
    return `${get('day')}/${get('month')}/${get('year')}`;
  }
  function checkDigit(body) {
    const sum = [...body].reduce((total, digit, index) => {
      let value = Number(digit) * (index % 2 === 0 ? 2 : 1);
      return total + (value > 9 ? value - 9 : value);
    }, 0);
    return String((10 - sum % 10) % 10);
  }

  // Readable Latin display for the mockup, not an official passport transliteration.
  const latinWords = Object.freeze(Object.fromEntries(`محمد:MOHAMMED|أحمد:AHMAD|خالد:KHALID|عبد الله:ABDULLAH|عبد الرحمن:ABDULRAHMAN|عبد العزيز:ABDULAZIZ|فهد:FAHAD|سعود:SAUD|ناصر:NASSER|علي:ALI|حسن:HASAN|حسين:HUSSAIN|سامي:SAMI|فيصل:FAISAL|سلطان:SULTAN|سلمان:SALMAN|تركي:TURKI|بندر:BANDAR|ماجد:MAJED|عبد المجيد:ABDULMAJEED|صالح:SALEH|سعيد:SAEED|سليمان:SULAIMAN|إبراهيم:IBRAHIM|يوسف:YOUSEF|عمر:OMAR|عثمان:OTHMAN|عبد الكريم:ABDULKARIM|مشعل:MISHAAL|نواف:NAWAF|نايف:NAYEF|منصور:MANSOUR|راشد:RASHED|حمد:HAMAD|عبد الملك:ABDULMALIK|عبد المحسن:ABDULMOHSEN|عبد الإله:ABDULILAH|عبد الوهاب:ABDULWAHAB|عبد اللطيف:ABDULLATIF|عبد الرزاق:ABDULRAZZAQ|عبد الرحيم:ABDULRAHIM|عبد السلام:ABDULSALAM|عبد الحكيم:ABDULHAKIM|عبد الحميد:ABDULHAMID|عبد القادر:ABDULQADER|عبد الغني:ABDULGHANI|عبد الحليم:ABDULHALIM|عبد الباسط:ABDULBASIT|عبد الجليل:ABDULJALIL|عبد الهادي:ABDULHADI|عبد الخالق:ABDULKHALIQ|عبد الرؤوف:ABDULRAOUF|عبد المعين:ABDULMUEEN|عبد الواحد:ABDULWAHID|عبد القوي:ABDULQAWI|عبد الستار:ABDULSATTAR|عبد المنعم:ABDULMUNIM|عبد الفتاح:ABDULFATTAH|عبد الجبار:ABDULJABBAR|عبد الصمد:ABDULSAMAD|عبد المتين:ABDULMATIN|عبد الحفيظ:ABDULHAFIZ|عبد البديع:ABDULBADIE|عبد المالك:ABDULMALEK|عبد الرب:ABDULRAB|طلال:TALAL|بدر:BADR|وليد:WALEED|زياد:ZIAD|ياسر:YASSER|يحيى:YAHYA|حامد:HAMED|حمود:HAMOUD|حميد:HUMAID|حماد:HAMMAD|حمدان:HAMDAN|حزام:HIZAM|حازم:HAZEM|حاتم:HATEM|حبيب:HABIB|حسان:HASSAN|حذيفة:HUDHAIFA|حسام:HUSSAM|حمزة:HAMZA|سعد:SAAD|سعدون:SAADOUN|سالم:SALEM|سليم:SALIM|سامر:SAMER|سمير:SAMIR|سهيل:SUHAIL|صقر:SAQR|سيف:SAIF|شاكر:SHAKER|شاهر:SHAHER|شايع:SHAYEA|شادي:SHADI|شريف:SHARIF|صلاح:SALAH|صابر:SABER|صبري:SABRI|طاهر:TAHER|طارق:TARIQ|ظافر:DHAFFER|عايد:AYED|عادل:ADEL|عامر:AMER|عباس:ABBAS|عدنان:ADNAN|عقيل:AQEEL|عمار:AMMAR|عماد:IMAD|عواد:AWWAD|عوض:AWAD|عيسى:ISSA|غالب:GHALEB|غازي:GHAZI|فارس:FARES|فايز:FAYEZ|فواز:FAWAZ|فراج:FARRAJ|فريد:FARID|فالح:FALEH|قاسم:QASIM|قصي:QUSAI|كمال:KAMAL|كريم:KARIM|لؤي:LOUAI|مازن:MAZEN|مالك:MALIK|مبارك:MUBARAK|محسن:MOHSEN|محمود:MAHMOUD|مرزوق:MARZOUQ|مروان:MARWAN|مسعود:MASOUD|مساعد:MUSAED|مصلح:MUSLEH|مصطفى:MUSTAFA|مطلق:MUTLAQ|معاذ:MUADH|معيض:MUEED|مقرن:MUQRIN|مهند:MUHANNAD|موسى:MUSA|متعب:MUTAIB|نادر:NADER|ناجي:NAJI|نبيل:NABIL|نجيب:NAJIB|نزار:NIZAR|هاني:HANI|هاشم:HASHIM|هشام:HISHAM|هلال:HILAL|هيثم:HAITHAM|هزاع:HAZZA|هذال:HATHAL|وائل:WAEL|وافي:WAFI|وحيد:WAHEED|يافع:YAFEA|يعقوب:YAQOUB|يونس:YOUNIS|أيمن:AYMAN|إياد:IYAD|أنس:ANAS|أنور:ANWAR|أسامة:OSAMA|أمين:AMIN|أكرم:AKRAM|أوس:AWS|باسل:BASEL|بسام:BASSAM|بشير:BASHIR|بكر:BAKR|بلال:BILAL|براء:BARAA|براك:BARRAK|جاسم:JASIM|جاسر:JASER|جابر:JABER|جعفر:JAFAR|جلال:JALAL|جمال:JAMAL|جواد:JAWAD|ثامر:THAMER|ثنيان:THUNAYAN|توفيق:TAWFIQ|تميم:TAMIM|خليل:KHALIL|خميس:KHAMIS|داود:DAWOOD|دخيل:DAKHEEL|رائد:RAED|راكان:RAKAN|رامي:RAMI|رشيد:RASHID|رضوان:RIDWAN|ريان:RAYAN|زاهر:ZAHER|زكريا:ZAKARIA|زامل:ZAMEL|زيد:ZAID|نورة:NOURA|فاطمة:FATIMAH|سارة:SARAH|مريم:MARYAM|عائشة:AISHA|خديجة:KHADIJAH|هند:HIND|حصة:HESSAH|الجوهرة:ALJAWAHRA|العنود:ALANOUD|ريم:REEM|مها:MAHA|منيرة:MUNIRAH|لطيفة:LATIFAH|عبير:ABEER|أمل:AMAL|أروى:ARWA|أريج:AREEJ|أشواق:ASHWAQ|أضواء:ADWA|أنفال:ANFAL|ابتهال:IBTIHAL|الجوري:ALJOURI|بسمة:BASMAH|بشاير:BASHAYER|جمانة:JUMANAH|جوان:JUWAN|حسناء:HASNA|خلود:KHOLOUD|رحاب:REHAB|رنا:RANA|رهف:RAHAF|روان:RAWAN|سامية:SAMIA|سحر:SAHAR|سعاد:SUAD|سفانة:SAFANAH|سلمى:SALMA|سمر:SAMAR|سمية:SUMAYAH|سميرة:SAMIRAH|شمة:SHAMMAH|عهود:OHOUD|عواطف:AWATIF|لجين:LUJAIN|لمى:LAMA|لمياء:LAMIA|لينا:LINA|مرام:MARAM|مروة:MARWAH|مزنة:MUZNAH|ملاك:MALAK|منال:MANAL|مي:MAI|نجلاء:NAJLA|ندى:NADA|نور:NOUR|هلا:HALA|وضحى:WADHA|وعد:WAAD|ود:WUD|وفاء:WAFA|هدى:HUDA|هيفاء:HAIFA|حنان:HANAN|حليمة:HALIMAH|أسماء:ASMA|آمنة:AMINAH|آلاء:ALAA|إيمان:IMAN|ابتسام:IBTISAM|بدرية:BADRIAH|تهاني:TAHANI|دلال:DALAL|دانية:DANIAH|رباب:RABAB|رقية:RUQAYAH|رزان:RAZAN|زينب:ZAINAB|زهراء:ZAHRA|سهام:SIHAM|شذى:SHATHA|شوق:SHOUQ|شيخة:SHAIKHAH|عفاف:AFAF|عالية:ALIAH|عليا:OLYA|غادة:GHADAH|غدير:GHADEER|فوزية:FAWZIAH|فوز:FAWZ|لؤلؤة:LULUAH|ليلى:LAILA|لولوة:LULWAH|مشاعل:MASHAEL|نوف:NOUF|نوال:NAWAL|نعيمة:NAIMAH|نجود:NUJOUD|هيا:HAYA|هناء:HANAA|هتون:HATOON|وجدان:WIJDAN|وصايف:WASAYEF|ياسمين:YASMEEN|ريما:REEMA|حور:HOOR|رغد:RAGHAD|لين:LEEN|جنى:JANA|بيان:BAYAN|سجى:SAJA|شهد:SHAHAD|جود:JOUD|تالا:TALA|دانة:DANAH|ديما:DEEMA|رند:RAND|ريماس:REEMAS|الغامدي:ALGHAMDI|الزهراني:ALZAHRANI|الدوسري:ALDOSARI|الحربي:ALHARBI|العتيبي:ALOTAIBI|القحطاني:ALQAHTANI|الشمري:ALSHAMMARI|العنزي:ALENEZI|المطيري:ALMUTAIRI|السبيعي:ALSUBAIE|الشهري:ALSHEHRI|الشهراني:ALSHAHRANI|المالكي:ALMALKI|الحارثي:ALHARTHI|البلوي:ALBALAWI|الجهني:ALJUHANI|الرشيدي:ALRASHIDI|السهلي:ALSAHLI|الظفيري:ALDHAFEERI|اليامي:ALYAMI|العجمي:ALAJMI|البقمي:ALBUQAMI|القرني:ALQARNI|الثبيتي:ALTHUBAITI|الروقي:ALROUQI|العصيمي:ALOSAIMI|التميمي:ALTAMIMI|الخالدي:ALKHALDI|الهاجري:ALHAJRI|الشراري:ALSHARARI|الحويطي:ALHUWAITI|السلمي:ALSULAMI|القرشي:ALQURASHI|الثقفي:ALTHAQAFI|الأسمري:ALASMARI|الأحمري:ALAHMARI|الأشهري:ALASHHARI|الأكلبي:ALAKLABI|الوادعي:ALWADAI|الوايلي:ALWAILI|الودعاني:ALWADAANI|العامري:ALAMRI|الكناني:ALKINANI|الهذلي:ALHUTHALI|الأشجعي:ALASHJAI|الفيفي:ALFAIFI|المسعودي:ALMASOUDI|الحازمي:ALHAZMI|العبدلي:ALABDALI|الشريف:ALSHARIF|الجعفري:ALJAFARI|الحسني:ALHASANI|الحسيني:ALHUSAINI|الأنصاري:ALANSARI|الحكمي:ALHAKAMI|المجرشي:ALMAJRASHI|النجمي:ALNAJMI|المدخلي:ALMADKHALI|الجابري:ALJABRI|المسملي:ALMASMALI|الريثي:ALRAITHI|الصيعري:ALSAIARI|النهدي:ALNAHDI|الكثيري:ALKATHIRI|العمودي:ALAMOUDI|البابطين:ALBABTAIN|الباحوث:ALBAHOUTH|الثنيان:ALTHUNAYAN|الحصيني:ALHUSAINI|الخراشي:ALKHARASHI|الربيش:ALRUBAISH|الرقيبة:ALRUQAIBAH|الزامل:ALZAMIL|السالم:ALSALIM|السعيد:ALSAEED|السنيدي:ALSUNAIDI|الصالح:ALSALEH|الصغير:ALSUGHAYYIR|الفوزان:ALFAWZAN|الماجد:ALMAJED|المبارك:ALMUBARAK|المنصور:ALMANSOUR|الناصر:ALNASSER|النفيسة:ALNUFAISAH|الهبدان:ALHABDAN|الهلالي:ALHILALI|الوبر:ALWABAR|العسيري:ALASIRI|العقيل:ALAQEEL|العجلان:ALAJLAN|الراجحي:ALRAJHI|الراشد:ALRASHED|الربيعة:ALRABIAH|الجاسر:ALJASER|البراك:ALBARRAK|القصيبي:ALGOSAIBI|السديري:ALSUDAIRI|التركي:ALTURKI|الحمدان:ALHAMDAN|العيسى:ALISSA|القاضي:ALQADI|البسام:ALBASSAM|المنيع:ALMANEA|الخريف:ALKHORAYEF|الحقيل:ALHUGAIL|السويلم:ALSUWAILIM|العمر:ALOMAR|العبيد:ALOBEID|المهنا:ALMUHANNA|الحميد:ALHUMAID|الزيد:ALZAID|البليهد:ALBULAIHED|الدخيل:ALDAKHEEL|السليمان:ALSULAIMAN|العثيمين:ALOTHAIMEEN|الحماد:ALHAMMAD|المقبل:ALMUQBIL|النصار:ALNASSAR|العواد:ALAWWAD|المسند:ALMUSNAD|السيف:ALSAIF|الشعلان:ALSHAALAN|المقرن:ALMUQRIN|السلوم:ALSALLOUM|آل الشيخ:AL ALSHEIKH|آل سعيد:AL SAEED|آل عائض:AL AYED|آل مفرح:AL MUFREH|آل جابر:AL JABER`.split('|').map(pair => pair.split(':'))));
  function latinName(person, connectors) {
    const latin = name => latinWords[name] || name;
    const connector = value => ({'بن':'BIN','ابن':'IBN','بنت':'BINT','':''})[value];
    return [latin(person.firstName), connector(connectors.first), latin(person.fatherName), connector(connectors.second), latin(person.grandfatherName), latin(person.familyName)].filter(Boolean).join(' ');
  }
  function createEngine(random = Math.random) {
    const names = NameEngine.createEngine(random);
    const pick = values => values[Math.floor(random() * values.length)];
    const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
    const randomDate = (min, max) => new Date(integer(min.getTime() / DAY, max.getTime() / DAY) * DAY);
    function generate(options = {}) {
      const today = options.today ? dateOnly(options.today) : riyadhToday();
      const person = options.person || names.generate({gender:options.gender});
      const connectors = names.chooseConnectors(person);
      const earliestBirth = new Date(shiftYears(today, -50).getTime() + DAY);
      const birthDate = randomDate(earliestBirth, shiftYears(today, -20));
      const mode = options.expiryMode || 'mixed';
      if (!['mixed','valid','expired'].includes(mode)) throw new TypeError('Unsupported expiry mode');
      const expiryDate = mode === 'valid' ? randomDate(today, shiftYears(today, 8))
        : mode === 'expired' ? randomDate(shiftYears(today, -2), new Date(today.getTime() - DAY))
        : randomDate(shiftYears(today, -2), shiftYears(today, 8));
      const numberBody = pick(prefixes) + Array.from({length:6}, () => integer(0,9)).join('');
      return Object.freeze({person, connectors, name: names.formatID(person, connectors), latinName:latinName(person, connectors),
        idNumber:options.idNumber || numberBody + checkDigit(numberBody), version:integer(1,5), birthDate, expiryDate,
        age:ageOn(birthDate, today), birthPlace:pick(birthplaces), today, expired:expiryDate.getTime() < today.getTime(),
        portraitVariant:integer(0,3)});
    }
    return Object.freeze({generate});
  }
  globalThis.IDEngine = Object.freeze({createEngine, riyadhToday, ageOn, shiftYears, gregorian, hijri, arabicDigits, checkDigit, prefixes, latinWords});
})();
