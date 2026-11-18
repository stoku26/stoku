// v331 (pronari, 18.11.2026: "Bone opsionin D amo quaje ballina"): PC: butoni "Ballina" mbi pllakat dhe faqja Ballina
//  (afatet, skadojnë së pari, grafiku i 6 muajve, malli, furnizuesit, grupi). Faqja e parë kur adresa është bosh; #/ballina.
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const FOLDERA = [{ id: 'pije', emri: 'Pije' }];
const PR = { 'pije::1': { kategoriaId: 'pije', barkodi: '1', emri: 'Ujë', sasia: 56, furnizuesi: 'Rugove', ndryshuarSe: t } };
const AFT = [
  { id: 'a1', emri: 'Qumësht Vita 1L', barkodi: '3890001', data: d(-1), sasia: 3, furnizuesi: 'Vita', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
  { id: 'a2', emri: 'Jogurt Abi', barkodi: '3890002', data: d(3), sasia: 5, furnizuesi: 'Abi', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
  { id: 'a3', emri: 'Lëng Frutti', barkodi: '3890003', data: d(60), sasia: 2, furnizuesi: 'Frutti', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }
];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([f, p, a]) => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    if (!sessionStorage.getItem('mbushur')) {
      sessionStorage.setItem('mbushur', '1');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify(f)); localStorage.setItem('stoku:produktet:v2', JSON.stringify(p)); localStorage.setItem('stoku:afatet:v1', JSON.stringify(a));
    }
  }, [FOLDERA, PR, AFT]);
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await p.waitForTimeout(2500);
  ok(/#\/ballina$/.test(p.url()), '1. adresa bosh → Ballina (#/ballina)', p.url());
  const gj = await p.evaluate(() => ({
    btn: document.getElementById('btnBallina').classList.contains('aktiv'),
    tekst: document.getElementById('btnBallina').textContent.trim(),
    rendi: document.getElementById('btnBallina').nextElementSibling === document.querySelector('.sbp-pllakat'),
    pllakaAktive: [...document.querySelectorAll('.sbp-pllake.aktiv')].length,
    duket: !document.getElementById('pamjaBallina').classList.contains('fsheh') && document.getElementById('pamjaTabela').classList.contains('fsheh') && document.getElementById('pamjaPermbledhja').classList.contains('fsheh'),
    kartat: [...document.querySelectorAll('#blPjeset .bl-karta h3')].map(x => x.textContent),
    numrat: [...document.querySelectorAll('#blPjeset .bl-hero-nr')].map(x => x.textContent).join('|'),
    skadojne: [...document.querySelectorAll('#blPjeset .bl-tabela tr')].slice(1).map(x => x.firstChild.textContent),
    titulli: document.title
  }));
  ok(gj.btn && /^Ballina/.test(gj.tekst) && gj.rendi && gj.pllakaAktive === 0, '1. butoni "Ballina" mbi pllakat, aktiv; asnjë pllakë aktive', gj);
  ok(gj.duket && gj.titulli.indexOf('Ballina') === 0, '1. faqja Ballina duket (titulli "Ballina")', gj.titulli);
  ok(['Afatet e 14 ditëve të ardhshme', 'Furnizuesit', 'Afatet në 6 muajt e ardhshëm'].every(x => gj.kartat.includes(x)), '2. kartat (v334): tabela e 14 ditëve, furnizuesit, grafiku', gj.kartat);
  ok(gj.numrat === '1Të skaduara|1Afër|3Gjithsej', '2. numrat e afateve', gj.numrat);
  ok(gj.skadojne[0] === 'Qumësht Vita 1L' && gj.skadojne[1] === 'Jogurt Abi' && gj.skadojne.length === 2, '2. tabela e 14 ditëve (pa Lëng Frutti, 60 ditë)', gj.skadojne);
  // Kartat hapin faqet
  await p.click('#btnAkordStoku'); await p.waitForTimeout(400);
  ok(/#\/malli$/.test(p.url()), '3. pllaka "Malli" → #/malli', p.url());
  ok(await p.evaluate(() => !document.getElementById('btnBallina').classList.contains('aktiv') && document.getElementById('btnAkordStoku').classList.contains('aktiv')), '3. te Malli: pllaka Malli aktive, Ballina jo');
  await p.click('#btnBallina'); await p.waitForTimeout(400);
  ok(/#\/ballina$/.test(p.url()), '3. butoni "Ballina" → #/ballina', p.url());
  await p.click('#blPjeset .bl-hero-nr'); await p.waitForTimeout(400);
  ok(/#\/afatet$/.test(p.url()), '3. numrat e afateve → #/afatet', p.url());
  await p.goBack(); await p.waitForTimeout(400);
  ok(/#\/ballina$/.test(p.url()) && await p.evaluate(() => !document.getElementById('pamjaBallina').classList.contains('fsheh')), '3. "Mbrapa" → Ballina', p.url());
  await p.evaluate(() => { location.hash = '#/permbledhja'; }); await p.waitForTimeout(400);
  ok(/#\/malli$/.test(p.url()), '4. lidhja e vjetër #/permbledhja → #/malli', p.url());
  await p.evaluate(() => { location.hash = '#/ekipa/anetaret'; }); await p.waitForTimeout(400);
  ok(/#\/grupi\/koleget$/.test(p.url()), '4. #/ekipa/anetaret → #/grupi/koleget', p.url());
  await p.goto('http://127.0.0.1:' + PORTI + '/pc.html#/ballina'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !document.getElementById('pamjaBallina').classList.contains('fsheh')), '4. #/ballina hapet direkt');
  // Tema e çelët: kartat kanë sfond (s'janë transparente)
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#blPjeset .bl-karta')).backgroundColor !== 'rgba(0, 0, 0, 0)'), '5. kartat me sfond');
  ok(!gab.length, 'pa gabime JS', gab);
  await ctx.close(); await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
