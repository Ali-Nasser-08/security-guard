const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '../src/shared/name-engine.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(code, context);
const { pools, familyProbabilities, normalize, createEngine } = context.NameEngine;

// Seeded runs keep failures reproducible without changing production randomness.
let seed = 20261006;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const engine = createEngine(random);
for (const [key, names] of Object.entries(pools)) {
  assert.equal(new Set(names).size, names.length, `Duplicate in ${key}`);
  assert(names.every(name => name && /^[\u0600-\u06FF ]+$/.test(name)), `Invalid name in ${key}`);
}
assert(pools.families.length >= 100);
assert.equal(normalize('عبد الرحمن'), normalize('عبدالرحمن'));
assert.equal(normalize('أحمد'), normalize('احمد'));

let females = 0, repeatedGrandfather = 0, compound = 0;
const familyCounts = Object.fromEntries(pools.families.map(name => [name, 0]));
const count = 50000;
for (let i = 0; i < count; i++) {
  const p = engine.generate();
  assert(pools[p.gender].includes(p.firstName));
  assert(pools.male.includes(p.fatherName) && pools.male.includes(p.grandfatherName));
  assert.notEqual(normalize(p.firstName), normalize(p.fatherName));
  assert.notEqual(normalize(p.fatherName), normalize(p.grandfatherName));
  assert.equal(p.fullName, [p.firstName, p.fatherName, p.grandfatherName, p.familyName].join(' '));
  assert.equal(p.ledgerName, [p.firstName, p.fatherName, p.familyName].join(' '));
  assert.equal(engine.formatID(p, {first:'', second:''}), p.fullName);
  const previousName = p.fullName;
  engine.formatID(p);
  assert.equal(p.fullName, previousName);
  females += p.gender === 'female';
  assert(pools.families.includes(p.familyName), 'Family must remain in the approved pool');
  familyCounts[p.familyName]++;
  repeatedGrandfather += normalize(p.firstName) === normalize(p.grandfatherName);
  compound += p.firstName.startsWith('عبد ');
}
assert(Math.abs(females / count - .05) < .005, 'Gender probability drift');
assert(repeatedGrandfather > 0, 'First name may match grandfather');
assert(compound > 0, 'Compound names must be generated');
for (const [name, target] of Object.entries(familyProbabilities)) {
  assert(Math.abs(familyCounts[name] / count - target) < .01, `Regional probability drift: ${name}`);
}
const regionalCount = Object.keys(familyProbabilities).reduce((sum, name) => sum + familyCounts[name], 0);
assert(Math.abs(regionalCount / count - .30) < .015, 'Combined regional probability drift');
assert(Object.values(familyCounts).every(total => total > 0), 'Other surnames must remain reachable');

const sami = {gender:'male',firstName:'سامي',fatherName:'ناصر',grandfatherName:'أحمد',familyName:'الغامدي'};
const expected = [
  'سامي ناصر أحمد الغامدي', 'سامي ناصر بن أحمد الغامدي', 'سامي ناصر ابن أحمد الغامدي',
  'سامي بن ناصر أحمد الغامدي', 'سامي بن ناصر بن أحمد الغامدي', 'سامي بن ناصر ابن أحمد الغامدي',
  'سامي ابن ناصر أحمد الغامدي', 'سامي ابن ناصر بن أحمد الغامدي', 'سامي ابن ناصر ابن أحمد الغامدي'
];
const actual = Array.from(engine.variants(sami), connectors => engine.formatID(sami, connectors));
assert.deepEqual(actual, expected);
const woman = {...sami,gender:'female',firstName:'نورة'};
assert.equal(engine.variants(woman).length, 6);
assert(engine.variants(woman).every(c => c.first === '' || c.first === 'بنت'));
assert.equal(engine.formatID(woman, {first:'بنت',second:'ابن'}), 'نورة بنت ناصر ابن أحمد الغامدي');

console.log(JSON.stringify({result:'passed',samples:count,maleNames:pools.male.length,femaleNames:pools.female.length,families:pools.families.length,femalePercentage:(100*females/count).toFixed(2),regionalPercentages:Object.fromEntries(Object.keys(familyProbabilities).map(name => [name, (100*familyCounts[name]/count).toFixed(2)])),nonAdjacentRepeats:repeatedGrandfather}, null, 2));
