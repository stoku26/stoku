// v271: pronari (foto e Afateve në Android): "Heqja qat buton nalt anen e djatht qe o per sinkronizim edhe daten, leje sinkronizimin
// me u bo pas qdo ndryshimi automatik. Ne web app edhe android app nese o naj kun edhe npc heke."
//  1) telefoni: koka e Afateve pa muajin ("Tetor 2026") dhe pa ikonën e cloud-it; koka mbetet 44 e lartë (kartat 72 nga lart, si më parë);
//  2) telefoni: një ndryshim i afatit sinkronizohet vetë (pa asnjë prekje), statusi del te Cilësimet;
//  3) kompjuteri: pa "Sinkronizuar · ora" poshtë në anësore (as butoni "Sinkronizo tani" aty); karta e llogarisë me emrin dhe "Dil";
//  4) kompjuteri: sinkronizimi bëhet vetë, statusi te Cilësimet;
//  5) versionet dhe "Çka ka të re".
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const MUAJT = /Janar|Shkurt|Mars|Prill|Maj|Qershor|Korrik|Gusht|Shtator|Tetor|Nëntor|Dhjetor/;

async function faqe(b, pc) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(([af, t]) => {
    window.__nrSink = 0;
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }),
      bashkoDheRuaj: async fn => { window.__nrSink++; return { ok: true, gjendja: fn(null) }; },
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'f1::111': { barkodi: '111', emri: 'Bukë', sasia: 4, kategoriaId: 'f1', prekurSe: t } }));
    localStorage.setItem('stoku:afatet:v1', JSON.stringify(af));
  }, [[{ id: 'a1', emri: 'Kos', barkodi: '3800001', data: d(3), sasia: 3, statusi: 'aktiv', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 }], t]);
  const p = await ctx.newPage();
  p.__gab = [];
  p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
  await p.waitForTimeout(2500);
  return { p, ctx };
}
const rr = (p, sel) => p.evaluate(sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, duket: r.width > 0 && r.height > 0 && s.visibility !== 'hidden' };
}, sel);

(async () => {
  const b = await chromium.launch();

  // ===== 1–2. Telefoni =====
  {
    const { p, ctx } = await faqe(b, false);
    await p.click('#btnAfatet'); await p.waitForTimeout(800);
    const koka = await p.evaluate(() => ({ sink: !!document.getElementById('afSinkStatus') || !!document.querySelector('.af-sink'),
      muaji: !!document.getElementById('afMuaji') || !!document.querySelector('.sb-muaji'),
      tekst: document.querySelector('#dlgAfatet .opsione-krye').innerText.replace(/\s+/g, ' ').trim(),
      butona: Array.from(document.querySelectorAll('#dlgAfatet .opsione-krye button')).filter(x => x.offsetParent).length }));
    ok(!koka.sink && !koka.muaji && koka.butona === 0, '1. Afatet: pa ikonën e cloud-it dhe pa muajin lart', koka);
    ok(koka.tekst === 'Afatet' && !MUAJT.test(koka.tekst), '1. koka: vetëm "Afatet" (pa "Tetor 2026")', koka.tekst);
    const at = await rr(p, '#afTitulli'), fo = await rr(p, '#afFotografo'), kk = await rr(p, '#dlgAfatet .opsione-krye');
    ok(at.fs === '26px' && fo.y === 72 && kk.h === 56, '1. koka 12 + 44 (kartat 72 nga lart, si më parë)', { at, fo, kk });

    const n0 = await p.evaluate(() => window.__nrSink);
    ok(n0 >= 1, '2. sinkronizimi i parë bëhet vetë pas hyrjes', n0);
    await p.click('#afLista .af-karta[data-id="a1"]'); await p.waitForTimeout(400);
    await p.fill('#afatSasia', '7');
    await p.click('#afatRuaj'); await p.waitForTimeout(1500); // afatet dërgohen 300 ms pas ndryshimit (ruajAfatet)
    const n1 = await p.evaluate(() => window.__nrSink), st = await p.textContent('#cloudStatusi');
    ok(n1 > n0 && /U sinkronizua \d\d:\d\d\./.test(st), '2. ndryshimi u sinkronizua vetë (pa asnjë prekje), statusi te Cilësimet', { n0, n1, st });
    ok(!p.__gab.length, '2. telefoni: pa gabime JS', p.__gab);
    await ctx.close();
  }

  // ===== 3–4. Kompjuteri =====
  {
    const { p, ctx } = await faqe(b, true);
    const an = await p.evaluate(() => ({ sink: !!document.getElementById('sinkStatus') || !!document.getElementById('sinkTekst') || !!document.querySelector('.sink-status'),
      tekst: document.querySelector('.sbp-account').innerText.replace(/\s+/g, ' ').trim() }));
    ok(!an.sink && !/Sinkronizuar|Sinkronizo|Vetëm në këtë kompjuter|Pa lidhje/.test(an.tekst), '3. anësorja: pa statusin e sinkronizimit poshtë', an);
    ok(/^A agim$/.test(an.tekst), '3. karta e llogarisë: vetëm shkronja e avatarit dhe emri (plus ikona "Dil")', an.tekst);
    const kartaL = await rr(p, '.sbp-account'), dil = await rr(p, '#sbpDil'), us = await rr(p, '#btnLlogaria');
    ok(dil.duket && Math.abs((dil.y + dil.h / 2) - (us.y + us.h / 2)) <= 1 && kartaL.h <= us.h + 18, '3. "Dil" në të njëjtin rresht me emrin, karta pa rresht të dytë', { kartaL, dil, us });
    const n = await p.evaluate(() => window.__nrSink), sub = await p.textContent('#opsNavSub');
    ok(n >= 1 && /^Sinkronizuar · \d\d:\d\d$/.test(sub), '4. kompjuteri sinkronizohet vetë, statusi te Cilësimet', { n, sub });
    await p.screenshot({ path: __dirname + '/v271-pc.png', clip: { x: 0, y: 600, width: 300, height: 300 } });
    ok(!p.__gab.length, '4. kompjuteri: pa gabime JS', p.__gab);
    await ctx.close();
  }

  // ===== 5. Versionet =====
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + PORTI + '/404.html');
    const sw = await p.evaluate(() => fetch('/sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 271 && nr(/app-tel\.js\?v=(\d+)/) >= 271 && nr(/app-pc\.js\?v=(\d+)/) >= 257 && nr(/stoku\.css\?v=(\d+)/) >= 56 && nr(/stoku-pc\.css\?v=(\d+)/) >= 40,
      '5. CACHE ≥ 271, app-tel ≥ 271, app-pc ≥ 257, stoku.css ≥ 56, stoku-pc.css ≥ 40');
    const tr = await p.evaluate(() => fetch('/teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 271,[^\n]*platforma: 'tel'/.test(tr) && /\{ v: 271,[^\n]*platforma: 'pc'/.test(tr), '5. teRejat v271 (telefon + kompjuter)');
    await ctx.close();
  }

  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
