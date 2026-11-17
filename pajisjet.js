/*
 * Pajisjet ku je i kyçur (v319). Pronari: "Te cilesimet > llogaria e shton ni opsion me i pa pajisjet ku osht i kyqt qaj perdorues
 * edhe me pas mundesi me e shkyq llogarin prej ku don." E përbashkët për telefonin (index.html) dhe PC-në (pc.html); Android-i ka
 * binjakun te Pajisjet.kt (ndryshoji bashkë).
 *
 * Firestore: perdoruesit/{uid}/pajisjet/{id} = { emri, lloji ('tel' | 'pc' | 'android'), krijuarSe, paraSe, v }
 *   - Secila pajisje e shkruan dokumentin e vet kur hyn dhe e rifreskon (paraSe) jo më shpesh se një herë në 30 minuta.
 *   - "Shkëput" nga një pajisje tjetër = fshirja e dokumentit. Pajisja e dëgjon dokumentin e vet: kur zhduket (pasi është parë
 *     që ekziston), del vetë nga llogaria (si "Dil") dhe e tregon këtë me një mesazh.
 *   - "Dil" në këtë pajisje e fshin dokumentin e vet.
 * Rregullat (pronari i shton te Firebase, brenda match /perdoruesit/{uid}): lexon, shkruan dhe fshin vetëm vetë llogaria.
 */
(function (root) {
  'use strict';
  var KEY_ID = 'stoku:pajisja:id';
  var RIFRESKO_MS = 30 * 60 * 1000;

  function idEPajisjes() {
    var id = null;
    try { id = localStorage.getItem(KEY_ID); } catch (e) { /* ok */ }
    if (!id || !/^[a-z0-9]{12,40}$/.test(id)) {
      id = '';
      for (var i = 0; i < 20; i++) id += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36));
      try { localStorage.setItem(KEY_ID, id); } catch (e) { /* ok */ }
    }
    return id;
  }

  // "Chrome në Android", "Safari në iPhone", "Edge në Windows" (pa të dhëna të tjera nga shfletuesi)
  function emriNgaUA(ua) {
    ua = String(ua || '');
    var sis = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
      : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'pajisje';
    var sh = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
      : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Shfletuesi';
    return sh + ' në ' + sis;
  }

  // Lista për faqen: e kjo pajisje e para, pastaj sipas aktivitetit të fundit
  function renditLista(lista, idIm) {
    return (lista || []).slice().sort(function (a, b) {
      if ((a.id === idIm) !== (b.id === idIm)) return a.id === idIm ? -1 : 1;
      return (+b.paraSe || 0) - (+a.paraSe || 0);
    });
  }

  // fs: { doc, collection, setDoc, deleteDoc, onSnapshot }; lloji: 'tel' | 'pc'
  function krijo(fs, db, uidFn, lloji, versioni) {
    var id = idEPajisjes();
    var gj = { uid: null, ndalVeten: null, ekziston: false, shkruar: 0, kurShkeputet: null };
    function ref(uid, pid) { return fs.doc(db, 'perdoruesit', uid, 'pajisjet', pid || id); }
    function shkruaj(uid, iRi) {
      var t = Date.now();
      var d = { emri: emriNgaUA(root.navigator && root.navigator.userAgent), lloji: lloji, paraSe: t, v: String(versioni || '') };
      if (iRi) d.krijuarSe = t;
      gj.shkruar = t;
      return fs.setDoc(ref(uid), d, { merge: true }).catch(function () { gj.shkruar = 0; });
    }
    function ndal() {
      if (gj.ndalVeten) { try { gj.ndalVeten(); } catch (e) { /* ok */ } }
      gj.ndalVeten = null; gj.uid = null; gj.ekziston = false;
    }
    // Thirret sa herë ndryshon llogaria (onAuthStateChanged)
    function nis() {
      var uid = uidFn();
      if (uid === gj.uid) return;
      ndal();
      if (!uid) return;
      gj.uid = uid;
      shkruaj(uid, true);
      gj.ndalVeten = fs.onSnapshot(ref(uid), function (s) {
        if (gj.uid !== uid) return;
        if (s.exists()) { gj.ekziston = true; return; }
        if (gj.ekziston && gj.kurShkeputet) { gj.ekziston = false; gj.kurShkeputet(); } // u shkëput nga një pajisje tjetër
      }, function () { /* pa rregullat e reja ose pa internet: s'ndalet asgjë */ });
    }
    // Kur faqja shihet sërish: paraSe rifreskohet (jo më shpesh se 30 min)
    function rifresko() {
      if (gj.uid && Date.now() - gj.shkruar > RIFRESKO_MS) shkruaj(gj.uid, false);
    }
    return {
      id: id,
      nis: nis,
      rifresko: rifresko,
      ndal: ndal,
      kurShkeputet: function (fn) { gj.kurShkeputet = fn; },
      // Lista e pajisjeve të llogarisë (dëgjim); cb([{ id, emri, lloji, krijuarSe, paraSe, kjo }]); kthen funksionin që e ndal
      degjoListen: function (cb, cbGabim) {
        var uid = uidFn();
        if (!uid) { cb([]); return function () {}; }
        return fs.onSnapshot(fs.collection(db, 'perdoruesit', uid, 'pajisjet'), function (q) {
          var l = [];
          q.forEach(function (d) { var x = d.data() || {}; l.push({ id: d.id, emri: x.emri || 'Pajisje', lloji: x.lloji || '', krijuarSe: +x.krijuarSe || 0, paraSe: +x.paraSe || 0, kjo: d.id === id }); });
          cb(renditLista(l, id));
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // Shkëput një pajisje tjetër (fshin dokumentin e saj); ajo del vetë sapo ta marrë ndryshimin
      shkeput: async function (pid) {
        var uid = uidFn();
        if (!uid || !pid || pid === id) return { ok: false };
        try { await fs.deleteDoc(ref(uid, pid)); return { ok: true }; } catch (e) { return { ok: false, kodi: e && e.code }; }
      },
      // "Dil" në këtë pajisje: hiqet nga lista
      fshiVeten: async function () {
        var uid = gj.uid || uidFn();
        ndal();
        if (!uid) return;
        try { await fs.deleteDoc(ref(uid)); } catch (e) { /* ok */ }
      }
    };
  }

  var api = { krijo: krijo, emriNgaUA: emriNgaUA, renditLista: renditLista, KEY_ID: KEY_ID, RIFRESKO_MS: RIFRESKO_MS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuPajisjet = api;
})(typeof window !== 'undefined' ? window : this);
