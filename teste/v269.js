// v269: "Të fshihen të gjitha?" njësoj si te Android-i (Konfirmo): dritare në mes, titulli, teksti (pa shënimin për Excel),
// "Anulo" me vijë dhe "Fshi të gjitha (5)" e kuqe që aktivizohet pas 5 sekondash. Titulli i folderit vetëm emri, pa numrin e produkteve.
// Fushat (opsioni 3 i përdoruesit): "Barkodi" + butoni 🔍 50 × 50; "Kërko" del vetëm kur e prek (ose kur ka tekst), prekja tjetër e mbyll dhe e pastron.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };

const shto = (p, n) => p.evaluate(n => {
  const t = Date.now(), pm = JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}');
  for (let i = 0; i < n; i++) { const bk = '38900000000' + (10 + i); pm['pije::' + bk] = { kategoriaId: 'pije', barkodi: bk, emri: 'Prova ' + i, sasia: 3, prekurSe: t - i }; }
  localStorage.setItem('stoku:produktet:v2', JSON.stringify(pm));
}, n);
const dritarja = p => p.evaluate(() => {
  const m = document.getElementById('dlgFshirje'), d = m.querySelector('.dialog'), r = d.getBoundingClientRect(), s = getComputedStyle(d);
  const a = document.getElementById('fshiAnulo'), f = document.getElementById('fshiKonfirmo'), ra = a.getBoundingClientRect(), rf = f.getBoundingClientRect();
  const c = x => { const e = document.createElement('div'); e.style.color = getComputedStyle(document.documentElement).getPropertyValue(x); document.body.appendChild(e); const v = getComputedStyle(e).color; e.remove(); return v; };
  return { hapur: m.classList.contains('hapur'), x: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), qendra: Math.round(r.top + r.height / 2), rrezja: s.borderTopLeftRadius,
    doreza: getComputedStyle(d, '::before').display, titulli: document.getElementById('fshiTitulli').textContent, tfs: getComputedStyle(document.getElementById('fshiTitulli')).fontSize,
    teksti: document.getElementById('fshiTekst').textContent, xfs: getComputedStyle(document.getElementById('fshiTekst')).fontSize,
    anulo: { t: a.textContent, w: Math.round(ra.width), h: Math.round(ra.height), kl: a.className }, fshi: { t: f.textContent, w: Math.round(rf.width), h: Math.round(rf.height), d: f.disabled,
      pritet: f.scrollWidth > f.clientWidth + 1, bg: getComputedStyle(f).backgroundColor, exp: c('--sb-exp'), c: getComputedStyle(f).color }, njeRresht: Math.round(ra.top) === Math.round(rf.top) };
});

