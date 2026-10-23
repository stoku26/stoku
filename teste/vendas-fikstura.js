// Aplikacioni Stoku për Android (vendas/): rastet e provës për logjikën në Kotlin, të llogaritura me kodin e VËRTETË të web-it
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
  // Rreshtat që i kthen AI-ja (Worker-i stoku-afatet) → normalizoRreshtin
  const ai = [
    { barkodi: '389 001-000', emri: ' Kos ', data: '2026-11-03', sasia: '60+30', furnizuesi: ' Vita ', x: 0.2, y: '0.5' },
    { barkodi: '38O0O1', data: '12.10.26', dyshim: true, x: 1.7, y: -2 },
    { barkodi: 3890010, emri: 7, data_origjinale: '31/12/2026', sasia: 5, x: '', y: null },
    { barkodi: 'ABCo', data: '2026-02-30', dataOrigjinale: '30 shkurt', sasia: 'abc' },
    { emri: 'Pa datë', data: '', sasia: '12 copë', x: 'abc', y: true },
    { data: 'nov 2027', sasia: null, furnizuesi: null, dyshim: 0 },
    {}, null, { barkodi: 0, emri: '', data: 0, x: 0, y: 1 }
  ].map(r => ({ r, n: A.normalizoRreshtin(r) }));
  dalja.afatet = { TANI_A, rastet, renditur, datat, shkrimi, sasite, furn, ikonat, lejet, numero: n, ai: JSON.parse(JSON.stringify(ai)) };
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

