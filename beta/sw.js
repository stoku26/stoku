// Stoku Beta u hoq (pamja e re tani është te Stoku). Ky service worker vetëm pastron: fshin cache-t e betës,
// çregjistrohet dhe i kthen dritaret e hapura te Stoku (stoku.site/).
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try {
      var emrat = await caches.keys();
      await Promise.all(emrat.filter(function (k) { return k.indexOf('stoku-beta-') === 0; }).map(function (k) { return caches.delete(k); }));
    } catch (err) { /* ok */ }
    await self.registration.unregister();
    var dritaret = await self.clients.matchAll({ type: 'window' });
    dritaret.forEach(function (d) { try { d.navigate('../'); } catch (err) { /* ok */ } });
  })());
});
