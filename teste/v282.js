// v282: pronari: "ora duhet mu kon prej stoku e jo prej telefonit ose galaxy watch. Oren e kosoves ... 24 oresh ... ta rregullon automatik
// kur tbohet ora verore". Koha e Stoku-t = Europe/Belgrade (ora e Kosovës), edhe kur pajisja ka zonë tjetër.
//  1) StokuAfatet: oraKs/sot/ditetDeri në dimër (+1) dhe verë (+2), pajisja me zonë tjetër (UTC, New York, Tokio);
//  2) Grupi (ekipa.js): kohaRelative / titulliDites / statistikat (hequr sot) sipas Kosovës;
//  3) Aktiviteti i telefonit tregon 07:25 për një heqje më 06:25 UTC (dimër), me pajisje në UTC; PC: kohaRelative njësoj;
//  4) versionet.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const DIMER = Date.UTC(2026, 10, 9, 6, 25), VERE = Date.UTC(2026, 6, 9, 6, 25), NATE = Date.UTC(2026, 10, 9, 23, 30);
(async () => {
  const b = await chromium.launch();
  for (const tz of ['UTC', 'America/New_York', 'Asia/Tokyo']) {
    const ctx = await b.newContext({ timezoneId: tz, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 } });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(1500);
    const r = await p.evaluate(([D, V, N]) => {
      const A = window.StokuAfatet, E = window.StokuEkipa;
      return { dimer: A.oraKs(D), vere: A.oraKs(V), sotNate: A.sot(N), ditet: A.ditetDeri('2026-11-10', N), zona: A.zona(),
        rel: E.kohaRelative(D, D + 2 * 3600000), titulli: E.titulliDites(N - 60000, N + 60000),
        hequrSot: E.statistikat([{ uid: 'u', emri: 'u', afatet: [{ id: 'x', data: '2026-11-01', statusi: 'hequr', hequrSe: N }] }], N + 3600000).hequrSot };
    }, [DIMER, VERE, NATE]);
    ok(r.dimer === '07:25' && r.vere === '08:25' && r.zona === 'Europe/Belgrade', tz + ' 1. ora e Kosovës: 07:25 në dimër, 08:25 në verë', r);
    ok(r.sotNate === '2026-11-10' && r.ditet === 0, tz + ' 1. 23:30 UTC = 00:30 në Kosovë: "sot" është 10.11 (afati i 10.11 skadon sot)', r);
    ok(r.rel === 'sot 07:25' && r.titulli === 'Sot' && r.hequrSot === 1, tz + ' 2. Grupi: "sot 07:25", ditët dhe "hequr sot" sipas Kosovës', r);
    ok(!p.__gab.length, tz + ' pa gabime JS', p.__gab);
    await ctx.close();
  }
  // 3) Aktiviteti i telefonit me pajisje në UTC
  {
    const ctx = await b.newContext({ timezoneId: 'UTC', serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 } });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(1200);
    const r = await p.evaluate(D => ({ ora: (function () { const d = window.StokuAfatet.dataKs(D); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); })() }), DIMER);
    ok(r.ora === '07:25', '3. pajisja në UTC: heqja e 06:25 UTC del 07:25', r);
    await ctx.close();
    const c2 = await b.newContext({ timezoneId: 'UTC', serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
    await c2.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    const q = await c2.newPage(); q.__gab = []; q.on('pageerror', e => q.__gab.push(e.message));
    await q.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await q.waitForTimeout(1500);
    ok(await q.evaluate(D => window.StokuAfatet.oraKs(D) === '07:25' && window.StokuAfatet.sot(D) === '2026-11-09', DIMER) && !q.__gab.length, '3. PC në UTC: ora e Kosovës, pa gabime', q.__gab);
    const sw = await q.evaluate(() => fetch('sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 282 && nr(/afatet\.js\?v=(\d+)/) >= 282 && nr(/ekipa\.js\?v=(\d+)/) >= 282 && nr(/app-tel\.js\?v=(\d+)/) >= 282 && nr(/app-pc\.js\?v=(\d+)/) >= 282 && nr(/xlsx\.js\?v=(\d+)/) >= 282 && nr(/porta\.js\?v=(\d+)/) >= 282, '4. versionet ≥ 282');
    ok(/\{ v: 282,[^\n]*platforma: 'tel'/.test(await q.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()))), '4. teRejat v282');
    await c2.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
