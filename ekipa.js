/*
 * Ekipa — pjesa e përbashkët e telefonit (index.html) dhe kompjuterit (pc.html) për tabin "Ekipa".
 *
 * Çka ka brenda:
 *  1. krijoCloud(fs, db, auth, platforma) — leximet/shkrimet në Firestore për ekipën:
 *       perdoruesit/{uid}              → emri + prania (aktivSe, online, platforma)
 *       perdoruesit/{uid}/njoftimet    → njoftimet personale (p.sh. "Blerta e hoqi nga rafti Qumështin tënd")
 *       ekipa_anetaret/{uid}           → kush është pranuar në ekipë (e shkruan vetëm administratori)
 *       ekipa_afatet/{uid}             → përmbledhja e afateve të secilit (vetëm afatet, jo stoku) — kolegët
 *                                        lexojnë këtë, jo dyqanin e plotë (dyqane/{uid} mbetet vetëm i pronarit)
 *       ekipa_feed                     → aktiviteti i ekipës (kush çka hoqi, shtoi, lajmëroi…)
 *       ekipa_chat                     → chat-i i ekipës
 *     Dyqani i secilit (dyqane/{uid}) mbetet i PRONARIT: askush tjetër s'shkruan aty. Kur një koleg e heq nga
 *     rafti një afat të skaduar të dikujt tjetër, i dërgon pronarit një njoftim; aplikacioni i pronarit e zbaton
 *     vetë (vetëm nëse afati ka skaduar vërtet dhe s'është ndryshuar pas heqjes).
 *     Aktiviteti, chat-i dhe njoftimet kalojnë nga një radhë lokale (localStorage): pa internet s'humbin, dërgohen
 *     sapo të ketë lidhje — edhe nëse aplikacioni mbyllet ndërkohë.
 *     Anëtarësia: një llogari e re sheh Ekipën vetëm pasi ta pranojë administratori. Derisa rregullat e reja të
 *     Firestore-it të vendosen (ekipa_anetaret s'lexohet), punohet si më parë: krejt llogaritë janë ekipa.
 *  2. Funksione të pastra (pa DOM, testohen me node): koha relative, prania, mbivendosja e heqjeve,
 *     kalendari, statistikat, teksti i aktivitetit.
 *  3. krijoKontrollues(o) — mban gjendjen e ekipës (anëtarët, afatet e secilit, aktivitetin, chat-in,
 *     njoftimet) dhe dëgjuesit; faqja (telefon/PC) vetëm e vizaton kur thirret o.ndryshoi(…).
 */
