/*
 * Service worker: e ruan aplikacionin në telefon që të hapet edhe pa internet
 * pasi të jetë hapur një herë me internet.
 *
 * NDRYSHIM: kur ta përditësosh index.html, ndrysho numrin këtu (v1 -> v2),
 * që telefonat të marrin versionin e ri. Kur ndryshon xlsx.js / bashkimi.js / afatet.js, ndrysho edhe
 * "?v=" te index.html, pc.html dhe më poshtë — që asnjë pajisje të mos përdorë kopjen e vjetër.
 */
var CACHE = 'stoku-v65';
var CDN_BIBLIOTEKA = [
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js'
];
var SHELL = [
  './',
  './index.html',
  './pc.html',
  './xlsx.js?v=58',
  './bashkimi.js?v=58',
  './afatet.js?v=62',
  './manifest.webmanifest',
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
    e.respondWith(
      fetch(kerkesa).then(function (pergjigja) {
        // Ridrejtim (p.sh. adresa e vjetër → stoku.site): lëre shfletuesin ta ndjekë, mos e fsheh me kopjen e ruajtur
        if (pergjigja && pergjigja.type === 'opaqueredirect') return pergjigja;
        // Nëse faqja kthen gabim (p.sh. faqja e pezulluar), mos e ruaj dhe mbaje aplikacionin e ruajtur
        if (!pergjigja || !pergjigja.ok) {
          return caches.match(faqja).then(function (e_ruajtur) { return e_ruajtur || pergjigja; });
        }
        var kopje = pergjigja.clone();
        caches.open(CACHE).then(function (c) { c.put(faqja, kopje); });
        return pergjigja;
      }).catch(function () {
        return caches.match(faqja).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

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
