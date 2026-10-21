// Firestore i simuluar në node, me rregullat e Stoku-t (të rejat v110 ose të vjetrat v109), për teste me disa faqe.
// Faqet përdorin kodin e VËRTETË: ruajtja.js (dyqani) + ekipa.js (krijoCloud) mbi një "fs" të rremë që flet me këtë server.
const ADMIN = 'mendurberisha';

function klon(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

function krijoFirestore(opt = {}) {
  const S = { rregullat: opt.rregullat || 'reja', docs: new Map(), shkrime: [], refuzime: [] };
  const faqet = new Map();  // page → { uid, email }
  const subs = [];          // { page, id, lloji: 'doc'|'query', path, c }
  let nrId = 0;

  // ---------------- Rregullat ----------------
  const emriNgaEmail = e => String(e || '').split('@')[0];
  // v140: admini = llogaria "mendurberisha" (email-i) OSE fusha emri te perdoruesit/{uid} (si rregullat e reja)
  const emailet = new Map(); // uid → email (nga faqet e lidhura)
  const eshteAdmin = uid => { if (S.rregullat === 'reja' && emriNgaEmailF(emailet.get(uid)) === ADMIN) return true; const d = S.docs.get('perdoruesit/' + uid); return !!(d && d.emri === ADMIN); };
  function emriNgaEmailF(e) { return String(e || '').split('@')[0]; }
  const neEkipe = uid => S.docs.has('ekipa_anetaret/' + uid) || eshteAdmin(uid);
  const pjeset = p => p.split('/');
  const fshire = uid => S.rregullat === 'reja' && S.docs.has('ekipa_fshire/' + uid); // v116

  // v164: grupet
  const anetar = (uid, g) => !!g && S.docs.has('grupet/' + g + '/anetaret/' + uid);
  const pronar = (uid, g) => { const d = g && S.docs.get('grupet/' + g + '/anetaret/' + uid); return !!(d && d.roli === 'pronar'); };
  const ndryshuarKeys = (iRi, iVjeter) => { const k = new Set(Object.keys(iRi || {}).concat(Object.keys(iVjeter || {}))); return [...k].filter(x => JSON.stringify((iRi || {})[x]) !== JSON.stringify((iVjeter || {})[x])); };
  const vetemKeto = (l, lejuar) => l.every(x => lejuar.includes(x));
  let pasBatch = null; // getAfter(): gjendja sikur batch-i të kishte kaluar
  const pas = path => (pasBatch && pasBatch.has(path) ? pasBatch.get(path) : S.docs.get(path));
  function lexim(a, path, eListe, c) {
    if (!a) return false;
    const p = pjeset(path);
    const reja = S.rregullat === 'reja';
    const emriA = emriNgaEmail(a.email);
    if (reja && p[0] === 'grupet') {
      const g = p[1];
      if (p.length === 2) return anetar(a.uid, g) || eshteAdmin(a.uid);
      if (p[2] === 'anetaret') return (!eListe && a.uid === p[3]) || anetar(a.uid, g) || eshteAdmin(a.uid);
      if (p[2] === 'push') return anetar(a.uid, g) || eshteAdmin(a.uid);
      if (!['afatet', 'feed', 'kujtesa'].includes(p[2])) return false; // v221: pa chat (vetëm nënkoleksionet e rregullave)
      return anetar(a.uid, g) || eshteAdmin(a.uid);
    }
    if (reja && p[0] === 'ftesat') {
      if (eshteAdmin(a.uid)) return true;
      if (!eListe) { const d = S.docs.get(path); return !!d && (d.perdoruesi === emriA || anetar(a.uid, d.gid)); }
      const w = (c || []).filter(x => x.lloji === 'where' && x.op === '==');
      return w.some(x => x.f === 'perdoruesi' && x.v === emriA) || w.some(x => x.f === 'gid' && anetar(a.uid, x.v));
    }
    if (reja && p[0] === 'perdoruesit' && p.length === 2 && eListe) return eshteAdmin(a.uid); // v164: lista vetëm admini
    if (reja && p[0] === 'dyqane' && p[2] === 'skedaret') return !S.paSkedare && a.uid === p[1]; // v227 (S.paSkedare: rregullat e vjetra, pa skedarët)
    if (p[0] === 'dyqane') return reja ? ((a.uid === p[1] && !fshire(p[1])) || eshteAdmin(a.uid)) : (p[2] === 'fletet' ? (a.uid === p[1] || eshteAdmin(a.uid)) : true);
    if (p[0] === 'ekipa_fshire') return reja && (a.uid === p[1] || eshteAdmin(a.uid));
    // v230: lejet/{uid} (S.paLejet: rregullat para v230, s'lexohen)
    if (p[0] === 'lejet') return reja && !S.paLejet && (eListe ? eshteAdmin(a.uid) : (a.uid === p[1] || eshteAdmin(a.uid)));
    if (p[0] === 'perdoruesit' && p[2] === 'njoftimet') return a.uid === p[1] || (S.rregullat === 'reja' && eshteAdmin(a.uid));
    if (p[0] === 'perdoruesit') return reja ? (eListe ? neEkipe(a.uid) : (a.uid === p[1] || neEkipe(a.uid))) : true;
    if (p[0] === 'ekipa_anetaret') return reja && (eListe ? neEkipe(a.uid) : (a.uid === p[1] || neEkipe(a.uid)));
    if (p[0] === 'ekipa_afatet') return reja && neEkipe(a.uid);
    if (p[0] === 'ekipa_feed') return reja ? neEkipe(a.uid) : true;
    if (p[0] === 'ekipa_push') return reja && neEkipe(a.uid); // v130
    if (p[0] === 'publike' && p[1] === 'furnizuesit' && p.length === 2) return reja; // v211: kushdo i kyçur
    return false;
  }
  function shkrim(a, path, lloji, iRi, iVjeter) {
    if (!a) return false;
    const p = pjeset(path);
    const reja = S.rregullat === 'reja';
    const emriIm = emriNgaEmail(a.email);
    if (reja && p[0] === 'grupet') {
      const g = p[1], adm = eshteAdmin(a.uid);
      if (p.length === 2) {
        const emriOk = x => typeof x.emri === 'string' && x.emri.length >= 2 && x.emri.length <= 60;
        if (lloji === 'create') return adm || (iRi.pronarUid === a.uid && iRi.pronarEmri === emriIm && !fshire(a.uid) && emriOk(iRi) && g !== 'ekipa'
          && vetemKeto(Object.keys(iRi), ['emri', 'pronarUid', 'pronarEmri', 'krijuarSe']));
        if (lloji === 'update') return adm || (pronar(a.uid, g) && vetemKeto(ndryshuarKeys(iRi, iVjeter), ['emri']) && emriOk(iRi));
        return adm || pronar(a.uid, g);
      }
      const k = p[2], id = p[3];
      if (k === 'anetaret') {
        if (lloji === 'create') {
          if (adm) return true;
          if (a.uid !== id || fshire(id) || iRi.emri !== emriIm || !vetemKeto(Object.keys(iRi), ['emri', 'roli', 'hyriSe', 'aktivSe', 'online', 'platforma'])) return false;
          const gPas = pas('grupet/' + g);
          return (iRi.roli === 'pronar' && !S.docs.has('grupet/' + g) && !!gPas && gPas.pronarUid === id)
            // v216: ftesa duhet të fshihet në të njëjtin batch (existsAfter), që të mos përdoret dy herë
            || (iRi.roli === 'anetar' && S.docs.has('ftesat/' + g + '_' + emriIm) && !pas('ftesat/' + g + '_' + emriIm) && S.docs.has('grupet/' + g))
            || (g === 'ekipa' && iRi.roli === 'anetar' && S.docs.has('ekipa_anetaret/' + id));
        }
        if (lloji === 'update') {
          const ndr = ndryshuarKeys(iRi, iVjeter);
          return adm || (a.uid === id && vetemKeto(ndr, ['emri', 'aktivSe', 'online', 'platforma']) && iRi.emri === emriIm)
            || (pronar(a.uid, g) && vetemKeto(ndr, ['roli', 'sasiaShpejte']) && ['pronar', 'anetar'].includes(iRi.roli));
        }
        return a.uid === id || pronar(a.uid, g) || adm;
      }
      if (k === 'afatet') {
        if (lloji === 'delete' && (pronar(a.uid, g) || a.uid === id)) return true;
        return adm || (a.uid === id && !fshire(id) && anetar(a.uid, g));
      }
      if (k === 'feed') {
        if (lloji === 'update') return false;
        if (lloji === 'delete') return !!iVjeter && (iVjeter.uid === a.uid || pronar(a.uid, g) || adm);
        if (adm) return true;
        if (!anetar(a.uid, g) || iRi.uid !== a.uid || iRi.emri !== emriIm) return false;
        return true;
      }
      if (k === 'kujtesa') { // v197
        if (lloji === 'delete') return anetar(a.uid, g) || adm;
        return (anetar(a.uid, g) || adm) && /^p[0-9x]$/.test(id) && vetemKeto(Object.keys(iRi), ['p', 'ndryshuarSe']) && !!iRi.p && typeof iRi.p === 'object';
      }
      if (k === 'push') {
        if (lloji === 'delete') return anetar(a.uid, g) || adm;
        return anetar(a.uid, g) && iRi.uid === a.uid && id.indexOf(a.uid + '_') === 0;
      }
      return false;
    }
    if (reja && p[0] === 'ftesat') {
      const adm = eshteAdmin(a.uid);
      if (lloji === 'delete') return !!iVjeter && (iVjeter.perdoruesi === emriIm || pronar(a.uid, iVjeter.gid) || adm);
      return pronar(a.uid, iRi.gid) && p[1] === iRi.gid + '_' + iRi.perdoruesi && /^[a-z0-9_.-]{3,40}$/.test(iRi.perdoruesi || '')
        && iRi.ngaUid === a.uid && iRi.ngaEmri === emriIm
        && vetemKeto(Object.keys(iRi), ['gid', 'grupiEmri', 'perdoruesi', 'ngaUid', 'ngaEmri', 'koha'])
        && (iRi.grupiEmri === undefined || (typeof iRi.grupiEmri === 'string' && iRi.grupiEmri.length <= 60));
    }
    if (reja && p[0] === 'dyqane' && p[2] === 'skedaret') { // v227: skedarët nga telefoni te PC-ja
      if (S.paSkedare || a.uid !== p[1]) return false;
      if (lloji === 'delete') return true;
      if (fshire(p[1])) return false;
      if (p.length === 4) {
        if (lloji === 'update') return vetemKeto(ndryshuarKeys(iRi, iVjeter), ['shkarkuarSe']);
        const int = v => typeof v === 'number' && Math.floor(v) === v;
        return vetemKeto(Object.keys(iRi), ['emri', 'lloji', 'titulli', 'pajisja', 'madhesia', 'pjeset', 'krijuarSe', 'skadon'])
          && typeof iRi.emri === 'string' && iRi.emri.length > 0 && iRi.emri.length <= 150
          && int(iRi.madhesia) && iRi.madhesia > 0 && iRi.madhesia <= 15728640 && int(iRi.pjeset) && iRi.pjeset > 0 && iRi.pjeset <= 20;
      }
      if (p.length === 6 && p[4] === 'pjeset') {
        if (lloji === 'update') return false;
        const b = iRi.b;
        return vetemKeto(Object.keys(iRi), ['i', 'b']) && !!b && typeof b.__bytes === 'string' && Buffer.from(b.__bytes, 'base64').length <= 1000000;
      }
      return false;
    }
    if (p[0] === 'dyqane') return (a.uid === p[1] && !fshire(p[1])) || eshteAdmin(a.uid);
    if (p[0] === 'ekipa_fshire') return reja && eshteAdmin(a.uid);
    if (p[0] === 'lejet') { // v230: vetëm administratori
      if (!reja || S.paLejet || !eshteAdmin(a.uid) || p.length !== 2) return false;
      if (lloji === 'delete') return true;
      return vetemKeto(Object.keys(iRi), ['lejet', 'kontrolluarSe', 'kontrolluarNga', 'emri']) && !!iRi.lejet && typeof iRi.lejet === 'object'
        && !Array.isArray(iRi.lejet) && Object.keys(iRi.lejet).length <= 60;
    }
    if (p[0] === 'perdoruesit' && p[2] === 'njoftimet') {
      // v164: dërguesi dhe marrësi në të njëjtin grup (fusha `grupi`), ose administratori
      if (lloji === 'create') return iRi.uid === a.uid && (!reja || (iRi.emri === emriIm && ((typeof iRi.grupi === 'string' && anetar(a.uid, iRi.grupi) && anetar(p[1], iRi.grupi)) || eshteAdmin(a.uid))));
      if (lloji === 'delete') return a.uid === p[1] || (reja && eshteAdmin(a.uid));
      return a.uid === p[1];
    }
    if (p[0] === 'perdoruesit') {
      if (lloji === 'delete') return reja && eshteAdmin(a.uid);
      if (a.uid === p[1] && fshire(p[1])) return false;
      if (a.uid !== p[1]) {
        // administratori: vetëm leja e sasisë së shpejtë te dokumenti i tjetrit (rregullat v112)
        if (!reja || lloji !== 'update' || !eshteAdmin(a.uid)) return false;
        const k = new Set(Object.keys(iRi).concat(Object.keys(iVjeter || {})));
        return [...k].every(x => x === 'sasiaShpejte' || JSON.stringify(iRi[x]) === JSON.stringify(iVjeter[x]));
      }
      if (lloji === 'create') return !('emri' in iRi) && (!reja || !('perdoruesi' in iRi) || iRi.perdoruesi === emriIm);
      const ndryshuar = k => JSON.stringify(iRi[k]) !== JSON.stringify(iVjeter[k]);
      return !ndryshuar('emri') && (!reja || !ndryshuar('perdoruesi') || iRi.perdoruesi === emriIm);
    }
    if (p[0] === 'ekipa_anetaret') return reja && (eshteAdmin(a.uid) || (lloji === 'delete' && (a.uid === p[1] || pronar(a.uid, 'ekipa'))));
    if (p[0] === 'ekipa_afatet') return reja && ((a.uid === p[1] && !fshire(p[1])) || eshteAdmin(a.uid));
    if (p[0] === 'ekipa_push') { // v130: pajisjet për njoftimet push
      if (!reja || !neEkipe(a.uid)) return false;
      if (lloji === 'delete') return true;
      return iRi.uid === a.uid && p[1].indexOf(a.uid + '_') === 0;
    }
    if (p[0] === 'ekipa_feed') {
      if (lloji === 'update') return false;
      if (lloji === 'delete') return iVjeter && (iVjeter.uid === a.uid || (reja && eshteAdmin(a.uid)));
      if (iRi.uid !== a.uid) return false;
      if (reja && (!neEkipe(a.uid) || iRi.emri !== emriIm)) return false;
      return true;
    }
    if (p[0] === 'publike' && p[1] === 'furnizuesit' && p.length === 2) { // v211: vetëm administratori
      if (!reja || lloji === 'delete' || !eshteAdmin(a.uid)) return false;
      return Object.keys(iRi).every(k => k === 'lista' || k === 'ndryshuarSe') && Array.isArray(iRi.lista) && iRi.lista.length <= 3000;
    }
    return false;
  }

  // ---------------- Pyetjet ----------------
  function dokEKoleksionit(path) {
    const n = pjeset(path).length;
    return [...S.docs.keys()].filter(k => k.startsWith(path + '/') && pjeset(k).length === n + 1);
  }
  function ekzekutoPyetjen(path, c) {
    let l = dokEKoleksionit(path).map(k => ({ id: k.split('/').pop(), data: klon(S.docs.get(k)) }));
    (c || []).forEach(x => { if (x.lloji === 'where') l = l.filter(d => x.op === '==' ? d.data[x.f] === x.v : true); });
    const ob = (c || []).find(x => x.lloji === 'orderBy');
    if (ob) l.sort((a, b) => ((a.data[ob.f] || 0) - (b.data[ob.f] || 0)) * (ob.dir === 'desc' ? -1 : 1));
    const lm = (c || []).find(x => x.lloji === 'limit');
    if (lm) l = l.slice(0, lm.n);
    return l;
  }
  function rezultati(sub, a) {
    if (sub.lloji === 'doc') {
      if (!lexim(a, sub.path, false)) return { gabim: 'permission-denied' };
      return { exists: S.docs.has(sub.path), data: klon(S.docs.get(sub.path)) };
    }
    if (!lexim(a, sub.path + '/x', true, sub.c)) return { gabim: 'permission-denied' };
    return { docs: ekzekutoPyetjen(sub.path, sub.c) };
  }
  async function shtyj(sub) {
    const a = faqet.get(sub.page);
    const r = rezultati(sub, a);
    if (r.gabim) { const i = subs.indexOf(sub); if (i !== -1) subs.splice(i, 1); }
    const j = JSON.stringify(r);
    if (j === sub.fundit) return; // si Firestore: pa ndryshim, pa ngjarje
    sub.fundit = j;
    try { await sub.page.evaluate(([id, r]) => window.__fsPush && window.__fsPush(id, r), [sub.id, r]); } catch (e) { /* faqja u mbyll */ }
  }
  // Pas çdo shkrimi rikontrollohen krejt dëgjuesit (edhe lejet: anëtarësia/admini mund të kenë ndryshuar);
  // secili njoftohet vetëm nëse rezultati i tij ndryshoi.
  function prekur() { return Promise.all(subs.slice().map(shtyj)); }

  // ---------------- Veprimet nga faqet ----------------
  function eObjekt(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function bashkoThelle(v, r) {
    const o = Object.assign({}, v);
    Object.keys(r).forEach(k => { o[k] = eObjekt(o[k]) && eObjekt(r[k]) ? bashkoThelle(o[k], r[k]) : r[k]; });
    return o;
  }
  function zbato(a, op) {
    const [lloji, path, te, merge] = op;
    const ekziston = S.docs.has(path);
    const vjeter = S.docs.get(path);
    if (lloji === 'delete') {
      if (!shkrim(a, path, 'delete', null, vjeter)) return 'permission-denied';
      return () => S.docs.delete(path);
    }
    let iRi;
    if (lloji === 'update') { if (!ekziston) return 'not-found'; iRi = Object.assign({}, vjeter, klon(te)); }
    else iRi = merge && ekziston ? bashkoThelle(vjeter, klon(te)) : klon(te); // si Firestore: merge bashkon edhe map-at brenda
    if (!shkrim(a, path, ekziston ? 'update' : 'create', iRi, vjeter)) return 'permission-denied';
    return () => S.docs.set(path, iRi);
  }
  async function op(page, emer, ...x) {
    const a = faqet.get(page);
    if (emer === 'get') {
      if (!lexim(a, x[0], false)) return { ok: false, code: 'permission-denied' };
      return { ok: true, exists: S.docs.has(x[0]), data: klon(S.docs.get(x[0])) };
    }
    if (emer === 'query') {
      if (!lexim(a, x[0] + '/x', true, x[1])) return { ok: false, code: 'permission-denied' };
      return { ok: true, docs: ekzekutoPyetjen(x[0], x[1]) };
    }
    if (emer === 'batch') {
      const fn = [];
      pasBatch = new Map();
      for (const o of x[0]) {
        const [ll, pth, te, mrg] = o, v = pasBatch.has(pth) ? pasBatch.get(pth) : S.docs.get(pth);
        pasBatch.set(pth, ll === 'delete' ? undefined : (ll === 'update' || mrg) && v ? Object.assign({}, v, klon(te)) : klon(te));
      }
      for (const o of x[0]) {
        const r = zbato(a, o);
        if (typeof r === 'string') { pasBatch = null; S.refuzime.push({ uid: a && a.uid, op: o[0], path: o[1], kodi: r }); return { ok: false, code: r }; }
        fn.push(r);
      }
      pasBatch = null;
      fn.forEach(f => f());
      x[0].forEach(o => S.shkrime.push({ uid: a && a.uid, op: o[0], path: o[1] }));
      await prekur(x[0].map(o => o[1]));
      return { ok: true };
    }
    if (emer === 'sub') {
      const sub = { page, id: x[0], lloji: x[1], path: x[2], c: x[3] };
      subs.push(sub);
      setTimeout(() => shtyj(sub), 15);
      return true;
    }
    if (emer === 'unsub') { const i = subs.findIndex(s => s.page === page && s.id === x[0]); if (i !== -1) subs.splice(i, 1); return true; }
    if (emer === 'resync') { await Promise.all(subs.filter(s => s.page === page).map(s => { s.fundit = null; return shtyj(s); })); return true; }
    if (emer === 'id') return 'id' + (++nrId).toString(36) + Math.random().toString(36).slice(2, 8);
    return null;
  }

  // ---------------- Skripti i faqes: "fs" i rremë + __stokuCloud me kodin e vërtetë ----------------
  function skripti() {
    return ({ uid, email, platforma, lokale }) => {
      // v232 (testet): llogaria e ndërruar (si Firebase, e përbashkët për krejt skedat e pajisjes) vlen edhe pas rifreskimit
      try { const o = JSON.parse(localStorage.getItem('__fsLlogaria') || 'null'); if (o && o.uid) { uid = o.uid; email = o.email; } } catch (e) { /* ok */ }
      const emri = email.split('@')[0];
      window.__fsCb = {};
      window.__fsOffline = false;
      let rradhaOffline = [];
      window.__fsOnline = () => { window.__fsOffline = false; const r = rradhaOffline; rradhaOffline = []; r.forEach(f => f()); window.__fs('resync'); window.dispatchEvent(new Event('online')); };
      const prit = () => window.__fsOffline ? new Promise(r => rradhaOffline.push(r)) : Promise.resolve();
      const gabim = kodi => Object.assign(new Error(kodi === 'permission-denied' ? 'Missing or insufficient permissions.' : kodi), { code: kodi });
      let nrSub = 0; const nrFaqe = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      // v227: Bytes si te Firestore; JSON-i i tij është { __bytes: base64 }, që serveri ta njohë dhe ta kthejë
      class Bytes {
        constructor(u8) { this._u8 = new Uint8Array(u8); }
        static fromUint8Array(u8) { return new Bytes(u8); }
        toUint8Array() { return new Uint8Array(this._u8); }
        toJSON() { let s = ''; for (let i = 0; i < this._u8.length; i += 32768) s += String.fromCharCode.apply(null, this._u8.subarray(i, i + 32768)); return { __bytes: btoa(s) }; }
      }
      const ringjall = d => {
        if (!d || typeof d !== 'object') return d;
        if (typeof d.__bytes === 'string' && Object.keys(d).length === 1) { const s = atob(d.__bytes), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Bytes(u); }
        if (Array.isArray(d)) return d.map(ringjall);
        const o = {}; Object.keys(d).forEach(k => { o[k] = ringjall(d[k]); }); return o;
      };
      const dok = (id, r) => ({ id, exists: () => !!r.exists, data: () => ringjall(r.data), metadata: { hasPendingWrites: false, fromCache: false } });
      const pyetje = r => { const docs = r.docs.map(d => ({ id: d.id, data: () => ringjall(d.data), exists: () => true })); return { docs, empty: !docs.length, size: docs.length, forEach: f => docs.forEach(f), metadata: { hasPendingWrites: false, fromCache: false } }; };
      const fs = {
        doc: (db, ...p) => {
          const ri = k => { const path = k.path + '/' + 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); return { path, id: path.split('/').pop() }; };
          if (db && db.koleksion && !p.length) return ri(db); // si Firestore: doc(koleksioni) → id i ri
          if (p.length === 1 && p[0] && p[0].koleksion) return ri(p[0]);
          return { path: p.join('/'), id: p[p.length - 1] };
        },
        collection: (db, ...p) => ({ path: p.join('/'), koleksion: true }),
        query: (col, ...c) => ({ path: col.path, koleksion: true, c }),
        where: (f, o, v) => ({ lloji: 'where', f, op: o, v }),
        orderBy: (f, dir) => ({ lloji: 'orderBy', f, dir: dir || 'asc' }),
        limit: n => ({ lloji: 'limit', n }),
        getDoc: async ref => { await prit(); const r = await window.__fs('get', ref.path); if (!r.ok) throw gabim(r.code); return dok(ref.path.split('/').pop(), r); },
        getDocs: async q => { await prit(); const r = await window.__fs('query', q.path, q.c || []); if (!r.ok) throw gabim(r.code); return pyetje(r); },
        setDoc: async (ref, te, o) => { await prit(); const r = await window.__fs('batch', [['set', ref.path, JSON.parse(JSON.stringify(te)), !!(o && o.merge)]]); if (!r.ok) throw gabim(r.code); },
        addDoc: async (col, te) => { const ref = fs.doc(null, col); await fs.setDoc(ref, te); return { id: ref.path.split('/').pop() }; },
        deleteDoc: async ref => { await prit(); const r = await window.__fs('batch', [['delete', ref.path]]); if (!r.ok) throw gabim(r.code); },
        writeBatch: () => {
          const ops = [];
          return {
            set: (r, te, o) => ops.push(['set', r.path, JSON.parse(JSON.stringify(te)), !!(o && o.merge)]),
            update: (r, te) => ops.push(['update', r.path, JSON.parse(JSON.stringify(te))]),
            delete: r => ops.push(['delete', r.path]),
            commit: async () => { await prit(); const r = await window.__fs('batch', ops); if (!r.ok) throw gabim(r.code); }
          };
        },
        runTransaction: async (db, fn) => {
          await prit();
          const ops = [];
          const tx = {
            get: async ref => { const r = await window.__fs('get', ref.path); if (!r.ok) throw gabim(r.code); return dok(ref.path.split('/').pop(), r); },
            set: (ref, te, o) => { ops.push(['set', ref.path, JSON.parse(JSON.stringify(te)), !!(o && o.merge)]); }
          };
          const rez = await fn(tx);
          const r = await window.__fs('batch', ops);
          if (!r.ok) throw gabim(r.code);
          return rez;
        },
        onSnapshot: (ref, cb, cbE) => {
          const id = 's' + nrFaqe + '_' + (++nrSub); // unike edhe pas rifreskimit (dëgjuesit e faqes së vjetër s'përzihen)
          const lloji = ref.koleksion ? 'query' : 'doc';
          window.__fsCb[id] = r => {
            if (r.gabim) { delete window.__fsCb[id]; if (cbE) cbE(gabim(r.gabim)); return; }
            if (window.__fsOffline) return;
            cb(lloji === 'doc' ? dok(ref.path.split('/').pop(), r) : pyetje(r));
          };
          window.__fs('sub', id, lloji, ref.path, ref.c || []);
          return () => { delete window.__fsCb[id]; window.__fs('unsub', id); };
        }
      };
      window.__fsPush = (id, r) => { const f = window.__fsCb[id]; if (f) f(r); };
      fs.Bytes = Bytes;
      window.__fsTest = fs;
      const iFshire = sessionStorage.getItem('__fshire') === '1';
      const auth = { currentUser: iFshire ? null : { uid, email, getIdToken: async () => 'tok.' + btoa(JSON.stringify({ user_id: uid })) + '.x' } };
      // v232 (testet): ndërrimi i llogarisë në këtë faqe, si Firebase kur në një skedë tjetër hyhet me llogari tjetër
      window.__fsNdrroLlogarine = (uid2, email2) => {
        try { localStorage.setItem('__fsLlogaria', JSON.stringify(uid2 ? { uid: uid2, email: email2 } : null)); } catch (e) { /* ok */ }
        auth.currentUser = uid2 ? { uid: uid2, email: email2, getIdToken: async () => 'tok.' + btoa(JSON.stringify({ user_id: uid2 })) + '.x' } : null;
        window.dispatchEvent(new Event('stoku-auth-ndryshoi'));
      };
      if (!iFshire) {
        localStorage.setItem('stoku:pronari-uid', uid);
        localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid, emri }));
      }
      localStorage.setItem('stoku:te-rejat:pare', '999');
      if (lokale && !localStorage.getItem('stoku:afatet:v1')) {
        localStorage.setItem('stoku:afatet:v1', JSON.stringify(lokale.afatet || []));
        if (lokale.foldera) localStorage.setItem('stoku:foldera:v1', JSON.stringify(lokale.foldera));
      }
      document.addEventListener('DOMContentLoaded', () => {
        const db = {};
        const ruajtja = window.StokuRuajtja.krijo(fs, db, () => auth.currentUser && auth.currentUser.uid);
        const ekipa = window.StokuEkipa.krijoCloud(fs, db, auth, platforma);
        window.__stokuCloud = {
          authGati: true, perdoruesiAktual: () => auth.currentUser, token: async () => 't', dil: async () => {},
          hyr: async () => ({ ok: true }), regjistrohu: async () => ({ ok: true }),
          riautentifikohu: async p => (p === 'sakte1' ? { ok: true } : { ok: false, kodi: 'auth/invalid-credential' }),
          fshiVeten: async () => { sessionStorage.setItem('__fshire', '1'); auth.currentUser = null; },
          merr: () => ruajtja.merr(), bashkoDheRuaj: fn => ruajtja.bashkoDheRuaj(fn), ruaj: g => ruajtja.ruaj(g),
          degjo: (cb, e) => ruajtja.degjo(cb, e), modaPjeseve: () => ruajtja.modaPjeseve(),
          degjoFletet: () => () => {}, dergoFleten: async () => ({ ok: true }), fshijFleten: async () => ({ ok: true }),
          merrDyqaninEPerdoruesit: async u => { try { return await window.StokuRuajtja.krijo(fs, db, () => u).merr(); } catch (e) { return { ok: false, kodi: e.code }; } },
          krejtPerdoruesit: async () => ({ ok: true, lista: [] }),
          skedaret: window.StokuSkedaret ? window.StokuSkedaret.krijo(fs, db, () => auth.currentUser && auth.currentUser.uid) : null,
          lejet: window.StokuLejet ? window.StokuLejet.krijo(fs, db, () => auth.currentUser && auth.currentUser.uid) : null, // v230
          ndryshoDyqaninEPerdoruesit: async (u, fn) => { try { return await window.StokuRuajtja.krijo(fs, db, () => u).bashkoDheRuaj(fn); } catch (e) { return { ok: false, kodi: e.code }; } },
          ekipa
        };
        // si regjistroPerdoruesin: perdoruesit/{uid}
        if (auth.currentUser) fs.setDoc(fs.doc(db, 'perdoruesit', uid), { perdoruesi: emri, kycurSe: Date.now() }, { merge: true }).catch(() => {});
        window.dispatchEvent(new Event('stoku-cloud-gati'));
        window.dispatchEvent(new Event('stoku-auth-ndryshoi'));
      }, { once: true });
    };
  }

  async function lidh(ctx, uid, email, platforma, lokale) {
    await ctx.exposeBinding('__fs', (src, emer, ...x) => op(src.page, emer, ...x));
    await ctx.addInitScript(skripti(), { uid, email, platforma, lokale: lokale || null });
    emailet.set(uid, email);
    ctx.on('page', p => faqet.set(p, { uid, email }));
  }
  return { S, lidh, faqet, eshteAdmin, neEkipe, klon, subs };
}
module.exports = { krijoFirestore, ADMIN };