// ---------- Grupi (ekipa.js, funksionet e pastra): prania, koha, statistikat, tekstet, kalendari, përmbledhja ----------
{
  process.env.TZ = 'UTC';
  const EK = require(RR + '/ekipa.js');
  const A = require(RR + '/afatet.js');
  const TANI_G = Date.UTC(2026, 9, 23, 10, 15, 0); // 23.10.2026 10:15 UTC
  const DataE = Date;
  global.Date = class extends DataE { constructor(...x) { if (x.length) super(...x); else super(TANI_G); } static now() { return TANI_G; } };
  const iso = n => { const d = new DataE(TANI_G + n * 864e5); return d.toISOString().slice(0, 10); };
  const prania = [{ online: true, aktivSe: TANI_G - 60e3 }, { online: true, aktivSe: TANI_G - 5 * 60e3 }, { online: false, aktivSe: TANI_G - 60e3 },
    { online: true, aktivSe: TANI_G - 3 * 3600e3 }, { online: false, aktivSe: TANI_G - 30 * 3600e3 }, { online: false }, null]
    .map(a => ({ a, on: EK.eshteOnline(a, TANI_G), tx: EK.tekstiPranise(a, TANI_G) }));
  const kohet = [30e3, 5 * 60e3, 59 * 60e3, 2 * 3600e3, 11 * 3600e3, 26 * 3600e3, 3 * 864e5, 300 * 864e5, 0].map(d => {
    const ts = d ? TANI_G - d : 0; return { ts, rel: EK.kohaRelative(ts, TANI_G), dita: ts ? EK.titulliDites(ts, TANI_G) : '' };
  });
  const afatetG = [
    { id: 'a1', barkodi: '1', emri: 'Kos', data: iso(-2), sasia: 3, statusi: 'aktiv', ndryshuarSe: TANI_G - 5 * 864e5, furnizuesi: 'Vita', krijuarSe: 1, m: 'x' },
    { id: 'a2', barkodi: '2', emri: 'Qumësht', data: iso(0), sasia: '', statusi: 'aktiv', ndryshuarSe: TANI_G, furnizuesi: 'Vita' },
    { id: 'a3', emri: 'Djathë', data: iso(4), sasia: 2, statusi: 'aktiv', furnizuesi: 'Bylmeti', mk: 'Viva' },
    { id: 'a4', emri: 'Jogurt', data: iso(12), statusi: 'aktiv' },
    { id: 'a5', emri: 'Bukë', data: iso(45), statusi: 'aktiv' },
    { id: 'a6', emri: 'Lëng', data: iso(-9), statusi: 'hequr', hequrSe: TANI_G - 2 * 3600e3, hequrNga: 'agim' },
    { id: 'a7', emri: 'Çaj', data: iso(-60), statusi: 'hequr', hequrSe: TANI_G - 50 * 864e5 },
    { id: 'a8', emri: 'Oriz', data: iso(-20), statusi: 'hequr', hequrSe: TANI_G - 15 * 864e5 },
    { id: 'a9', emri: 'Pa datë', data: '', statusi: 'aktiv' },
    { id: '', emri: 'pa id', data: iso(3) },
    { id: 'b1', emri: 'Ujë', data: iso(-1), statusi: 'aktiv', ndryshuarSe: TANI_G - 864e5 }
  ];
  const permb = EK.permbledhjaEAfateve(afatetG, TANI_G);
  const anetaret = [{ uid: 'u1', emri: 'besa', afatet: afatetG.slice(0, 6) }, { uid: 'u2', emri: 'agim', afatet: afatetG.slice(5) }, { uid: 'u3', emri: 'drini', afatet: [] }];
  const st = EK.statistikat(anetaret, TANI_G);
  const ngjarjet = [
    { lloji: 'hequr', uid: 'u2', emri: 'agim', koha: TANI_G - 3600e3, pronariUid: 'u1', pronariEmri: 'besa', afatId: 'a1', produkti: 'Kos', data: iso(-2), sasia: 3 },
    { lloji: 'hequr', uid: 'u1', emri: 'besa', koha: TANI_G - 7200e3, pronariUid: 'u1', afatId: 'a2', produkti: 'Qumësht' },
    { lloji: 'hequr', uid: 'u2', emri: 'agim', koha: TANI_G - 4000e3, pronariUid: 'u1', pronariEmri: 'besa', afatId: 'b1', barkodi: '9' },
    { lloji: 'heqje-refuzuar', uid: 'u1', emri: 'besa', koha: TANI_G - 3000e3, pronariUid: 'u1', afatId: 'b1', produkti: 'Ujë', kerkuesUid: 'u2', kerkuesEmri: 'agim' },
    { lloji: 'heqje-pranuar', uid: 'u1', emri: 'besa', koha: TANI_G - 100e3, afatId: 'zz', produkti: 'X', kerkuesUid: 'u3' },
    { lloji: 'afate-te-reja', uid: 'u2', emri: 'agim', koha: TANI_G - 1e3, n: 3, ngaFoto: true },
    { lloji: 'afate-te-reja', uid: 'u1', emri: 'besa', koha: TANI_G - 1e3 },
    { lloji: 'rikthyer', uid: 'u1', emri: 'besa', koha: TANI_G, barkodi: '5' },
    { lloji: 'anetar-i-ri', uid: 'u1', emri: 'besa', koha: TANI_G, anetariUid: 'u3', anetariEmri: 'drini' },
    { lloji: 'anetar-i-ri', uid: 'u3', emri: 'drini', koha: TANI_G },
    { lloji: 'lajmerim', uid: 'u1', emri: 'besa', koha: TANI_G, tekst: 'Mbledhje nesër' },
    { lloji: 'lajmeruar', uid: 'u2', emri: 'agim', koha: TANI_G, furnizuesi: 'Vita', n: 1 },
    { lloji: 'kerkese-heqje', uid: 'u2', emri: 'agim', koha: TANI_G, produktet: [{ produkti: 'A', barkodi: '1' }, { produkti: 'B' }, { barkodi: '3' }, { produkti: 'D', data: iso(-1) }], perUid: 'u1', shenim: 'shpejt' },
    { lloji: 'kerkese-heqje', uid: 'u1', emri: 'besa', koha: TANI_G, produkti: 'Kos', barkodi: '1' },
    { lloji: 'kerkese-kryer', uid: 'u3', emri: 'drini', koha: TANI_G, produkti: 'Kos', kerkuesUid: 'u1' },
    { lloji: 'admin-afat', uid: 'uA', emri: 'mendurberisha', koha: TANI_G, veprimi: 'fshij', produkti: 'Kos', pronariUid: 'u1' },
    { lloji: 'admin-afat', uid: 'u1', emri: 'besa', koha: TANI_G, veprimi: 'kthe', produkti: 'Kos', pronariUid: 'u2', pronariEmri: 'agim' },
    { lloji: 'tjeter', uid: 'u2', koha: TANI_G, tekst: 'diçka' }
  ];
  const tekstet = [];
  ngjarjet.forEach(ng => ['u1', 'u2', null].forEach(u => tekstet.push({ ng, u, t: EK.tekstiNgjarjes(ng, u) })));
  const njoftimet = [
    { lloji: 'kerkese-heqje', emri: 'agim', produkti: 'Kos', barkodi: '1', perKrejt: true, shenim: 'sot' },
    { lloji: 'kerkese-heqje', produktet: [{ produkti: 'A' }, { produkti: 'B' }] },
    { lloji: 'kerkese-kryer', emri: 'drini', produkti: 'Kos' },
    { lloji: 'hequr', emri: 'agim', produkti: 'Kos', data: iso(-2) },
    { lloji: 'hequr', barkodi: '77' },
    { lloji: 'heqje-pranuar', emri: 'besa', produkti: 'Kos' },
    { lloji: 'heqje-refuzuar', produkti: 'Kos' },
    { lloji: 'lajmerim', emri: 'besa', tekst: 'Përshëndetje' },
    { lloji: 'admin-i-ri', emri: 'besa' },
    { lloji: 'admin-afat', emri: 'mendurberisha', veprimi: 'hiq', produkti: 'Kos' },
    { lloji: 'x', tekst: 'tjetër' }
  ].map(nj => ({ nj, t: EK.tekstiNjoftimit(nj) }));
  const harta = EK.hartaEHeqjeve(ngjarjet);
  const hartaTx = Object.keys(harta).sort().map(k => [k, harta[k].heqja ? harta[k].heqja.koha : null, harta[k].vendimi ? harta[k].vendimi.koha : null]);
  const mbiv = ['a1', 'a2', 'b1', 'a3'].map(id => { const a = afatetG.find(x => x.id === id); return { a, r: EK.mbivendosHeqjen(a, 'u1', harta) }; });
  const zbatimi = [[afatetG[0], { koha: TANI_G }], [afatetG[0], { koha: TANI_G - 6 * 864e5 }], [afatetG[1], { koha: TANI_G }], [afatetG[5], { koha: TANI_G }], [afatetG[10], { koha: TANI_G }]]
    .map(([a, nj]) => ({ a, nj, po: EK.duhetZbatuarHeqja(a, nj) }));
  const kal = [[2026, 9], [2026, 1], [2027, 0]].map(([v, m]) => { const k = EK.kalendari(afatetG, v, m, TANI_G); return { v, m, titulli: k.titulli, ditetMeStatus: k.ditetMeStatus, q: k.qelizat.map(q => q ? [q.iso, q.dita, q.sot, q.afatet.length, q.neRaft, q.statusi] : null) }; });
  const kerkesat = [ngjarjet[12], ngjarjet[13], { produktet: [] }, { produkti: '', barkodi: '' }].map(k => ({ k, l: EK.listaEKerkeses(k) }));
  const rreshtat = [{ produkti: 'Kos', barkodi: '1', data: iso(-2) }, { barkodi: '2' }, {}].map(x => ({ x, t: EK.rreshtiIProduktit(x) }));
  global.Date = DataE;
  dalja.grupi = JSON.parse(JSON.stringify({ TANI_G, prania, kohet, afatetG, permb, anetaret, st, tekstet, njoftimet, hartaTx, mbiv, zbatimi, kal, kerkesat, rreshtat }));
  fs.writeFileSync(sk, JSON.stringify(dalja));
  console.log('grupi: ' + tekstet.length + ' tekste, ' + permb.length + ' në përmbledhje');
}

