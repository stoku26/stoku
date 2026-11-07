// v279: pronari: dritarja "Eksporto si foto" "shum keq u doka" → "ideja 5": "Të gjithë" pranë titullit, kërkimi i furnizuesit
// (kur janë 6 e më shumë), lart "Me afate të skaduara" e poshtë "Të tjerët" (karta me rreshta: kutia, emri, sa afate), butoni poshtë.
//  1) grupet dhe renditja; 2) kërkimi filtron pa i humbur të zgjedhurit; 3) kutia e qartë në temën e errët; 4) versionet;
//  5) importi: fleta e jep muajin vetëm me emrin e saktë ("Nëntor"), jo "Nëntor2" / "nov" (pronari: "kerkush si emerton mujt qeshtu").
const { chromium } = require('./pw.js');
const A = require('../afatet.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const AF = []; const shto = (e, f, n) => AF.push({ id: 'a' + AF.length, emri: e, barkodi: '38900100' + (1000 + AF.length), data: d(n), sasia: 3, furnizuesi: f, statusi: 'aktiv', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 });
[['Abi Drink', 1, 0], ['Albi', 4, 0], ['Albulena Impex', 2, 0], ['Argo Group', 3, 1], ['Devolli', 2, 0], ['Laberion', 3, 2], ['Meridian', 2, 0]]
  .forEach(([f, n, sk]) => { for (let i = 0; i < n; i++) shto('P' + i, f, i < sk ? -2 : 5 + i); });
(async () => {
  const b = await chromium.launch();
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(([af, tema]) => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
      localStorage.setItem('stoku:afatet:v1', JSON.stringify(af)); localStorage.setItem('stoku:tema', tema);
    }, [AF, tema]);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    await p.click('#btnAfatet'); await p.waitForTimeout(700);
    await p.click('#afExcel'); await p.click('#afEksFoto'); await p.waitForTimeout(400);
    const gr = () => p.evaluate(() => Array.from(document.querySelectorAll('#aefLista .aef-etiketa')).map(e => e.textContent + ': ' +
      Array.from(e.nextElementSibling.querySelectorAll('.ax-rresht')).map(r => r.querySelector('.aef-m').textContent + ' (' + r.querySelector('.aef-n').textContent + ')').join(', ')));
    const g1 = await gr();
    ok(g1.join(' | ') === 'Me afate të skaduara: Argo Group (3 afate), Laberion (3 afate) | Të tjerët: Abi Drink (1 afat), Albi (4 afate), Albulena Impex (2 afate), Devolli (2 afate), Meridian (2 afate)', tema + ' 1. lart me afate të skaduara, poshtë të tjerët', g1);
    const k = await p.evaluate(() => { const h = document.getElementById('aefTitulli').getBoundingClientRect(), x = document.getElementById('aefKrejt').getBoundingClientRect(), kr = document.getElementById('aefKrijo').getBoundingClientRect(), l = document.getElementById('aefLista').getBoundingClientRect();
      return { pranë: Math.abs((h.top + h.bottom) / 2 - (x.top + x.bottom) / 2) < 8 && x.left > h.right, kerko: !document.getElementById('aefKerkoKuti').hidden, poshte: kr.top >= l.bottom, nen: document.getElementById('aefNen').textContent }; });
    ok(k.pranë && k.kerko && k.poshte && k.nen === 'Një foto për secilin furnizues.', tema + ' 1. "Të gjithë" pranë titullit, kërkimi, butoni poshtë listës', k);
    await p.click('#aefLista .ax-rresht >> nth=0'); await p.click('#aefLista .ax-rresht >> nth=3');
    await p.fill('#aefKerko', 'ALB'); await p.waitForTimeout(150);
    const g2 = await gr(), t2 = await p.textContent('#aefKrijoT');
    ok(g2.join(' | ') === 'Furnizuesit: Albi (4 afate), Albulena Impex (2 afate)' && t2 === 'Krijo 2 foto', tema + ' 2. kërkimi "ALB" filtron, të zgjedhurit mbesin (2)', { g2, t2 });
    const ch = await p.evaluate(() => Array.from(document.querySelectorAll('#aefLista input')).map(i => i.checked));
    ok(ch.join() === 'true,false', tema + ' 2. "Albi" mbetet i zgjedhur pas kërkimit', ch);
    await p.fill('#aefKerko', 'zzz'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => (document.querySelector('#aefLista .aef-bosh') || {}).textContent === 'S\'u gjet asnjë furnizues.'), tema + ' 2. pa rezultat: "S\'u gjet asnjë furnizues."');
    await p.fill('#aefKerko', ''); await p.waitForTimeout(150);
    const kt = await p.evaluate(() => { const [a, b] = document.querySelectorAll('#aefLista input'), s = getComputedStyle(b), s2 = getComputedStyle(a); return { kufi: s.boxShadow, bgZ: s2.backgroundColor, w: Math.round(b.getBoundingClientRect().width) }; });
    ok(kt.w === 24 && /inset/.test(kt.kufi) && kt.bgZ !== 'rgba(0, 0, 0, 0)' && (tema === 'light' || /rgb\(133, 138, 148\)|rgb\(1[0-9]{2}, 1[0-9]{2}, 1[0-9]{2}\)/.test(kt.kufi)), tema + ' 3. kutia 24 px me vijë të qartë, e zgjedhura blu', kt);
    ok(!p.__gab.length, tema + ' pa gabime JS', p.__gab);
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 279 && nr(/app-tel\.js\?v=(\d+)/) >= 279 && nr(/teRejat\.js\?v=(\d+)/) >= 279, '4. CACHE ≥ 279, app-tel ≥ 279, teRejat ≥ 279');
      ok(/\{ v: 279,[^\n]*platforma: 'tel'/.test(await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()))), '4. teRejat v279');
    }
    await ctx.close();
  }
  const mm = ['Nëntor', 'nentor', ' DHJETOR ', 'janar', 'Nëntor2', 'NENTOR 2', 'Nëntor (2)', 'nov', 'November', 'Dhjetor 2026', 'Fleta1', ''].map(A.muajiNgaEmri);
  ok(mm.join() === '11,11,12,1,,,,,,,,', '5. muaji vetëm nga emri i saktë i fletës', mm);
  const html = require('fs').readFileSync(__dirname + '/../index.html', 'utf8') + require('fs').readFileSync(__dirname + '/../pc.html', 'utf8');
  ok(!/Nëntor2/.test(html) && /Fletët me emrin e muajit \(Nëntor, Dhjetor…\)/.test(html), '5. teksti i importit pa "Nëntor2" (telefoni + PC)');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
