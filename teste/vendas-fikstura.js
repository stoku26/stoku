// Aplikacioni native (vendas/): rastet e provës për logjikën në Kotlin, të llogaritura me kodin e VËRTETË të web-it
// (bashkimi.js, ruajtja.js). Kotlini duhet të japë saktësisht të njëjtin rezultat (vendas/logjika/src/test).
//   node teste/vendas-fikstura.js   → vendas/logjika/src/test/resources/fikstura.json
const path = require('path');
const fs = require('fs');
const RR = path.resolve(__dirname, '..');
const B = require(RR + '/bashkimi.js');
const R = require(RR + '/ruajtja.js');
let fara = 12345;
const rast = () => { fara = (fara * 1103515245 + 12345) % 2147483648; return fara / 2147483648; };
const nje = l => l[Math.floor(rast() * l.length)];
const TANI = 1792712593135;
const koha = () => nje([TANI - 5e3, TANI - 6e4, TANI - 6e4, TANI - 9e6, TANI - 130 * 864e5, TANI - 3e5, 0, undefined]);
const FOLD = ['ushqimore', 'pije', 'higjiene', 'fresh', 'f1', 'f2'];
const BARK = ['1', '2', '389001000', '38900ë', 'x y', '😀7', 5, ''];
function produkt() {
  const p = { kategoriaId: nje(FOLD.concat([undefined])), barkodi: nje(BARK), emri: nje(['Ujë', 'Kos ë', null, 7, undefined, '']), sasia: nje([1, 0, -3, 2.5, '4', 'abc', null, undefined, 1e21]) };
  const k = koha(); if (k !== undefined) p.prekurSe = k;
  if (rast() < 0.3) p.furnizuesi = nje(['Vita', 'Bylmeti', '']);
  if (rast() < 0.1) p.fushaERe = { a: [1, 'b', null], c: true };
  return p;
}
function folder() {
  const f = { id: nje(FOLD.concat(['', null])), emri: nje(['Pije', 'Fresh', 3, null, 'Ë']) };
  const k = koha(); if (k !== undefined) f.ndryshuarSe = k;
  if (rast() < 0.3) f.ikona = nje(['shporta', 'shishe', '']);
  return f;
}
function afat() {
  const a = { id: nje(['a1', 'a2', 'a3', 7, '', null, 'Z9', 'b10']), barkodi: nje(BARK), emri: nje(['Kos', 'Djathë']), data: nje(['2026-10-20', '2026-11-01', '', undefined, '2026-10-20']), statusi: nje(['aktiv', 'hequr', undefined]) };
  if (rast() < 0.8) a.sasia = nje([3, '2', '', null, 0]);
  const k = koha(); if (k !== undefined) a.ndryshuarSe = k;
  if (rast() < 0.3) a.m = nje(['k1', 'm2']);
  return a;
}
function market() {
  const m = { id: nje(['k1', 'm2', 'k3', '', 4]), emri: nje(['Albi', 'Viva']), lat: nje([42.6476, 42.66, undefined]), lng: 21.1491 };
  const k = koha(); if (k !== undefined) m.ndryshuarSe = k;
  return m;
}
function fshirje() {
  const f = {};
  ['produktet', 'foldera', 'afatet', 'marketet'].forEach(l => {
    if (rast() < 0.2) return;
    const m = {};
    const n = Math.floor(rast() * 4);
    for (let i = 0; i < n; i++) {
      const k = l === 'produktet' ? nje(FOLD) + '::' + nje(BARK) : l === 'foldera' ? nje(FOLD) : l === 'afatet' ? nje(['a1', 'a2', 'a3', '7']) : nje(['k1', 'm2', 'k3']);
      m[k] = nje([TANI - 1e3, TANI - 6e4, TANI - 7e6, TANI - 200 * 864e5, String(TANI - 2e3), 'x', 0]);
    }
    f[l] = m;
  });
  return f;
}
function gjendje() {
  if (rast() < 0.08) return null;
  const n = k => Array.from({ length: Math.floor(rast() * k) }, () => null);
  const g = {
    foldera: n(6).map(folder), produktet: n(10).map(produkt), afatet: n(7).map(afat), marketet: n(4).map(market),
    fshira: fshirje(), rendiKoha: nje([0, TANI - 1e4, TANI - 5e4, undefined, '123'])
  };
  if (rast() < 0.1) g.foldera.push(null, 5);
  if (rast() < 0.1) g.produktet.push(null, { barkodi: 1.5, kategoriaId: 'pije' });
  if (rast() < 0.1) g.afatet.push(null, { emri: 'pa id' });
  if (rast() < 0.1) g.fshira = null;
  return g;
}
const pastro = x => JSON.parse(JSON.stringify(x === undefined ? null : x));
const bashkimi = [];
for (let i = 0; i < 150; i++) {
  const cloud = pastro(gjendje()), lokal = pastro(gjendje());
  const rez = B.bashko(cloud, lokal, TANI);
  const siguruar = B.sigurojFolderat(B.bashko(cloud, lokal, TANI), TANI);
  bashkimi.push({ cloud, lokal, rez: pastro(rez), siguruar: pastro(siguruar), njejte: B.eNjejte(rez, lokal), njejteCloud: B.eNjejte(B.bashko(cloud, lokal, TANI), rez) });
}
// sigurojFolderat: pa foldera (me fshirje të freskëta / të vjetra)
const siguro = [];
for (const fsh of [{}, { foldera: { pije: TANI - 1e3, tjeter: TANI - 1e8 } }, { foldera: { pije: TANI - 1e8, tjeter: TANI - 2e8 } }, { foldera: { pije: 'x' } }]) {
  const g = { foldera: [], produktet: [], fshira: fsh, x: 1 };
  siguro.push({ g, rez: pastro(B.sigurojFolderat(g, TANI)) });
}
// ndarja në pjesë dhe bashkimi i pjesëve
const ndarja = [];
for (let i = 0; i < 30; i++) {
  const g = B.bashko(pastro(gjendje()), pastro(gjendje()), TANI);
  const nPara = nje([0, 1, 2, 3, 7]);
  const nd = R.ndajNePjese(g, nPara);
  ndarja.push({ g: pastro(g), nPara, kryesori: pastro(nd.kryesori), pjeset: pastro(nd.pjeset), bashkuar: pastro(R.bashkoPjeset(nd.kryesori, nd.pjeset)) });
}
// pjesë e madhe: 3000 produkte → më shumë se 1 pjesë
const madhe = { foldera: [{ id: 'pije', emri: 'Pije' }], produktet: Array.from({ length: 6000 }, (_, i) => ({ kategoriaId: 'pije', barkodi: String(380000000 + i), emri: 'Produkt shumë i gjatë me emër ' + 'ë'.repeat(i % 40) + i, sasia: i % 50, prekurSe: TANI - i })), afatet: [] };
const ndM = R.ndajNePjese(madhe, 0); // Kotlini i krijon vetë të njëjtat produkte; këtu vetëm barkodet e secilës pjesë
const madheRez = { n: ndM.pjeset.length, barkodet: ndM.pjeset.map(pj => pj.produktet.map(p => p.barkodi)) };
// bashkoPjeset me kryesor të vjetër (produktet brenda kryesorit) dhe dublikata
const bp = [];
for (let i = 0; i < 30; i++) {
  const k = rast() < 0.2 ? null : Object.assign({ pjeset: 2, rendiKoha: 5 }, pastro(gjendje()) || {});
  const pj = [pastro(gjendje()), rast() < 0.3 ? null : pastro(gjendje())];
  bp.push({ k, pj, rez: pastro(R.bashkoPjeset(k, pj)) });
}
const hashet = ['', 'a', 'p:pije::389001000', 'a:a1', 'p:ushqimore::😀7', 'ëçÇË', 'x'.repeat(1000)].map(s => ({ s, h: (function (s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; })(s) }));
// kanonik (pjesaKanonike) e disa vlerave: Kotlini duhet ta japë njësoj (krahasohet me Firestore-in)
const kan = [{ b: 1, a: [2.5, 'ë', null, true, { z: 1, y: '"\\\n\u0001' }] }, { x: 1e21, y: -0.000001, z: 123456789012 }, [1.1, 0.1, 100, -7]].map(x => ({ x, k: R.pjesaKanonike({ produktet: [x], afatet: [], tjeter: x }) }));
const dalja = { TANI, bashkimi, siguro, ndarja, bp, hashet, kan, madheRez };
const sk = path.join(RR, 'vendas/logjika/src/test/resources/fikstura.json');
fs.writeFileSync(sk, JSON.stringify(dalja));
console.log('OK ' + sk + ' ' + (fs.statSync(sk).size / 1024 | 0) + ' KB; pjesët e madhe: ' + ndM.pjeset.length);