// ---------- Excel (xlsx.js), barkodet e etiketave (JsBarcode), CSV dhe importi i afateve (afatet.js) ----------
// Leximi i .xlsx kërkon DOMParser: xlsx.js read() ekzekutohet në Chromium (Playwright, teste/pw.js).
(async () => {
  process.env.TZ = 'UTC'; // kolonat "date" të Excel-it varen nga zona; Kotlini i provon me UTC
  const X = require(RR + '/xlsx.js');
  const A = require(RR + '/afatet.js');
  const zlib = require('zlib');
  const JsBarcode = require(path.join(__dirname, 'npm/node_modules/jsbarcode'));
  // ZIP pa kompresim (si i krijon xlsx.js) → [[emri, teksti]]
  function hyrjet(u8) {
    const b = Buffer.from(u8), out = [];
    let o = 0;
    while (o + 30 <= b.length && b.readUInt32LE(o) === 0x04034b50) {
      const n = b.readUInt32LE(o + 18), gjE = b.readUInt16LE(o + 26), gjX = b.readUInt16LE(o + 28), f = o + 30 + gjE + gjX;
      out.push([b.slice(o + 30, o + 30 + gjE).toString('utf8'), b.slice(f, f + n).toString('utf8')]);
      o = f + n;
    }
    return out;
  }
  // ZIP me deflate (si Excel-i i vërtetë): [[emri, teksti]]
  function zipDeflate(sk) {
    const pjeset = [], qendra = [];
    let off = 0;
    sk.forEach(([emri, t]) => {
      const e = Buffer.from(emri), te = Buffer.from(t), k = zlib.deflateRawSync(te), crc = zlib.crc32(te);
      const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(8, 8); l.writeUInt32LE(crc, 14);
      l.writeUInt32LE(k.length, 18); l.writeUInt32LE(te.length, 22); l.writeUInt16LE(e.length, 26);
      const q = Buffer.alloc(46); q.writeUInt32LE(0x02014b50, 0); q.writeUInt16LE(20, 4); q.writeUInt16LE(20, 6); q.writeUInt16LE(8, 10); q.writeUInt32LE(crc, 16);
      q.writeUInt32LE(k.length, 20); q.writeUInt32LE(te.length, 24); q.writeUInt16LE(e.length, 28); q.writeUInt32LE(off, 42);
      pjeset.push(l, e, k); qendra.push(q, e); off += 30 + e.length + k.length;
    });
    const qq = Buffer.concat(qendra), fund = Buffer.alloc(22);
    fund.writeUInt32LE(0x06054b50, 0); fund.writeUInt16LE(sk.length, 8); fund.writeUInt16LE(sk.length, 10); fund.writeUInt32LE(qq.length, 12); fund.writeUInt32LE(off, 16);
    return Buffer.concat(pjeset.concat([qq, fund]));
  }
  const prodX = [
    [],
    [{ barkodi: '0038900', emri: 'Ujë & "Kos" <1>', sasia: 3, furnizuesi: 'Vita' }, { barkodi: '1', emri: 'Pa furnizues', sasia: '4' },
      { barkodi: '2', emri: 'x\u0001y\tz\n', sasia: 2.7, furnizuesi: '' }, { barkodi: '3', emri: '', sasia: -2.5 }, { barkodi: '4', emri: 'ë😀', sasia: 1e21 },
      { barkodi: '5', emri: null, sasia: null }, { barkodi: '6', sasia: 'abc' }, { barkodi: 7, emri: 8, sasia: true, furnizuesi: 0 }]
  ];
  const build = prodX.map(p => ({ p, h: hyrjet(X.build(p)) }));
  const fletetX = [
    [],
    [{ name: 'Afatet', columns: [{ title: 'Barkodi', width: 18 }, { title: 'Emri i produktit', width: 36 }, { title: 'Sasia (copë)', width: 12, type: 'number' },
      { title: 'Skadon më', width: 13, type: 'day' }, { title: 'Ditë', type: 'number' }, { title: 'Koha', type: 'date', width: 0 }],
      rows: [['001', 'Kos', 3, '2026-10-20', -2, 1792712593135], ['', null, '', '2026-02-30', 0, 0], [7, 'Ë & <', 'x', 'abc', 1.5, -5],
        ['b', 'ë', 2.25, '0099-01-01', null, '17927'], ['c', 'd', '7', '2026-13-00', '0', 1e12]],
      totalLabel: 'Gjithsej', totalColumns: [2, 4], redZeroColumn: 4 }],
    [{ name: "'Coca Cola' e gjatë shumë shumë shumë shumë", columns: [{ title: 'A' }], rows: [['x']] },
      { name: "'Coca Cola' e gjatë shumë shumë shumë shumë", columns: [{ title: 'A' }], rows: [] }, { name: 'a[b]:c*?/\\d', columns: [], rows: [] },
      { name: '', columns: [{ title: 'B', type: 'number' }], rows: [[1], [2]], totalLabel: 'Gjithsej', totalColumns: [0] },
      { name: 'FLETA', columns: [{ title: 'Z' }], rows: [['1']] }, { name: 'fleta', columns: [{ title: "O'Neil" }], rows: [["it's"]] },
      { name: '   ', columns: [{ title: 'K', width: 9.5 }], rows: [[null]], totalLabel: '', totalColumns: [0] }]
  ];
  const workbook = fletetX.map(s => ({ s, h: hyrjet(X.buildWorkbook(s)) }));
  // Leximi: Excel me deflate, sharedStrings, tekst me formatim, rPh, b/str/e, rreshta pa "r", qeliza pa "r", rreshta bosh
  const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const xlsxDore = zipDeflate([
    ['[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'],
    ['xl/workbook.xml', '﻿<?xml version="1.0" encoding="UTF-8"?><workbook ' + NS + '><sheets><sheet name="Nëntor2" sheetId="1" r:id="rId7"/><sheet name="Pa rels" sheetId="2" r:id="rId9"/><sheet sheetId="3" r:id="rId8"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId7" Target="worksheets/fleta.xml"/><Relationship Id="rId8" Target="/xl/worksheets/tjeter.xml"/></Relationships>'],
    ['xl/sharedStrings.xml', '<?xml version="1.0"?><sst ' + NS + '><si><t>Barkodi</t></si><si><r><t>Emri </t></r><r><rPr><b/></rPr><t xml:space="preserve">i produktit</t></r><rPh><t>X</t></rPh></si><si><t>Kos &amp; "ujë"</t></si><si><t/></si></sst>'],
    ['xl/worksheets/fleta.xml', '<?xml version="1.0"?><worksheet ' + NS + '><sheetData>' +
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="inlineStr"><is><t>Data</t></is></c></row>' +
      '<row r="3"><c r="A3"><v>3890010001</v></c><c r="B3" t="s"><v>2</v></c><c r="C3" t="b"><v>1</v></c><c r="D3"><v>46300</v></c><c r="E3" t="str"><v>formula</v></c><c r="F3" t="e"><v>#N/A</v></c><c r="G3" t="b"><v>0</v></c></row>' +
      '<row r="4"><c r="A4" s="1"/><c r="B4" t="s"><v>3</v></c></row>' +
      '<row><c><v>1.5</v></c><c t="s"><v>99</v></c><c><v>-0.25</v></c></row>' +
      '<row r="0"><c r="A0"><v>5</v></c></row>' +
      '<row r="1048576"><c r="A1048576" s="3"/></row>' +
      '<row r="6"><c r="C6"><v>1E-7</v></c><c r="AA6" t="inlineStr"><is><r><t>a</t></r><r><t>b</t></r></is></c></row>' +
      '</sheetData></worksheet>'],
    ['xl/worksheets/sheet2.xml', '<?xml version="1.0"?><worksheet ' + NS + '><sheetData><row r="2"><c r="B2" t="inlineStr"><is><t>vetëm B2</t></is></c></row></sheetData></worksheet>'],
    ['xl/worksheets/tjeter.xml', '<?xml version="1.0"?><x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><x:sheetData><x:row x:r="1"><x:c r="A1" t="inlineStr"><x:is><x:t>me prefiks</x:t></x:is></x:c></x:row></x:sheetData></x:worksheet>']
  ]);
  const leximi = [
    { emri: 'dore', b64: xlsxDore.toString('base64') },
    { emri: 'build', b64: Buffer.from(X.build(prodX[1])).toString('base64') },
    { emri: 'workbook1', b64: Buffer.from(X.buildWorkbook(fletetX[1])).toString('base64') },
    { emri: 'workbook2', b64: Buffer.from(X.buildWorkbook(fletetX[2])).toString('base64') },
    { emri: 'afatet-test.xlsx', b64: fs.readFileSync(path.join(__dirname, 'afatet-test.xlsx')).toString('base64') }
  ];
  // Barkodet: si vizatoBarkodin() te app-tel.js (formati sipas gjatësisë, pastaj CODE128)
  const formatiB = b => /^[0-9]{13}$/.test(b) ? 'EAN13' : /^[0-9]{12}$/.test(b) ? 'UPC' : /^[0-9]{8}$/.test(b) ? 'EAN8' : 'CODE128';
  const barkodet = ['5901234123457', '5901234123458', '036000291452', '036000291453', '96385074', '12345670', '12345678', '389001000', 'ABC-123', 'abc', 'Kos12345678x',
    '1', '12', '123', '1234', 'a1b2c3d4', '\u0001AB', 'AB\u0001cd', 'ab\u0001cd', 'A\u0001b\u0002C', 'x y', '😀7', 'ë', '00000000000000', '0', 'aB\tC', '12ab34cd5678',
    'AB12345678CD', '12345a', 'a12345', 'abc1234def', '~!@#$%^&*()_+{}|:"<>?', '\u007f\u0000', '1234567890123456789'].map(b => {
    const f = formatiB(b), formatet = f === 'CODE128' ? [f] : [f, 'CODE128'];
    for (const x of formatet) { try { const o = {}; JsBarcode(o, b, { format: x }); return { b, formati: x, modulet: o.encodings.map(e => e.data).join('') }; } catch (e) { /* tjetri */ } }
    return { b, formati: null, modulet: null };
  });
  // CSV: lexoCsvTel nga app-tel.js (funksioni i brendshëm merret nga kodi)
  const src = fs.readFileSync(RR + '/app-tel.js', 'utf8');
  const i0 = src.indexOf('function lexoCsvTel(');
  let i1 = src.indexOf('{', i0), th = 0;
  for (; i1 < src.length; i1++) { if (src[i1] === '{') th++; else if (src[i1] === '}' && --th === 0) break; }
  const lexoCsvTel = new Function(src.slice(i0, i1 + 1) + '; return lexoCsvTel;')();
  const csv = ['a;b;c\n1;2;3\n', '"x,y",z\r\n"q""q",w\r\n\r\n', 'Barkodi\tEmri\n1\tKos', '﻿a,b\n,\n  , \n3,4', 'nje rresht', '"shume\nrreshta",2\n', 'a,b;c;d\n1,2;3', '', '\r\r\n\n', ';;\n x ; ']
    .map(t => ({ t, r: lexoCsvTel(t) }));
  const dekodimi = [[0xEF, 0xBB, 0xBF, 0x61, 0xC3, 0xAB], [0x61, 0xEB, 0x80, 0x62], [0x61, 0x62]].map(b => {
    let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(b)); } catch (e) { t = new TextDecoder('windows-1252').decode(Uint8Array.from(b)); }
    return { b, t };
  });
  // Importi i afateve: ora ndalet te TANI_I (datat me vetëm ditën varen nga viti i tanishëm)
  const TANI_I = new Date(2026, 9, 22, 15, 30).getTime();
  const DataE = Date;
  global.Date = class extends DataE { constructor(...x) { if (x.length) super(...x); else super(TANI_I); } static now() { return TANI_I; } };
  const fletetI = [
    { name: 'Nëntor2', rows: [['Barkodi', 'Emri i produktit', 'Skadon', 'Sasia', 'Furnizuesi'], ['3890010001', 'Kos', 15, '12', 'Vita'], [3890010002, 'Djathë', 46300, 5, ' Bylmeti '],
      ['', '', '', '', ''], ['389 001-0003', 'Ujë', '12.10.2026', '3 copë', ''], ['', 'Pa datë', '', 2, ''], ['', '', '31.02.2026', 1, ''], ['3890010001', 'Kos', 15, 3, 'Vita'],
      ['Gjithsej', '', '', 20, ''], ['111111', 'Qumësht', 12.1, '', 'Vita'], ['222222', 'Jogurt', 10.203, 'x', ''], [true, 'Bool', '5', 1, ''], ['333333', 'Ditë', '20.', '60+30', 'Vita'],
      ['444444', 'Sot', 46317, -1, ''], [], ['555555']] },
    { name: 'Dhjetor', rows: [['Barkodi', 'Emri', 'Skadon', 'Sasia'], ['3890010001', 'Kos', 15, 4], ['3890010009', 'Ëmbël', '1.', 1], ['3890010010', 'Total', 32, 1]] },
    { name: 'Fleta3', rows: [['Kodi', 'Artikulli', 'Data'], ['555555', 'Sapun', '2026-12-01'], ['666666', 'shuma', '01.01.27']] }
  ];
  const paKoke = [['3890010001', 'Kos i freskët', '12.11.2026', 4], ['3890010002', 'Djathë', 46300, 12], ['3890010003', 'Ujë', '1/12/26', 'x']];
  const ekzistuese = [{ id: 'e1', barkodi: '3890010002', emri: 'Djathë', data: '2026-10-05', statusi: 'aktiv' }, { id: 'e2', barkodi: '', emri: 'Ujë!', data: '2026-10-12' },
    { id: 'e3', barkodi: '555555', data: '2026-12-01', statusi: 'hequr' }, { id: 'e4', barkodi: 7, data: '' }];
  const hamendesimi = fletetI.map(sh => [true, false].map(k => A.hamendesoKolonatEAfateve(sh.rows, k))).concat([[A.hamendesoKolonatEAfateve(paKoke, false), A.hamendesoKolonatEAfateve(paKoke, true)]]);
  const planet = [
    { fletet: fletetI, meKoke: true, kol: A.hamendesoKolonatEAfateve(fletetI[0].rows, true) },
    { fletet: fletetI.slice(1), meKoke: true, kol: { barkodi: 0, emri: 1, data: 2, sasia: 3, furnizuesi: -1 } },
    { fletet: [{ name: 'CSV', rows: paKoke }], meKoke: false, kol: A.hamendesoKolonatEAfateve(paKoke, false) },
    { fletet: [{ name: 'Fleta', rows: paKoke }], meKoke: true, kol: { barkodi: 0, emri: -1, data: 2, sasia: -1, furnizuesi: 7 } }
  ].map(p => {
    const plan = A.planiImportitAfateve(p.fletet, { meKoke: p.meKoke, kol: p.kol, ekzistuese });
    const teReja = A.afatetNgaPlani(plan, { krijuarNga: 'besa' }).map(a => { const x = Object.assign({}, a); delete x.id; return x; });
    return Object.assign(p, { rreshta: plan.rreshta.map(r => [r.fleta, r.nr, r.barkodi, r.emri, r.data, r.dataOrigjinale, r.sasia, r.furnizuesi, r.gabim, r.veprimi]),
      numrat: [plan.teRinj, plan.ekzistojne, plan.gabime, plan.bashkuar], teReja });
  });
  const muajt = ['Nëntor', 'nentor2', 'NENTOR 2', 'Nëntor (2)', 'nov', 'no', 'Fleta1', 'shk', 'Sept', 'dhe', 'Dhjetor 2026', 'tetor', 'okt', 'janarr', '', null, 7]
    .map(t => [t, A.muajiNgaEmri(t)]);
  const qelizat = [[3890010001, null], [12.5, null], [-7, null], [1e21, null], ['  x ', null], [true, null], [null, null], [46300, null], [46300.6, null], [15, 11], [15, null],
    [32, 11], [12.1, null], [10.203, null], [12.1, 11], ['15', 11], ['15.', 11], ['15', null], ['31.02.2026', null], ['12 nëntor 26', null], ['', 11], [0, 2], [20000, null]]
    .map(([v, m]) => ({ v, m, tekst: A.tekstNgaQeliza(v), data: A.dataNgaQeliza(v, m) }));
  global.Date = DataE;

  const { chromium } = require(path.join(__dirname, 'pw.js'));
  const br = await chromium.launch();
  const pg = await br.newPage();
  await pg.addScriptTag({ content: fs.readFileSync(RR + '/xlsx.js', 'utf8') });
  for (const r of leximi) {
    r.rez = await pg.evaluate(async b64 => {
      const b = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return (await StokuXlsx.read(b)).map(sh => ({ name: sh.name, rows: sh.rows.map(r => r.map(v => typeof v === 'number' && !isFinite(v) ? 'NaN' : v)) }));
    }, r.b64);
  }
  await br.close();
  dalja.excel = JSON.parse(JSON.stringify({ build, workbook, leximi, barkodet, csv, dekodimi, TANI_I, hamendesimi, planet, muajt, qelizat }));
  fs.writeFileSync(sk, JSON.stringify(dalja));
  console.log('excel: ' + build.length + ' build, ' + workbook.length + ' workbook, ' + leximi.length + ' lexime, ' + barkodet.length + ' barkode, ' + planet.length + ' plane');
})().catch(e => { console.error(e); process.exit(1); });
