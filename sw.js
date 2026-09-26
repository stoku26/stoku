/*
 * Service worker: e ruan aplikacionin në telefon që të hapet edhe pa internet
 * pasi të jetë hapur një herë me internet.
 *
 * NDRYSHIM: kur ta përditësosh index.html, ndrysho numrin këtu (v1 -> v2),
 * që telefonat të marrin versionin e ri. Kur ndryshon xlsx.js / bashkimi.js / afatet.js, ndrysho edhe
 * "?v=" te index.html, pc.html dhe më poshtë — që asnjë pajisje të mos përdorë kopjen e vjetër.
 */
var CACHE = 'stoku-v90';

// Njoftimet për afatet (kontrolli bëhet edhe kur aplikacioni është mbyllur — shih njoftimet.js)
importScripts('./afatet.js?v=88', './njoftimet.js?v=85');
var CDN_BIBLIOTEKA = [
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.2/dist/iife/ponyfill.js',
  'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.3/dist/reader/zxing_reader.wasm',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js'
];
var SHELL = [
  './',
  './index.html',
  './pc.html',
  './xlsx.js?v=58',
  './bashkimi.js?v=81',
  './ruajtja.js?v=81',
  './afatet.js?v=88',
  './porta.js?v=86',
  './njoftimet.js?v=85',
  './manifest.webmanifest?v=84',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).then(function () {
        // bibliotekat e jashtme (kamera, barkodi, PDF): nëse dështojnë, aplikacioni prapë instalohet
        return Promise.all(CDN_BIBLIOTEKA.map(function (u) { return c.add(u).catch(function () { /* ok */ }); }));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (emrat) {
      return Promise.all(emrat.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var kerkesa = e.request;
  if (kerkesa.method !== 'GET') return;

  // Faqet (telefon = index.html, kompjuter = pc.html): provo internetin së pari (për përditësime),
  // pastaj kopjen e ruajtur të PO ASAJ faqeje — secila ruhet veç, që njëra të mos e zëvendësojë tjetrën.
  if (kerkesa.mode === 'navigate') {
    var faqja = /\/pc(\.html)?$/.test(new URL(kerkesa.url).pathname) ? './pc.html' : './index.html';
    e.respondWith(new Promise(function (zgjidh) {
      var uKthye = false;
      function kthe(r) { if (!uKthye && r) { uKthye = true; zgjidh(r); } }
      // Internet i ngadaltë (p.sh. 3G i dobët në dyqan): pas 4 s hapet kopja e ruajtur, që aplikacioni të mos
      // rrijë me ekran të bardhë; versioni i ri (nëse ka) merret ndërkohë dhe përdoret hapjen tjetër.
      var kohezuesi = setTimeout(function () { caches.match(faqja).then(kthe); }, 4000);
      fetch(kerkesa).then(function (pergjigja) {
        clearTimeout(kohezuesi);
        // Ridrejtim (p.sh. adresa e vjetër → stoku.site): lëre shfletuesin ta ndjekë, mos e fsheh me kopjen e ruajtur
        if (pergjigja && pergjigja.type === 'opaqueredirect') { kthe(pergjigja); return; }
        // Nëse faqja kthen gabim (p.sh. faqja e pezulluar), mos e ruaj dhe mbaje aplikacionin e ruajtur
        if (!pergjigja || !pergjigja.ok) { caches.match(faqja).then(function (r) { kthe(r || pergjigja); }); return; }
        var kopje = pergjigja.clone();
        caches.open(CACHE).then(function (c) { c.put(faqja, kopje); });
        kthe(pergjigja);
      }).catch(function () {
        clearTimeout(kohezuesi);
        caches.match(faqja).then(function (r) { return r || caches.match('./index.html'); }).then(function (r) { kthe(r || Response.error()); });
      });
    }));
    return;
  }

  // Vetëm skedarët e vetë aplikacionit dhe bibliotekat nga CDN ruhen në telefon. Kërkesat e tjera
  // (Firebase/Firestore — sinkronizimi, hyrja, Worker-i i AI-së…) kalojnë drejt në internet: përndryshe
  // çdo lidhje e Firestore-it (GET që rri e hapur minuta të tëra, me URL gjithmonë të re) do të ruhej
  // në telefon pa fund, dhe një URL e përsëritur do të merrte përgjigje të vjetër nga kopja.
  var url = new URL(kerkesa.url);
  var eRuajtshme = url.origin === self.location.origin ||
    /^(cdn|fastly)\.jsdelivr\.net$/.test(url.hostname) ||
    (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0);
  if (!eRuajtshme) return;

  // Gjithçka tjetër: kopja e ruajtur së pari, pastaj interneti
  e.respondWith(
    caches.match(kerkesa).then(function (gjetur) {
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

// ---------- Njoftimet për afatet ----------
// Chrome në Android (app e instaluar) e zgjon service worker-in herë pas here (zakonisht ~1 herë në ditë).
self.addEventListener('periodicsync', function (e) {
  if (e.tag === 'stoku-afatet') e.waitUntil(self.StokuNjoftimet.kontrollo(self.registration));
});

// Prekja e njoftimit hap aplikacionin te "Afatet e produkteve"
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './index.html#afatet';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (dritaret) {
    for (var i = 0; i < dritaret.length; i++) {
      var d = dritaret[i];
      if (!/\/pc(\.html)?$/.test(new URL(d.url).pathname)) {
        d.postMessage({ lloji: 'hap-afatet' });
        return d.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
