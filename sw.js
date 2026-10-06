// Static app shell only. No trainee data is sent or stored in the network cache.
const CACHE='tuwaiq-training-v1';
const FILES=['./index.html','./app.css','./manifest.webmanifest','./assets/brand/app-icon.svg','./assets/brand/app-icon-192.png','./assets/brand/app-icon-512.png','./font/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Regular.ttf','./font/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Medium.ttf','./src/shared/name-engine.js','./src/features/person/id-engine.js','./src/features/person/ledger-engine.js','./assets/signatures/demo-signatures.js','./assets/brand/ledger-assets.js','./src/features/person/ledger-renderer.js','./assets/portraits/portrait-data.js','./assets/brand/training-card.js','./src/features/person/id-artwork.js','./src/features/person/id-card.js','./src/features/person/training-engine.js','./src/shared/training-store.js','./src/shared/performance-report.js','./src/app.js'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES);})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('tuwaiq-training-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),indexURL=new URL('./index.html',self.location.href||self.location.origin+'/sw.js');
    const pathname=new URL(event.request.url).pathname;
    if(event.request.mode==='navigate'&&(pathname===indexURL.pathname||pathname===new URL('./',indexURL).pathname))return (await cache.match('./index.html'))||fetch(event.request);
    return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);
  })());
});
