// v277: pronari zgjodhi "ideja 10 B": "Shto" me kornizë blu dhe ikonën e barkodit (këndet me tri vija, 19 px, sa ikonat poshtë);
// poshtë tij "Importo" (hap direkt importin e Excel-it) dhe "Eksporto" (menu: Excel, PDF, foto) pranë njëri-tjetrit. Njësoj te Android-i.
//  1) "Shto": teksti, korniza blu, ikona 19, pa sfond; Importo / Eksporto në një rresht nën "Shto", ikona 19, sipër tekstit;
//  2) "Shto" hap "Afat i ri"; "Importo" hap importin; "Eksporto" hap menynë me 3 opsionet;
//  3) versionet.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  for (const [tema, blu] of [['light', 'rgb(31, 95, 196)'], ['dark', 'rgb(122, 170, 242)']]) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(t => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', t);
    }, tema);
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:madhesia:v296', '1'); const o = JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}'); if (!o.madhesia) { o.madhesia = 'normale'; localStorage.setItem('stoku:opsione:v1', JSON.stringify(o)); } } catch (e) {} }); // v296: zoom 1 ("E madhe"), si kur u shkrua testi
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    await p.click('#btnAfatet'); await p.waitForTimeout(700);
    const bt = await p.evaluate(() => ['afShto', 'afImporto', 'afExcel'].map(id => { const e = document.getElementById(id), s = getComputedStyle(e), r = e.getBoundingClientRect(), v = e.querySelector('svg').getBoundingClientRect();
      return { id, tekst: e.textContent.trim(), bg: s.backgroundColor, hije: s.boxShadow, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), ik: Math.round(v.width), lart: v.bottom < r.top + r.height / 2 + 4 }; }));
    const [sh, im, ek] = bt;
    ok(sh.tekst === 'Shto' && im.tekst === 'Importo' && ek.tekst === 'Eksporto', tema + ' 1. tekstet Shto / Importo / Eksporto', bt.map(x => x.tekst));
    ok(bt.every(x => x.ik === 19 && x.bg === 'rgba(0, 0, 0, 0)'), tema + ' 1. ikonat 19 px, pa sfond', bt);
    ok(/inset/.test(sh.hije) && await p.evaluate(() => document.querySelectorAll('#afShto svg path').length === 2), tema + ' 1. "Shto" me kornizë (v278: jo më blu) dhe ikonën e barkodit', sh.hije);
    ok(im.y === ek.y && im.y >= sh.y + sh.h && Math.abs(im.w - ek.w) <= 1 && im.x < ek.x && Math.abs((im.x + ek.x + ek.w) - (sh.x * 2 + sh.w)) <= 2 && im.lart && ek.lart && sh.h >= 61,
      tema + ' 1. Importo dhe Eksporto pranë njëri-tjetrit nën "Shto", ikona sipër tekstit', bt);
    const sf = await p.evaluate(() => { const e = document.getElementById('afExcel'); return e.scrollWidth <= e.clientWidth; });
    ok(sf, tema + ' 1. "Eksporto" nxë pa u prerë');
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const m = await p.evaluate(() => Array.from(document.querySelectorAll('#afExcelMenu .sb-menu__item')).filter(x => x.offsetParent).map(x => x.textContent.trim()));
    ok(m.join() === 'Eksporto Excel,Eksporto PDF,Eksporto si foto', tema + ' 2. "Eksporto" hap menynë (pa importin)', m);
    await p.click('#afExcel'); await p.waitForTimeout(150);
    await p.click('#afImporto'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => !!document.querySelector('.mbulese.hapur #aiSkedari') || document.querySelector('#aiSkedari').closest('.mbulese').classList.contains('hapur')), tema + ' 2. "Importo" hap importin e Excel-it');
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (x.id !== 'dlgAfatet') x.classList.remove('hapur'); }));
    await p.click('#afShto'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur')), tema + ' 2. "Shto" hap "Afat i ri"');
    ok(!p.__gab.length, tema + ' pa gabime JS', p.__gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
