/*
 * Skedarët (Excel, PDF) që telefoni ose PDA-ja ia dërgon PC-së së së njëjtës llogari (v227), i përbashkët për të dyja.
 *
 * Firebase (Firestore):
 *   dyqane/{uid}/skedaret/{id}          → { emri, lloji, titulli, pajisja, madhesia, pjeset, krijuarSe, skadon[, shkarkuarSe] }
 *   dyqane/{uid}/skedaret/{id}/pjeset/  → 000, 001, … = { i, b } (b: Bytes, deri në 900 KB; një dokument pranon 1 MB)
 *
 * Copat shkruhen të parat dhe dokumenti me të dhënat i fundit: PC-ja e sheh skedarin vetëm kur është i plotë.
 * Nëse dërgimi dështon në mes, copat e shkruara fshihen (fshirjet radhiten pas shkrimeve që ende presin).
 * Skedari mbahet 7 ditë (pastron PC-ja); fshihet edhe me "Fshi". Shih rregullat te SHENIME.md (v227).
 */
(function (root) {
  'use strict';

  var COPA = 900 * 1024;               // bajt për një copë (dokument)
  var MAKS = 15 * 1024 * 1024;         // skedari më i madh që dërgohet
  var DITE_MBAJTJE = 7;
  var AFATI_SHKRIMIT = 45000;          // ms për një shkrim (pa internet Firestore pret pa fund)
  var MIME = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    csv: 'text/csv;charset=utf-8',
    json: 'application/json'
  };

  function idECopes(i) { return ('00' + i).slice(-3); }
  function llojiISkedarit(emri) {
    var m = /\.([a-z0-9]{1,6})$/i.exec(String(emri || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function mimeISkedarit(sk) { return MIME[(sk && sk.lloji) || ''] || 'application/octet-stream'; }
  // Emri i skedarit pa shenja që s'lejohen në Windows/Android (/ \ : * ? " < > |), maksimumi 150 shenja
  function pastroEmrin(emri) {
    var s = String(emri || '').replace(/[\/\\:*?"<>|\u0000-\u001f]+/g, '_').replace(/^[\s.]+|[\s.]+$/g, '');
    if (s.length > 150) {
      var l = llojiISkedarit(s);
      s = s.slice(0, 150 - (l ? l.length + 1 : 0)).replace(/[\s.]+$/, '') + (l ? '.' + l : '');
    }
    return s || 'skedar';
  }
  function madhesiaTekst(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
    return (n / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }
  function eshteLeje(e) { return !!e && (e.code === 'permission-denied' || /permission|insufficient/i.test(String(e.message || ''))); }
  function meAfat(p, ms) {
    return new Promise(function (zgjidh, refuzo) {
      var t = setTimeout(function () { refuzo({ code: 'afati' }); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(t); zgjidh(v); }, function (e) { clearTimeout(t); refuzo(e); });
    });
  }
  function injoro() { /* ok */ }

  // fs: funksionet e Firestore-it { doc, collection, setDoc, getDocs, deleteDoc, onSnapshot, query, orderBy, limit, writeBatch, Bytes };
  // opsionet.afati: ms për një shkrim (testet)
  function krijo(fs, db, uidFn, opsionet) {
    var afati = (opsionet && opsionet.afati) || AFATI_SHKRIMIT;
    function refSkedari(uid, id) { return fs.doc(db, 'dyqane', uid, 'skedaret', id); }
    function refCopes(uid, id, i) { return fs.doc(db, 'dyqane', uid, 'skedaret', id, 'pjeset', idECopes(i)); }

    // skedari: File/Blob; info: { emri, titulli, pajisja, progres(0..1) }
    async function dergo(skedari, info) {
      info = info || {};
      var uid = uidFn();
      if (!uid) return { ok: false, arsye: 'pa-hyrje' };
      var emri = pastroEmrin(info.emri || (skedari && skedari.name));
      var u8;
      try { u8 = new Uint8Array(await skedari.arrayBuffer()); } catch (e) { return { ok: false, arsye: 'lexim' }; }
      if (!u8.length) return { ok: false, arsye: 'bosh' };
      if (u8.length > MAKS) return { ok: false, arsye: 'i-madh' };
      var ref = fs.doc(fs.collection(db, 'dyqane', uid, 'skedaret')); // id i ri
      var n = Math.ceil(u8.length / COPA), tani = Date.now();
      try {
        for (var i = 0; i < n; i++) {
          var copa = u8.subarray(i * COPA, Math.min(u8.length, (i + 1) * COPA));
          await meAfat(fs.setDoc(refCopes(uid, ref.id, i), { i: i, b: fs.Bytes.fromUint8Array(copa) }), afati);
          if (info.progres) { try { info.progres((i + 1) / (n + 1)); } catch (e) { /* ok */ } }
        }
        await meAfat(fs.setDoc(ref, {
          emri: emri, lloji: llojiISkedarit(emri), titulli: String(info.titulli || '').slice(0, 80),
          pajisja: String(info.pajisja || '').slice(0, 40), madhesia: u8.length, pjeset: n,
          krijuarSe: tani, skadon: tani + DITE_MBAJTJE * 86400000
        }), afati);
        return { ok: true, id: ref.id, emri: emri, madhesia: u8.length, pjeset: n };
      } catch (e) {
        try { fs.deleteDoc(ref).catch(injoro); } catch (e2) { /* ok */ }
        for (var j = 0; j < n; j++) { try { fs.deleteDoc(refCopes(uid, ref.id, j)).catch(injoro); } catch (e3) { /* ok */ } }
        return { ok: false, arsye: eshteLeje(e) ? 'leje' : (e && e.code === 'afati' ? 'afati' : 'rrjeti'), kodi: e && e.code };
      }
    }

    // Lista në kohë reale (më të rinjtë të parët); vetëm skedarët e plotë (dokumenti shkruhet pas copave)
    function degjo(cb, cbGabim) {
      var uid = uidFn();
      if (!uid) { cb([]); return function () {}; }
      var q = fs.query(fs.collection(db, 'dyqane', uid, 'skedaret'), fs.orderBy('krijuarSe', 'desc'), fs.limit(60));
      return fs.onSnapshot(q, function (s) {
        var lista = [];
        s.forEach(function (d) {
          var x = d.data() || {};
          if (typeof x.emri === 'string' && typeof x.pjeset === 'number' && x.pjeset > 0) { x.id = d.id; lista.push(x); }
        });
        cb(lista);
      }, function (e) { if (cbGabim) cbGabim(e); });
    }

    // Bajtet e skedarit (copat bashkë, në rend); gabim nëse mungon ndonjë copë
    async function merr(sk) {
      var uid = uidFn();
      if (!uid) throw new Error('pa-hyrje');
      var s = await fs.getDocs(fs.collection(db, 'dyqane', uid, 'skedaret', sk.id, 'pjeset'));
      var copat = [];
      s.forEach(function (d) { var x = d.data() || {}; if (x.b && typeof x.i === 'number') copat.push(x); });
      copat.sort(function (a, b) { return a.i - b.i; });
      if (copat.length !== sk.pjeset) throw new Error('jo-i-plote');
      var pjeset = copat.map(function (c) { return c.b.toUint8Array(); });
      var gj = 0;
      pjeset.forEach(function (p) { gj += p.length; });
      if (sk.madhesia && gj !== sk.madhesia) throw new Error('jo-i-plote');
      var bajtet = new Uint8Array(gj), o = 0;
      pjeset.forEach(function (p) { bajtet.set(p, o); o += p.length; });
      return bajtet;
    }

    function shenoShkarkuar(sk) {
      var uid = uidFn();
      if (!uid) return Promise.resolve({ ok: false });
      return fs.setDoc(refSkedari(uid, sk.id), { shkarkuarSe: Date.now() }, { merge: true })
        .then(function () { return { ok: true }; }, function () { return { ok: false }; });
    }

    // Dokumenti dhe copat në një batch: s'mbetet as skedar pa copa, as copa pa skedar
    async function fshij(sk) {
      var uid = uidFn();
      if (!uid) return { ok: false, arsye: 'pa-hyrje' };
      var b = fs.writeBatch(db);
      b.delete(refSkedari(uid, sk.id));
      for (var i = 0; i < Math.min(sk.pjeset || 0, 40); i++) b.delete(refCopes(uid, sk.id, i));
      try { await b.commit(); return { ok: true }; } catch (e) { return { ok: false, arsye: eshteLeje(e) ? 'leje' : 'rrjeti' }; }
    }

    // Fshin të skaduarit (më shumë se 7 ditë) dhe kthen të tjerët
    function pastroTeSkaduarat(lista, tani) {
      tani = tani || Date.now();
      var mbeten = [];
      (lista || []).forEach(function (sk) {
        if (typeof sk.skadon === 'number' && sk.skadon <= tani) fshij(sk).catch(injoro);
        else mbeten.push(sk);
      });
      return mbeten;
    }

    return { dergo: dergo, degjo: degjo, merr: merr, shenoShkarkuar: shenoShkarkuar, fshij: fshij, pastroTeSkaduarat: pastroTeSkaduarat };
  }

  var api = {
    krijo: krijo, COPA: COPA, MAKS: MAKS, DITE_MBAJTJE: DITE_MBAJTJE, idECopes: idECopes, llojiISkedarit: llojiISkedarit,
    mimeISkedarit: mimeISkedarit, pastroEmrin: pastroEmrin, madhesiaTekst: madhesiaTekst
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuSkedaret = api;
})(typeof self !== 'undefined' ? self : this);
