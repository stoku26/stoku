// v243: GABIMI QË "FSHINTE" GRUPIN PAS RIFRESKIMIT. Firestore-i i vërtetë, pasi aplikacioni shkruan "u kyç" (merge) te
// perdoruesit/{uid}, e tregon fillimisht dokumentin e pjesshëm të pajisjes (fromCache, PA fushën `grupi`); ekipa.js e merrte
// si "pa tregues" dhe e shkruante grupi = ''. Ky test e imiton saktë atë sjellje (fs i rremë me metadata) dhe kontrollon:
// kopja e pjesshme s'prek asgjë, gjendja nga serveri vlen, llogaria e re pret serverin, rikthimi i treguesit të humbur.
const EK = require('../ekipa.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = ms => new Promise(r => setTimeout(r, ms));
global.localStorage = { m: {}, getItem(k) { return k in this.m ? this.m[k] : null; }, setItem(k, v) { this.m[k] = String(v); }, removeItem(k) { delete this.m[k]; } };

// Firestore i rremë: serveri (S) + dëgjuesit; snapshot-et kanë metadata { fromCache, hasPendingWrites }
function krijoFs() {
  const S = new Map(), deg = [], shkrime = [];
  const ref = (...p) => ({ path: p.slice(1).join('/') });
  const dok = (path, data, meta) => ({ id: path.split('/').pop(), exists: () => !!data, data: () => data ? JSON.parse(JSON.stringify(data)) : undefined, metadata: meta });
  const fs = {
    doc: (db, ...p) => ({ path: p.join('/') }),
    collection: (db, ...p) => ({ path: p.join('/'), kol: true }),
    query: (k, ...c) => ({ path: k.path, kol: true, c }),
    where: (f, op, v) => ({ f, op, v }),
    limit: n => ({ limit: n }),
    getDoc: async r => { await prit(5); return dok(r.path, S.get(r.path), { fromCache: false, hasPendingWrites: false }); },
    getDocs: async q => {
      await prit(5);
      const n = q.path.split('/').length;
      let l = [...S.keys()].filter(k => k.startsWith(q.path + '/') && k.split('/').length === n + 1).map(k => ({ id: k.split('/').pop(), d: S.get(k) }));
      (q.c || []).forEach(c => { if (c && c.op === '==') l = l.filter(x => x.d[c.f] === c.v); });
      return { empty: !l.length, forEach: fn => l.forEach(x => fn({ id: x.id, data: () => x.d })) };
    },
    setDoc: async (r, te, o) => {
      shkrime.push({ path: r.path, te });
      // si SDK-ja: shkrimi i pakonfirmuar shihet menjëherë (kopja e pjesshme kur dokumenti s'është te pajisja)
      deg.filter(d => d.path === r.path).forEach(d => { const lok = Object.assign({}, d.njohur ? S.get(r.path) : {}, te); d.cb(dok(r.path, lok, { fromCache: !d.njohur, hasPendingWrites: true })); });
      await prit(20);
      S.set(r.path, o && o.merge ? Object.assign({}, S.get(r.path) || {}, te) : te);
      deg.filter(d => d.path === r.path).forEach(d => { d.njohur = true; d.cb(dok(r.path, S.get(r.path), { fromCache: false, hasPendingWrites: false })); });
    },
    onSnapshot: (r, a, b, c) => {
      const cb = typeof a === 'function' ? a : b;
      const d = { path: r.path, cb, njohur: false };
      deg.push(d);
      setTimeout(() => { if (!d.njohur) { d.njohur = true; cb(dok(r.path, S.get(r.path), { fromCache: false, hasPendingWrites: false })); } }, 60);
      return () => { const i = deg.indexOf(d); if (i !== -1) deg.splice(i, 1); };
    },
    deleteDoc: async r => { S.delete(r.path); },
    writeBatch: () => { const ops = []; return { set: (r, te) => ops.push(['s', r, te]), delete: r => ops.push(['d', r]), update: (r, te) => ops.push(['u', r, te]), commit: async () => { ops.forEach(o => o[0] === 'd' ? S.delete(o[1].path) : S.set(o[1].path, o[0] === 'u' ? Object.assign({}, S.get(o[1].path), o[2]) : o[2])); } }; }
  };
  return { S, fs, shkrime };
}
function cloud(F, uid, emri) { return EK.krijoCloud(F.fs, {}, { currentUser: { uid, email: emri + '@stoku-app.local' } }, 'tel'); }

(async () => {
  // 1. Anëtar i një grupi të ri: hapja (shkrimi "u kyç" para përgjigjes së serverit) s'e prek treguesin
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u1', { perdoruesi: 'albi', kycurSe: 1, grupi: 'g1' });
    F.S.set('grupet/g1/anetaret/u1', { emri: 'albi', roli: 'pronar' });
    const e = cloud(F, 'u1', 'albi');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja + ':' + (r.grupi || '')));
    F.fs.setDoc(F.fs.doc({}, 'perdoruesit', 'u1'), { perdoruesi: 'albi', kycurSe: 2 }, { merge: true }); // si regjistroTani
    await prit(400);
    ok(F.S.get('perdoruesit/u1').grupi === 'g1', '1. treguesi mbetet "g1" (kopja e pjesshme injorohet)', F.S.get('perdoruesit/u1'));
    ok(!F.shkrime.some(x => x.te.grupi === ''), '1. asnjë shkrim grupi = \'\'', F.shkrime.map(x => x.te));
    ok(gjendjet.join() === 'anetar:g1', '1. gjendja: anëtar i g1 (pa "pa-grup" në mes)', gjendjet);
    ndal();
  }
  // 2. Llogari e re (pa fushën grupi te serveri): pritet serveri, pastaj "pa grup" një herë
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: 1 });
    const e = cloud(F, 'u2', 'besa');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja));
    F.fs.setDoc(F.fs.doc({}, 'perdoruesit', 'u2'), { perdoruesi: 'besa', kycurSe: 2 }, { merge: true });
    await prit(500);
    ok(F.S.get('perdoruesit/u2').grupi === '' && gjendjet[gjendjet.length - 1] === 'pa-grup', '2. llogari e re: "pa grup" (pas serverit)', [F.S.get('perdoruesit/u2'), gjendjet]);
    ndal();
  }
  // 3. Treguesi i humbur nga gabimi i vjetër: rikthehet nga lista publike (admini i grupit) kur anëtarësia ekziston
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u3', { perdoruesi: 'drini', kycurSe: 1, grupi: '' });
    F.S.set('grupet/g3/anetaret/u3', { emri: 'drini', roli: 'pronar' });
    F.S.set('grupet_publike/g3', { emri: 'Viva 7', pronarEmri: 'drini' });
    F.S.set('grupet_publike/g9', { emri: 'Tjetër', pronarEmri: 'drini' }); // s'është më anëtar aty
    const e = cloud(F, 'u3', 'drini');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja + ':' + (r.grupi || '')));
    await prit(500);
    ok(F.S.get('perdoruesit/u3').grupi === 'g3' && gjendjet[gjendjet.length - 1] === 'anetar:g3', '3. rikthehet te g3 (aty ku anëtarësia ekziston)', [F.S.get('perdoruesit/u3'), gjendjet]);
    ndal();
  }
  // 4. Rikthimi nga grupi i fundit i pajisjes (anëtar, jo admin)
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u4', { perdoruesi: 'vjosa', kycurSe: 1, grupi: '' });
    F.S.set('grupet/g4/anetaret/u4', { emri: 'vjosa', roli: 'anetar' });
    const e = cloud(F, 'u4', 'vjosa');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja + ':' + (r.grupi || '')), 'g4');
    await prit(500);
    ok(F.S.get('perdoruesit/u4').grupi === 'g4' && gjendjet[gjendjet.length - 1] === 'anetar:g4', '4. rikthehet te grupi i fundit i pajisjes', gjendjet);
    ndal();
  }
  // 5. Pa anëtarësi (u largua ose e hoqën): s'rikthehet
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u5', { perdoruesi: 'zana', kycurSe: 1, grupi: '' });
    F.S.set('grupet_publike/g5', { emri: 'Grupi Zana', pronarEmri: 'zana' });
    const e = cloud(F, 'u5', 'zana');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja), 'g5');
    await prit(500);
    ok(F.S.get('perdoruesit/u5').grupi === '' && gjendjet[gjendjet.length - 1] === 'pa-grup', '5. pa anëtarësi: mbetet pa grup', gjendjet);
    ndal();
  }
  // 6. Grupi s'është te lista publike (krijuar para v242) dhe pajisja s'e mban mend: gjendet nga pronarUid (rregulla v243)
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u6', { perdoruesi: 'albi', kycurSe: 1, grupi: '' });
    F.S.set('grupet/g6', { emri: 'Albi Market 34', pronarUid: 'u6', pronarEmri: 'albi', krijuarSe: 1 });
    F.S.set('grupet/g6/anetaret/u6', { emri: 'albi', roli: 'pronar' });
    F.S.set('grupet/g7', { emri: 'I huaji', pronarUid: 'u99', pronarEmri: 'tjetri', krijuarSe: 1 });
    const e = cloud(F, 'u6', 'albi');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja + ':' + (r.grupi || '')));
    await prit(500);
    ok(F.S.get('perdoruesit/u6').grupi === 'g6' && gjendjet[gjendjet.length - 1] === 'anetar:g6', '6. rikthehet te grupi që e krijoi (pa listë publike, pa pajisje)', [F.S.get('perdoruesit/u6'), gjendjet]);
    ndal();
  }
  // 7. "Kërko të hysh" te grupi ku jam ende anëtar: kthehem menjëherë, pa kërkesë
  {
    const F = krijoFs();
    F.S.set('perdoruesit/u7', { perdoruesi: 'besa', kycurSe: 1, grupi: '' });
    F.S.set('grupet/g8/anetaret/u7', { emri: 'besa', roli: 'anetar' });
    const e = cloud(F, 'u7', 'besa');
    const gjendjet = [];
    const ndal = e.degjoGrupin(r => gjendjet.push(r.gjendja + ':' + (r.grupi || '')));
    await prit(300);
    const r = await e.dergoKerkesen({ id: 'g8', emri: 'Viva 8' });
    await prit(300);
    ok(r.ok && r.rikthyer, '7. dergoKerkesen: rikthyer', r);
    ok(F.S.get('perdoruesit/u7').grupi === 'g8' && gjendjet[gjendjet.length - 1] === 'anetar:g8', '7. treguesi g8, gjendja anëtar', [F.S.get('perdoruesit/u7'), gjendjet]);
    ok(!F.S.has('kerkesat_grupi/g8_u7'), '7. asnjë kërkesë e shkruar');
    // grupi tjetër (s'jam anëtar): kërkesa e zakonshme
    const r2 = await e.dergoKerkesen({ id: 'g9', emri: 'Tjetër' });
    ok(r2.ok && !r2.rikthyer && F.S.has('kerkesat_grupi/g9_u7'), '7. grupi ku s\'jam anëtar: kërkesë normale', r2);
    ndal();
  }
  // 8. Kërkimi: pa dallim shkronjash, ë/ç, hapësirash e shenjash; lexim i ri kur s'gjendet (grupi u krijua sapo)
  {
    let n = 0, L = [{ id: 'g1', emri: 'Viva Fresh – Prishtinë', pronarEmri: 'drini' }, { id: 'g2', emri: 'Market Çarshia', pronarEmri: 'zana' }];
    const K = EK.krijoKontrollues({ cloud: () => ({ ekipa: { listaEGrupeve: async () => { n++; return { ok: true, lista: L.slice() }; } } }), uidIm: () => 'u9', ndryshoi: () => {} });
    const gjej = async q => (await K.kerkoGrupet(q)).lista.map(x => x.id).join(',');
    ok(await gjej('viva fresh prishtine') === 'g1' && await gjej('VIVA-FRESH') === 'g1' && await gjej('fresh viva') === 'g1' && await gjej('carshia') === 'g2' && await gjej('drini') === 'g1',
      '8. kërkimi tolerant (shkronjat, ë/ç, viza, renditja e fjalëve, admini)');
    ok(await gjej('Albi Market 34') === '' && n === 1, '8. s\'gjendet ende, pa lexim të ri brenda 2 s', n);
    L.push({ id: 'g3', emri: 'Albi Market 34', pronarEmri: 'albi' });
    await prit(2100);
    ok(await gjej('albi  market 34') === 'g3' && n === 2, '8. pas 2 s lexohet sërish dhe gjendet grupi i ri', n);
    ok(await gjej('albimarket34') === 'g3' && n === 2, '8. edhe pa hapësira; nga kujtesa (pa lexim)', n);
  }
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
