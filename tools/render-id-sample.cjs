// Optional filesystem-only artwork inspection; never launches or controls a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sharp=require(process.argv[2]||'sharp');
const root=path.join(__dirname,'..');
const context=vm.createContext({});
for(const file of ['src/shared/name-engine.js','src/features/person/id-engine.js','src/features/person/id-preview.js','assets/portraits/portrait-data.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
let seed=7;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const gender=process.argv[3]||'male';
const engine=context.IDEngine,data=engine.createEngine(random).generate({gender,expiryMode:process.argv[4]||'valid',today:new Date('2026-10-06')});
const text={version:`رقم النسخة: ${engine.arabicDigits(data.version)}`,'arabic-name':data.name,'latin-name':data.latinName,
  'arabic-number':engine.arabicDigits(data.idNumber),'latin-number':data.idNumber,
  'hijri-birth':engine.arabicDigits(engine.hijri(data.birthDate)),'gregorian-birth':engine.gregorian(data.birthDate),
  'hijri-expiry':engine.arabicDigits(engine.hijri(data.expiryDate)),'gregorian-expiry':engine.gregorian(data.expiryDate),
  birthplace:data.birthPlace,'barcode-number':data.idNumber};
let svg=fs.readFileSync(path.join(root,'id-preview.html'),'utf8').match(/<svg class="card"[\s\S]*?<\/svg>/)[0];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
svg=svg.replace(/(<text[^>]*data-field="([^"]+)"[^>]*>)[\s\S]*?(<\/text>)/g,(_,start,key,end)=>start+escape(text[key])+end);
svg=svg.replace(/<image[^>]*data-field="[^"]*"[^>]*\/>/g,tag=>tag.replace('/>',` href="${context.PortraitAssets[data.person.gender]}"/>`));
svg=svg.replace(/(<g[^>]*data-art="([^"]+)"[^>]*>)(<\/g>)/g,(_,start,key,end)=>start+context.IDCardArtwork[key](data.idNumber)+end);
svg=svg.replace('</defs>','</defs><style>text{font-family:Arial,sans-serif;fill:#151c15}.ar-text{direction:rtl;text-anchor:start}.en-text{direction:ltr;text-anchor:start}.header-text{fill:#34733e;font-weight:600}.data-text{font-size:23px}.en-data{font-size:20px}.label-text{font-size:22px}</style>');
const destination=path.join(root,'artifacts');fs.mkdirSync(destination,{recursive:true});
const basename=gender==='male'?'id-sample':'id-sample-female';
fs.writeFileSync(path.join(destination,basename+'.svg'),svg);
sharp(Buffer.from(svg)).resize({width:1284}).png().toFile(path.join(destination,basename+'.png')).then(()=>console.log(JSON.stringify({image:'artifacts/'+basename+'.png',name:data.name,id:data.idNumber}))).catch(error=>{console.error(error);process.exitCode=1;});
