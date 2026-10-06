// Optional static release folder. Node built-ins only; no package installation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');
const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const files=vm.runInNewContext(worker.match(/const FILES=(\[[\s\S]*?\]);/)[1]);
let bytes=0;
for(const relative of [...files,'./sw.js','./font/IBM_Plex_Sans_Arabic/OFL.txt']){
  const source=path.resolve(root,relative),target=path.resolve(output,relative);
  if(!source.startsWith(root+path.sep)||!target.startsWith(output+path.sep))throw new Error('Invalid static path');
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);bytes+=fs.statSync(source).size;
}
console.log(JSON.stringify({output:'dist',files:files.length+1,bytes,frameworks:0,externalServices:0}));
