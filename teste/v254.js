// v254: te "Afat i ri" (telefoni) s'ka më datat e shpejta (1 javë, 2 javë, 1 muaj, 3 muaj).
//  A) dritarja s'ka #afatDatat / .sb-date, as tekstet "1 javë" … "3 muaj";
//  B) data shkruhet te fusha, "Skadon për N ditë" del poshtë saj dhe afati ruhet;
//  C) afati ekzistues hapet me datën e tij dhe tekstin e ditëve (pa datat e shpejta);
//  D) CSS-i s'ka më rregullat .sb-date / .sb-dates; kompjuteri s'preket.
const { chromium } = require('./pw.js');
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => { const x = new Date(t + n * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const fusha = iso => iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(2, 4);

async function faqe(b, pc, af) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(([af, t]) => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    if (!sessionStorage.getItem('__v254')) { localStorage.setItem('stoku:afatet:v1', JSON.stringify(af || [])); sessionStorage.setItem('__v254', '1'); }
  }, [af, t]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
  await p.waitForTimeout(2000);
  return { p, ctx };
}

(async () => {
  const b = await chromium.launch();
  {
    const af = [{ id: 'a1', barkodi: '3890000000011', emri: 'Kos 500g', data: d(20), sasia: 3, statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }];
    const { p, ctx } = await faqe(b, false, af);
    await p.click('#btnAfatet'); await p.waitForTimeout(300);
    await p.click('#afShto'); await p.waitForTimeout(400);
    ok(await p.isVisible('#dlgAfat'), 'A: "Afat i ri" hapet');
    ok(await p.$('#afatDatat') === null, 'A: s\'ka #afatDatat');
    ok(await p.$$eval('#dlgAfat .sb-date, #dlgAfat .sb-dates', x => x.length) === 0, 'A: s\'ka asnjë .sb-date');
    const tekst = await p.textContent('#dlgAfat');
    ok(!/1 javë|2 javë|1 muaj|3 muaj/.test(tekst), 'A: s\'ka tekstet e datave të shpejta');
    ok(await p.isVisible('#afatData'), 'A: fusha e datës (DD-MM-VV) mbetet');
    ok((await p.textContent('#afatDataHint')).trim() === '', 'A: pa datë, s\'ka tekst poshtë fushës');

    // B) data me dorë
    await p.fill('#afatEmri', 'Qumësht 1L');
    await p.fill('#afatData', fusha(d(10))); await p.dispatchEvent('#afatData', 'input'); await p.waitForTimeout(150);
    ok(/Skadon për 10 ditë/.test(await p.textContent('#afatDataHint')), 'B: "Skadon për 10 ditë."', await p.textContent('#afatDataHint'));
    await p.click('#afatRuaj'); await p.waitForTimeout(500);
    const ruajtur = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')));
    const ri = ruajtur.find(a => a.emri === 'Qumësht 1L');
    ok(ri && ri.data === d(10), 'B: afati u ruajt me datën e shkruar', ri && ri.data);
    ok(!(await p.isVisible('#dlgAfat')), 'B: dritarja mbyllet pas ruajtjes');

    // C) afati ekzistues
    await p.click('#afLista .af-karta[data-id="a1"]'); await p.waitForTimeout(400);
    ok(await p.inputValue('#afatData') === fusha(d(20)), 'C: afati ekzistues hapet me datën e tij', await p.inputValue('#afatData'));
    ok(/Skadon për 20 ditë/.test(await p.textContent('#afatDataHint')), 'C: teksti i ditëve del menjëherë', await p.textContent('#afatDataHint'));
    ok(await p.$('#afatDatat') === null, 'C: as këtu s\'ka datat e shpejta');
    await ctx.close();
  }
  {
    const TR = require(__dirname + '/../teRejat.js');
    const tel = TR.teRejatPas(253, 'tel', false, () => true).map(h => h.titulli), pc = TR.teRejatPas(253, 'pc', false, () => true).map(h => h.titulli);
    ok(tel.includes('Afat i ri më i thjeshtë') && !pc.includes('Afat i ri më i thjeshtë'), 'D: "Çka ka të re": telefoni e sheh, kompjuteri jo', { tel, pc });
    const css = fs.readFileSync(__dirname + '/../css/stoku.css', 'utf8');
    ok(!/\.sb-dates?\b/.test(css), 'D: css/stoku.css s\'ka më .sb-date / .sb-dates');
    const { p, ctx } = await faqe(b, true, []);
    ok(await p.$('#afatDatat') === null && await p.$$eval('.sb-date', x => x.length) === 0, 'D: kompjuteri pa datat e shpejta (si më parë)');
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