// ---------- Afatet (afatet.js): statuset, tekstet, datat ----------
{
  const A = require(RR + '/afatet.js');
  const L = require(RR + '/lejet.js');
  const TANI_A = new Date(2026, 9, 22, 15, 30).getTime(); // 22.10.2026 15:30, ora lokale
  const iso = n => { const d = new Date(TANI_A); d.setDate(d.getDate() + n); return A.isoNgaData ? A.isoNgaData(d) : d.toISOString().slice(0, 10); };
  const afatet = [];
  [-400, -40, -2, -1, 0, 1, 2, 29, 30, 31, 90, 365].forEach(n => afatet.push({ id: 'x' + n, emri: 'P' + n, data: iso(n), statusi: 'aktiv', sasia: n % 3 ? 2 : '' }));
  afatet.push({ id: 'h1', emri: 'Hequr', data: iso(-5), statusi: 'hequr', hequrSe: TANI_A - 3 * 864e5 });
  afatet.push({ id: 'h2', emri: 'Hequr 2', data: iso(10), statusi: 'hequr', hequrSe: TANI_A - 864e5 });
  afatet.push({ id: 'pd', emri: 'Pa datë', data: '', statusi: 'aktiv' });
  afatet.push({ id: 'gb', emri: 'Gabim', data: '2026-02-30', statusi: 'aktiv', furnizuesi: ' Vita  ' });
  afatet.push({ id: 'f1', emri: 'Ëmbëlsirë', data: iso(5), statusi: 'aktiv', furnizuesi: 'vita' });
  afatet.push({ id: 'f2', emri: 'çokollatë', data: iso(5), statusi: 'aktiv', furnizuesi: 'Bylmeti' });
  const rastet = afatet.map(a => ({ a, statusi: A.statusi(a, TANI_A), ditet: A.ditetDeri(a.data, TANI_A), pershkrimi: A.pershkrimi(a, TANI_A), mbetura: A.ditetEMbetura(a, TANI_A), formato: A.formato(a.data), muaji: A.celesiMuajit(a), sasiaTekst: A.sasiaTekst(a), fusha: A.formatoPerFushe(a.data) }));
  // krahaso() e përdor orën e tanishme: këtu ora ndalet te TANI_A (që rezultati të mos varet nga dita kur krijohet)
  const DataE = Date;
  global.Date = class extends DataE { constructor(...x) { if (x.length) super(...x); else super(TANI_A); } static now() { return TANI_A; } };
  const renditur = afatet.slice().sort((a, b) => A.krahaso(a, b)).map(a => a.id);
  global.Date = DataE;
  const datat = ['12.10.2026', '12/10/26', '12-10-2026', '2026-10-12', '1.2.27', '10/2026', '10.26', '12 nëntor 26', 'nov 2027', '311226', '31.02.2026', 'abc', '', '05 tet 2026', 'dhj.27', '3/27'].map(t => ({ t, iso: A.lexoDaten(t) }));
  const shkrimi = ['1', '12', '1-', '121', '1210', '12102', '121026', '1.10.26', '01102026', '1-10-2026x', 'ab12'].map(t => ({ t, v: A.formatoDatenGjateShkrimit(t) }));
  const sasite = ['3', ' 60 + 30 ', '5 copë', '12pcs', '-2', '1234567', 'abc', '', null, 7, '2+x'].map(v => ({ v, s: A.lexoSasine(v), shume: A.sasiaSiShume(v), pranueshme: A.sasiaEPranueshme(v) }));
  const furn = A.furnizuesitELista(afatet).map(f => [f.celes, f.n, f.emri]);
  const ikonat = [{ emri: 'Pije' }, { emri: 'Ushqimore' }, { emri: 'FRESH' }, { emri: 'Bulmeti' }, { emri: 'Diçka' }, { ikona: 'zemra', emri: 'Pije' }, { emri: 'Çokollata' }].map(f => ({ f, id: A.ikonaEFolderit(f).id }));
  const lejet = [];
  [null, {}, { stoku: false }, { stokuNdrysho: false }, { marketet: true }, { marketet: true, afatet: false }, { stokuPlusMinus: false, kamera: false }].forEach(l => {
    L.CELESAT.concat(['panjohur']).forEach(k => lejet.push({ l, k, po: L.lejohet(l, k) }));
  });
  const n = A.numero(afatet, TANI_A);
  dalja.afatet = { TANI_A, rastet, renditur, datat, shkrimi, sasite, furn, ikonat, lejet, numero: n };
  fs.writeFileSync(sk, JSON.stringify(dalja));
  console.log('afatet: ' + rastet.length + ' raste');
}

