// v274: pronari: "boma ideja 5 po ja pershtat edhe per white mode nese e ka dikush aktiv. edhe butonin per eksport si foto e len qaty ku
// po shkrun excel te afatet qe osht ner shto, dmth kur klikon ne at buton me pas opsionet me tjerat bashk".
//  1) menuja "Excel" te Afatet: Importo Excel, Eksporto Excel, Eksporto si foto;
//  2) dritarja: furnizuesit (renditur, "Pa furnizues" në fund) me sa afate dhe sa të skaduara; "Krijo foton" pa zgjedhje s'punon;
//  3) dy furnizues → dy foto JPG (1080 të gjera, aq më të gjata sa më shumë afate), pa të hequrat, ndahen me një prekje;
//  4) tema: e çelët / e errët sipas aplikacionit (ngjyra e sfondit të fotos);
//  5) pa "Shpërndaj" në shfletues: fotot shkarkohen;
//  6) pa lejen e eksportit: s'del opsioni;
//  7) versionet.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const L = require('../lejet.js');
const PORTI = process.env.PORTI || '8765';
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const sot = new Date(), dita = sot.getFullYear() + '-' + String(sot.getMonth() + 1).padStart(2, '0') + '-' + String(sot.getDate()).padStart(2, '0');

const AF = [];
const shto = (emri, f, n, s, st) => AF.push({ id: 'a' + AF.length, emri, barkodi: '38900100' + String(1000 + AF.length), data: d(n), sasia: s, furnizuesi: f,
  statusi: st || 'aktiv', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 });
[['Kos 500g', -2, 3], ['Ajran 250ml', -1, 8], ['Qumësht i freskët 1L', 0, 6], ['Djathë i bardhë 400g', 2, 2], ['Jogurt me dredhëz 150g', 4, 12],
  ['Ajkë qumështi 200g', 7, 5], ['Gjizë 250g', 13, 4], ['Mocarela 125g', 21, 6], ['Puding me çokollatë 4×100g me një emër shumë të gjatë që s\'nxë në një rresht', 26, 3],
  ['Gjalpë 250g', 38, 10], ['Qumësht pa laktozë 1L', 45, 4], ['Kaçkavall 300g', 66, 7]].forEach(([e, n, s]) => shto(e, 'Meridian Group', n, s));
shto('Kos i hequr', 'Meridian Group', -5, 1, 'hequr');
shto('Lëng portokalli 1L', 'Agro Fresh', 5, 6); shto('Ujë 0.5L', 'agro  fresh', 40, 24); shto('Çaj i ftohtë', 'Agro Fresh', -3, '');
shto('Bukë', '', 1, 2);

async function faqe(b, tema) {
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(([af, tema]) => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    localStorage.setItem('stoku:afatet:v1', JSON.stringify(af));
    if (tema) localStorage.setItem('stoku:tema', tema);
    // "Shpërndaj" i rremë: ruan skedarët
    window.__ndare = null;
    navigator.canShare = d => !!(d && d.files && d.files.length);
    navigator.share = async d => { window.__ndare = { title: d.title, files: d.files }; };
  }, [AF, tema]);
  const p = await ctx.newPage();
  p.__gab = [];
  p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
  return { p, ctx };
}
// Fotot e ndara: emri, lloji, përmasat dhe ngjyra e disa pikave (sfondi lart majtas, shiriti i rreshtit të parë)
const fotot = p => p.evaluate(async () => {
  const n = window.__ndare; if (!n) return null;
  const r = [];
  for (const f of n.files) {
    const u = URL.createObjectURL(f), im = new Image(); im.src = u; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const px = (a, b) => Array.from(x.getImageData(a, b, 1, 1).data.slice(0, 3));
    const b64 = c.toDataURL('image/jpeg', 0.9).split(',')[1];
    r.push({ emri: f.name, lloji: f.type, w: im.naturalWidth, h: im.naturalHeight, madh: f.size, sfondi: px(6, 6), b64 });
  }
  return { title: n.title, r };
});
const afer = (a, b, t) => a.every((v, i) => Math.abs(v - b[i]) <= (t || 6));

