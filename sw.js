/*
 * Service worker: e ruan aplikacionin në telefon që të hapet edhe pa internet, dhe e përditëson vetë.
 *
 * VERSION I RI = ndrysho numrin te CACHE (v90 → v91). Faqja e kontrollon sw.js në sfond sa herë hapet
 * aplikacioni; kur numri ndryshon, instalohet versioni i ri dhe aplikacioni rinis vetë në çastin e parë
 * të qetë. Kur ndryshon një skedar me "?v=" (xlsx.js, afatet.js, teRejat.js…), ndrysho "?v=" edhe te
 * index.html, pc.html dhe te SHELL më poshtë. Te teRejat.js shto edhe shënimin "Çka ka të re".
 *
 * Instalimi është i lirë: skedarët e pandryshuar (bibliotekat, ikonat, skedarët me të njëjtin ?v=)
 * kopjohen nga cache-i i versionit të mëparshëm, pa u shkarkuar sërish; vetëm faqet dhe skedarët e rinj
 * merren nga interneti.
 */
var CACHE = 'stoku-v116';

// Njoftimet për afatet (kontrolli bëhet edhe kur aplikacioni është mbyllur — shih njoftimet.js)
importScripts('./afatet.js?v=90', './njoftimet.js?v=85');
var CDN_BIBLIOTEKA = [
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.2/dist/iife/ponyfill.js',
  'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.3/dist/reader/zxing_reader.wasm',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js'
];
// Faqet: merren gjithmonë nga interneti (duke anashkaluar cache-in HTTP të shfletuesit)
var FAQET = ['./', './index.html', './pc.html'];
var SHELL = FAQET.concat([
  './xlsx.js?v=113',
  './bashkimi.js?v=113',
  './ruajtja.js?v=110',
  './afatet.js?v=90',
  './ekipa.js?v=5',
  './porta.js?v=116',
  './njoftimet.js?v=85',
  './teRejat.js?v=116',
  './manifest.webmanifest?v=84',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo.png'
]);

async function mbushCacheEri() {
  var c = await caches.open(CACHE);
  var teVjetrat = [];
  try {
    var emrat = await caches.keys();
    for (var i = 0; i < emrat.length; i++) if (emrat[i] !== CACHE) teVjetrat.push(await caches.open(emrat[i]));
  } catch (e) { /* pa cache të vjetër */ }
  async function ngaCacheEVjeter(url) {
    for (var j = 0; j < teVjetrat.length; j++) { var r = await teVjetrat[j].match(url); if (r) return r; }
    return null;
  }
  // 1) Faqet: gjithmonë të freskëta
  for (var f = 0; f < FAQET.length; f++) {
    var pf = await fetch(FAQET[f], { cache: 'reload' });
    if (!pf || !pf.ok) throw new Error('instalimi dështoi: ' + FAQET[f]);
    await c.put(FAQET[f], pf);
  }
  // 2) Skedarët e aplikacionit: të pandryshuarit kopjohen nga cache-i i vjetër, të rinjtë shkarkohen
  for (var k = 0; k < SHELL.length; k++) {
    var url = SHELL[k];
    if (FAQET.indexOf(url) !== -1) continue;
    var eVjeter = await ngaCacheEVjeter(url);
    if (eVjeter) { await c.put(url, eVjeter); continue; }
    var p = await fetch(url);
    if (!p || !p.ok) throw new Error('instalimi dështoi: ' + url);
    await c.put(url, p);
  }
  // 3) Bibliotekat e jashtme (kamera, barkodi, PDF): nëse dështojnë, aplikacioni prapë instalohet
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
      // cache: 'no-cache' = rivërtetohet me serverin (ETag) — kopja HTTP e shfletuesit s'e mban faqen e vjetër deri 10 min
      fetch(kerkesa.url, { cache: 'no-cache', redirect: 'manual', credentials: 'same-origin' }).then(function (pergjigja) {
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

// Prekja e njoftimit: afatet → "Afatet e produkteve"; Ekipa (#ekipa… / #/ekipa…) → tabi Ekipa, në të njëjtin lloj
// dritareje nga erdhi njoftimi (telefon = index.html, kompjuter = pc.html)
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './index.html#afatet';
  var perPc = /pc\.html/.test(url);
  var mesazhi = /#\/?ekipa/.test(url) ? { lloji: 'hap-ekipa', pamja: /chat/.test(url) ? 'chat' : /anetaret/.test(url) ? 'anetaret' : 'afatet' } : { lloji: 'hap-afatet' };
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (dritaret) {
    for (var i = 0; i < dritaret.length; i++) {
      var d = dritaret[i];
      var eshtePc = /\/pc(\.html)?$/.test(new URL(d.url).pathname);
      if (eshtePc === perPc) {
        d.postMessage(mesazhi);
        return d.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
