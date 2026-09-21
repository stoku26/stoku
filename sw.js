/*
 * Service worker: e ruan aplikacionin në telefon që të hapet edhe pa internet
 * pasi të jetë hapur një herë me internet.
 *
 * NDRYSHIM: kur ta përditësosh index.html, ndrysho numrin këtu (v1 -> v2),
 * që telefonat të marrin versionin e ri.
 */
var CACHE = 'stoku-v11';
var CDN_KAMERA = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
var SHELL = [
  './',
  './index.html',
  './xlsx.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).then(function () {
        // libraria e kamerës: nëse dështon, aplikacioni prapë instalohet
        return c.add(CDN_KAMERA).catch(function () { /* ok */ });
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

  // Faqja kryesore: provo internetin së pari (për përditësime), pastaj kopjen e ruajtur
  if (kerkesa.mode === 'navigate') {
    e.respondWith(
      fetch(kerkesa).then(function (pergjigja) {
        // Nëse faqja kthen gabim (p.sh. faqja e pezulluar), mos e ruaj dhe mbaje aplikacionin e ruajtur
        if (!pergjigja || !pergjigja.ok) {
          return caches.match('./index.html').then(function (e_ruajtur) { return e_ruajtur || pergjigja; });
        }
        var kopje = pergjigja.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', kopje); });
        return pergjigja;
      }).catch(function () {
        return caches.match('./index.html');
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