(async () => {
  const b = await chromium.launch();

  // ===== 1–4. E çelët =====
  {
    const { p, ctx } = await faqe(b, 'light');
    await p.click('#btnAfatet'); await p.waitForTimeout(800);
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const menu = await p.evaluate(() => Array.from(document.querySelectorAll('#afExcelMenu .sb-menu__item')).filter(x => x.offsetParent).map(x => x.textContent.trim()));
    ok(menu.join() === 'Importo Excel,Eksporto Excel,Eksporto PDF,Eksporto si foto', '1. menuja "Excel": Importo, Eksporto Excel, (v275: Eksporto PDF), Eksporto si foto', menu);
    await p.click('#afEksFoto'); await p.waitForTimeout(400);
    const dl = await p.evaluate(() => ({ hapur: document.getElementById('dlgAfEksFoto').classList.contains('hapur'), menu: document.getElementById('afExcelMenu').hidden,
      titulli: document.getElementById('aefTitulli').textContent, nen: document.getElementById('aefNen').textContent,
      rr: Array.from(document.querySelectorAll('#aefLista .ax-rresht')).map(r => r.innerText.replace(/\s+/g, ' ').trim()),
      krijo: document.getElementById('aefKrijo').textContent, pa: document.getElementById('aefKrijo').disabled, krejt: document.getElementById('aefKrejt').textContent }));
    ok(dl.hapur && dl.menu && dl.titulli === 'Eksporto si foto' && /Për secilin del një foto më vete/.test(dl.nen), '2. dritarja "Eksporto si foto" (menuja mbyllet)', dl);
    ok(dl.rr.join(' | ') === 'Agro Fresh 3 afate · 1 i skaduar | Meridian Group 12 afate · 2 të skaduara | Pa furnizues 1 afat', '2. furnizuesit me afatet aktive dhe të skaduarat, "Pa furnizues" në fund', dl.rr);
    ok(dl.pa && dl.krijo === 'Krijo foton' && dl.krejt === 'Të gjithë', '2. pa zgjedhje "Krijo foton" s\'punon', dl);
    await p.click('#aefLista .ax-rresht:nth-child(2)'); await p.click('#aefLista .ax-rresht:nth-child(1)'); await p.waitForTimeout(100);
    const k2 = await p.evaluate(() => ({ t: document.getElementById('aefKrijo').textContent, pa: document.getElementById('aefKrijo').disabled }));
    ok(k2.t === 'Krijo 2 foto' && !k2.pa, '2. dy të zgjedhur: "Krijo 2 foto"', k2);
    await p.click('#aefKrejt'); await p.waitForTimeout(100);
    const k3 = await p.evaluate(() => ({ t: document.getElementById('aefKrijo').textContent, k: document.getElementById('aefKrejt').textContent }));
    ok(k3.t === 'Krijo 3 foto' && k3.k === 'Asnjë', '2. "Të gjithë" → 3, butoni bëhet "Asnjë"', k3);
    await p.click('#aefKrejt'); await p.click('#aefLista .ax-rresht:nth-child(1)'); await p.click('#aefLista .ax-rresht:nth-child(2)');
    await p.click('#aefKrijo'); await p.waitForTimeout(1500);
    const f = await fotot(p);
    ok(f && f.r.length === 2 && f.title === 'Afatet', '3. dy foto, me një prekje te "Shpërndaj"', f && { n: f.r.length, t: f.title });
    const [ag, me] = f.r;
    ok(ag.emri === 'afatet_agro_fresh_' + dita + '.jpg' && me.emri === 'afatet_meridian_group_' + dita + '.jpg' && ag.lloji === 'image/jpeg', '3. emrat dhe lloji (JPG)', [ag.emri, me.emri, ag.lloji]);
    ok(ag.w === 1080 && me.w === 1080 && me.h > ag.h + 1500 && me.h > 3000, '3. 1080 të gjera, Meridian (12 afate) shumë më e gjatë se Agro (3)', { ag: [ag.w, ag.h], me: [me.w, me.h] });
    ok(afer(me.sfondi, [246, 245, 242]), '4. tema e çelët: sfondi #f6f5f2', me.sfondi);
    ok(!(await p.evaluate(() => document.getElementById('dlgAfEksFoto').classList.contains('hapur'))), '3. dritarja mbyllet');
    fs.writeFileSync(__dirname + '/v274-celet.jpg', Buffer.from(me.b64, 'base64'));
    fs.writeFileSync(__dirname + '/v274-agro.jpg', Buffer.from(ag.b64, 'base64'));
    // Një furnizues: zgjidhet vetë kur është i vetmi (këtu: kërkimi s'e ndryshon listën e fotos)
    ok(!p.__gab.length, '3. pa gabime JS', p.__gab);
    await ctx.close();
  }

  // ===== 4. E errët =====
  {
    const { p, ctx } = await faqe(b, 'dark');
    await p.click('#btnAfatet'); await p.waitForTimeout(800);
    await p.click('#afExcel'); await p.click('#afEksFoto'); await p.waitForTimeout(300);
    await p.click('#aefLista .ax-rresht:nth-child(2)'); await p.click('#aefKrijo'); await p.waitForTimeout(1500);
    const f = await fotot(p);
    ok(f && f.r.length === 1 && f.title === 'Afatet: Meridian Group' && afer(f.r[0].sfondi, [15, 17, 21]), '4. tema e errët: sfondi #0f1115', f && { t: f.title, s: f.r[0].sfondi });
    fs.writeFileSync(__dirname + '/v274-erret.jpg', Buffer.from(f.r[0].b64, 'base64'));
    ok(!p.__gab.length, '4. pa gabime JS', p.__gab);
    await ctx.close();
  }

  // ===== 5. Pa "Shpërndaj": shkarkim =====
  {
    const { p, ctx } = await faqe(b, 'light');
    await p.evaluate(() => { navigator.canShare = undefined; navigator.share = undefined; });
    await p.click('#btnAfatet'); await p.waitForTimeout(800);
    await p.click('#afExcel'); await p.click('#afEksFoto'); await p.waitForTimeout(300);
    await p.click('#aefLista .ax-rresht:nth-child(1)');
    const [sh] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('#aefKrijo')]);
    await p.waitForTimeout(500);
    ok(sh && sh.suggestedFilename() === 'afatet_agro_fresh_' + dita + '.jpg' && /Fotoja u shkarkua/.test(await p.textContent('#toast')), '5. pa "Shpërndaj": fotoja shkarkohet', sh && sh.suggestedFilename());
    await ctx.close();
  }
  await b.close();

  // ===== 6. Pa lejen e eksportit =====
  {
    const { b: b2, p } = await hapFaqen(chromium, { uid: 'uB', emri: 'besa', lejet: Object.assign(L.krejt(true), { eksportExcel: false }) });
    await p.waitForTimeout(500);
    const v = await p.evaluate(() => { const e = document.getElementById('afEksFoto'); return { ndaluar: e.classList.contains('leja-ndaluar'), display: getComputedStyle(e).display }; });
    ok(v.ndaluar && v.display === 'none', '6. pa lejen "eksportExcel": s\'del "Eksporto si foto"', v);
    const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 274 && nr(/app-tel\.js\?v=(\d+)/) >= 274 && nr(/teRejat\.js\?v=(\d+)/) >= 274, '7. CACHE, app-tel, teRejat ≥ 274');
    const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 274,[^\n]*platforma: 'tel'/.test(tr), '7. teRejat v274 (telefon)');
    await b2.close();
  }
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
