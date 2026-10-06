(() => {
  'use strict';
  const DAY = 86400000;
  const countProbabilities = Object.freeze(Object.fromEntries(Array.from({length:16}, (_, index) => {
    const count = index + 1;return [count, count === 1 || count === 16 ? .35 : count === 8 ? .10 : count === 4 ? .08 : .01];
  })));
  const contractors = Object.freeze(['شركة روافد المشاريع', 'شركة آفاق التشغيل', 'شركة منابع الصيانة', 'شركة مسارات الخدمات', 'شركة رواسي الأعمال']);
  function createEngine(random = Math.random) {
    const names = NameEngine.createEngine(random);
    const integer = (min,max) => min + Math.floor(random() * (max - min + 1));
    const pick = list => list[integer(0,list.length-1)];
    const addDays = (date,days) => new Date(date.getTime() + days * DAY);
    function chooseCount() {
      const roll=random();let cumulative=0;
      for (const [count, probability] of Object.entries(countProbabilities)) {cumulative+=probability;if(roll<cumulative)return Number(count);}
      return 16;
    }
    function idNumber() {
      const body=pick(IDEngine.prefixes)+Array.from({length:6},()=>integer(0,9)).join('');return body+IDEngine.checkDigit(body);
    }
    function generate(options={}) {
      const count=options.count === undefined ? chooseCount() : Number(options.count);
      if(!Number.isInteger(count)||count<1||count>16)throw new RangeError('Ledger count must be between 1 and 16');
      const sourceDate=options.today || IDEngine.riyadhToday();
      const today=new Date(Date.UTC(sourceDate.getUTCFullYear(),sourceDate.getUTCMonth(),sourceDate.getUTCDate()));
      const startDate=addDays(today,-integer(0,30)),issueDate=addDays(startDate,-integer(1,4)),endDate=addDays(today,integer(30,120));
      const ids=new Set(),fullNames=new Set(),entries=[];
      while(entries.length<count){
        const person=names.generate();const number=idNumber();
        if(ids.has(number)||fullNames.has(person.ledgerName))continue;
        ids.add(number);fullNames.add(person.ledgerName);
        entries.push(Object.freeze({person,name:person.ledgerName,idNumber:number,nationality:person.gender==='female'?'سعودية':'سعودي',notes:''}));
      }
      const signerNames=new Set(entries.map(entry=>entry.name));
      const signer=role=>{let person;do{person=names.generate({gender:'male'});}while(signerNames.has(person.ledgerName));signerNames.add(person.ledgerName);return Object.freeze({name:person.ledgerName,role});};
      const signatureIndices=[0,1,2,3,4,5];
      // Different marks for the two signers and stamp on a single permit.
      const signature=()=>signatureIndices.splice(integer(0,signatureIndices.length-1),1)[0];
      return Object.freeze({count,entries:Object.freeze(entries),today,issueDate,startDate,endDate,
        permitNumber:`R/${String(integer(1,99999)).padStart(5,'0')}`,revision:integer(0,3),
        approvalNumber:String(integer(100000000,199999999)),approvalDate:addDays(issueDate,-integer(30,600)),
        contractor:pick(contractors),project:'تشغيل وصيانة شبكات الصرف الصحي\nومحطة المعالجة بالباحة',site:'محطة المعالجة الرئيسية بالباحة',
        issuer:signer('أخصائي بطاقات العمل'),manager:signer('مدير إدارة الأمن الصناعي'),requester:signer('مشرف تشغيل المشروع'),
        issuerSignature:signature(),managerSignature:signature(),stampSignature:signature()});
    }
    return Object.freeze({generate,chooseCount});
  }
  globalThis.LedgerEngine=Object.freeze({createEngine,countProbabilities});
})();
