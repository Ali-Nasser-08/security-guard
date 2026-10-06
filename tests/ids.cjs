const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const context = vm.createContext({});
for (const file of ['src/shared/name-engine.js','src/features/person/id-engine.js','src/features/person/id-preview.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const {IDEngine:ids,NameEngine:names,IDCardArtwork:art} = context;
assert.equal(ids.riyadhToday(new Date('2026-10-05T21:30:00Z')).toISOString(), '2026-10-06T00:00:00.000Z');
assert.equal(ids.riyadhToday(new Date('2026-10-05T20:59:00Z')).toISOString(), '2026-10-05T00:00:00.000Z');
for (const pool of Object.values(names.pools)) {
  for (const name of pool) assert(ids.latinWords[name], `Missing Latin spelling: ${name}`);
}
assert.equal(ids.arabicDigits('1012345678'), '١٠١٢٣٤٥٦٧٨');
assert.equal(ids.gregorian(new Date('2026-10-06T00:00:00Z')), '06/10/2026');
assert.match(ids.hijri(new Date('2026-10-06T00:00:00Z')), /^\d{2}\/\d{2}\/1448$/);
assert.equal(ids.ageOn(new Date('2006-10-06'),new Date('2026-10-06')),20);
assert.equal(ids.ageOn(new Date('2006-10-07'),new Date('2026-10-06')),19);
let seed=901;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const engine=ids.createEngine(random);
let females=0,expired=0,young=0,older=0;
const prefixes=new Set();
for(const todayString of ['2026-10-06','2024-02-29','2027-01-01','2040-03-01']) {
  const today=new Date(todayString+'T00:00:00Z');
  for(let i=0;i<2500;i++) {
    const card=engine.generate({today});
    assert(card.age>=20&&card.age<=49, `Out-of-range age: ${card.age}`);
    assert.equal(card.age,ids.ageOn(card.birthDate,today));
    assert(card.birthDate.getTime()<card.expiryDate.getTime());
    assert.equal(card.expired,card.expiryDate.getTime()<today.getTime());
    assert.match(card.idNumber,/^(101|102|111)\d{7}$/);
    const sum=[...card.idNumber].reduce((total,digit,index)=>{let v=Number(digit)*(index%2===0?2:1);return total+(v>9?v-9:v);},0);
    assert.equal(sum%10,0,'Bad check digit');
    assert(!/[\u0600-\u06ff]/.test(card.latinName),'Latin card name contains Arabic');
    assert.equal(card.name,names.createEngine().formatID(card.person,card.connectors));
    assert.equal(card.person.ledgerName,[card.person.firstName,card.person.fatherName,card.person.familyName].join(' '));
    assert(card.version>=1&&card.version<=5);
    assert.match(ids.hijri(card.birthDate),/^\d{2}\/\d{2}\/\d{4}$/);
    prefixes.add(card.idNumber.slice(0,3));females+=card.person.gender==='female';expired+=card.expired;young+=card.age<30;older+=card.age>=40;
  }
}
assert.equal(prefixes.size,3);assert(females>350&&females<650);assert(expired>0&&expired<10000);assert(young>0&&older>0);
for(const expiryMode of ['valid','expired'])for(const gender of ['male','female'])for(let i=0;i<100;i++){
  const card=engine.generate({expiryMode,gender,today:new Date('2026-10-06')});
  assert.equal(card.person.gender,gender);assert.equal(card.expired,expiryMode==='expired');
}
const onExpiryDay=ids.createEngine(()=>0).generate({expiryMode:'valid',today:new Date('2026-10-06')});
assert.equal(onExpiryDay.expired,false);assert.equal(onExpiryDay.expiryDate.toISOString(),'2026-10-06T00:00:00.000Z');
assert(art.waves().includes('<path'));assert(art.rosette().includes('<path'));
assert.equal(art.barcode('1012345678'),art.barcode('1012345678'));
assert.notEqual(art.barcode('1012345678'),art.barcode('1022345678'));
console.log(JSON.stringify({result:'passed',samples:10400,ageRange:'20–49',prefixes:[...prefixes],femalePercentage:(females/100).toFixed(2),leapDayAndRiyadhDate:'passed',expiryOverrides:'passed',latinVocabulary:'complete'},null,2));
