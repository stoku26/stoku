// v227: skedaret.js (dërgimi i skedarëve në PC) mbi një Firestore të rremë në memorie
const S = require('../skedaret.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };

class Bytes {
  constructor(u8) { this._u8 = new Uint8Array(u8); }
  static fromUint8Array(u8) { return new Bytes(u8); }
  toUint8Array() { return new Uint8Array(this._u8); }
}
function fsIRreme(opt = {}) {
  const docs = new Map(), shkrimet = [], subs = [];
  let nr = 0;
  const rruga = a => a.join('/');
  const db = {};
  const madhesia = d => Object.values(d).reduce((m, v) => m + (v instanceof Bytes ? v._u8.length : JSON.stringify(v).length), 0);
  const njofto = () => subs.forEach(s => s.ekzekuto());
  const fs = {
    Bytes,
    collection: (db0, ...seg) => ({ lloji: 'kol', path: rruga(seg) }),
    doc: (a, ...seg) => a && a.lloji === 'kol' && !seg.length ? { lloji: 'doc', path: a.path + '/id' + (++nr), id: 'id' + nr } : { lloji: 'doc', path: rruga(seg), id: seg[seg.length - 1] },
    async setDoc(ref, data, o) {
      if (opt.prit && opt.prit(ref, shkrimet.length)) return new Promise(() => {}); // s'mbaron kurrë (pa internet)
      if (opt.refuzo && opt.refuzo(ref, shkrimet.length)) { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; }
      if (madhesia(data) > 1048487) { const e = new Error('Document too big'); e.code = 'invalid-argument'; throw e; }
      shkrimet.push({ lloji: 'set', path: ref.path });
      docs.set(ref.path, o && o.merge ? Object.assign({}, docs.get(ref.path) || {}, data) : Object.assign({}, data));
      njofto();
    },
    async deleteDoc(ref) { shkrimet.push({ lloji: 'del', path: ref.path }); docs.delete(ref.path); njofto(); },
    async getDocs(kol) {
      const lista = [...docs.entries()].filter(([p]) => p.startsWith(kol.path + '/') && p.slice(kol.path.length + 1).indexOf('/') < 0);
      return { forEach: f => lista.forEach(([p, d]) => f({ id: p.split('/').pop(), data: () => Object.assign({}, d) })) };
    },
    query: (kol, ...k) => ({ kol, k }), orderBy: (f, d) => ({ f, d }), limit: n => ({ n }),
    onSnapshot(q, cb) {
      const s = { ekzekuto: async () => { const r = await fs.getDocs(q.kol); const a = []; r.forEach(x => a.push(x)); a.sort((x, y) => (y.data().krijuarSe || 0) - (x.data().krijuarSe || 0)); cb({ forEach: f => a.forEach(f) }); } };
      subs.push(s); s.ekzekuto(); return () => subs.splice(subs.indexOf(s), 1);
    },
    writeBatch: () => { const ops = []; return { delete: r => ops.push(r), async commit() { if (opt.refuzoBatch) { const e = new Error('x'); e.code = 'permission-denied'; throw e; } ops.forEach(r => { shkrimet.push({ lloji: 'del', path: r.path }); docs.delete(r.path); }); njofto(); } }; }
  };
  return { fs, db, docs, shkrimet };
}
const rastesishem = n => { const u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = (i * 2654435761 + (i >> 7)) & 255; return u; };
const skedar = (u8, emri) => ({ name: emri, arrayBuffer: async () => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) });
const njejte = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

