/*
Name pools: curated Saudi-oriented starter vocabulary, reviewed and extended locally.
    Source reference: Saudi Arabia section of thm/uinames names.json (MIT).
    https://github.com/thm/uinames/blob/master/names.json
    MIT License — Copyright (c) 2019 Thom van der Weerd
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */
(() => {
    'use strict';
    const list = text => Object.freeze(text.split('|').map(name => name.trim().normalize('NFC')));
    const pools = Object.freeze({
      male: list('محمد|أحمد|خالد|عبد الله|عبد الرحمن|عبد العزيز|فهد|سعود|ناصر|علي|حسن|حسين|سامي|فيصل|سلطان|سلمان|تركي|بندر|ماجد|عبد المجيد|صالح|سعيد|سليمان|إبراهيم|يوسف|عمر|عثمان|عبد الكريم|مشعل|نواف|نايف|منصور|راشد|حمد|عبد الملك|عبد المحسن|عبد الإله|عبد الوهاب|عبد اللطيف|عبد الرزاق|عبد الرحيم|عبد السلام|عبد الحكيم|عبد الحميد|عبد القادر|عبد الغني|عبد الحليم|عبد الباسط|عبد الجليل|عبد الهادي|عبد الخالق|عبد الرؤوف|عبد المعين|عبد الواحد|عبد القوي|عبد الستار|عبد المنعم|عبد الفتاح|عبد الجبار|عبد الصمد|عبد المتين|عبد الحفيظ|عبد البديع|عبد المالك|طلال|بدر|وليد|زياد|ياسر|يحيى|عبد الرب|حامد|حمود|حميد|حماد|حمدان|حزام|حازم|حاتم|حبيب|حسان|حذيفة|حسام|حمزة|سعد|سعدون|سالم|سليم|سامر|سمير|سهيل|صقر|سيف|شاكر|شاهر|شايع|شادي|شريف|صلاح|صابر|صبري|طاهر|طارق|ظافر|عايد|عادل|عامر|عباس|عدنان|عقيل|عمار|عماد|عواد|عوض|عيسى|غالب|غازي|فارس|فايز|فواز|فراج|فريد|فالح|قاسم|قصي|كمال|كريم|لؤي|مازن|مالك|مبارك|محسن|محمود|مرزوق|مروان|مسعود|مساعد|مصلح|مصطفى|مطلق|معاذ|معيض|مقرن|مهند|موسى|متعب|نادر|ناجي|نبيل|نجيب|نزار|هاني|هاشم|هشام|هلال|هيثم|هزاع|هذال|وائل|وافي|وحيد|يافع|يعقوب|يونس|أيمن|إياد|أنس|أنور|أسامة|أمين|أكرم|أوس|باسل|بسام|بشير|بكر|بلال|براء|براك|جاسم|جاسر|جابر|جعفر|جلال|جمال|جواد|ثامر|ثنيان|توفيق|تميم|خليل|خميس|داود|دخيل|رائد|راكان|رامي|رشيد|رضوان|ريان|زاهر|زكريا|زامل|زيد') ,
      female: list('نورة|فاطمة|سارة|مريم|عائشة|خديجة|هند|حصة|الجوهرة|العنود|ريم|مها|منيرة|لطيفة|عبير|أمل|أروى|أريج|أشواق|أضواء|أنفال|ابتهال|الجوري|بسمة|بشاير|جمانة|جوان|حسناء|خلود|رحاب|رنا|رهف|روان|سامية|سحر|سعاد|سفانة|سلمى|سمر|سمية|سميرة|شمة|عهود|عواطف|لجين|لمى|لمياء|لينا|مرام|مروة|مزنة|ملاك|منال|مي|نجلاء|ندى|نور|هلا|وضحى|وعد|ود|وفاء|هدى|هيفاء|حنان|حليمة|أسماء|آمنة|آلاء|إيمان|ابتسام|بدرية|تهاني|دلال|دانية|رباب|رقية|رزان|زينب|زهراء|سهام|شذى|شوق|شيخة|عفاف|عالية|عليا|غادة|غدير|فوزية|فوز|لؤلؤة|ليلى|لولوة|مشاعل|نوف|نوال|نعيمة|نجود|هيا|هناء|هتون|وجدان|وصايف|ياسمين|ريما|حور|رغد|لين|جنى|بيان|سجى|شهد|جود|تالا|دانة|ديما|رند|ريماس') ,
      families: list('الغامدي|الدوسري|الحربي|الزهراني|العتيبي|القحطاني|الشمري|العنزي|المطيري|السبيعي|الشهري|الشهراني|المالكي|الحارثي|البلوي|الجهني|الرشيدي|السهلي|الظفيري|اليامي|العجمي|البقمي|القرني|الثبيتي|الروقي|العصيمي|التميمي|الخالدي|الهاجري|الشراري|الحويطي|السلمي|القرشي|الثقفي|الأسمري|الأحمري|الأشهري|الأكلبي|الوادعي|الوايلي|الودعاني|العامري|الكناني|الهذلي|الأشجعي|الفيفي|المسعودي|الحازمي|العبدلي|الشريف|الجعفري|الحسني|الحسيني|الأنصاري|الحكمي|المجرشي|النجمي|المدخلي|الجابري|المسملي|الريثي|الصيعري|النهدي|الكثيري|العمودي|البابطين|الباحوث|الثنيان|الحصيني|الخراشي|الربيش|الرقيبة|الزامل|السالم|السعيد|السنيدي|الصالح|الصغير|الفوزان|الماجد|المبارك|المنصور|الناصر|النفيسة|الهبدان|الهلالي|الوبر|العسيري|العقيل|العجلان|الراجحي|الراشد|الربيعة|الجاسر|البراك|القصيبي|السديري|التركي|الحمدان|العيسى|القاضي|البسام|المنيع|الخريف|الحقيل|السويلم|العمر|العبيد|المهنا|الحميد|الزيد|البليهد|الدخيل|السليمان|العثيمين|الحماد|المقبل|النصار|العواد|المسند|السيف|الشعلان|المقرن|السلوم|آل الشيخ|آل سعيد|آل عائض|آل مفرح|آل جابر')
    });
    // Training mix for this southern facility; these are configurable probabilities, not census data.
    const familyProbabilities = Object.freeze({'الغامدي': .15, 'الزهراني': .15});
    const regionalFamilies = Object.entries(familyProbabilities);
    const otherFamilies = Object.freeze(pools.families.filter(name => !Object.hasOwn(familyProbabilities, name)));
    // Compare whole name components, never whitespace tokens (عبد الرحمن is one component).
    const normalize = name => name.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, '').trim();
    function createEngine(random = Math.random) {
      const pick = values => values[Math.floor(random() * values.length)];
      const different = (values, previous) => pick(values.filter(name => normalize(name) !== normalize(previous)));
      function pickFamily() {
        const roll = random();
        let threshold = 0;
        for (const [name, probability] of regionalFamilies) {
          threshold += probability;
          if (roll < threshold) return name;
        }
        return pick(otherFamilies);
      }
      function generate(options = {}) {
        if (options.gender && !['male', 'female'].includes(options.gender)) throw new TypeError('Unsupported gender');
        const gender = options.gender || (random() < .05 ? 'female' : 'male');
        const firstName = pick(pools[gender]);
        const fatherName = different(pools.male, firstName);
        const grandfatherName = different(pools.male, fatherName);
        const familyName = pickFamily();
        return Object.freeze({gender, firstName, fatherName, grandfatherName, familyName,
          fullName: [firstName, fatherName, grandfatherName, familyName].join(' '),
          ledgerName: [firstName, fatherName, familyName].join(' ')});
      }
      function variants(person) {
        const firstConnectors = person.gender === 'female' ? ['', 'بنت'] : ['', 'بن', 'ابن'];
        return firstConnectors.flatMap(first => ['', 'بن', 'ابن'].map(second => Object.freeze({first, second})));
      }
      function formatID(person, connectors = pick(variants(person))) {
        return [person.firstName, connectors.first, person.fatherName, connectors.second, person.grandfatherName, person.familyName].filter(Boolean).join(' ');
      }
      return Object.freeze({generate, variants, formatID, chooseConnectors: person => pick(variants(person))});
    }
    globalThis.NameEngine = Object.freeze({pools, familyProbabilities, normalize, createEngine});
  })();
