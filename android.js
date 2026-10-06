/*
 * Stoku brenda aplikacionit Android (tel/, WebView me window.StokuAndroid).
 * WebView s'i ka disa API të shfletuesit; këtu ato lidhen me telefonin, që pjesa tjetër e kodit të mbetet e njëjtë:
 *  - Notification (leja + njoftimet lokale) → njoftimet e Android-it
 *  - navigator.share me skedarë (eksporti në Excel/PDF) → menyja "Ndaj" e Android-it
 *  - shkarkimet "blob:" (<a download>) → po ashtu "Ndaj"
 *  - njoftimet push vijnë nga Firebase Cloud Messaging (ekipa.js e regjistron tokenin)
 * Ngarkohet i pari te index.html. Në shfletues s'bën asgjë.
 */
(function () {
  'use strict';
  var A = window.StokuAndroid;
  if (!A) return;
  document.documentElement.classList.add('android-app');

  // Aplikacion i instaluar (për pyetjet "lejo njoftimet" që bëhen vetëm në aplikacion)
  try { Object.defineProperty(navigator, 'standalone', { get: function () { return true; }, configurable: true }); } catch (e) { /* ok */ }

  // ---- Njoftimet ----
  function urlNga(o) { return String((o && o.data && o.data.url) || ''); }
  function Njoftim(titulli, o) {
    o = o || {};
    try { A.njofto(String(titulli || 'Stoku'), String(o.body || ''), String(o.tag || 'stoku'), urlNga(o)); } catch (e) { /* ok */ }
  }
  Object.defineProperty(Njoftim, 'permission', { get: function () { try { return A.leja(); } catch (e) { return 'denied'; } } });
  var pritjet = [];
  window.__stokuLejaCb = function (p) { var l = pritjet; pritjet = []; l.forEach(function (f) { try { f(p); } catch (e) { /* ok */ } }); };
  Njoftim.requestPermission = function (cb) {
    return new Promise(function (zgjidh) {
      pritjet.push(function (p) { zgjidh(p); if (typeof cb === 'function') cb(p); });
      try { A.kerkoLejen(); } catch (e) { window.__stokuLejaCb('denied'); }
    });
  };
  window.Notification = Njoftim;
  if (window.ServiceWorkerRegistration && ServiceWorkerRegistration.prototype) {
    ServiceWorkerRegistration.prototype.showNotification = function (titulli, o) { Njoftim(titulli, o); return Promise.resolve(); };
  }

  // ---- Skedarët: "Ndaj" e Android-it ----
  function base64(blob) {
    return new Promise(function (zgjidh, refuzo) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ''); zgjidh(s.slice(s.indexOf(',') + 1)); };
      r.onerror = function () { refuzo(r.error); };
      r.readAsDataURL(blob);
    });
  }
  function ndaj(blob, emri, titulli) {
    return base64(blob).then(function (b) { A.ndaj(String(emri || 'skedar'), String(blob.type || ''), b, String(titulli || '')); });
  }
  navigator.canShare = function (d) { return !!(d && d.files && d.files.length); };
  navigator.share = function (d) {
    if (!d || !d.files || !d.files.length) return Promise.reject(new DOMException('S\'ka skedar', 'NotSupportedError'));
    var f = d.files[0];
    return ndaj(f, f.name, d.title);
  };
  // <a href="blob:..." download="emri">: WebView s'e shkarkon vetë
  var klikoOrigjinal = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var h = this.href || '';
    if (this.hasAttribute('download') && /^(blob|data):/.test(h)) {
      var emri = this.getAttribute('download') || 'skedar';
      fetch(h).then(function (r) { return r.blob(); }).then(function (b) { return ndaj(b, emri, emri); }).catch(function () { /* ok */ });
      return;
    }
    return klikoOrigjinal.apply(this, arguments);
  };

  // ---- Ngjyra e shiritave të sistemit sipas temës së Stoku-t (e çelët / e errët) ----
  function ngjyrat() {
    var m = document.getElementById('metaTema') || document.querySelector('meta[name="theme-color"]');
    if (m && A.ngjyrat) { try { A.ngjyrat(String(m.getAttribute('content') || '')); } catch (e) { /* ok */ } }
  }
  document.addEventListener('DOMContentLoaded', function () {
    ngjyrat();
    var m = document.getElementById('metaTema');
    if (m && window.MutationObserver) new MutationObserver(ngjyrat).observe(m, { attributes: true, attributeFilter: ['content'] });
  });

  // ---- Tokeni i njoftimeve (Firebase) ----
  // Aplikacioni e jep kur e merr (edhe më vonë): pajisja regjistrohet sërish te grupi dhe te njoftimi ditor.
  window.addEventListener('stoku-android-token', function () {
    var c = window.__stokuCloud, e = c && c.ekipa;
    if (e && e.aktivizoPush) e.aktivizoPush(true).catch(function () { /* ok */ });
  });
})();