(function (root) {
  'use strict';

  var ONLINE_MS = 4 * 60 * 1000;   // pa shenjë jete më shumë se kaq → s'numërohet më "online"
  var RRAHJA_MS = 90 * 1000;       // sa shpesh aplikacioni i hapur thotë "jam këtu"
  var ADMIN_EMRI = 'mendurberisha'; // pasqyron eshteAdmin() te rregullat e Firestore-it: llogaria (email-i i hyrjes) OSE perdoruesit/{uid}.emri
  var PERMBLEDHJA_HEQUR_DITE = 40; // të hequrat e kaq ditëve të fundit hyjnë te përmbledhja (statistikat e muajit)
  var PERMBLEDHJA_MAKS = 700 * 1024; // larg kufirit 1 MB të një dokumenti
  var RADHA_MAKS = 200;
  // Njoftimet push të chat-it (worker/stoku-push.js te Cloudflare). Çelësi publik VAPID: çifti i tij privat është
  // vetëm te Worker-i (VAPID_PRIVATE). Pa Worker-in (ose pa leje për njoftime) punohet si më parë.
  var PUSH_URL = 'https://stoku-push.mendurb.workers.dev';
  var PUSH_VAPID = 'BJ_OXYJsYC00MdMvM1z5WICalHw1CVDrDqNdIxi6zXLd7xIDXlxxCvi7qT9mA-o00zT5PRWGkI50UMMImh5DNyc';
  var KEY_PUSH = 'stoku:push:pajisja';      // { uid, id, endpoint, koha } — kjo pajisje është regjistruar
  var KEY_PUSH_SERVER = 'stoku:push:server'; // koha e përgjigjes së fundit të mirë nga Worker-i
  var MUAJT = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
  var DITET_SHKURT = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];

  function AF() {
    if (root.StokuAfatet) return root.StokuAfatet;
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') return require('./afatet.js'); // testet me node
    return null;
  }
  function dy(n) { return (n < 10 ? '0' : '') + n; }
  function isoDites(d) { return d.getFullYear() + '-' + dy(d.getMonth() + 1) + '-' + dy(d.getDate()); }
  function emriNgaEmail(email) { return String(email || '').replace(/@stoku-app\.local$/, ''); }

  // ======================================================================================
  // 0. Fotot e profilit: ruhen te Worker-i (Cloudflare KV), jo te Firebase. Indeksi { uid: koha } mbahet edhe
  //    te localStorage që fotot të dalin menjëherë (edhe pa internet, nga cache-i i shfletuesit).
  //    Çdo vend me avatar thërret Fotot.apliko(el, { uid, emri }): ka foto → sfond me foton, përndryshe shkronja.
  // ======================================================================================
  var KEY_FOTOT = 'stoku:fotot:indeksi', KEY_FOTOT_EMRAT = 'stoku:fotot:emrat';
  var FOTO_MASA = 256, FOTO_CILESIA = 0.82;
  var Fotot = (function () {
    function lexo(k) { try { return JSON.parse(localStorage.getItem(k) || 'null') || {}; } catch (e) { return {}; } }
    function shkruaj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
    var indeksi = lexo(KEY_FOTOT), emrat = lexo(KEY_FOTOT_EMRAT);
    function celesEmri(e) { return String(e || '').trim().toLowerCase(); }
    function url(u) { return u && indeksi[u] ? PUSH_URL + '/foto/' + encodeURIComponent(u) + '?v=' + indeksi[u] : ''; }
    function uidPer(kush) {
      if (!kush) return '';
      if (typeof kush === 'string') return emrat[celesEmri(kush)] || '';
      return kush.uid || emrat[celesEmri(kush.emri)] || '';
    }
    function vendos(el) {
      var src = url(el.getAttribute('data-foto-uid') || emrat[celesEmri(el.getAttribute('data-foto-emri'))] || '');
      if (src) { el.style.backgroundImage = 'url("' + src + '")'; el.classList.add('me-foto'); }
      else if (el.classList.contains('me-foto')) { el.style.backgroundImage = ''; el.classList.remove('me-foto'); }
    }
    function apliko(el, kush) {
      if (!el) return el;
      var u = typeof kush === 'string' ? '' : (kush && kush.uid) || '';
      el.setAttribute('data-foto-uid', u);
      el.setAttribute('data-foto-emri', typeof kush === 'string' ? kush : (kush && kush.emri) || '');
      vendos(el);
      return el;
    }
    function riapliko() {
      if (typeof document === 'undefined') return;
      Array.prototype.forEach.call(document.querySelectorAll('[data-foto-emri]'), vendos);
    }
    function vendosIndeksin(ind) {
      ind = ind && typeof ind === 'object' ? ind : {};
      if (JSON.stringify(ind) === JSON.stringify(indeksi)) return;
      indeksi = ind; shkruaj(KEY_FOTOT, indeksi); riapliko();
      try { window.dispatchEvent(new Event('stoku-fotot-ndryshuan')); } catch (e) { /* node */ }
    }
    function ndryshoNjeren(u, koha) {
      var ind = Object.assign({}, indeksi);
      if (koha) ind[u] = koha; else delete ind[u];
      vendosIndeksin(ind);
    }
    function vendosEmrat(lista) {
      var ri = Object.assign({}, emrat), ndr = false;
      (lista || []).forEach(function (a) {
        if (!a || !a.uid || !a.emri) return;
        var k = celesEmri(a.emri);
        if (ri[k] !== a.uid) { ri[k] = a.uid; ndr = true; }
      });
      if (!ndr) return;
      emrat = ri; shkruaj(KEY_FOTOT_EMRAT, emrat); riapliko();
    }
    // Fotoja e zgjedhur → katror 256×256 (prerë në mes), JPEG. Kthen Blob.
    function pergatit(skedari) {
      return new Promise(function (ok, gabim) {
        if (!skedari || !/^image\//.test(skedari.type || 'image/')) { gabim(new Error('jo-foto')); return; }
        var img = new Image(), src = URL.createObjectURL(skedari);
        img.onload = function () {
          try {
            var w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
            if (!m) throw new Error('jo-foto');
            var c = document.createElement('canvas'); c.width = c.height = FOTO_MASA;
            var x = c.getContext('2d');
            x.fillStyle = '#fff'; x.fillRect(0, 0, FOTO_MASA, FOTO_MASA);
            x.imageSmoothingQuality = 'high';
            x.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, FOTO_MASA, FOTO_MASA);
            URL.revokeObjectURL(src);
            c.toBlob(function (b) { if (b) ok(b); else gabim(new Error('jo-foto')); }, 'image/jpeg', FOTO_CILESIA);
          } catch (e) { URL.revokeObjectURL(src); gabim(e); }
        };
        img.onerror = function () { URL.revokeObjectURL(src); gabim(new Error('jo-foto')); };
        img.src = src;
      });
    }
    return { apliko: apliko, riapliko: riapliko, url: url, uidPer: uidPer, kaFoto: function (kush) { return !!url(uidPer(kush)); },
      vendosIndeksin: vendosIndeksin, ndryshoNjeren: ndryshoNjeren, vendosEmrat: vendosEmrat, pergatit: pergatit };
  })();

  // ======================================================================================
  // 1. Cloud
  // ======================================================================================
  function krijoCloud(fs, db, auth, platforma) {
    function uid() { return auth.currentUser ? auth.currentUser.uid : null; }
    function emri() { return auth.currentUser ? emriNgaEmail(auth.currentUser.email) : ''; }
    function gabim(e) { return { ok: false, kodi: e && e.code, arsye: String((e && e.message) || e), leje: eshteLeje(e) }; }
    function eshteLeje(e) { return !!e && (e.code === 'permission-denied' || /permission/i.test(String(e.message || ''))); }
    function pastro(o) { var r = {}; Object.keys(o).forEach(function (k) { if (o[k] !== undefined) r[k] = o[k]; }); return r; }
    function listaNga(s) { var l = []; s.forEach(function (d) { l.push(Object.assign({}, d.data(), { id: d.id })); }); return l; }
    function idERe() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); }

    // ---------- Radha e dërgimit (aktiviteti, chat-i, njoftimet) ----------
    // Çdo shkrim merr një id të caktuar dhe ruhet te localStorage derisa serveri ta pranojë. Pa internet, SDK-ja e
    // mban vetë sa kohë faqja është e hapur; nëse aplikacioni mbyllet para kësaj, dërgohet në hapjen tjetër.
    // Rregullat lejojnë vetëm krijimin, prandaj një dërgim i dytë i së njëjtës id refuzohet — s'ka dyfishime.
    var neRruge = {}; // id → premtimi i dërgimit në këtë sesion
    function celesiRadhes() { return 'stoku:ekipa:radha:' + uid(); }
    function lexoRadhen() {
      try { var l = JSON.parse(localStorage.getItem(celesiRadhes()) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
    }
    function ruajRadhen(l) { try { localStorage.setItem(celesiRadhes(), JSON.stringify(l.slice(-RADHA_MAKS))); } catch (e) { /* ok */ } }
    function hiqNgaRadha(id) { if (uid()) ruajRadhen(lexoRadhen().filter(function (x) { return x.id !== id; })); }
    function dergoOp(op, ngaRadha) {
      if (neRruge[op.id]) return neRruge[op.id];
      var te = op.te;
      if (ngaRadha && op.kohaEDergimit) te = Object.assign({}, te, { koha: Date.now() }); // chat-i: kur u dërgua vërtet
      var p;
      try { p = fs.setDoc(fs.doc.apply(null, [db].concat(op.rruga, [op.id])), te); }
      catch (e) { hiqNgaRadha(op.id); return Promise.resolve(gabim(e)); } // p.sh. rrugë e pavlefshme — s'riprovohet
      p = p.then(function () {
        hiqNgaRadha(op.id);
        if (op.rruga[0] === 'ekipa_chat') njoftoPushChat(op.id); // kolegët e marrin njoftimin edhe me aplikacion të mbyllur
        if (op.rruga[0] === 'ekipa_feed' && /^kerkese-/.test(op.te.lloji)) njoftoPushKerkese(op.id);
        return { ok: true, id: op.id };
      }, function (e) {
        // Vetëm gabimet e përkohshme (lidhja) riprovohen; "s'lejohet" (ose ekziston tashmë nga një dërgim i
        // mëparshëm) dhe të dhënat e pavlefshme hiqen nga radha — s'kanë kuptim të riprovohen.
        if (!/unavailable|deadline|resource-exhausted|aborted|internal|unknown|cancelled/.test(String(e && e.code))) { hiqNgaRadha(op.id); return gabim(e); }
        return { ok: true, id: op.id, neRadhe: true }; // mbetet në radhë: dërgohet kur të kthehet lidhja
      }).then(function (r) { delete neRruge[op.id]; return r; });
      neRruge[op.id] = p;
      return p;
    }
    function shtoNeRadhe(rruga, te, kohaEDergimit) {
      var op = { id: idERe(), rruga: rruga, te: pastro(te), kohaEDergimit: !!kohaEDergimit };
      var l = lexoRadhen(); l.push(op); ruajRadhen(l);
      return { id: op.id, premtimi: dergoOp(op, false) };
    }
    function dergoRadhen() { if (uid()) lexoRadhen().forEach(function (op) { dergoOp(op, true); }); }
    // Pret deri në `ms` përgjigjen e serverit; pa internet kthen { ok: true, neRadhe: true } (dërgohet më vonë)
    function pritPak(dergimi, ms) {
      return Promise.race([dergimi.premtimi, new Promise(function (r) { setTimeout(function () { r({ ok: true, id: dergimi.id, neRadhe: true }); }, ms || 4000); })]);
    }
    if (typeof window !== 'undefined') window.addEventListener('online', dergoRadhen);

    // ---------- Njoftimet push (chat-i edhe kur aplikacioni është krejt i mbyllur) ----------
    function lexoLS(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
    function shkruajLS(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
    function pushMbeshtetet() {
      return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' &&
        'PushManager' in window && typeof Notification !== 'undefined';
    }
    function bytesNgaB64u(t) {
      t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '=';
      var b = atob(t), u = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      return u;
    }
    function b64uNgaBytes(buf) {
      var u = new Uint8Array(buf), t = '';
      for (var i = 0; i < u.length; i++) t += String.fromCharCode(u[i]);
      return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function hashTekst(t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); }
    async function thirrPush(rruga, trup) {
      if (!auth.currentUser || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      var token = await auth.currentUser.getIdToken();
      var r = await fetch(PUSH_URL + rruga, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(trup || {}) });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (r.ok && j.ok) shkruajLS(KEY_PUSH_SERVER, Date.now());
      return j;
    }
    // ---------- Fotot e profilit (te Worker-i) ----------
    var fototMarreSe = 0;
    async function thirrFotot(metoda, rruga, trup) {
      if (!auth.currentUser || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      var token = await auth.currentUser.getIdToken();
      var h = { 'Authorization': 'Bearer ' + token };
      if (trup) h['Content-Type'] = trup.type || 'image/jpeg';
      var r = await fetch(PUSH_URL + rruga, { method: metoda, headers: h, body: trup || undefined });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (!r.ok && !j.arsye) j.arsye = 'http-' + r.status;
      return j;
    }
    async function rifreskoFotot(detyrimisht) {
      if (!uid() || (!detyrimisht && Date.now() - fototMarreSe < 10 * 60000)) return false;
      fototMarreSe = Date.now();
      try {
        var j = await thirrFotot('GET', '/fotot');
        if (j && j.ok) { Fotot.vendosIndeksin(j.fotot); return true; }
      } catch (e) { /* pa internet / pa Worker */ }
      fototMarreSe = 0;
      return false;
    }
    async function ngarkoFoton(skedari) {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      var b;
      try { b = await Fotot.pergatit(skedari); } catch (e) { return { ok: false, arsye: 'jo-foto' }; }
      try {
        var j = await thirrFotot('PUT', '/foto', b);
        if (j && j.ok) Fotot.ndryshoNjeren(uid(), j.koha);
        return j && j.ok ? { ok: true } : { ok: false, arsye: (j && j.arsye) || 'gabim' };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    async function hiqFoton() {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      try {
        var j = await thirrFotot('DELETE', '/foto');
        if (j && j.ok) Fotot.ndryshoNjeren(uid(), 0);
        return j && j.ok ? { ok: true } : { ok: false, arsye: (j && j.arsye) || 'gabim' };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    function vetjaTeFotot() { if (uid()) Fotot.vendosEmrat([{ uid: uid(), emri: emri() }]); }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('stoku-auth-ndryshoi', function () { vetjaTeFotot(); rifreskoFotot(true); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) rifreskoFotot(false); });
    }

    function njoftoPushKerkese(id) { thirrPush('/kerkese', { id: id }).catch(function () { /* pa internet / pa Worker */ }); }
    function njoftoPushChat(id) { thirrPush('/chat', { id: id }).catch(function () { /* pa internet / pa Worker — s'ka gjë */ }); }
    // Worker-i u përgjigj mirë së fundi (7 ditë)? Vetëm atëherë i besohet push-it dhe hiqen njoftimet lokale të chat-it.
    async function kontrolloServerin() {
      try {
        var r = await fetch(PUSH_URL, { method: 'GET' });
        var j = await r.json();
        if (r.ok && j && j.ok && j.celesat !== false) { shkruajLS(KEY_PUSH_SERVER, Date.now()); return true; }
      } catch (e) { /* ok */ }
      return false;
    }
    function pushAktiv() {
      var p = lexoLS(KEY_PUSH), s = lexoLS(KEY_PUSH_SERVER);
      return !!(p && p.uid === uid() && s && (Date.now() - s) < 7 * 86400000) &&
        typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    // Regjistron këtë pajisje për njoftime (vetëm me leje të dhënë). Shkruan te ekipa_push vetëm kur ndryshon diçka
    // ose çdo 7 ditë, që lista e Worker-it të mbetet e freskët.
    async function aktivizoPush(detyro) {
      if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
      if (!pushMbeshtetet()) return { ok: false, arsye: 'pa-mbeshtetje' };
      if (Notification.permission !== 'granted') return { ok: false, arsye: 'pa-leje' };
      try {
        var reg = await navigator.serviceWorker.ready;
        var sub = await reg.pushManager.getSubscription();
        if (sub && sub.options && sub.options.applicationServerKey && b64uNgaBytes(sub.options.applicationServerKey) !== PUSH_VAPID) {
          try { await sub.unsubscribe(); } catch (e) { /* ok */ }
          sub = null;
        }
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesNgaB64u(PUSH_VAPID) });
        var j = sub.toJSON();
        var id = uid() + '_' + hashTekst(j.endpoint);
        var ruajtur = lexoLS(KEY_PUSH);
        if (detyro || !ruajtur || ruajtur.id !== id || ruajtur.endpoint !== j.endpoint || (Date.now() - (ruajtur.koha || 0)) > 7 * 86400000) {
          if (ruajtur && ruajtur.id && ruajtur.id !== id && ruajtur.uid === uid()) { try { await fs.deleteDoc(fs.doc(db, 'ekipa_push', ruajtur.id)); } catch (e) { /* ok */ } }
          await fs.setDoc(fs.doc(db, 'ekipa_push', id), { uid: uid(), emri: emri(), endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, platforma: platforma, koha: Date.now() });
          shkruajLS(KEY_PUSH, { uid: uid(), id: id, endpoint: j.endpoint, koha: Date.now() });
        }
        // Orari ditor i kësaj pajisjeje ishte për një regjistrim tjetër (p.sh. çelës i ri): rinovohet me të riun
        var o = orariIm();
        if (o && o.aktiv && o.endpoint !== j.endpoint) vendosOrarin({ aktiv: true, ora: o.ora }).catch(function () { /* ok */ });
        var serveri = await kontrolloServerin();
        return { ok: true, serveri: serveri };
      } catch (e) { return gabim(e); }
    }
    // ---------- Njoftimi ditor për afatet (Worker-i e dërgon në orën e zgjedhur, me Cron) ----------
    var KEY_ORARI = 'stoku:orari', KEY_ORARI_AFATET = 'stoku:orari:afatet';
    function orariIm() { var o = lexoLS(KEY_ORARI); return o && o.uid === uid() ? o : null; }
    async function thirrOrarin(trup) {
      var token = await auth.currentUser.getIdToken();
      var r = await fetch(PUSH_URL + '/orari', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(trup) });
      var j = {}; try { j = await r.json(); } catch (e) { /* ok */ }
      if (!r.ok && !j.arsye) j.arsye = 'http-' + r.status;
      return j;
    }
    function zonaKohore() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Belgrade'; } catch (e) { return 'Europe/Belgrade'; } }
    async function vendosOrarin(o) {
      if (!uid() || typeof fetch !== 'function') return { ok: false, arsye: 'pa-hyrje' };
      try {
        var sub = null;
        if (pushMbeshtetet()) { var reg = await navigator.serviceWorker.ready; sub = await reg.pushManager.getSubscription(); }
        if (o.aktiv && !sub) {
          var a = await aktivizoPush(true);
          if (!a || !a.ok) return { ok: false, arsye: (a && a.arsye) || 'pa-push' };
          sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
        }
        var ishte = orariIm();
        if (!sub) { shkruajLS(KEY_ORARI, null); return { ok: !o.aktiv, arsye: 'pa-push' }; }
        var j = sub.toJSON();
        var r = await thirrOrarin({ aktiv: !!o.aktiv, ora: o.ora, tz: zonaKohore(), platforma: platforma, pajisja: { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth } });
        if (!r || !r.ok) return { ok: false, arsye: (r && r.arsye) || 'gabim' };
        shkruajLS(KEY_ORARI, o.aktiv ? { uid: uid(), aktiv: true, ora: o.ora, endpoint: j.endpoint, koha: Date.now() } : null);
        if (o.aktiv && !(ishte && ishte.aktiv)) shkruajLS(KEY_ORARI_AFATET, null); // afatet dërgohen sërish menjëherë
        return { ok: true };
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }
    // Kopja e afateve te Worker-i (vetëm kur kjo pajisje ka orar dhe kur lista ndryshon, ose një herë në ditë)
    async function dergoAfatetPerOrarin(afatet) {
      var o = orariIm();
      if (!o || !o.aktiv || !uid()) return { ok: false, arsye: 'pa-orar' };
      var l = (afatet || []).filter(function (a) { return a && a.statusi !== 'hequr' && /^\d{4}-\d{2}-\d{2}$/.test(a.data || ''); })
        .map(function (a) { return { e: String(a.emri || '').slice(0, 120), b: String(a.barkodi || '').slice(0, 40), d: a.data }; });
      var h = hashTekst(JSON.stringify(l)), ruajtur = lexoLS(KEY_ORARI_AFATET);
      if (ruajtur && ruajtur.uid === uid() && ruajtur.h === h && Date.now() - ruajtur.koha < 86400000) return { ok: true, pandryshuar: true };
      try {
        var r = await thirrOrarin({ afatet: l });
        if (r && r.ok) shkruajLS(KEY_ORARI_AFATET, { uid: uid(), h: h, koha: Date.now() });
        return r;
      } catch (e) { return { ok: false, arsye: 'rrjeti' }; }
    }

    // Në dalje nga llogaria: kjo pajisje s'merr më njoftimet e kësaj llogarie
    async function caktivizoPush() {
      var o = orariIm();
      if (o && o.aktiv) { try { await vendosOrarin({ aktiv: false }); } catch (e) { /* ok */ } }
      shkruajLS(KEY_ORARI, null); shkruajLS(KEY_ORARI_AFATET, null);
      var ruajtur = lexoLS(KEY_PUSH);
      shkruajLS(KEY_PUSH, null);
      if (ruajtur && ruajtur.id && uid() === ruajtur.uid) { try { await fs.deleteDoc(fs.doc(db, 'ekipa_push', ruajtur.id)); } catch (e) { /* ok */ } }
    }

    // ---------- Prania: "online tani" / "parë para 5 min" ----------
    var rrahjaKohez = null, praniaNisur = false;
    function rrahZemren(online) {
      if (!uid()) return Promise.resolve();
      return fs.setDoc(fs.doc(db, 'perdoruesit', uid()), { aktivSe: Date.now(), online: online !== false, platforma: platforma }, { merge: true })
        .catch(function () { /* pa internet — provohet sërish */ });
    }
    function nisPranine() {
      clearInterval(rrahjaKohez);
      if (!uid()) return;
      praniaNisur = true;
      if (!document.hidden) rrahZemren(true);
      rrahjaKohez = setInterval(function () { if (!document.hidden) rrahZemren(true); }, RRAHJA_MS);
    }
    function ndalPranine() {
      clearInterval(rrahjaKohez); rrahjaKohez = null;
      if (praniaNisur && uid()) rrahZemren(false);
      praniaNisur = false;
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () { if (praniaNisur && uid()) rrahZemren(!document.hidden); });
      window.addEventListener('pagehide', function () { if (praniaNisur && uid()) rrahZemren(false); });
    }

    return {
      nisPranine: nisPranine,
      ndalPranine: ndalPranine,
      rifreskoFotot: rifreskoFotot, ngarkoFoton: ngarkoFoton, hiqFoton: hiqFoton,
      dergoRadhen: dergoRadhen,

      // Anëtarët (perdoruesit/*) me praninë, në kohë reale
      degjoAnetaret: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'perdoruesit'), function (s) {
          var lista = listaNga(s).map(function (x) {
            return { uid: x.id, emri: x.perdoruesi || x.emri || x.id, aktivSe: x.aktivSe || x.kycurSe || 0, online: x.online === true,
              platforma: x.platforma || '', kycurSe: x.kycurSe || 0, admin: x.emri === ADMIN_EMRI || x.perdoruesi === ADMIN_EMRI, sasiaShpejte: x.sasiaShpejte === true };
          });
          Fotot.vendosEmrat(lista);
          cb(lista);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Anëtarësia (miratimi nga administratori) ----------
      // cb({ gjendja }): 'anetar' | 'jo' (në pritje të miratimit) | 'pa-rregulla' (rregullat e reja ende s'janë
      // vendosur: ekipa_anetaret s'lexohet → punohet si më parë, pa miratim)
      degjoAnetaresine: function (cb) {
        if (!uid()) return function () {};
        return fs.onSnapshot(fs.doc(db, 'ekipa_anetaret', uid()), function (s) {
          if (!s.exists() && s.metadata && s.metadata.fromCache) return; // pa internet: ende s'dihet
          cb({ gjendja: s.exists() ? 'anetar' : 'jo' });
        }, function (e) { cb({ gjendja: eshteLeje(e) ? 'pa-rregulla' : 'gabim' }); });
      },
      // Krejt të pranuarit: { uid: { emri, pranuarSe, pranuarNga } }
      degjoTeMiratuarit: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'ekipa_anetaret'), function (s) {
          var m = {};
          s.forEach(function (d) { m[d.id] = Object.assign({}, d.data()); });
          cb(m);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },
      // A është kjo llogari administratori? (true/false; null = s'dihet, p.sh. pa internet)
      // (v140) Llogaria me emrin "mendurberisha" është administratori edhe pa fushën `emri` te Firestore — emri i llogarisë
      // vjen nga Firebase Auth dhe s'falsifikohet; rregullat e Firestore-it e njohin njësoj (request.auth.token.email).
      eshteAdmin: async function () {
        if (!uid()) return null;
        if (emri() === ADMIN_EMRI) return true;
        if (!fs.getDoc) return null;
        try { var s = await fs.getDoc(fs.doc(db, 'perdoruesit', uid())); return !!(s.exists() && s.data().emri === ADMIN_EMRI); } catch (e) { return null; }
      },
      // Administratori: prano në ekipë (lista: [{ uid, emri }])
      pranoAnetaret: async function (lista) {
        if (!uid() || !lista || !lista.length) return { ok: true };
        try {
          var b = fs.writeBatch(db), tani = Date.now();
          lista.slice(0, 400).forEach(function (a) { b.set(fs.doc(db, 'ekipa_anetaret', a.uid), { emri: a.emri || '', pranuarSe: tani, pranuarNga: emri() }); });
          await b.commit();
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      hiqNgaEkipa: async function (u) {
        try { await fs.deleteDoc(fs.doc(db, 'ekipa_anetaret', u)); return { ok: true }; } catch (e) { return gabim(e); }
      },
      // Administratori: fshin llogarinë komplet. Së pari shënohet te ekipa_fshire/{uid} (rregullat ia mbyllin çdo
      // qasje menjëherë, dhe aplikacioni i tij e fshin llogarinë e Firebase-it sapo hapet), pastaj fshihen krejt të
      // dhënat: dyqani (me pjesët dhe fletët), afatet e ekipës, anëtarësia, njoftimet dhe profili.
      fshijLlogarine: async function (u, emriTjeter) {
        if (!uid() || !u || u === uid()) return { ok: false };
        try { await fs.setDoc(fs.doc(db, 'ekipa_fshire', u), { emri: emriTjeter || '', fshireSe: Date.now(), fshireNga: emri() }); }
        catch (e) { return gabim(e); }
        var mbetur = 0;
        async function fshij(ref) { try { await fs.deleteDoc(ref); } catch (e) { mbetur++; } }
        async function fshijKoleksionin(rruga) {
          try {
            var s = await fs.getDocs(fs.collection.apply(null, [db].concat(rruga)));
            var l = []; s.forEach(function (d) { l.push(d.id); });
            for (var i = 0; i < l.length; i++) await fshij(fs.doc.apply(null, [db].concat(rruga, [l[i]])));
          } catch (e) { mbetur++; }
        }
        await fshij(fs.doc(db, 'ekipa_anetaret', u));
        await fshij(fs.doc(db, 'ekipa_afatet', u));
        await fshijKoleksionin(['dyqane', u, 'pjeset']);
        await fshijKoleksionin(['dyqane', u, 'fletet']);
        await fshij(fs.doc(db, 'dyqane', u));
        await fshijKoleksionin(['perdoruesit', u, 'njoftimet']);
        await fshij(fs.doc(db, 'perdoruesit', u));
        return { ok: true, mbetur: mbetur };
      },
      // Kjo llogari u fshi nga administratori? cb() thirret sapo shënimi ekziston (edhe kur je duke punuar)
      degjoFshirjen: function (cb) {
        if (!uid()) return function () {};
        return fs.onSnapshot(fs.doc(db, 'ekipa_fshire', uid()), function (s) { if (s.exists()) cb(s.data() || {}); },
          function () { /* rregullat e vjetra: ekipa_fshire s'lexohet — s'ka fshirje */ });
      },
      // Administratori: llogaritë që presin miratimin (lexim i njëhershëm — për shenjën kur Ekipa s'është e hapur)
      merrKerkesat: async function () {
        if (!uid()) return { ok: false, lista: [] };
        try {
          var r = await Promise.all([fs.getDocs(fs.collection(db, 'perdoruesit')), fs.getDocs(fs.collection(db, 'ekipa_anetaret'))]);
          var pranuar = {};
          r[1].forEach(function (d) { pranuar[d.id] = true; });
          var lista = [];
          r[0].forEach(function (d) {
            var x = d.data() || {};
            if (!pranuar[d.id] && d.id !== uid() && x.emri !== ADMIN_EMRI && x.perdoruesi !== ADMIN_EMRI) lista.push({ uid: d.id, emri: x.perdoruesi || x.emri || d.id, kycurSe: x.kycurSe || 0, aktivSe: x.aktivSe || 0 });
          });
          return { ok: true, lista: lista };
        } catch (e) { var g = gabim(e); g.lista = []; return g; }
      },
      // Administratori, herën e parë me rregullat e reja: krejt llogaritë ekzistuese (ekipa e sotme) pranohen njëherësh.
      // Bëhet vetëm një herë (shënohet te perdoruesit/{admin}.ekipaMigruarSe), që një ekipë e zbrazur qëllimisht të mos mbushet sërish.
      migroAnetaret: async function () {
        if (!uid() || !fs.getDoc) return { ok: false };
        try {
          var une = await fs.getDoc(fs.doc(db, 'perdoruesit', uid()));
          if (une.exists() && une.data().ekipaMigruarSe) return { ok: true, n: 0 };
          var r = await Promise.all([fs.getDocs(fs.collection(db, 'perdoruesit')), fs.getDocs(fs.collection(db, 'ekipa_anetaret'))]);
          // Krejt llogaritë që s'janë ende në ekipë (edhe kur administratori ka pranuar dikë para migrimit)
          var pranuar = {};
          r[1].forEach(function (d) { pranuar[d.id] = true; });
          var n = 0, b = fs.writeBatch(db), tani = Date.now();
          r[0].forEach(function (d) {
            if (n >= 400 || pranuar[d.id]) return;
            var x = d.data() || {};
            b.set(fs.doc(db, 'ekipa_anetaret', d.id), { emri: x.perdoruesi || x.emri || d.id, pranuarSe: tani, pranuarNga: emri(), migruar: true });
            n++;
          });
          if (n) await b.commit();
          await fs.setDoc(fs.doc(db, 'perdoruesit', uid()), { ekipaMigruarSe: Date.now() }, { merge: true });
          return { ok: true, n: n };
        } catch (e) { return gabim(e); }
      },

      // ---------- Administratori: leja e sasisë së shpejtë, njoftim për krejt ekipën, pastrimi ----------
      vendosLejen: async function (u, po) {
        try { await fs.setDoc(fs.doc(db, 'perdoruesit', u), { sasiaShpejte: !!po }, { merge: true }); return { ok: true }; } catch (e) { return gabim(e); }
      },
      // Njoftim te zilja e secilit (lista e uid-ve) + në aktivitet; kalon nga radha (s'humbet pa internet)
      lajmeroEkipen: function (tekst, listaUid) {
        tekst = String(tekst || '').trim().slice(0, 1000);
        if (!tekst || !uid()) return Promise.resolve({ ok: false, arsye: 'bosh' });
        var koha = Date.now();
        (listaUid || []).forEach(function (u) {
          if (u === uid()) return;
          shtoNeRadhe(['perdoruesit', u, 'njoftimet'], { lloji: 'lajmerim', tekst: tekst, uid: uid(), emri: emri(), koha: koha, lexuar: false });
        });
        return pritPak(shtoNeRadhe(['ekipa_feed'], { lloji: 'lajmerim', tekst: tekst, uid: uid(), emri: emri(), koha: koha }));
      },
      // Kërkesë që një koleg (ose krejt ekipa) ta heqë nga rafti një produkt (edhe pa afat në Stoku).
      // Ngjarja te aktiviteti + njoftim te zilja e secilit marrës; Worker-i dërgon push (/kerkese).
      kerkoHeqjen: function (k, listaUid) {
        var produktet = listaEKerkeses(k);
        if (!produktet.length || !uid()) return Promise.resolve({ ok: false, arsye: 'bosh' });
        var produkti = produktet[0].produkti, barkodi = produktet[0].barkodi; // për kërkesat e para (pa listë)
        var shenim = String(k.shenim || '').trim().slice(0, 300), koha = Date.now();
        var ng = shtoNeRadhe(['ekipa_feed'], { lloji: 'kerkese-heqje', uid: uid(), emri: emri(), koha: koha, produkti: produkti,
          barkodi: barkodi, produktet: produktet, shenim: shenim, perUid: k.perUid || '', perEmri: k.perEmri || '' });
        (listaUid || []).forEach(function (u) {
          if (u === uid()) return;
          shtoNeRadhe(['perdoruesit', u, 'njoftimet'], { lloji: 'kerkese-heqje', kerkeseId: ng.id, produkti: produkti, barkodi: barkodi,
            produktet: produktet, shenim: shenim, perKrejt: !k.perUid, uid: uid(), emri: emri(), koha: koha, lexuar: false });
        });
        return pritPak(ng);
      },
      // Marrësi e shënon të kryer: njoftimi i vet (kryer), ngjarje te aktiviteti dhe njoftim te ai që e kërkoi
      kryejKerkesen: async function (nj) {
        if (!uid() || !nj || !nj.id) return { ok: false };
        var koha = Date.now();
        try { await fs.setDoc(fs.doc(db, 'perdoruesit', uid(), 'njoftimet', nj.id), { kryer: true, kryerSe: koha, lexuar: true }, { merge: true }); }
        catch (e) { if (!/unavailable|deadline/.test(String(e && e.code))) return gabim(e); }
        var te = { kerkeseId: nj.kerkeseId || '', produkti: nj.produkti || '', barkodi: nj.barkodi || '', produktet: listaEKerkeses(nj) };
        if (nj.uid && nj.uid !== uid()) shtoNeRadhe(['perdoruesit', nj.uid, 'njoftimet'], Object.assign({ lloji: 'kerkese-kryer', uid: uid(), emri: emri(), koha: koha, lexuar: false }, te));
        return pritPak(shtoNeRadhe(['ekipa_feed'], Object.assign({ lloji: 'kerkese-kryer', uid: uid(), emri: emri(), koha: koha,
          kerkuesUid: nj.uid || '', kerkuesEmri: nj.emri || '' }, te)));
      },
      // Fshin krejt dokumentet e një koleksioni (ekipa_chat / ekipa_feed), me grupe nga 400
      pastroKoleksionin: async function (emriKol) {
        var n = 0;
        try {
          for (var i = 0; i < 50; i++) {
            var s = await fs.getDocs(fs.query(fs.collection(db, emriKol), fs.limit(400)));
            if (s.empty) break;
            var b = fs.writeBatch(db);
            s.forEach(function (d) { b.delete(fs.doc(db, emriKol, d.id)); n++; });
            await b.commit();
          }
          return { ok: true, n: n };
        } catch (e) { var g = gabim(e); g.n = n; return g; }
      },
      // Përmbledhja e afateve të një kolegu, pasi administratori ia ndryshoi afatet
      publikoAfatetPer: async function (u, emriPronarit, afatet) {
        try { await fs.setDoc(fs.doc(db, 'ekipa_afatet', u), { uid: u, emri: emriPronarit || '', afatet: afatet, ndryshuarSe: Date.now() }); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // ---------- Përmbledhja e afateve (ekipa_afatet/{uid}) ----------
      publikoAfatet: async function (afatet) {
        if (!uid()) return { ok: false, arsye: 'pa-hyrje' };
        try {
          await fs.setDoc(fs.doc(db, 'ekipa_afatet', uid()), { uid: uid(), emri: emri(), afatet: afatet, ndryshuarSe: Date.now() });
          return { ok: true };
        } catch (e) { return gabim(e); }
      },
      // { uid: { emri, afatet, ndryshuarSe } }, në kohë reale
      degjoAfatetEEkipes: function (cb, cbGabim) {
        return fs.onSnapshot(fs.collection(db, 'ekipa_afatet'), function (s) {
          var m = {};
          s.forEach(function (d) { var x = d.data() || {}; m[d.id] = { emri: x.emri || '', afatet: Array.isArray(x.afatet) ? x.afatet : [], ndryshuarSe: x.ndryshuarSe || 0 }; });
          cb(m);
        }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Aktiviteti ----------
      shtoNgjarje: function (ng) {
        if (!uid()) return Promise.resolve({ ok: false, arsye: 'pa-hyrje' });
        return pritPak(shtoNeRadhe(['ekipa_feed'], Object.assign({}, ng, { uid: uid(), emri: emri(), koha: Date.now() })));
      },
      degjoNgjarjet: function (cb, n, cbGabim) {
        var q = fs.query(fs.collection(db, 'ekipa_feed'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },

      // ---------- Njoftimet push ----------
      pushMbeshtetet: pushMbeshtetet,
      aktivizoPush: aktivizoPush,
      caktivizoPush: caktivizoPush,
      pushAktiv: pushAktiv,
      orariIm: orariIm, vendosOrarin: vendosOrarin, dergoAfatetPerOrarin: dergoAfatetPerOrarin,

      // ---------- Chat ----------
      dergoMesazh: function (tekst) {
        tekst = String(tekst || '').trim().slice(0, 2000);
        if (!tekst) return Promise.resolve({ ok: false, arsye: 'bosh' });
        if (!uid()) return Promise.resolve({ ok: false, arsye: 'pa-hyrje' });
        return pritPak(shtoNeRadhe(['ekipa_chat'], { uid: uid(), emri: emri(), tekst: tekst, koha: Date.now() }, true));
      },
      degjoChatin: function (cb, n, cbGabim) {
        var q = fs.query(fs.collection(db, 'ekipa_chat'), fs.orderBy('koha', 'desc'), fs.limit(n || 150));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      fshijMesazhin: async function (id) {
        hiqNgaRadha(id); // nëse s'është dërguar ende, s'dërgohet më
        try { await fs.deleteDoc(fs.doc(db, 'ekipa_chat', id)); return { ok: true }; } catch (e) { return gabim(e); }
      },

      // ---------- Njoftimet personale ----------
      dergoNjoftim: function (pronariUid, nj) {
        if (!uid()) return Promise.resolve({ ok: false, arsye: 'pa-hyrje' });
        return pritPak(shtoNeRadhe(['perdoruesit', pronariUid, 'njoftimet'], Object.assign({}, nj, { uid: uid(), emri: emri(), koha: Date.now(), lexuar: false })));
      },
      degjoNjoftimetEPalexuara: function (cb, cbGabim) {
        if (!uid()) return function () {};
        var q = fs.query(fs.collection(db, 'perdoruesit', uid(), 'njoftimet'), fs.where('lexuar', '==', false));
        return fs.onSnapshot(q, function (s) { cb(listaNga(s)); }, function (e) { if (cbGabim) cbGabim(e); });
      },
      merrNjoftimet: async function (n) {
        if (!uid()) return { ok: false, lista: [] };
        try {
          var s = await fs.getDocs(fs.query(fs.collection(db, 'perdoruesit', uid(), 'njoftimet'), fs.orderBy('koha', 'desc'), fs.limit(n || 40)));
          return { ok: true, lista: listaNga(s) };
        } catch (e) { var g = gabim(e); g.lista = []; return g; }
      },
      shenoTeLexuara: async function (ids) {
        if (!uid() || !ids || !ids.length) return { ok: true };
        try {
          var b = fs.writeBatch(db);
          ids.slice(0, 400).forEach(function (id) { b.update(fs.doc(db, 'perdoruesit', uid(), 'njoftimet', id), { lexuar: true }); });
          await b.commit();
          return { ok: true };
        } catch (e) { return gabim(e); }
      }
    };
  }

  // ======================================================================================
  // 2. Funksione të pastra
  // ======================================================================================
  function eshteOnline(a, tani) {
    tani = tani || Date.now();
    return !!a && a.online === true && (tani - (a.aktivSe || 0)) < ONLINE_MS;
  }

  function kohaRelative(ts, tani) {
    if (!ts) return '';
    tani = tani || Date.now();
    var d = tani - ts;
    if (d < 60000) return 'tani';
    if (d < 3600000) return 'para ' + Math.floor(d / 60000) + ' min';
    var dt = new Date(ts), sot = new Date(tani);
    var ora = dy(dt.getHours()) + ':' + dy(dt.getMinutes());
    if (isoDites(dt) === isoDites(sot)) return 'sot ' + ora;
    var dje = new Date(tani); dje.setDate(dje.getDate() - 1);
    if (isoDites(dt) === isoDites(dje)) return 'dje ' + ora;
    return dy(dt.getDate()) + '.' + dy(dt.getMonth() + 1) + (dt.getFullYear() !== sot.getFullYear() ? '.' + dt.getFullYear() : '') + ' ' + ora;
  }

  // Titulli i grupit të ditës në listat me kohë (aktiviteti, chat-i)
  function titulliDites(ts, tani) {
    tani = tani || Date.now();
    var dt = new Date(ts), sot = new Date(tani);
    if (isoDites(dt) === isoDites(sot)) return 'Sot';
    var dje = new Date(tani); dje.setDate(dje.getDate() - 1);
    if (isoDites(dt) === isoDites(dje)) return 'Dje';
    return dy(dt.getDate()) + '.' + dy(dt.getMonth() + 1) + '.' + dt.getFullYear();
  }

  function tekstiPranise(a, tani) {
    tani = tani || Date.now();
    if (eshteOnline(a, tani)) return 'Online tani';
    if (a && a.aktivSe) return 'Parë ' + kohaRelative(a.aktivSe, tani);
    return 'S\'është parë ende';
  }
  function tekstiPlatformes(p) { return p === 'pc' ? 'në kompjuter' : p === 'tel' ? 'në telefon' : ''; }
  // Prania si ikonë (jo tekst): online = ikona e pajisjes (telefon/kompjuter) me pikë të gjelbër;
  // offline = ikonë "jashtë linje" + koha kur u pa. Kthen { online, html, titulli } (html vetëm me ikona + kohë).
  var IK_TEL = '<rect x="6" y="2" width="12" height="20" rx="2.5"></rect><path d="M11 18h2"></path>';
  var IK_PC = '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path>';
  var IK_OFF = '<path d="M2 2l20 20"></path><path d="M8.5 16.5a5 5 0 0 1 7 0"></path><path d="M5 12.9a10 10 0 0 1 5.2-2.8"></path><path d="M19 12.9a10 10 0 0 0-2.3-1.6"></path><path d="M2 8.8a15 15 0 0 1 4.2-2.6"></path><path d="M22 8.8a15 15 0 0 0-11.3-3.8"></path><path d="M12 20h.01"></path>';
  function svgIk(p, m) { return '<svg width="' + (m || 15) + '" height="' + (m || 15) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  function praniaIkone(a, uneJam, platformaIme, tani) {
    tani = tani || Date.now();
    var online = !!uneJam || eshteOnline(a, tani);
    var pl = uneJam ? platformaIme : (a && a.platforma);
    var emriPl = pl === 'pc' ? 'në kompjuter' : pl === 'tel' ? 'në telefon' : '';
    if (online) {
      return { online: true, titulli: 'Online tani' + (emriPl ? ' ' + emriPl : ''),
        html: (pl ? svgIk(pl === 'pc' ? IK_PC : IK_TEL) : '') + '<span class="pk"></span>' };
    }
    var kur = a && a.aktivSe ? kohaRelative(a.aktivSe, tani) : '';
    return { online: false, titulli: 'Jashtë linje' + (kur ? ' · parë ' + kur : '') + (emriPl ? ' (' + emriPl + ')' : ''),
      html: svgIk(IK_OFF) + (kur ? '<span class="kur">' + String(kur).replace(/[<>&"]/g, '') + '</span>' : '') };
  }

  // Heqjet nga rafti të bëra nga kolegët (nga aktiviteti) → afati tregohet "i hequr" te të gjithë,
  // edhe para se aplikacioni i pronarit ta ketë zbatuar në dyqanin e tij.
  function hartaEHeqjeve(ngjarjet) {
    var m = {};
    (ngjarjet || []).forEach(function (ng) {
      if (ng.lloji !== 'hequr' || !ng.pronariUid || !ng.afatId) return;
      var k = ng.pronariUid + '|' + ng.afatId;
      if (!m[k] || m[k].koha < ng.koha) m[k] = ng;
    });
    return m;
  }
  function mbivendosHeqjen(afat, pronariUid, harta) {
    var ng = harta && harta[pronariUid + '|' + afat.id];
    if (!ng || afat.statusi === 'hequr' || (afat.ndryshuarSe || 0) >= ng.koha) return afat;
    // Njësoj si pronari (duhetZbatuarHeqja): vetëm një afat që ka skaduar vërtet shfaqet i hequr
    if (AF().statusi(afat) !== 'skaduar') return afat;
    return Object.assign({}, afat, { statusi: 'hequr', hequrSe: ng.koha, hequrNga: ng.emri });
  }
  // A duhet ta zbatojë pronari heqjen që i dërgoi një koleg? Vetëm për afate të skaduara vërtet, dhe jo nëse
  // pronari e ka ndryshuar afatin pas heqjes (p.sh. e ktheu si aktiv).
  function duhetZbatuarHeqja(afat, nj) {
    if (!afat || !nj || afat.statusi === 'hequr') return false;
    if (AF().statusi(afat) !== 'skaduar') return false;
    return (afat.ndryshuarSe || 0) < (nj.koha || 0);
  }

  // Përmbledhja e afateve që u shfaqet kolegëve (ekipa_afatet/{uid}): vetëm fushat që duhen, afatet në raft +
  // të hequrat e 40 ditëve të fundit, brenda një madhësie të sigurt për një dokument (së pari ato në raft).
  var FUSHAT_E_PERMBLEDHJES = ['id', 'barkodi', 'emri', 'data', 'sasia', 'furnizuesi', 'statusi', 'hequrSe', 'hequrNga', 'lajmeruarSe', 'ndryshuarSe'];
  function permbledhjaEAfateve(afatet, tani) {
    tani = tani || Date.now();
    var kufiri = tani - PERMBLEDHJA_HEQUR_DITE * 86400000;
    var lista = (afatet || []).filter(function (a) {
      return a && a.id && (a.statusi !== 'hequr' || (a.hequrSe || 0) >= kufiri);
    }).map(function (a) {
      var r = {};
      FUSHAT_E_PERMBLEDHJES.forEach(function (k) { if (a[k] !== undefined && a[k] !== null && a[k] !== '') r[k] = a[k]; });
      return r;
    });
    lista.sort(function (x, y) {
      var hx = x.statusi === 'hequr', hy = y.statusi === 'hequr';
      if (hx !== hy) return hx ? 1 : -1;
      if (hx) return (y.hequrSe || 0) - (x.hequrSe || 0) || String(x.id).localeCompare(String(y.id));
      return String(x.data || '').localeCompare(String(y.data || '')) || String(x.id).localeCompare(String(y.id));
    });
    var madhesia = 0, rez = [];
    for (var i = 0; i < lista.length; i++) {
      madhesia += JSON.stringify(lista[i]).length * 1.2 + 40; // ~bajtet në Firestore (shkronjat ë/ç = 2 bajt)
      if (madhesia > PERMBLEDHJA_MAKS) break;
      rez.push(lista[i]);
    }
    return rez;
  }
  function nenshkrimi(x) {
    var s = JSON.stringify(x), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36) + ':' + s.length;
  }

  // Administratori ndryshon një afat të një kolegu direkt në dyqanin e tij: kthen gjendjen e re (ose null nëse s'u gjet).
  // veprimi: 'hiq' (shëno të hequr) | 'kthe' (ktheje në raft) | 'fshij'
  function ndryshoAfatinNeGjendje(gjendja, afatId, veprimi, emriAdminit, tani) {
    tani = tani || Date.now();
    var g = Object.assign({}, gjendja || {});
    var afatet = Array.isArray(g.afatet) ? g.afatet : [];
    if (!afatet.some(function (a) { return a && a.id === afatId; })) return null;
    if (veprimi === 'fshij') {
      g.afatet = afatet.filter(function (a) { return a.id !== afatId; });
      var f = Object.assign({ produktet: {}, foldera: {}, afatet: {} }, g.fshira || {});
      f.afatet = Object.assign({}, f.afatet || {});
      f.afatet[afatId] = tani;
      g.fshira = f;
    } else {
      g.afatet = afatet.map(function (a) {
        if (a.id !== afatId) return a;
        return veprimi === 'kthe'
          ? Object.assign({}, a, { statusi: 'aktiv', hequrSe: 0, hequrNga: '', ndryshuarSe: tani })
          : Object.assign({}, a, { statusi: 'hequr', hequrSe: tani, hequrNga: emriAdminit || '', ndryshuarSe: tani });
      });
    }
    return g;
  }
  var FJALA_E_VEPRIMIT = { hiq: 'e hoqi nga rafti', kthe: 'e ktheu në raft', fshij: 'e fshiu' };

  // Fletët e Excel-it për stokun e një anëtari (xlsx.js buildWorkbook)
  function fletetEStokut(emriAnetarit, produktet, foldera) {
    var emriF = {};
    (foldera || []).forEach(function (f) { emriF[f.id] = f.emri; });
    var rreshtat = (produktet || []).slice().sort(function (a, b) {
      return String(emriF[a.kategoriaId] || '').localeCompare(String(emriF[b.kategoriaId] || ''), 'sq') || String(a.emri || '').localeCompare(String(b.emri || ''), 'sq');
    }).map(function (p) { return [p.barkodi, p.emri || '', emriF[p.kategoriaId] || 'Pa folder', p.sasia | 0, p.prekurSe || '']; });
    return [{ name: String(emriAnetarit || 'Stoku').slice(0, 28), totalLabel: 'Gjithsej', totalColumns: [3], redZeroColumn: 3, rows: rreshtat, columns: [
      { title: 'Barkodi', width: 20, type: 'text' }, { title: 'Emri i produktit', width: 44, type: 'text' },
      { title: 'Folderi', width: 20, type: 'text' }, { title: 'Sasia', width: 10, type: 'number' }, { title: 'Ndryshuar më', width: 18, type: 'date' }] }];
  }

  var RENDI_STATUSIT = { skaduar: 4, 'pa-date': 3, afer: 2, ok: 1, hequr: 0 };
  function statusiMeIKeq(lista) {
    var m = null;
    lista.forEach(function (a) { var s = AF().statusi(a); if (m === null || RENDI_STATUSIT[s] > RENDI_STATUSIT[m]) m = s; });
    return m;
  }

  // Kalendari i një muaji: çdo ditë me afatet që skadojnë atë ditë dhe ngjyrën (statusi më i keq i atyre ende në raft)
  function kalendari(afatet, viti, muaji, tani) {
    var sot = isoDites(new Date(tani || Date.now()));
    var sipasDites = {};
    (afatet || []).forEach(function (a) { if (a.data) (sipasDites[a.data] = sipasDites[a.data] || []).push(a); });
    var e1 = new Date(viti, muaji, 1);
    var zbrazet = (e1.getDay() + 6) % 7; // e hëna = kolona e parë
    var nDite = new Date(viti, muaji + 1, 0).getDate();
    var qelizat = [];
    var i;
    for (i = 0; i < zbrazet; i++) qelizat.push(null);
    for (var d = 1; d <= nDite; d++) {
      var iso = viti + '-' + dy(muaji + 1) + '-' + dy(d);
      var lista = sipasDites[iso] || [];
      var neRaft = lista.filter(function (a) { return AF().statusi(a) !== 'hequr'; });
      qelizat.push({
        iso: iso, dita: d, sot: iso === sot, afatet: lista, neRaft: neRaft.length,
        statusi: neRaft.length ? statusiMeIKeq(neRaft) : (lista.length ? 'hequr' : null)
      });
    }
    while (qelizat.length % 7) qelizat.push(null);
    var shuma = { skaduar: 0, afer: 0, ok: 0, hequr: 0 };
    qelizat.forEach(function (q) { if (q && q.statusi && shuma[q.statusi] !== undefined) shuma[q.statusi]++; });
    return { titulli: MUAJT[muaji] + ' ' + viti, viti: viti, muaji: muaji, qelizat: qelizat, ditet: DITET_SHKURT, ditetMeStatus: shuma };
  }

  // Statistikat e ekipës. anetaret: [{ uid, emri, afatet }] (afatet tashmë me heqjet e mbivendosura)
  function statistikat(anetaret, tani) {
    tani = tani || Date.now();
    var A = AF();
    var dt = new Date(tani);
    var fillimiMuajit = new Date(dt.getFullYear(), dt.getMonth(), 1).getTime();
    var para30 = tani - 30 * 86400000;
    var r = { aktive: 0, skaduara: 0, afer: 0, ok: 0, javes: 0, sot: 0, hequrMuajit: 0, hequrSot: 0, perAnetar: [], furnizuesit: [], heqesit: [] };
    var fur = {}, heq = {};
    var sotIso = isoDites(dt);
    (anetaret || []).forEach(function (m) {
      var x = { uid: m.uid, emri: m.emri, aktive: 0, skaduara: 0, afer: 0, hequr30: 0 };
      (m.afatet || []).forEach(function (a) {
        var st = A.statusi(a);
        if (st === 'hequr') {
          var hs = a.hequrSe || 0;
          if (hs >= fillimiMuajit) r.hequrMuajit++;
          if (hs && isoDites(new Date(hs)) === sotIso) r.hequrSot++;
          if (hs >= para30) {
            x.hequr30++;
            var kush = a.hequrNga || m.emri || '';
            if (kush) heq[kush] = (heq[kush] || 0) + 1;
          }
          return;
        }
        r.aktive++; x.aktive++;
        if (st === 'skaduar') { r.skaduara++; x.skaduara++; }
        else if (st === 'afer') { r.afer++; x.afer++; }
        else if (st === 'ok') r.ok++;
        var n = A.ditetDeri(a.data);
        if (n !== null && n >= 0 && n <= 7) r.javes++;
        if (n === 0) r.sot++;
        if ((st === 'skaduar' || st === 'afer') && a.furnizuesi) fur[a.furnizuesi] = (fur[a.furnizuesi] || 0) + 1;
      });
      r.perAnetar.push(x);
    });
    function rendit(h) { return Object.keys(h).map(function (k) { return { emri: k, n: h[k] }; }).sort(function (a, b) { return b.n - a.n || a.emri.localeCompare(b.emri, 'sq'); }).slice(0, 5); }
    r.furnizuesit = rendit(fur);
    r.heqesit = rendit(heq);
    r.perAnetar.sort(function (a, b) { return b.skaduara - a.skaduara || b.aktive - a.aktive || String(a.emri).localeCompare(String(b.emri), 'sq'); });
    return r;
  }

  // Teksti i një ngjarjeje të aktivitetit: { kush, cfare, detaje, lloji }
  function tekstiNgjarjes(ng, uidIm) {
    var kush = ng.uid === uidIm ? 'Ti' : (ng.emri || 'Dikush');
    var A = AF();
    var dataTx = ng.data && A ? A.formato(ng.data) : '';
    switch (ng.lloji) {
      case 'hequr':
        var iKujt = !ng.pronariUid || ng.pronariUid === ng.uid ? '' : (ng.pronariUid === uidIm ? 'produkt i yti' : 'i përket: ' + (ng.pronariEmri || 'kolegut'));
        return { lloji: 'hequr', kush: kush, cfare: (ng.uid === uidIm ? 'e hoqe' : 'e hoqi') + ' nga rafti: ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: [iKujt, dataTx ? 'skadoi më ' + dataTx : '', ng.sasia ? ng.sasia + ' copë' : ''].filter(Boolean).join(' · ') };
      case 'lajmeruar':
        return { lloji: 'lajmeruar', kush: kush, cfare: (ng.uid === uidIm ? 'e lajmërove' : 'e lajmëroi') + ' furnizuesin' + (ng.furnizuesi ? ' ' + ng.furnizuesi : ''),
          detaje: ng.n ? ng.n + (ng.n === 1 ? ' produkt afër skadimit' : ' produkte afër skadimit') : '' };
      case 'afate-te-reja':
        return { lloji: 'afate-te-reja', kush: kush, cfare: (ng.uid === uidIm ? 'shtove ' : 'shtoi ') + (ng.n || 1) + ((ng.n || 1) === 1 ? ' afat të ri' : ' afate të reja'),
          detaje: ng.ngaFoto ? 'nga fleta e fotografuar' : '' };
      case 'rikthyer':
        return { lloji: 'rikthyer', kush: kush, cfare: (ng.uid === uidIm ? 'e ktheve' : 'e ktheu') + ' në raft: ' + (ng.produkti || ng.barkodi || 'produkt'), detaje: '' };
      case 'anetar-i-ri':
        // Pranimi nga administratori: ngjarja e shkruan ai, por i riu është anetari/anetariEmri
        if (ng.anetariUid && ng.anetariUid !== ng.uid) {
          var iRi = ng.anetariUid === uidIm;
          return { lloji: 'anetar-i-ri', kush: iRi ? 'Ti' : (ng.anetariEmri || 'Një koleg'), cfare: iRi ? 'u pranove në ekipë' : 'u bashkua me ekipën',
            detaje: 'pranuar nga ' + (ng.uid === uidIm ? 'ti' : (ng.emri || 'administratori')), avatar: ng.anetariEmri || '' };
        }
        return { lloji: 'anetar-i-ri', kush: kush, cfare: ng.uid === uidIm ? 'u bashkove me ekipën' : 'u bashkua me ekipën', detaje: '' };
      case 'lajmerim':
        return { lloji: 'lajmerim', kush: kush, cfare: ng.uid === uidIm ? 'njoftove krejt ekipën' : 'njoftoi krejt ekipën', detaje: ng.tekst || '' };
      case 'kerkese-heqje':
        return { lloji: 'lajmeruar', kush: kush, cfare: (ng.uid === uidIm ? 'kërkove' : 'kërkoi') + ' heqjen nga rafti: ' + produktiIKerkeses(ng),
          detaje: (ng.perUid ? 'për ' + (ng.perUid === uidIm ? 'ty' : (ng.perEmri || 'një koleg')) : 'për krejt ekipën') + (ng.shenim ? ' · ' + ng.shenim : '') };
      case 'kerkese-kryer':
        return { lloji: 'hequr', kush: kush, cfare: (ng.uid === uidIm ? 'e hoqe' : 'e hoqi') + ' nga rafti: ' + produktiIKerkeses(ng),
          detaje: 'me kërkesë të ' + (ng.kerkuesUid === uidIm ? 'teje' : (ng.kerkuesEmri || 'një kolegu')) };
      case 'admin-afat':
        return { lloji: 'admin-afat', kush: kush, cfare: (FJALA_E_VEPRIMIT[ng.veprimi] || 'ndryshoi') + ': ' + (ng.produkti || ng.barkodi || 'produkt'),
          detaje: ng.pronariUid === uidIm ? 'produkt i yti' : 'i përket: ' + (ng.pronariEmri || 'kolegut') };
      default:
        return { lloji: ng.lloji || '', kush: kush, cfare: ng.tekst || '', detaje: '' };
    }
  }

  // Produktet e një kërkese për heqje: lista `produktet` (v148), ose produkti/barkodi i vetëm (kërkesat e para)
  var KERKESA_MAKS = 30;
  function listaEKerkeses(k) {
    var l = (k && Array.isArray(k.produktet) && k.produktet.length) ? k.produktet : [{ produkti: k && k.produkti, barkodi: k && k.barkodi, data: k && k.data }];
    return l.filter(function (x) { return x && (x.produkti || x.barkodi); }).slice(0, KERKESA_MAKS).map(function (x) {
      return { produkti: String(x.produkti || '').trim().slice(0, 120), barkodi: String(x.barkodi || '').trim().slice(0, 40), data: /^\d{4}-\d{2}-\d{2}$/.test(x.data || '') ? x.data : '' };
    });
  }
  function emriIProduktit(x) { var p = x.produkti, b = x.barkodi; return p && b && p !== b ? p + ' (' + b + ')' : (p || b || 'produkt'); }
  // Një rresht për listën te njoftimet: "Kos Vita · 3900… · skadoi më 12.09.2026"
  function rreshtiIProduktit(x) {
    var A = AF();
    return [x.produkti || x.barkodi || 'produkt', x.produkti && x.barkodi ? x.barkodi : '', x.data && A ? 'skadoi më ' + A.formato(x.data) : ''].filter(Boolean).join(' · ');
  }
  function produktiIKerkeses(k) {
    var l = listaEKerkeses(k);
    if (l.length <= 1) return emriIProduktit(l[0] || {});
    var emrat = l.slice(0, 3).map(function (x) { return x.produkti || x.barkodi; });
    return l.length + ' produkte (' + emrat.join(', ') + (l.length > 3 ? ' e ' + (l.length - 3) + (l.length - 3 === 1 ? ' tjetër' : ' të tjera') : '') + ')';
  }

  // Zgjedhësi i produkteve te "Kërko heqje nga rafti" (tel + PC): dy lista (të skaduarat / krejt produktet), kërkim
  // dhe shenja (disa njëherësh). burimet: { skaduara: [{ produkti, barkodi, data, nen }], produktet: [...] }
  function zgjedhesIKerkeses(rrenja, burimet, kurNdryshon) {
    var zgjedhur = {}, rendi = [], tabi = (burimet.skaduara || []).length ? 'skaduara' : 'produktet', kerkimi = '';
    function celes(x) { return (x.barkodi || '') + '|' + (x.produkti || '') + '|' + (x.data || ''); }
    function el(tag, kl, tk) { var e = document.createElement(tag); if (kl) e.className = kl; if (tk != null) e.textContent = tk; return e; }
    rrenja.textContent = '';
    var tabet = el('div', 'krk-tabet'); tabet.setAttribute('role', 'tablist');
    var bT = {};
    [['skaduara', 'Të skaduarat'], ['produktet', 'Produktet e mia']].forEach(function (t) {
      var b = el('button', 'krk-tab'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.appendChild(el('span', null, t[1])); b.appendChild(el('span', 'krk-tab__nr', String((burimet[t[0]] || []).length)));
      b.addEventListener('click', function () { tabi = t[0]; vizato(); });
      bT[t[0]] = b; tabet.appendChild(b);
    });
    var kerko = el('input', 'krk-kerko inp'); kerko.type = 'search'; kerko.placeholder = 'Kërko në listë…'; kerko.setAttribute('aria-label', 'Kërko në listë');
    kerko.autocomplete = 'off'; kerko.spellcheck = false;
    kerko.addEventListener('input', function () { kerkimi = kerko.value.trim().toLowerCase(); vizato(); });
    var lista = el('div', 'krk-lista'); lista.setAttribute('role', 'listbox'); lista.setAttribute('aria-multiselectable', 'true');
    rrenja.appendChild(tabet); rrenja.appendChild(kerko); rrenja.appendChild(lista);
    function vizato() {
      Object.keys(bT).forEach(function (k) { bT[k].classList.toggle('aktiv', k === tabi); bT[k].setAttribute('aria-selected', k === tabi ? 'true' : 'false'); });
      lista.textContent = '';
      var te = (burimet[tabi] || []).filter(function (x) {
        return !kerkimi || (String(x.produkti || '') + ' ' + String(x.barkodi || '')).toLowerCase().indexOf(kerkimi) !== -1;
      });
      if (!te.length) {
        lista.appendChild(el('div', 'krk-bosh', kerkimi ? 'Asgjë s\'përputhet me kërkimin.' : tabi === 'skaduara' ? 'S\'ke produkte të skaduara në raft.' : 'S\'ke ende produkte në Stoku.'));
        return;
      }
      te.slice(0, 300).forEach(function (x) {
        var c = celes(x), on = !!zgjedhur[c];
        var b = el('button', 'krk-rresht' + (on ? ' zgjedhur' : '')); b.type = 'button';
        b.setAttribute('role', 'option'); b.setAttribute('aria-selected', on ? 'true' : 'false');
        var sh = el('span', 'krk-shenja'); sh.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
        var tk = el('span', 'krk-tk');
        tk.appendChild(el('b', null, x.produkti || x.barkodi || 'produkt'));
        var nen = [x.produkti && x.barkodi ? x.barkodi : '', x.nen || ''].filter(Boolean).join(' · ');
        if (nen) tk.appendChild(el('span', null, nen));
        b.appendChild(sh); b.appendChild(tk);
        b.addEventListener('click', function () {
          if (zgjedhur[c]) { delete zgjedhur[c]; rendi = rendi.filter(function (k) { return k !== c; }); }
          else { if (rendi.length >= KERKESA_MAKS) return; zgjedhur[c] = x; rendi.push(c); }
          vizato(); if (kurNdryshon) kurNdryshon(rendi.length);
        });
        lista.appendChild(b);
      });
    }
    vizato();
    return {
      zgjedhur: function () { return rendi.map(function (k) { return { produkti: zgjedhur[k].produkti || '', barkodi: zgjedhur[k].barkodi || '', data: zgjedhur[k].data || '' }; }); },
      numri: function () { return rendi.length; }
    };
  }
  // Teksti i një njoftimi personal (zilja + njoftimi i sistemit)
  function tekstiNjoftimit(nj) {
    if (nj.lloji === 'kerkese-heqje') return (nj.emri || 'Një koleg') + (nj.perKrejt ? ' i kërkon ekipës ta heqë nga rafti: ' : ' të kërkon ta heqësh nga rafti: ') +
      produktiIKerkeses(nj) + (nj.shenim ? ' · ' + nj.shenim : '');
    if (nj.lloji === 'kerkese-kryer') return (nj.emri || 'Një koleg') + ' e hoqi nga rafti: ' + produktiIKerkeses(nj) + ' (kërkesa jote)';
    if (nj.lloji === 'hequr') {
      var A = AF();
      return (nj.emri || 'Një koleg') + ' e hoqi nga rafti: ' + (nj.produkti || nj.barkodi || 'produkt') +
        (nj.data && A ? ' (skadoi më ' + A.formato(nj.data) + ')' : '');
    }
    if (nj.lloji === 'lajmerim') return (nj.emri || 'Administratori') + ': ' + (nj.tekst || '');
    if (nj.lloji === 'admin-afat') return (nj.emri || 'Administratori') + ' ' + (FJALA_E_VEPRIMIT[nj.veprimi] || 'ndryshoi') + ': ' + (nj.produkti || nj.barkodi || 'produkt');
    return nj.tekst || '';
  }

  // ======================================================================================
  // 3. Kontrolluesi — gjendja + dëgjuesit; faqja vetëm vizaton
  // ======================================================================================
  // o = {
  //   cloud()        → window.__stokuCloud
  //   uidIm()        → uid i llogarisë aktuale (ose null)
  //   emriIm()       → emri i përdoruesit aktual
  //   afatetEMia()   → afatet lokale (të freskëta, pa pritur cloud-in)
  //   zbatoHeqjet(lista) → pronari zbaton heqjet e kolegëve në dyqanin e vet
  //   njofto({ titulli, teksti, tag, pamja }) → njoftim i sistemit (nëse lejohet)
  //   ndryshoi(cfare) → rivizato
  // }
  var KEY_CHAT_LEXUAR = 'stoku:ekipa:chat-lexuar';
  var KEY_NJOFTUAR = 'stoku:ekipa:njoftuar';
  var KEY_ANETARESIA = 'stoku:ekipa:anetaresia';  // { uid, gjendja, admin } — e fundit e ditur (hapje e shpejtë / pa internet)
  var KEY_PUBLIKUAR = 'stoku:ekipa:publikuar';     // nënshkrimi i përmbledhjes së fundit të dërguar nga kjo pajisje

  function krijoKontrollues(o) {
    var gj = {
      anetaret: [], dyqanet: {}, ngarkuarSe: 0, dukeNgarkuar: false, gabimNgarkimi: '',
      ngjarjet: [], ngjarjetGati: false, chat: [], chatGati: false, chatHapur: false,
      njoftimetPalexuara: [], mesazhiFundit: null, hapur: false,
      anetaresia: null,          // 'anetar' | 'jo' (në pritje të miratimit) | 'pa-rregulla' (rregullat e vjetra) | null (s'dihet ende)
      admin: false,
      teMiratuarit: null,        // { uid: { emri, pranuarSe, pranuarNga } } — null derisa të lexohet
      permbledhjet: null,        // { uid: { emri, afatet, ndryshuarSe } } nga ekipa_afatet
      permbledhjetGabim: false,  // ekipa_afatet s'lexohet (rregullat e vjetra) → lexohen dyqanet si më parë
      nKerkesa: 0                // administratori: sa llogari presin miratimin
    };
    var d = {};
    var chatNisurSe = 0, rifreskimKohez = {}, afateTeReja = { n: 0, ngaFoto: false, kohez: null };
    var publikimi = { kohez: null, nenshkrimi: null, bllokuarDeri: 0, afatet: null };
    var migrimiNeRruge = false;

    function E() { var c = o.cloud && o.cloud(); return (c && c.ekipa) || null; }
    function ndal(k) { if (d[k]) { try { d[k](); } catch (e) { /* ok */ } d[k] = null; } }
    function lexo(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function shkruaj(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } }
    function thirr(cfare) { try { o.ndryshoi(cfare); } catch (e) { if (root.console) console.error(e); } }

    // ---------- Njoftimet e sistemit: secila vetëm një herë ----------
    function uNjoftua(id) {
      var l = []; try { l = JSON.parse(lexo(KEY_NJOFTUAR) || '[]'); } catch (e) { l = []; }
      if (l.indexOf(id) !== -1) return true;
      l.push(id); if (l.length > 200) l = l.slice(-200);
      shkruaj(KEY_NJOFTUAR, JSON.stringify(l));
      return false;
    }

    // ---------- Anëtarësia ----------
    function ruajAnetaresine() {
      var u = o.uidIm();
      if (u) shkruaj(KEY_ANETARESIA, JSON.stringify({ uid: u, gjendja: gj.anetaresia, admin: gj.admin }));
    }
    function ngarkoAnetaresine() {
      var x = null;
      try { x = JSON.parse(lexo(KEY_ANETARESIA) || 'null'); } catch (e) { x = null; }
      var ok = x && x.uid === o.uidIm();
      gj.anetaresia = ok ? (x.gjendja || null) : null;
      gj.admin = ok ? !!x.admin : false;
    }
    function rregullatEReja() { return gj.anetaresia === 'anetar' || gj.anetaresia === 'jo'; }
    // A e sheh ekipën kjo llogari? 'ok' | 'ne-pritje' (pret miratimin e administratorit) | 'duke-kontrolluar'
    function gjendjaEQasjes() {
      if (gj.admin || gj.anetaresia === 'anetar' || gj.anetaresia === 'pa-rregulla') return 'ok';
      return gj.anetaresia === 'jo' ? 'ne-pritje' : 'duke-kontrolluar';
    }
    // Pranimi (ose heqja nga ekipa, ose zbulimi i rregullave) ndryshon krejt çka shihet: dëgjuesit rinisen
    function kurNdryshonQasja() {
      gj.permbledhjetGabim = false;
      nisDegjuesitPersonale();
      if (gj.admin && rregullatEReja()) migroNeseDuhet();
      if (gj.hapur) {
        var chati = gj.chatHapur;
        mbyllDegjuesitEFaqes(); mbyllChatin();
        gj.teMiratuarit = null; gj.permbledhjet = null;
        hap();
        if (chati) hapChatin();
      } else thirr('te-gjitha');
    }
    async function kontrolloAdminin() {
      var e = E();
      if (!e || !e.eshteAdmin) return;
      var a = await e.eshteAdmin();
      if (a === null || !o.uidIm()) return; // pa internet: mbetet e fundit e ditur
      if (a !== gj.admin) { gj.admin = a; ruajAnetaresine(); kurNdryshonQasja(); }
      else if (a && rregullatEReja()) migroNeseDuhet();
    }
    // Administratori, herën e parë me rregullat e reja: ekipa e sotme pranohet krejt njëherësh
    async function migroNeseDuhet() {
      var e = E();
      if (migrimiNeRruge || !e || !e.migroAnetaret || !gj.admin || !rregullatEReja()) return;
      migrimiNeRruge = true;
      var r = await e.migroAnetaret();
      migrimiNeRruge = false;
      if (r && r.ok && r.n) thirr('anetaret');
      if (!gj.hapur) numeroKerkesatNjeHere(); // shenja e kërkesave edhe kur Ekipa s'është e hapur
    }
    // Llogaritë që presin miratimin (vetëm administratori i sheh)
    function kerkesat() {
      if (!gj.admin || !gj.teMiratuarit || !rregullatEReja()) return [];
      var uidIm = o.uidIm();
      return gj.anetaret.filter(function (a) { return !gj.teMiratuarit[a.uid] && !a.admin && a.uid !== uidIm; })
        .sort(function (x, y) { return (y.kycurSe || y.aktivSe || 0) - (x.kycurSe || x.aktivSe || 0); });
    }
    function njoftoKerkesat(lista) {
      var teReja = lista.filter(function (a) { return !uNjoftua('kr:' + a.uid) && (Date.now() - (a.kycurSe || a.aktivSe || 0)) < 7 * 86400000; });
      if (!teReja.length || !o.njofto) return;
      o.njofto({ titulli: 'Stoku · Ekipa', tag: 'ek-kr', pamja: 'anetaret',
        teksti: (teReja.length === 1 ? teReja[0].emri + ' kërkon të bashkohet' : teReja.length + ' llogari kërkojnë të bashkohen') + ' me ekipën. Prano te Ekipa → Anëtarët.' });
    }
    function perditesoKerkesat() {
      if (!gj.admin || !gj.teMiratuarit) return;
      var l = kerkesat();
      gj.nKerkesa = l.length;
      njoftoKerkesat(l);
    }
    async function numeroKerkesatNjeHere() {
      var e = E();
      if (!e || !e.merrKerkesat || !gj.admin || !rregullatEReja()) return;
      var r = await e.merrKerkesat();
      if (!r || !r.ok || gj.hapur) return;
      gj.nKerkesa = r.lista.length;
      njoftoKerkesat(r.lista);
      thirr('kerkesat');
    }
    // Veprimet e administratorit
    async function pranoAnetaret(lista) {
      var e = E();
      if (!e || !gj.admin || !lista || !lista.length) return { ok: false };
      var r = await e.pranoAnetaret(lista.map(function (a) { return { uid: a.uid, emri: a.emri }; }));
      if (r.ok) lista.forEach(function (a) { e.shtoNgjarje({ lloji: 'anetar-i-ri', anetariUid: a.uid, anetariEmri: a.emri }); });
      return r;
    }
    async function hiqNgaEkipa(a) {
      var e = E();
      if (!e || !gj.admin || !a || a.uid === o.uidIm()) return { ok: false };
      return e.hiqNgaEkipa(a.uid);
    }
    // Administratori: fshin llogarinë komplet (jo veten, jo një administrator tjetër)
    async function fshijLlogarine(a) {
      var e = E();
      if (!e || !e.fshijLlogarine || !gj.admin || !a || a.uid === o.uidIm() || a.admin) return { ok: false };
      var r = await e.fshijLlogarine(a.uid, a.emri);
      if (r.ok) {
        gj.anetaret = gj.anetaret.filter(function (x) { return x.uid !== a.uid; });
        delete gj.dyqanet[a.uid];
        if (gj.permbledhjet) delete gj.permbledhjet[a.uid];
        if (gj.teMiratuarit) delete gj.teMiratuarit[a.uid];
        perditesoKerkesat();
        thirr('anetaret');
      }
      return r;
    }
    // Administratori: leja e butonave +/- (sasia e shpejtë) për një anëtar
    async function vendosLejen(a, po) {
      var e = E();
      if (!e || !gj.admin || !e.vendosLejen) return { ok: false };
      return e.vendosLejen(a.uid, po);
    }
    // Kërkesë për heqje nga rafti (çdo anëtar): te një koleg (perUid) ose te krejt ekipa
    function koleget() { var im = o.uidIm(); return anetaretEDukshem().filter(function (a) { return a.uid !== im; }); }
    async function kerkoHeqjen(k) {
      var e = E();
      if (!e || !e.kerkoHeqjen) return { ok: false };
      var lista = koleget(), per = null;
      if (k.perUid) { lista.forEach(function (a) { if (a.uid === k.perUid) per = a; }); if (!per) return { ok: false, arsye: 'anetari' }; }
      if (!lista.length) return { ok: false, arsye: 'pa-kolege' };
      return e.kerkoHeqjen({ produktet: k.produktet, shenim: k.shenim, perUid: per ? per.uid : '', perEmri: per ? per.emri : '' },
        per ? [per.uid] : lista.map(function (a) { return a.uid; }));
    }
    async function kryejKerkesen(nj) {
      var e = E();
      if (!e || !e.kryejKerkesen) return { ok: false };
      var r = await e.kryejKerkesen(nj);
      if (r && r.ok) { nj.kryer = true; gj.njoftimetPalexuara = gj.njoftimetPalexuara.filter(function (x) { return x.id !== nj.id; }); thirr('njoftimet'); }
      return r;
    }
    // Administratori: njoftim te zilja e krejt anëtarëve
    async function lajmeroEkipen(tekst) {
      var e = E();
      if (!e || !gj.admin || !e.lajmeroEkipen) return { ok: false };
      return e.lajmeroEkipen(tekst, anetaretEDukshem().map(function (a) { return a.uid; }));
    }
    async function pastro(emriKol) {
      var e = E();
      if (!e || !gj.admin || !e.pastroKoleksionin) return { ok: false };
      return e.pastroKoleksionin(emriKol);
    }
    // Administratori: stoku i plotë i një anëtari (vetëm lexim)
    async function merrStokun(uid) {
      var c = o.cloud && o.cloud();
      if (!c || !c.merrDyqaninEPerdoruesit || !gj.admin) return { ok: false };
      if (uid === o.uidIm() && o.stokuIm) return { ok: true, produktet: o.stokuIm().produktet, foldera: o.stokuIm().foldera };
      var r = await c.merrDyqaninEPerdoruesit(uid);
      if (!r || !r.ok) return { ok: false, kodi: r && r.kodi };
      return { ok: true, produktet: (r.gjendja && r.gjendja.produktet) || [], foldera: (r.gjendja && r.gjendja.foldera) || [] };
    }
    // Administratori: heq / kthen / fshin një afat të një kolegu direkt në dyqanin e tij; pronari njoftohet
    async function adminNdryshoAfatin(afat, veprimi) {
      var c = o.cloud && o.cloud(), e = E();
      if (!c || !c.ndryshoDyqaninEPerdoruesit || !e || !gj.admin || !afat || afat.pronariUid === o.uidIm()) return { ok: false };
      var uGjet = true;
      var r = await c.ndryshoDyqaninEPerdoruesit(afat.pronariUid, function (gjendja) {
        var g = ndryshoAfatinNeGjendje(gjendja, afat.id, veprimi, o.emriIm());
        if (!g) { uGjet = false; return gjendja; }
        return g;
      });
      if (!r || !r.ok) return r || { ok: false };
      if (!uGjet) return { ok: false, arsye: 'nuk-u-gjet' };
      var p = permbledhjaEAfateve((r.gjendja && r.gjendja.afatet) || []);
      if (!gj.permbledhjet) gj.permbledhjet = {};
      gj.permbledhjet[afat.pronariUid] = { emri: afat.pronariEmri || '', afatet: p, ndryshuarSe: Date.now() };
      if (gj.dyqanet[afat.pronariUid]) gj.dyqanet[afat.pronariUid] = { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() };
      thirr('dyqanet');
      if (e.publikoAfatetPer) e.publikoAfatetPer(afat.pronariUid, afat.pronariEmri || '', p);
      var te = { lloji: 'admin-afat', veprimi: veprimi, afatId: afat.id, produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || '' };
      e.dergoNjoftim(afat.pronariUid, te);
      e.shtoNgjarje(Object.assign({ pronariUid: afat.pronariUid, pronariEmri: afat.pronariEmri || '' }, te));
      return { ok: true };
    }

    // ---------- Gjithmonë, sa kohë je i kyçur ----------
    function nisGjithmone() {
      var e = E();
      ndalGjithmone(true);
      if (!e || !o.uidIm()) return;
      ngarkoAnetaresine();
      e.nisPranine();
      if (e.dergoRadhen) e.dergoRadhen(); // aktiviteti/chat-i/njoftimet që mbetën pa u dërguar herën e kaluar
      if (e.degjoAnetaresine) {
        d.anetaresia = e.degjoAnetaresine(function (r) {
          var g = r.gjendja === 'gabim' ? (gj.anetaresia || 'pa-rregulla') : r.gjendja;
          if (g === gj.anetaresia) return;
          gj.anetaresia = g;
          ruajAnetaresine();
          kurNdryshonQasja();
        });
        kontrolloAdminin();
      } else gj.anetaresia = 'pa-rregulla';
      nisDegjuesitPersonale();
      // Administratori e fshiu këtë llogari → aplikacioni e mbyll dhe e fshin (o.llogariaUFshi)
      if (e.degjoFshirjen && o.llogariaUFshi) d.fshirja = e.degjoFshirjen(function (x) { ndal('fshirja'); try { o.llogariaUFshi(x); } catch (er) { /* ok */ } });
      if (gj.hapur) hap(); // Ekipa ishte e hapur kur u hyr në llogari → lidhu tani
    }
    // Njoftimet personale + mesazhi i fundit i chat-it (për shenjat), vetëm kur ke qasje në ekipë
    function nisDegjuesitPersonale() {
      var e = E();
      ndal('njoftimet'); ndal('chatFundit');
      if (!e || !o.uidIm() || gjendjaEQasjes() !== 'ok') {
        gj.njoftimetPalexuara = []; gj.mesazhiFundit = null;
        thirr('njoftimet');
        return;
      }
      d.njoftimet = e.degjoNjoftimetEPalexuara(function (lista) {
        lista.sort(function (a, b) { return (b.koha || 0) - (a.koha || 0); });
        gj.njoftimetPalexuara = lista;
        var heqjet = lista.filter(function (n) { return n.lloji === 'hequr'; });
        if (heqjet.length && o.zbatoHeqjet) { try { o.zbatoHeqjet(heqjet); } catch (er) { /* ok */ } }
        lista.forEach(function (n) {
          if (uNjoftua('nj:' + n.id)) return;
          if ((Date.now() - (n.koha || 0)) >= 2 * 86400000 || !o.njofto) return;
          // Kërkesat vijnë edhe si push nga Worker-i: kur push-i punon, njoftimi lokal do të ishte i dyfishtë (si te chat-i)
          var ngaPush = /^kerkese-/.test(n.lloji) && e.pushAktiv && e.pushAktiv();
          o.njofto({ titulli: /^kerkese-/.test(n.lloji) ? 'Stoku · Hiqe nga rafti' : 'Stoku · Ekipa', teksti: tekstiNjoftimit(n), tag: 'ek-nj-' + n.id, pamja: 'njoftimet', vetemNePerpara: ngaPush });
        });
        thirr('njoftimet');
      }, function () { /* p.sh. rregullat ende pa u vendosur — thjesht s'ka njoftime */ });
      if (e.aktivizoPush) e.aktivizoPush().then(function () { thirr('push'); }, function () { /* ok */ });
      chatNisurSe = Date.now();
      d.chatFundit = e.degjoChatin(function (lista) {
        var m = lista[0] || null;
        gj.mesazhiFundit = m;
        if (m && m.uid !== o.uidIm() && m.koha > chatNisurSe - 5000 && !uNjoftua('ch:' + m.id)) {
          var neChat = gj.chatHapur && !document.hidden;
          // Me push aktiv, njoftimin e sistemit e jep service worker-i (edhe kur aplikacioni është i mbyllur) — pa dyfishim
          if (!neChat && o.njofto && !(e.pushAktiv && e.pushAktiv())) o.njofto({ titulli: (m.emri || 'Ekipa') + ' · Chat', teksti: m.tekst, tag: 'ek-chat', pamja: 'chat' });
        }
        if (gj.chatHapur && !document.hidden) shenoChatinTeLexuar();
        thirr('chat-fundit');
      }, 1, function () { /* ok */ });
    }
    function ndalGjithmone(vetemDegjuesit) {
      ndal('njoftimet'); ndal('chatFundit'); ndal('anetaresia'); ndal('fshirja');
      if (!vetemDegjuesit) {
        var e = E(); if (e) e.ndalPranine();
        mbyll();
        clearTimeout(publikimi.kohez);
        gj.njoftimetPalexuara = []; gj.mesazhiFundit = null; gj.dyqanet = {}; gj.ngarkuarSe = 0; gj.anetaret = [];
        gj.ngjarjet = []; gj.ngjarjetGati = false; gj.chat = []; gj.chatGati = false;
        gj.anetaresia = null; gj.admin = false; gj.teMiratuarit = null; gj.permbledhjet = null; gj.permbledhjetGabim = false; gj.nKerkesa = 0;
        publikimi = { kohez: null, nenshkrimi: null, bllokuarDeri: 0, afatet: null };
        thirr('te-gjitha');
      }
    }

    // ---------- Kur hapet tabi Ekipa ----------
    function hap() {
      var e = E();
      gj.hapur = true;
      if (!e || !o.uidIm()) { thirr('te-gjitha'); return; }
      if (gjendjaEQasjes() !== 'ok') { mbyllDegjuesitEFaqes(); thirr('te-gjitha'); return; } // në pritje të miratimit / duke kontrolluar
      if (!d.anetaret) {
        d.anetaret = e.degjoAnetaret(function (lista) {
          gj.anetaret = lista;
          perditesoKerkesat();
          ngarkoMungesat();
          thirr('anetaret');
        }, function () { gj.gabimNgarkimi = 'rregullat'; thirr('anetaret'); });
      }
      if (!d.teMiratuarit && e.degjoTeMiratuarit && rregullatEReja()) {
        d.teMiratuarit = e.degjoTeMiratuarit(function (m) {
          gj.teMiratuarit = m;
          perditesoKerkesat();
          ngarkoMungesat();
          thirr('anetaret');
        }, function () { ndal('teMiratuarit'); thirr('anetaret'); });
      }
      if (!d.permbledhjet && e.degjoAfatetEEkipes && !gj.permbledhjetGabim) {
        d.permbledhjet = e.degjoAfatetEEkipes(function (m) {
          gj.permbledhjet = m;
          ngarkoMungesat();
          thirr('dyqanet');
        }, function () {
          // Rregullat e vjetra: afatet e kolegëve lexohen nga dyqanet e tyre, si më parë
          gj.permbledhjetGabim = true; gj.permbledhjet = null; ndal('permbledhjet');
          ngarkoMungesat();
          thirr('dyqanet');
        });
      }
      if (!e.degjoAfatetEEkipes) gj.permbledhjetGabim = true;
      ngarkoMungesat();
      if (!d.ngjarjet) {
        d.ngjarjet = e.degjoNgjarjet(function (lista) {
          var teRejaNgaTjeret = gj.ngjarjetGati ? lista.filter(function (ng) {
            return ng.uid !== o.uidIm() && !gj.ngjarjet.some(function (x) { return x.id === ng.id; });
          }) : [];
          gj.ngjarjet = lista;
          gj.ngjarjetGati = true;
          // Një koleg pa përmbledhje (version i vjetër) shtoi afate ose hoqi të vetat → rilexo dyqanin e tij
          teRejaNgaTjeret.forEach(function (ng) {
            if (ng.lloji === 'afate-te-reja' || ng.lloji === 'rikthyer' || (ng.lloji === 'hequr' && ng.pronariUid === ng.uid)) rifreskoDyqanin(ng.uid);
          });
          thirr('ngjarjet');
        }, 150, function () { gj.ngjarjetGati = true; thirr('ngjarjet'); });
      }
      thirr('te-gjitha');
    }
    function mbyllDegjuesitEFaqes() { ndal('anetaret'); ndal('ngjarjet'); ndal('teMiratuarit'); ndal('permbledhjet'); }
    function mbyll() {
      gj.hapur = false;
      mbyllDegjuesitEFaqes();
      mbyllChatin();
    }

    // ---------- Afatet e kolegëve ----------
    // Kryesisht nga përmbledhjet (ekipa_afatet, në kohë reale). Vetëm për kolegët pa përmbledhje ende (version i
    // vjetër i aplikacionit) ose me rregullat e vjetra, lexohet dyqani i tyre (nëse rregullat e lejojnë).
    function anetaretEDukshem() {
      if (!rregullatEReja()) return gj.anetaret;
      if (!gj.teMiratuarit) return gj.anetaret.filter(function (a) { return a.uid === o.uidIm(); }); // ende s'dihet kush është pranuar
      return gj.anetaret.filter(function (a) { return gj.teMiratuarit[a.uid] || a.admin; });
    }
    function kaPermbledhje(uid) { return !!(gj.permbledhjet && gj.permbledhjet[uid]); }
    async function ngarkoMungesat() {
      var c = o.cloud && o.cloud();
      if (!gj.hapur || !c || !c.merrDyqaninEPerdoruesit || gj.dukeNgarkuar) return;
      if (!gj.permbledhjetGabim && !gj.permbledhjet) return; // pritet përgjigjja e parë e përmbledhjeve
      var uidIm = o.uidIm(), tani = Date.now();
      var tjeret = anetaretEDukshem().filter(function (a) {
        if (a.uid === uidIm || kaPermbledhje(a.uid)) return false;
        var x = gj.dyqanet[a.uid];
        return !x || tani - x.merrurSe > 3 * 60 * 1000;
      });
      if (!tjeret.length) { if (!gj.ngarkuarSe && gj.anetaret.length) { gj.ngarkuarSe = tani; thirr('dyqanet'); } return; }
      gj.dukeNgarkuar = true; gj.gabimNgarkimi = '';
      thirr('dyqanet');
      var rez = await Promise.all(tjeret.map(function (a) { return c.merrDyqaninEPerdoruesit(a.uid); }));
      rez.forEach(function (r, i) {
        gj.dyqanet[tjeret[i].uid] = (r && r.ok)
          ? { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() }
          : { afatet: [], merrurSe: Date.now(), gabim: true };
      });
      gj.ngarkuarSe = Date.now();
      gj.dukeNgarkuar = false;
      thirr('dyqanet');
    }
    function rifreskoDyqanin(uid) {
      if (kaPermbledhje(uid)) return; // përmbledhja vjen vetë, në kohë reale
      clearTimeout(rifreskimKohez[uid]);
      rifreskimKohez[uid] = setTimeout(async function () {
        var c = o.cloud && o.cloud();
        if (!c || !c.merrDyqaninEPerdoruesit || kaPermbledhje(uid)) return;
        var r = await c.merrDyqaninEPerdoruesit(uid);
        if (r && r.ok) { gj.dyqanet[uid] = { afatet: (r.gjendja && r.gjendja.afatet) || [], merrurSe: Date.now() }; thirr('dyqanet'); }
      }, 2500);
    }

    // Anëtarët me afatet e tyre (heqjet e kolegëve të mbivendosura); i imi nga të dhënat lokale
    function anetaretMeAfate() {
      var uidIm = o.uidIm();
      var harta = hartaEHeqjeve(gj.ngjarjet);
      var lista = anetaretEDukshem().slice();
      if (uidIm && !lista.some(function (a) { return a.uid === uidIm; })) lista.push({ uid: uidIm, emri: o.emriIm(), aktivSe: Date.now(), online: true, admin: gj.admin });
      return lista.map(function (a) {
        var une = a.uid === uidIm;
        var p = !une && gj.permbledhjet && gj.permbledhjet[a.uid];
        var dq = !une && !p && gj.dyqanet[a.uid];
        var burimi = une ? (o.afatetEMia() || []) : p ? p.afatet : (dq && !dq.gabim ? dq.afatet : []);
        return Object.assign({}, a, {
          uneJam: une,
          ngarkuar: une || !!p || !!dq,
          paTeDhena: !une && !p && !!(dq && dq.gabim), // s'ka përmbledhje dhe dyqani s'lexohet: s'e ka hapur ende versionin e ri
          afatet: burimi.map(function (af) {
            return Object.assign(mbivendosHeqjen(af, a.uid, harta), { pronariUid: a.uid, pronariEmri: a.emri });
          })
        });
      }).sort(function (x, y) {
        if (x.uneJam !== y.uneJam) return x.uneJam ? -1 : 1;
        var ox = eshteOnline(x), oy = eshteOnline(y);
        if (ox !== oy) return ox ? -1 : 1;
        return String(x.emri).localeCompare(String(y.emri), 'sq');
      });
    }

    // ---------- Përmbledhja e afateve të mia për kolegët (ekipa_afatet/{uid}) ----------
    // Faqja e thërret pas çdo sinkronizimi të suksesshëm; dërgohet vetëm kur ndryshon diçka që e shohin kolegët.
    function publikoAfatet(afatet) {
      if (!Array.isArray(afatet)) return;
      publikimi.afatet = afatet;
      clearTimeout(publikimi.kohez);
      publikimi.kohez = setTimeout(publikoTani, 1500);
    }
    async function publikoTani() {
      clearTimeout(publikimi.kohez); publikimi.kohez = null;
      var e = E();
      if (!e || !e.publikoAfatet || !o.uidIm() || !publikimi.afatet || Date.now() < publikimi.bllokuarDeri) return;
      var p = permbledhjaEAfateve(publikimi.afatet);
      var n = o.uidIm() + '|' + (o.emriIm() || '') + '|' + nenshkrimi(p);
      if (n === publikimi.nenshkrimi || n === lexo(KEY_PUBLIKUAR)) { publikimi.nenshkrimi = n; return; }
      var r = await e.publikoAfatet(p);
      if (r && r.ok) { publikimi.nenshkrimi = n; shkruaj(KEY_PUBLIKUAR, n); }
      else if (r && r.leje) publikimi.bllokuarDeri = Date.now() + 10 * 60 * 1000; // rregullat e vjetra: mos provo pas çdo ndryshimi
    }

    // ---------- Heqja nga rafti ----------
    // afat: nga anetaretMeAfate() (ka pronariUid/pronariEmri). Për të miat, faqja thërret shenoHequr e vet.
    // Njoftimi + aktiviteti hyjnë në radhë menjëherë: pa internet dërgohen sapo të ketë lidhje (r.neRadhe).
    async function heqAfatinEKolegut(afat) {
      var e = E();
      if (!e) return { ok: false, arsye: 'pa-lidhje' };
      var ng = { lloji: 'hequr', pronariUid: afat.pronariUid, pronariEmri: afat.pronariEmri || '', afatId: afat.id,
        produkti: afat.emri || afat.barkodi || '', barkodi: afat.barkodi || '', data: afat.data || '', sasia: typeof afat.sasia === 'number' ? afat.sasia : undefined };
      var pNjoftimi = e.dergoNjoftim(afat.pronariUid, { lloji: 'hequr', afatId: afat.id, produkti: ng.produkti, barkodi: ng.barkodi, data: ng.data });
      e.shtoNgjarje(ng);
      // Shfaqet menjëherë si i hequr (pa pritur dëgjuesin e aktivitetit)
      var idLokale = 'lokal-' + Date.now();
      gj.ngjarjet = [Object.assign({ id: idLokale, uid: o.uidIm(), emri: o.emriIm(), koha: Date.now() }, ng)].concat(gj.ngjarjet);
      thirr('ngjarjet');
      var r = await pNjoftimi;
      if (!r || !r.ok) {
        gj.ngjarjet = gj.ngjarjet.filter(function (x) { return x.id !== idLokale; });
        thirr('ngjarjet');
      }
      return r || { ok: false };
    }

    // ---------- Aktiviteti nga faqja (heqje e vetes, lajmërim, afate të reja) ----------
    function ngjarje(ng) {
      var e = E();
      if (!e || !o.uidIm() || gjendjaEQasjes() === 'ne-pritje') return;
      e.shtoNgjarje(ng);
    }
    // Afatet e reja mblidhen 20 s, që "shtoi 12 afate" të dalë një herë, jo 12 herë
    function afateTeRejaU(n, ngaFoto) {
      if (!n || !E() || !o.uidIm()) return;
      afateTeReja.n += n;
      afateTeReja.ngaFoto = afateTeReja.ngaFoto || !!ngaFoto;
      clearTimeout(afateTeReja.kohez);
      afateTeReja.kohez = setTimeout(dergoAfateTeReja, 20000);
    }
    function dergoAfateTeReja() {
      clearTimeout(afateTeReja.kohez); afateTeReja.kohez = null;
      if (!afateTeReja.n) return;
      ngjarje({ lloji: 'afate-te-reja', n: afateTeReja.n, ngaFoto: afateTeReja.ngaFoto });
      afateTeReja.n = 0; afateTeReja.ngaFoto = false;
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', dergoAfateTeReja);
      document.addEventListener('visibilitychange', function () { if (document.hidden) { dergoAfateTeReja(); if (publikimi.kohez) publikoTani(); } });
    }

    // ---------- Chat ----------
    function hapChatin() {
      var e = E();
      gj.chatHapur = true;
      if (!e || gjendjaEQasjes() !== 'ok') { thirr('chat'); return; }
      if (!d.chat) {
        d.chat = e.degjoChatin(function (lista) {
          gj.chat = lista.slice().reverse(); // më i vjetri lart
          gj.chatGati = true;
          if (gj.chatHapur && !document.hidden) shenoChatinTeLexuar();
          thirr('chat');
        }, 150, function () { gj.chatGati = true; thirr('chat'); });
      }
      shenoChatinTeLexuar();
      thirr('chat');
    }
    function mbyllChatin() { gj.chatHapur = false; ndal('chat'); }
    function shenoChatinTeLexuar() {
      var m = gj.mesazhiFundit || gj.chat[gj.chat.length - 1];
      if (m && m.koha) { shkruaj(KEY_CHAT_LEXUAR, String(m.koha)); thirr('chat-fundit'); }
    }
    function kaChatTePalexuar() {
      var m = gj.mesazhiFundit;
      if (!m || m.uid === o.uidIm()) return false;
      return (Number(lexo(KEY_CHAT_LEXUAR)) || 0) < (m.koha || 0);
    }
    async function dergoMesazh(tekst) {
      var e = E();
      if (!e) return { ok: false, arsye: 'pa-lidhje' };
      return e.dergoMesazh(tekst);
    }
    async function fshijMesazhin(id) { var e = E(); return e ? e.fshijMesazhin(id) : { ok: false }; }

    // ---------- Zilja ----------
    async function merrNjoftimet() {
      var e = E();
      if (!e) return [];
      var r = await e.merrNjoftimet(40);
      var lista = (r && r.lista) || [];
      var heqjet = lista.filter(function (n) { return n.lloji === 'hequr'; });
      if (heqjet.length && o.zbatoHeqjet) { try { o.zbatoHeqjet(heqjet); } catch (er) { /* ok */ } }
      return lista;
    }
    async function shenoNjoftimetTeLexuara() {
      var e = E();
      var ids = gj.njoftimetPalexuara.map(function (n) { return n.id; });
      if (!e || !ids.length) return;
      gj.njoftimetPalexuara = [];
      thirr('njoftimet');
      await e.shenoTeLexuara(ids);
    }

    return {
      gj: gj,
      nisGjithmone: nisGjithmone, ndalGjithmone: ndalGjithmone,
      hap: hap, mbyll: mbyll, ngarkoDyqanet: ngarkoMungesat,
      anetaretMeAfate: anetaretMeAfate,
      heqAfatinEKolegut: heqAfatinEKolegut,
      ngjarje: ngjarje, afateTeReja: afateTeRejaU,
      publikoAfatet: publikoAfatet,
      hapChatin: hapChatin, mbyllChatin: mbyllChatin, kaChatTePalexuar: kaChatTePalexuar, shenoChatinTeLexuar: shenoChatinTeLexuar,
      dergoMesazh: dergoMesazh, fshijMesazhin: fshijMesazhin,
      merrNjoftimet: merrNjoftimet, shenoNjoftimetTeLexuara: shenoNjoftimetTeLexuara,
      numriNjoftimeve: function () { return gj.njoftimetPalexuara.length; },
      kaLidhje: function () { return !!E() && !!o.uidIm(); },
      // A janë marrë anëtarët dhe afatet e tyre (për "Krejt ekipa")
      eGatshme: function () { return gj.anetaret.length > 0 && (!!gj.permbledhjet || gj.ngarkuarSe > 0) && !gj.dukeNgarkuar; },
      // Anëtarësia
      gjendjaEQasjes: gjendjaEQasjes,
      eshteAdmin: function () { return !!gj.admin; },
      kerkesat: kerkesat,
      numriKerkesave: function () { return gj.admin ? gj.nKerkesa : 0; },
      pranoAnetaret: pranoAnetaret, hiqNgaEkipa: hiqNgaEkipa, fshijLlogarine: fshijLlogarine,
      vendosLejen: vendosLejen, lajmeroEkipen: lajmeroEkipen,
      koleget: koleget, kerkoHeqjen: kerkoHeqjen, kryejKerkesen: kryejKerkesen,
      pastroChatin: function () { return pastro('ekipa_chat'); }, pastroAktivitetin: function () { return pastro('ekipa_feed'); },
      merrStokun: merrStokun, adminNdryshoAfatin: adminNdryshoAfatin
    };
  }

  var api = {
    ONLINE_MS: ONLINE_MS, MUAJT: MUAJT, DITET_SHKURT: DITET_SHKURT,
    krijoCloud: krijoCloud, krijoKontrollues: krijoKontrollues,
    eshteOnline: eshteOnline, kohaRelative: kohaRelative, titulliDites: titulliDites,
    tekstiPranise: tekstiPranise, tekstiPlatformes: tekstiPlatformes, praniaIkone: praniaIkone,
    ADMIN_EMRI: ADMIN_EMRI, permbledhjaEAfateve: permbledhjaEAfateve, nenshkrimi: nenshkrimi,
    ndryshoAfatinNeGjendje: ndryshoAfatinNeGjendje, fletetEStokut: fletetEStokut,
    hartaEHeqjeve: hartaEHeqjeve, mbivendosHeqjen: mbivendosHeqjen, duhetZbatuarHeqja: duhetZbatuarHeqja,
    kalendari: kalendari, statistikat: statistikat, tekstiNgjarjes: tekstiNgjarjes, tekstiNjoftimit: tekstiNjoftimit,
    isoDites: isoDites, Fotot: Fotot, listaEKerkeses: listaEKerkeses, rreshtiIProduktit: rreshtiIProduktit, zgjedhesIKerkeses: zgjedhesIKerkeses
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuEkipa = api;
})(typeof self !== 'undefined' ? self : this);
