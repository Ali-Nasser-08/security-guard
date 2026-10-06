(() => {
  'use strict';
  const KEY='tuwaiq-training';
  // One JSON record. Counts: decisions, correct, false admits, false refuses,
  // correct admits, correct refuses. Completed results use the same six slots.
  const empty=()=>({v:1,n:'',t:'',l:{s:0,p:0,c:[0,0,0,0,0,0]},p:null,w:null,a:null});
  function validCounts(value){return Array.isArray(value)&&value.length===6&&value.every(n=>Number.isSafeInteger(n)&&n>=0)&&value[0]===value[1]+value[2]+value[3]&&value[1]===value[4]+value[5];}
  const validResult=result=>result===null||(typeof result==='object'&&Number.isSafeInteger(result.at)&&result.at>0&&Number.isSafeInteger(result.people)&&result.people>=1&&result.people<=16&&validCounts(result.c));
  function validActive(active){
    if(active===null)return true;
    if(!active||!validCounts(active.counts)||active.finished||typeof active.reviewed!=='boolean'||!Number.isSafeInteger(active.started)||active.started<=0||!Number.isInteger(active.streak))return false;
    const ledger=active.ledger;
    if(!ledger||!Number.isInteger(ledger.count)||ledger.count<1||ledger.count>16||!Array.isArray(ledger.entries)||ledger.entries.length!==ledger.count)return false;
    if(!['today','issueDate','startDate','endDate','approvalDate'].every(key=>typeof ledger[key]==='string'&&Number.isFinite(Date.parse(ledger[key]))))return false;
    const validPerson=person=>person&&['firstName','fatherName','grandfatherName','familyName'].every(key=>typeof person[key]==='string'&&person[key].length>0&&person[key].length<80)&&['male','female'].includes(person.gender);
    if(!ledger.entries.every(entry=>entry&&validPerson(entry.person)&&typeof entry.name==='string'&&/^(101|102|111)\d{7}$/.test(entry.idNumber)))return false;
    if(!['issuer','manager','requester'].every(key=>ledger[key]&&typeof ledger[key].name==='string'&&typeof ledger[key].role==='string'))return false;
    if(!['issuerSignature','managerSignature','stampSignature'].every(key=>Number.isInteger(ledger[key])&&ledger[key]>=0&&ledger[key]<6))return false;
    if(!Array.isArray(active.admitted)||new Set(active.admitted).size!==active.admitted.length||active.admitted.length>=ledger.count||!active.admitted.every(index=>Number.isInteger(index)&&index>=0&&index<ledger.count))return false;
    const current=active.current,card=current?.card;
    return !!card&&Number.isInteger(current.index)&&current.index>=0&&current.index<ledger.count&&!active.admitted.includes(current.index)&&['valid','stranger','number','name','expired'].includes(current.kind)&&validPerson(card.person)&&typeof card.name==='string'&&typeof card.latinName==='string'&&/^(101|102|111)\d{7}$/.test(card.idNumber)&&['today','birthDate','expiryDate'].every(key=>typeof card[key]==='string'&&Number.isFinite(Date.parse(card[key])))&&Number.isInteger(card.version)&&card.version>=1&&card.version<=5&&typeof card.birthPlace==='string';
  }
  function parse(raw){
    const data=JSON.parse(raw);
    if(data?.v!==1||typeof data.n!=='string'||data.n.length>100||!['','light','dark'].includes(data.t)||!data.l||!Number.isSafeInteger(data.l.s)||data.l.s<0||!Number.isSafeInteger(data.l.p)||data.l.p<0||!validCounts(data.l.c)||!validResult(data.p)||!validResult(data.w)||!validActive(data.a))throw new Error('Invalid training save');
    return data;
  }
  function create(storage){
    let record=empty(),available=true,corrupt=false;
    try{const raw=storage.getItem(KEY);if(raw)record=parse(raw);}catch(error){if(error?.name==='SyntaxError'||error?.message==='Invalid training save')corrupt=true;else available=false;}
    function save(){try{storage.setItem(KEY,JSON.stringify(record));available=true;return true;}catch{available=false;return false;}}
    function decide(engine,allow,now){
      const result=engine.decide(record.a,allow,now),counts=record.l.c;
      counts[0]++;if(result.correct)counts[1]++;counts[result.correct?(allow?4:5):(allow?2:3)]++;
      if(result.correct&&allow)record.l.p++;
      if(result.done){record.l.s++;record.p={at:record.a.finished,people:record.a.ledger.count,c:[...record.a.counts]};record.a=null;}
      save();return result;
    }
    return {get data(){return record;},get available(){return available;},get corrupt(){return corrupt;},save,decide};
  }
  globalThis.TrainingStore=Object.freeze({KEY,empty,parse,create});
})();