// ---------- Marketet (marketet.js, v253): pikat, kufiri 20 m, shtimi, sinkronizimi me pikat ----------
{
  const M = require(RR + '/marketet.js');
  const TANI_M = 1792712593135;
  const Q = { lat: 42.6476, lng: 21.1491 };
  // pikë në largësi (metra) nga qendra, në drejtim të rastit
  const pike = (d) => { const k = rast() * 2 * Math.PI; return { lat: Q.lat + d * Math.cos(k) / 111320, lng: Q.lng + d * Math.sin(k) / (111320 * Math.cos(Q.lat * Math.PI / 180)) }; };
  const EMRAT = ['Viva Fly', 'Albi', 'viva  fly', 'Meridian', '', null, 7, '  Ëmbëlsira  '];
  const larg = () => nje([0, 3, 12, 19, 22, 35, 50, 55, 58, 65, 90, 200, 260, 400, 2000]) + rast() * 2;
  function marketM(i) {
    const m = { id: nje(['m' + i, 'm' + i, 'k' + i, '', 5, null]), emri: nje(EMRAT) };
    if (rast() < 0.85) Object.assign(m, pike(larg()));
    if (rast() < 0.1) m.lat = 'x';
    if (rast() < 0.6) m.ndryshuarSe = nje([TANI_M - 1e3, TANI_M - 9e5, TANI_M - 864e5, 0]);
    if (rast() < 0.4) m.p = nje(['p1', 'p2', 'p3', 'p9', '', 'x'.repeat(50)]);
    return m;
  }
  function pikaM(i) {
    const x = Object.assign({ id: nje(['p' + i, 'p' + i, 'p1', '', null]), emri: nje(EMRAT) }, pike(larg()));
    if (rast() < 0.1) delete x.lat;
    if (rast() < 0.5) { x.krijuarNga = nje(['u1', '', 0, null]); x.krijuarNgaEmri = nje(['besa', '']); x.emriNgaAdmini = nje([true, 'po', false]); }
    return x;
  }
  const rastet = [];
  for (let i = 0; i < 120; i++) {
    const lista = M.pastro(Array.from({ length: Math.floor(rast() * 5) }, (_, j) => marketM(j)));
    const pikatRaw = Array.from({ length: Math.floor(rast() * 5) }, (_, j) => pikaM(j + 1));
    const pikat = M.pastroPikat(pikatRaw);
    const poz = rast() < 0.1 ? null : Object.assign(pike(larg()), { sakt: nje([5, 15, 40, 99, 100, 101, 400, -3, undefined]) });
    const afatet = Array.from({ length: Math.floor(rast() * 4) }, (_, j) => ({ id: 'a' + j, m: nje(lista.map(m => m.id).concat(['', 'zz', undefined])) }));
    const sinkr = M.sinkronizoMePikat(lista, pikat, afatet, rast() < 0.6, TANI_M);
    rastet.push({
      lista, pikatRaw, pikat, poz: pastro(poz), afatet: pastro(afatet),
      gjej: pastro(M.gjej(lista, poz)), afer: pastro(M.pikatAfer(pikat, poz, M.LIDHJA_M, 3)),
      neVend: pastro(M.marketiNeVend(lista, poz)), shumeAfer: pastro(M.pikaShumeAfer(pikat, poz)),
      kontrolli: pastro(M.kontrolloShtimin(poz, lista, pikat)),
      perMarketin: lista.map(m => (M.pikaPerMarketin(pikat, m) || {}).id || null),
      serveri: sinkr.serveriPerProve, sinkr: pastro(sinkr),
      meEmra: pastro(M.meEmra(afatet, lista)), paMarket: pastro(M.vendosPaMarket(afatet, lista, 'mX', TANI_M)),
      grupo: pastro(M.grupo(afatet, lista).map(g => [g.id, g.emri, g.afatet.map(a => a.id)]))
    });
  }
  // sinkronizoMePikat thirret dy herë (me serveri = true dhe false) që të provohen të dyja rrugët
  rastet.forEach(r => { r.sinkrS = pastro(M.sinkronizoMePikat(r.lista, r.pikat, r.afatet, true, TANI_M)); r.sinkrJ = pastro(M.sinkronizoMePikat(r.lista, r.pikat, r.afatet, false, TANI_M)); delete r.sinkr; delete r.serveri; });
  const aktivet = [];
  [{ id: 'm1', menyra: 'dore', koha: TANI_M - 1e6 }, { id: 'm1', menyra: 'dore', koha: TANI_M - 2e7 }, { id: null, menyra: 'gps', koha: 0 }].forEach(a => {
    [null, { marketi: { id: 'm2' }, largesia: 5 }].forEach(g => aktivet.push({ a, g, rez: M.pasGps(Object.assign({ kontrolluarSe: 0 }, a), g, TANI_M) }));
  });
  const kontrolli = [[], [{ id: 'm', emri: 'x' }], [{ id: 'm', emri: 'x', lat: 1, lng: 2 }]].flatMap(l => [0, TANI_M - 1e5, TANI_M - 2e5].map(k => ({ l, k, po: M.duhetKontrolli(l, { kontrolluarSe: k }, TANI_M) })));
  dalja.marketet = { TANI_M, rastet, aktivet, kontrolli, emrat: ['  Viva   Fly ', 'viva fly', 'ËMBËL', 'ëmbël', 'Albi', '7'].map(e => [e, M.ekzistonEmri([{ id: 'a', emri: 'Viva Fly' }, { id: 'b', emri: 'Ëmbël' }, { id: 'c', emri: 7 }], e), M.ekzistonEmri([{ id: 'a', emri: 'Viva Fly' }], e, 'a')]) };
  fs.writeFileSync(sk, JSON.stringify(dalja));
  console.log('marketet: ' + rastet.length + ' raste, ' + rastet.filter(r => r.kontrolli && r.kontrolli.arsye === 'afer').length + ' "afer", ' + rastet.filter(r => r.kontrolli && r.kontrolli.arsye === 'ekziston').length + ' "ekziston", ' + rastet.filter(r => r.kontrolli === null).length + ' lejohet');
}
