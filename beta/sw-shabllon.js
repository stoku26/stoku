/*
 * Service worker-i i Stoku Beta (scope: /beta/). I ndarë nga ai i Stoku-t (sw.js në rrënjë): ka cache-in
 * e vet ("stoku-beta-…") dhe fshin vetëm cache-t e veta të vjetra, kurrë ato të Stoku-t.
 * Skedarët e përbashkët (afatet.js, ekipa.js…) merren nga "../", me të njëjtat versione si te Stoku.
 */
var CACHE = '__CACHE__';

importScripts(__IMPORT__);
var CDN_BIBLIOTEKA = [
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.2/dist/iife/ponyfill.js',
  'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.3/dist/reader/zxing_reader.wasm',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js'
];
var FAQET = ['./', './index.html'];
var SHELL = FAQET.concat([
__SHELL__
  './fonts/onest.woff2',
  './fonts/jetbrains-mono.woff2',
  '../icon-192.png',
  '../icon-512.png',
  '../apple-touch-icon.png',
  '../logo.png'
]);

function eBetes(emri) { return emri.indexOf('stoku-beta-') === 0; }

async function mbushCacheEri() {
  var c = await caches.open(CACHE);
  var teVjetrat = [];
  try {
    var emrat = await caches.keys();
    for (var i = 0; i < emrat.length; i++) if (emrat[i] !== CACHE) teVjetrat.push(await caches.open(emrat[i]));
  } catch (e) { /* pa cache të vjetër */ }
  async function ngaCacheEVjeter(url) {
    var plote = new URL(url, self.location.href).href;
    for (var j = 0; j < teVjetrat.length; j++) { var r = await teVjetrat[j].match(plote); if (r) return r; }
    return null;
  }
  for (var f = 0; f < FAQET.length; f++) {
    var pf = await fetch(FAQET[f], { cache: 'reload' });
    if (!pf || !pf.ok) throw new Error('instalimi dështoi: ' + FAQET[f]);
    await c.put(FAQET[f], pf);
  }
  for (var k = 0; k < SHELL.length; k++) {
    var url = SHELL[k];
    if (FAQET.indexOf(url) !== -1) continue;
    var eVjeter = await ngaCacheEVjeter(url);
    if (eVjeter) { await c.put(url, eVjeter); continue; }
    var p = await fetch(url);
    if (!p || !p.ok) throw new Error('instalimi dështoi: ' + url);
    await c.put(url, p);
  }
  await Promise.all(CDN_BIBLIOTEKA.map(async function (u) {
    try {
      var e = await ngaCacheEVjeter(u);
      if (e) await c.put(u, e); else await c.add(u);
    } catch (err) { /* ok */ }
  }));
}

self.addEventListener('install', function (e) {
  e.waitUntil(mbushCacheEri().then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (emrat) {
      return Promise.all(emrat.filter(function (k) { return eBetes(k) && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var kerkesa = e.request;
  if (kerkesa.method !== 'GET') return;

  if (kerkesa.mode === 'navigate') {
    var faqja = './index.html';
    e.respondWith(new Promise(function (zgjidh) {
      var uKthye = false;
      function kthe(r) { if (!uKthye && r) { uKthye = true; zgjidh(r); } }
      var kohezuesi = setTimeout(function () { caches.match(faqja, { cacheName: CACHE }).then(kthe); }, 4000);
      fetch(kerkesa.url, { cache: 'no-cache', redirect: 'manual', credentials: 'same-origin' }).then(function (pergjigja) {
        clearTimeout(kohezuesi);
        if (pergjigja && pergjigja.type === 'opaqueredirect') { kthe(pergjigja); return; }
        if (!pergjigja || !pergjigja.ok) { caches.match(faqja, { cacheName: CACHE }).then(function (r) { kthe(r || pergjigja); }); return; }
        var kopje = pergjigja.clone();
        caches.open(CACHE).then(function (c) { c.put(faqja, kopje); });
        kthe(pergjigja);
      }).catch(function () {
        clearTimeout(kohezuesi);
        caches.match(faqja, { cacheName: CACHE }).then(function (r) { kthe(r || Response.error()); });
      });
    }));
    return;
  }

  var url = new URL(kerkesa.url);
  var eRuajtshme = url.origin === self.location.origin ||
    /^(cdn|fastly)\.jsdelivr\.net$/.test(url.hostname) ||
    (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0);
  if (!eRuajtshme) return;

  e.respondWith(
    caches.match(kerkesa, { cacheName: CACHE }).then(function (gjetur) {
      if (gjetur) return gjetur;
      return fetch(kerkesa).then(function (pergjigja) {
        if (pergjigja && pergjigja.ok) {
          var kopje = pergjigja.clone();
          caches.open(CACHE).then(function (c) { c.put(kerkesa, kopje); });
        }
        return pergjigja;
      });
    })
  );
});

self.addEventListener('periodicsync', function (e) {
  if (e.tag === 'stoku-afatet') e.waitUntil(self.StokuNjoftimet.kontrollo(self.registration));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './index.html#afatet';
  var mesazhi = /#\/?ekipa/.test(url) ? { lloji: 'hap-ekipa', pamja: /chat/.test(url) ? 'chat' : /anetaret/.test(url) ? 'anetaret' : 'afatet' } : { lloji: 'hap-afatet' };
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (dritaret) {
    for (var i = 0; i < dritaret.length; i++) {
      var d = dritaret[i];
      if (new URL(d.url).pathname.indexOf('/beta/') !== -1) {
        d.postMessage(mesazhi);
        return d.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