(async () => {
  for (const tema of ['light', 'dark']) {
    const { b, p } = await hapFaqen(chromium);
    await shto(p, tema === 'light' ? 6 : 1);
    await p.evaluate(t => localStorage.setItem('stoku:tema', t), tema);
    await p.reload(); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
    const tit = await p.textContent('#titulli');
    ok(tit === 'Pije', tema + ' 1. titulli i folderit vetëm emri (pa "(N produkte)")', tit);

    // Fushat: Barkodi + 🔍; "Kërko" e mbyllur
    const fushat = () => p.evaluate(() => {
      const r = id => { const e = document.getElementById(id), b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), duket: !!e.offsetParent }; };
      const k = document.getElementById('btnKerko');
      return { barkodi: r('barkodiMbeshtjellje'), btn: r('btnKerko'), a: k.getAttribute('aria-label'), exp: k.getAttribute('aria-expanded'), aktiv: k.classList.contains('aktiv'),
        kerko: r('kerkoFushe'), vlera: document.getElementById('kerko').value, fokus: document.activeElement && document.activeElement.id, lista: r('listaKrye'), n: document.querySelectorAll('#lista .artikull').length };
    });
    let fu = await fushat();
    ok(fu.barkodi.y === 68 && fu.barkodi.h === 50 && fu.barkodi.w === 290 && fu.btn.x === 320 && fu.btn.y === 68 && fu.btn.w === 50 && fu.btn.h === 50 && fu.a === 'Kërko',
      tema + ' 1b. "Barkodi" dhe butoni 🔍 50 × 50 në një rresht (10 ndërmjet)', fu);
    ok(!fu.kerko.duket && fu.exp === 'false' && !fu.aktiv && fu.lista.y === 128, tema + ' 1b. "Kërko" e mbyllur, "Produktet" menjëherë poshtë (10)', fu);
    await p.click('#btnKerko'); await p.waitForTimeout(250);
    fu = await fushat();
    ok(fu.kerko.duket && fu.kerko.y === 128 && fu.kerko.h === 50 && fu.exp === 'true' && fu.aktiv && fu.fokus === 'kerko' && fu.lista.y === 188, tema + ' 1c. prekja e 🔍: "Kërko" del poshtë barkodit, me kursorin brenda', fu);
    await p.keyboard.type('Prova 0'); await p.waitForTimeout(250);
    fu = await fushat();
    ok(fu.n === 1, tema + ' 1c. kërkimi filtron listën', fu.n);
    await p.click('#btnKerko'); await p.waitForTimeout(250);
    fu = await fushat();
    ok(!fu.kerko.duket && fu.vlera === '' && fu.n === (tema === 'light' ? 6 : 1) && !fu.aktiv, tema + ' 1d. prekja e dytë e mbyll, e pastron dhe kthen krejt listën', fu);
    await p.evaluate(() => { const k = document.getElementById('kerko'); k.value = '3890000000010'; k.dispatchEvent(new Event('input')); });
    await p.waitForTimeout(250);
    fu = await fushat();
    ok(fu.kerko.duket && fu.aktiv && fu.n === 1, tema + ' 1e. kur kërkimi ka tekst (p.sh. nga skanimi), fusha del vetë', fu);
    await p.click('#btnKerko'); await p.waitForTimeout(250);

    await p.click('#btnFshiTeGjitha'); await p.waitForTimeout(400);
    let d = await dritarja(p);
    ok(d.hapur && d.qendra >= 380 && d.qendra <= 464 && d.x === 46 && d.r === 344 && d.rrezja === '24px' && d.doreza === 'none',
      tema + ' 2. dritare në mes të ekranit (46 nga anët, rrezja 24, pa shiritin gri lart)', d);
    const pritur = tema === 'light' ? 'Do të fshihen të gjitha 6 produktet nga folderi "Pije". Ky veprim NUK mund të kthehet.' : 'Do të fshihet 1 produkt nga folderi "Pije". Ky veprim NUK mund të kthehet.';
    ok(d.titulli === 'Të fshihen të gjitha?' && d.tfs === '20px' && d.teksti === pritur && d.xfs === '15px' && !/Excel/.test(d.teksti), tema + ' 2. titulli 20, teksti 15 si te Android-i (pa shënimin për Excel)', d);
    ok(d.njeRresht && d.anulo.t === 'Anulo' && /dyte/.test(d.anulo.kl) && d.anulo.h === 48 && d.fshi.h === 48 && d.fshi.w > d.anulo.w, tema + ' 3. "Anulo" me vijë majtas, "Fshi të gjitha" më e gjerë djathtas, 48 të larta', d);
    ok(d.fshi.d && d.fshi.t === 'Fshi të gjitha (5)' && !d.fshi.pritet, tema + ' 3. "Fshi të gjitha (5)" joaktiv dhe s\'pritet', d.fshi);
    await p.waitForTimeout(5200);
    d = await dritarja(p);
    ok(!d.fshi.d && d.fshi.t === 'Fshi të gjitha' && d.fshi.bg === d.fshi.exp && d.fshi.c === 'rgb(255, 255, 255)', tema + ' 4. pas 5 sekondash: aktiv, i kuq me shkronja të bardha', d.fshi);
    if (tema === 'light') {
      await p.click('#fshiAnulo'); await p.waitForTimeout(300);
      ok(await p.evaluate(() => !document.getElementById('dlgFshirje').classList.contains('hapur') && document.querySelectorAll('#lista .artikull').length === 6), '5. "Anulo" mbyll dhe s\'fshin');
      await p.click('#btnFshiTeGjitha'); await p.waitForTimeout(5600);
    }
    await p.click('#fshiKonfirmo'); await p.waitForTimeout(500);
    const pas = await p.evaluate(() => ({ hapur: document.getElementById('dlgFshirje').classList.contains('hapur'), n: document.querySelectorAll('#lista .artikull').length, t: document.getElementById('titulli').textContent, d: document.getElementById('btnFshiTeGjitha').disabled }));
    ok(!pas.hapur && pas.n === 0 && pas.t === 'Pije' && pas.d, tema + ' 5. "Fshi të gjitha" i fshin, titulli mbetet "Pije", lidhja bëhet gri', pas);
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 269 && nr(/app-tel\.js\?v=(\d+)/) >= 269 && nr(/teRejat\.js\?v=(\d+)/) >= 269 && nr(/stoku\.css\?v=(\d+)/) >= 55, '6. CACHE, app-tel.js, teRejat.js ≥ 269, stoku.css ≥ 55');
      const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
      ok(/\{ v: 269,[^\n]*platforma: 'tel'/.test(tr), '6. teRejat v269 (telefon)');
    }
    ok(!p.__gab.length, tema + ' 7. pa gabime JS', p.__gab);
    await b.close();
  }
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