(async () => {
  // 1. Skedar i vogël: një copë, të dhënat, leximi i saktë
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const u8 = rastesishem(10 * 1024);
    const r = await sk.dergo(skedar(u8, 'malli_ushqimore.xlsx'), { titulli: 'Malli', pajisja: 'PDA' });
    ok(r.ok && r.pjeset === 1 && r.madhesia === 10240, '1. skedar 10 KB → 1 copë', r);
    const m = F.docs.get('dyqane/u1/skedaret/' + r.id);
    ok(m && m.emri === 'malli_ushqimore.xlsx' && m.lloji === 'xlsx' && m.titulli === 'Malli' && m.pajisja === 'PDA' && m.pjeset === 1 && m.madhesia === 10240, '1. dokumenti me të dhënat e skedarit', m);
    ok(m && m.skadon - m.krijuarSe === 7 * 86400000, '1. mbahet 7 ditë');
    ok(Object.keys(m).sort().join() === 'emri,krijuarSe,lloji,madhesia,pajisja,pjeset,skadon,titulli', '1. vetëm fushat që i lejojnë rregullat', Object.keys(m).sort());
    const b = await sk.merr(m && Object.assign({ id: r.id }, m));
    ok(njejte(b, u8), '1. PC-ja i merr bajtet e njëjta');
  }
  // 2. Skedar i madh (2,5 MB): 3 copa, copat para dokumentit, bashkimi i saktë
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const u8 = rastesishem(Math.round(2.5 * 1024 * 1024));
    const progr = [];
    const r = await sk.dergo(skedar(u8, 'etiketa.pdf'), { progres: x => progr.push(x) });
    ok(r.ok && r.pjeset === 3, '2. 2,5 MB → 3 copa', r);
    const radha = F.shkrimet.map(w => w.path.split('/').slice(4).join('/') || 'META');
    ok(radha.join() === 'pjeset/000,pjeset/001,pjeset/002,META', '2. copat shkruhen të parat, dokumenti i fundit', radha);
    ok(progr.length === 3 && progr[2] < 1, '2. përparimi raportohet', progr.map(x => x.toFixed(2)));
    const m = Object.assign({ id: r.id }, F.docs.get('dyqane/u1/skedaret/' + r.id));
    ok(m.lloji === 'pdf' && njejte(await sk.merr(m), u8), '2. bashkimi i copave jep skedarin e njëjtë');
  }
  // 3. Saktësisht 2 copa të plota
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const u8 = rastesishem(2 * S.COPA);
    const r = await sk.dergo(skedar(u8, 'x.xlsx'));
    const m = Object.assign({ id: r.id }, F.docs.get('dyqane/u1/skedaret/' + r.id));
    ok(r.ok && r.pjeset === 2 && njejte(await sk.merr(m), u8), '3. 2 × 900 KB → 2 copa, pa copë bosh');
  }
  // 4–6. Kufijtë
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    let r = await sk.dergo(skedar(new Uint8Array(S.MAKS + 1), 'i_madh.pdf'));
    ok(!r.ok && r.arsye === 'i-madh' && F.shkrimet.length === 0, '4. mbi 15 MB: s\'dërgohet, asnjë shkrim', r);
    r = await sk.dergo(skedar(new Uint8Array(S.MAKS), 'fiks.pdf'));
    ok(r.ok && r.pjeset === Math.ceil(S.MAKS / S.COPA), '4. saktësisht 15 MB: dërgohet', r.pjeset);
    r = await sk.dergo(skedar(new Uint8Array(0), 'bosh.xlsx'));
    ok(!r.ok && r.arsye === 'bosh', '5. skedar bosh', r);
    const sk2 = S.krijo(F.fs, F.db, () => null);
    r = await sk2.dergo(skedar(rastesishem(10), 'a.xlsx'));
    ok(!r.ok && r.arsye === 'pa-hyrje', '6. pa llogari', r);
  }
  // 7. Rregullat e refuzojnë copën e dytë: asgjë s'mbetet
  {
    const F = fsIRreme({ refuzo: (ref, i) => i === 1 }); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const r = await sk.dergo(skedar(rastesishem(2 * 1024 * 1024), 'a.pdf'));
    await new Promise(z => setTimeout(z, 20));
    ok(!r.ok && r.arsye === 'leje', '7. refuzim nga rregullat → arsye "leje"', r);
    ok(![...F.docs.keys()].some(k => k.startsWith('dyqane/u1/skedaret/')), '7. copat e shkruara fshihen, s\'mbetet asgjë', [...F.docs.keys()]);
  }
  // 8. Pa internet (shkrimi s'mbaron): afati, pastaj fshirjet radhiten
  {
    const F = fsIRreme({ prit: (ref, i) => i === 1 }); const sk = S.krijo(F.fs, F.db, () => 'u1', { afati: 150 });
    const t0 = Date.now();
    const r = await sk.dergo(skedar(rastesishem(1024 * 1024 + 5), 'a.xlsx'));
    ok(!r.ok && r.arsye === 'afati' && Date.now() - t0 < 2000, '8. pa internet: përgjigje pas afatit, jo pritje pa fund', r);
    await new Promise(z => setTimeout(z, 20));
    ok(![...F.docs.keys()].some(k => k.startsWith('dyqane/u1/skedaret/')), '8. copa e parë fshihet', [...F.docs.keys()]);
  }
  // 9. Emri: shenjat e ndaluara hiqen
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const r = await sk.dergo(skedar(rastesishem(100), 'x'), { emri: 'stoku/i "Besës": 2026?.xlsx' });
    ok(r.ok && r.emri === 'stoku_i _Besës_ 2026_.xlsx', '9. emri pa / " : ?', r.emri);
  }
  // 10. Dëgjimi, shënimi "u shkarkua", fshirja, pastrimi i të skaduarve
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const listat = [];
    const ndal = sk.degjo(l => listat.push(l.map(x => x.emri)));
    await new Promise(z => setTimeout(z, 10));
    const r1 = await sk.dergo(skedar(rastesishem(2000), 'i_pari.xlsx'));
    await new Promise(z => setTimeout(z, 5));
    const r2 = await sk.dergo(skedar(rastesishem(2 * 1024 * 1024), 'i_dyti.pdf'));
    await new Promise(z => setTimeout(z, 10));
    const eFundit = listat[listat.length - 1];
    ok(eFundit.join() === 'i_dyti.pdf,i_pari.xlsx', '10. lista: më i riu i pari', eFundit);
    ok(listat.every(l => !l.includes('i_dyti.pdf') || l.length === 2), '10. skedari del në listë vetëm i plotë (pas copave)');
    // copat e skedarit të dytë dolën në listë para dokumentit? (s'duhet)
    const lista = await new Promise(z => { const n2 = sk.degjo(l => { z(l); }); });
    const s2 = lista.find(x => x.id === r2.id);
    await sk.shenoShkarkuar(s2);
    ok(typeof F.docs.get('dyqane/u1/skedaret/' + r2.id).shkarkuarSe === 'number' && F.docs.get('dyqane/u1/skedaret/' + r2.id).emri === 'i_dyti.pdf', '10. "u shkarkua" shënohet pa i prekur të tjerat');
    const f = await sk.fshij(s2);
    ok(f.ok && ![...F.docs.keys()].some(k => k.includes(r2.id)), '10. fshirja heq dokumentin dhe krejt copat', [...F.docs.keys()]);
    const s1 = lista.find(x => x.id === r1.id);
    const mbeten = sk.pastroTeSkaduarat([s1, Object.assign({}, s1, { id: 'vjeter', skadon: Date.now() - 1 })]);
    ok(mbeten.length === 1 && mbeten[0].id === r1.id, '10. i skaduari hiqet nga lista', mbeten.map(x => x.id));
    ndal();
  }
  // 11. Copë që mungon: gabim, jo skedar i prishur
  {
    const F = fsIRreme(); const sk = S.krijo(F.fs, F.db, () => 'u1');
    const r = await sk.dergo(skedar(rastesishem(2 * 1024 * 1024), 'a.pdf'));
    F.docs.delete('dyqane/u1/skedaret/' + r.id + '/pjeset/001');
    let gab = null;
    try { await sk.merr(Object.assign({ id: r.id }, F.docs.get('dyqane/u1/skedaret/' + r.id))); } catch (e) { gab = e.message; }
    ok(gab === 'jo-i-plote', '11. copë që mungon → "jo-i-plote"', gab);
  }
  console.log(g ? '✖ ' + g + ' GABIME' : '✔ Krejt në rregull');
})();
