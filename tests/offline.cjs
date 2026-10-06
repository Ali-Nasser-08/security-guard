const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),listeners={},contents=new Map(),origin='https://training.test';let network=0,claimed=false;
const resolve=value=>new URL(typeof value==='string'?value:value.url,origin+'/').pathname;
const cache={async addAll(files){for(const file of files){const target=path.join(root,file);assert(fs.existsSync(target),`Missing offline asset: ${file}`);contents.set(resolve(file),fs.readFileSync(target));}},async match(request){return contents.get(resolve(request));}};
const caches={async open(){return cache;},async keys(){return ['unrelated-site','tuwaiq-training-v0','tuwaiq-training-v1'];},async delete(name){assert.equal(name,'tuwaiq-training-v0');return true;}};
const context=vm.createContext({self:{location:{origin},clients:{async claim(){claimed=true;}},addEventListener:(name,fn)=>listeners[name]=fn},caches,URL,fetch:()=>{network++;throw new Error('Offline');}});
vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),context);
async function lifecycle(name){let work;listeners[name]({waitUntil:promise=>work=promise});await work;}
async function get(url,mode='cors'){let response;listeners.fetch({request:{method:'GET',url:origin+url,mode},respondWith:promise=>response=promise});return response;}
(async()=>{
  await lifecycle('install');await lifecycle('activate');assert(claimed);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const references=[...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(match=>match[1]);
  for(const reference of references){assert(contents.has(resolve(reference)),`Uncached app reference: ${reference}`);assert(await get(resolve(reference)));}
  for(const asset of [...contents.keys()])assert(await get(asset+'?version=1'));
  assert.equal((await get('/','navigate')).toString(),html);assert.equal((await get('/index.html','navigate')).toString(),html);
  assert.equal(network,0);console.log(JSON.stringify({result:'passed',cachedAssets:contents.size,networkRequestsDuringOfflineReplay:network,navigationFallback:'passed',appReferences:'complete'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
