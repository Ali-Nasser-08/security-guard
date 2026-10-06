// Filesystem SVG rendering only. No browser is launched or controlled.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),destination=path.join(root,'artifacts');fs.mkdirSync(destination,{recursive:true});
// Load the supplied Arabic fonts without writing to system font caches.
const xmlEscape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const configDirectory=path.join(destination,'fontconfig'),cache=path.join(destination,'font-cache');
fs.mkdirSync(configDirectory,{recursive:true});fs.mkdirSync(cache,{recursive:true});
fs.writeFileSync(path.join(configDirectory,'fonts.conf'),`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${xmlEscape(path.join(root,'font','IBM_Plex_Sans_Arabic').replaceAll('\\','/'))}</dir><dir>C:/Windows/Fonts</dir><cachedir>${xmlEscape(cache.replaceAll('\\','/'))}</cachedir></fontconfig>`);
// Windows fontconfig reads the environment present when its process starts.
// Start this same filesystem renderer with the prepared font configuration.
if(process.env.LEDGER_RENDER_FONTS!=='1'){
  const result=require('node:child_process').spawnSync(process.execPath,process.argv.slice(1),{env:{...process.env,FONTCONFIG_FILE:path.join(configDirectory,'fonts.conf'),FONTCONFIG_PATH:configDirectory,LEDGER_RENDER_FONTS:'1'},stdio:'inherit'});
  if(result.error)throw result.error;process.exit(result.status??1);
}
const sharp=require(process.argv[2]||'sharp');
const context=vm.createContext({});
for(const file of ['src/shared/name-engine.js','src/features/person/id-engine.js','assets/signatures/demo-signatures.js','assets/brand/ledger-assets.js','src/features/person/ledger-engine.js','src/features/person/ledger-renderer.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
let seed=532;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const count=Number(process.argv[3]||16),data=context.LedgerEngine.createEngine(random).generate({count,today:new Date('2026-10-06T00:00:00Z')});
async function run(){
  let svg=context.LedgerRenderer.render(data,context.LedgerAssets);
  // Measure raster ink width using the same font, approximating the browser's text fitting.
  for(const match of [...svg.matchAll(/<text[^>]*data-fit="(\d+)"[^>]*>(.*?)<\/text>/g)]){
    const tag=match[0],content=match[2];if(!content.trim())continue;
    const width=Number(match[1]),size=Number(tag.match(/font-size="([\d.]+)"/)[1]),weight=tag.match(/font-weight="(\d+)"/)[1];
    const isolated=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="90"><text x="600" y="55" text-anchor="middle" direction="${tag.match(/direction="(\w+)"/)[1]}" font-family="IBM Plex Sans Arabic" font-size="${size}" font-weight="${weight}">${content}</text></svg>`;
    const {info}=await sharp(Buffer.from(isolated)).trim().png().toBuffer({resolveWithObject:true});
    if(info.width>width){const fitted=Math.max(12,size*width/info.width);let replacement=tag.replace(`font-size="${size}"`,`font-size="${fitted}"`);if(info.width*fitted/size>width)replacement=replacement.replace('<text ',`<text textLength="${width}" lengthAdjust="spacingAndGlyphs" `);svg=svg.replace(tag,replacement);}
  }
  const basename=`ledger-sample-${count}`;fs.writeFileSync(path.join(destination,basename+'.svg'),svg);
  await sharp(Buffer.from(svg)).resize({width:1782}).png().toFile(path.join(destination,basename+'.png'));
  console.log(JSON.stringify({image:`artifacts/${basename}.png`,count,permit:data.permitNumber,signers:[data.issuer.name,data.manager.name]}));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
