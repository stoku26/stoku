// v238: vetëm logoja (jo hapësira anash) rifreskon faqen dhe sinkronizon (PC, telefon); "Përmbledhja" s'del më te logoja
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
(async () => {
  const b = await chromium.launch();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  for (const pc of [true, false]) {
    const em = pc ? 'PC' : 'tel';
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: !pc });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    const kut = await p.evaluate(() => { const l = document.getElementById('logoButon').getBoundingClientRect(), c = document.getElementById(document.getElementById('logo') ? 'logo' : 'logoSlika').getBoundingClientRect();
      return { l: [l.left, l.top, l.width, l.height], c: [c.left, c.top, c.width, c.height], titulli: document.getElementById('logoButon').title, ktj: (document.getElementById('logo') || {}).title || '' }; });
    ok(kut.titulli === 'Rifresko dhe sinkronizo' && !/Përmbledhja/.test(kut.ktj), em + ': logoja: "Rifresko dhe sinkronizo", jo "Përmbledhja"', kut);
    // klikimi djathtas logos (hapësira bosh) s'bën asgjë
    const x0 = kut.l[0] + kut.l[2] + 25, y0 = kut.l[1] + kut.l[3] / 2;
    await p.evaluate(() => { window.__para = 1; });
    const kursori = await p.evaluate(([x, y]) => getComputedStyle(document.elementFromPoint(x, y)).cursor, [x0, y0]);
    await p.mouse.click(x0, y0); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => window.__para === 1) && kursori !== 'pointer', em + ': hapësira djathtas logos: pa dorë, s\'rifreskon', kursori);
    // klikimi i logos: sinkronizon (shkrim te cloud-i) dhe rifreskon
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'); a.push({ id: 'z1', emri: 'Para rifreskimit', barkodi: '', data: '2027-01-01', statusi: 'aktiv', ndryshuarSe: Date.now() }); localStorage.setItem('stoku:afatet:v1', JSON.stringify(a)); });
    const shkrimePara = F.S.shkrime.length;
    await Promise.all([p.waitForNavigation({ timeout: 12000 }).catch(() => null), p.click('#logoButon')]);
    await p.waitForTimeout(2500);
    ok(await p.evaluate(() => window.__para === undefined), em + ': klikimi i logos e rifreskon faqen');
    ok(F.S.shkrime.length > shkrimePara, em + ': ... dhe sinkronizon me cloud-in', F.S.shkrime.length - shkrimePara);
    ok(!gab.length, em + ': pa gabime JavaScript', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
