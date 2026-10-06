// In-memory DOM integration checks. No browser or visual-layout test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),voidTags=new Set(['meta','link','input','br','img']);
class Element{
  constructor(tag='div',attrs={}){Object.assign(this,{tagName:tag,attrs,children:[],style:{},events:{},_text:'',value:'',disabled:'disabled'in attrs,hidden:'hidden'in attrs,open:false,clientWidth:360,clientHeight:500,scrollWidth:1200,scrollTop:0,scrollLeft:0});this.classList={add:(...names)=>names.forEach(name=>this.classList.toggle(name,true)),toggle:(name,force)=>{const set=new Set((this.attrs.class||'').split(' ').filter(Boolean)),on=force===undefined?!set.has(name):force;if(on)set.add(name);else set.delete(name);this.attrs.class=[...set].join(' ');return on;}};}
  get id(){return this.attrs.id;}
  get dataset(){return new Proxy({},{get:(_,key)=>this.attrs['data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())],set:(_,key,value)=>{this.attrs['data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=value;return true;}});}
  get textContent(){return this._text+this.children.map(node=>node.textContent).join('');}set textContent(value){this._text=String(value);this.children=[];}
  set innerHTML(value){this.children=parse(value).children;this._text='';}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);}
  setAttribute(key,value){this.attrs[key]=String(value);}getAttribute(key){return this.attrs[key]??null;}removeAttribute(key){delete this.attrs[key];}
  matches(selector){if(selector[0]==='.')return (this.attrs.class||'').split(' ').includes(selector.slice(1));const match=selector.match(/^([\w-]+)?(?:\[([\w-]+)(?:="([^"]+)")?\])?$/);return !!match&&(!match[1]||this.tagName===match[1])&&(!match[2]||(match[2]==='open'?this.open:match[2]in this.attrs)&&(match[3]===undefined||this.attrs[match[2]]===match[3]));}
  querySelectorAll(selector){return this.children.flatMap(node=>[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]);}querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(name,fn){(this.events[name]||=[]).push(fn);}async emit(name,event={}){for(const fn of this.events[name]||[])await fn({...event,target:this});}
  showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
  getComputedTextLength(){return this.textContent.length*(parseFloat(this.style.fontSize)||Number(this.attrs['font-size'])||16)*.55;}getBoundingClientRect(){return {left:0,right:400,top:0,bottom:600};}
}
function parse(html){const root=new Element('root'),stack=[root];for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){if(token.startsWith('</')){const tag=token.slice(2,-1);while(stack.length>1){if(stack.pop().tagName===tag)break;}}else if(token.startsWith('<')&&!token.startsWith('<!')){const match=token.match(/^<([\w-]+)([\s\S]*?)\/?\s*>$/);if(!match)continue;const attrs={};for(const attribute of match[2].matchAll(/([\w:-]+)(?:="([^"]*)"|'([^']*)')?/g))attrs[attribute[1]]=attribute[2]??attribute[3]??'';const node=new Element(match[1],attrs);stack.at(-1).append(node);if(!voidTags.has(match[1])&&!token.endsWith('/>'))stack.push(node);}else stack.at(-1)._text+=token;}return root;}
const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
function boot(hash='#home'){
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),tree=parse(source),timers=new Map(),events={};let nextTimer=0;
  const document={body:tree.querySelector('body'),documentElement:tree.querySelector('html'),fonts:{ready:Promise.resolve(),async load(){}},getElementById:id=>{const walk=node=>node.id===id?node:node.children.map(walk).find(Boolean);return walk(tree);},querySelectorAll:s=>tree.querySelectorAll(s),querySelector:s=>tree.querySelector(s),createElement:tag=>new Element(tag)};
  const location={hash,protocol:'https:'},context=vm.createContext({document,localStorage:storage,location,history:{pushState(_,__,value){location.hash=value;}},matchMedia:()=>({matches:false,addEventListener(){}}),navigator:{serviceWorker:{async register(){return {};},ready:Promise.resolve()}},TextEncoder,Blob,File,URL,console,setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),isSecureContext:true,scrollTo(){},addEventListener:(name,fn)=>events[name]=fn});context.window=context;
  for(const match of source.matchAll(/<script src="\.\/([^"]+)" defer>/g))vm.runInContext(fs.readFileSync(path.join(root,match[1]),'utf8'),context,{filename:match[1]});
  return {context,location,tick(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}},get:id=>document.getElementById(id),navigate(hash){location.hash=hash;events.hashchange();}};
}
(async()=>{
  let page=boot();await Promise.resolve();assert(!page.get('home-screen').hidden);await page.get('person-start').emit('click');assert(!page.get('ledger-screen').hidden);assert(page.get('ledger-paper').querySelector('svg'));
  await page.get('ledger-preview-button').emit('click');assert(page.get('viewer-dialog').open);const old=page.get('zoom-value').textContent;await page.get('zoom-in').emit('click');assert.notEqual(page.get('zoom-value').textContent,old);page.get('viewer-dialog').close();
  await page.get('begin-cards').emit('click');assert(!page.get('training-screen').hidden);assert(page.get('training-card').querySelector('svg'));
  await page.get('open-id').emit('click');assert(page.get('viewer-title').textContent.includes('الهوية'));page.get('viewer-dialog').close();
  let data=JSON.parse(memory.get('tuwaiq-training'));const expected=page.context.TrainingEngine.createEngine().eligible(data.a,data.a.current.card);
  await page.get(expected?'refuse-button':'allow-button').emit('click');assert(!page.get('toast').hidden);assert.equal(page.get('toast').textContent,expected?'رفض غير صحيح':'سماح غير صحيح');assert.equal(JSON.parse(memory.get('tuwaiq-training')).a.admitted.length,0);assert(page.get('allow-button').disabled);page.tick();
  const saved=memory.get('tuwaiq-training');page=boot();assert.equal(memory.get('tuwaiq-training'),saved);assert(page.get('person-action').textContent.includes('استكمال'));await page.get('person-start').emit('click');assert(!page.get('training-screen').hidden);
  let decisions=0;while(JSON.parse(memory.get('tuwaiq-training')).a){assert(decisions++<100);data=JSON.parse(memory.get('tuwaiq-training'));const allow=page.context.TrainingEngine.createEngine().eligible(data.a,data.a.current.card);await page.get(allow?'allow-button':'refuse-button').emit('click');page.tick();}
  assert(!page.get('result-screen').hidden);assert.equal(JSON.parse(memory.get('tuwaiq-training')).l.s,1);assert(Number(page.get('result-decisions').textContent)>0);
  page.navigate('#stats');assert(!page.get('stats-screen').hidden);assert.equal(page.get('lifetime-sessions').textContent,'1');page.get('trainee-name').value='متدرّب';await page.get('trainee-name').emit('input');page.tick();assert.equal(JSON.parse(memory.get('tuwaiq-training')).n,'متدرّب');
  await page.get('theme-button').emit('click');assert.equal(JSON.parse(memory.get('tuwaiq-training')).t,'dark');assert.equal(memory.size,1);
  console.log(JSON.stringify({result:'passed',workflow:'home → ledger → card → result → statistics',viewerButtons:'passed',wrongDecisionToast:'passed',doubleTapGuard:'passed',resumeFromSameCard:'passed',nameAndThemeSaved:'passed',singleStorageRecord:'passed'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
