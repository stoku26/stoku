// v348 / Android Hyrja 106: kutitë e "Krijo llogari" si katror klasik (pamja 1) dhe mesazhi i ri i Kushteve
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const MESAZHI = "Për të vazhduar, duhet t'i lexoni dhe t'i pranoni Kushtet e përdorimit.";
(async () => {
  const pk = lx('vendas/app/src/main/java/site/stoku/vendas/ui/Porta.kt');
  // Hyrja 107: pa clip + border njëherësh (qoshet dilnin të prera)
  ok((pk.match(/size\(20\.dp\)\.then\(if \(v\) Modifier\.background\(n\.accent, RoundedCornerShape\(4\.dp\)\) else Modifier\.border\(2\.dp, n\.muted, RoundedCornerShape\(4\.dp\)\)\)/g) || []).length === 2, '1. Android: të dyja kutitë 20 dp, kënde 4 dp, vijë 2 dp (pa clip)');
  ok(pk.includes('"' + MESAZHI + '"') && lx('vendas/app/src/main/java/site/stoku/vendas/Llogaria.kt').includes('"' + MESAZHI + '"'), '2. Android: mesazhi i ri');
  ok(+/v: (\d+)/.exec(lx('versioni.js'))[1] >= 348 && /Hyrja\(106,/.test(lx('vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt')), '3. versionet');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(1500);
  await p.click('#pkTabKrijo'); await p.waitForTimeout(150);
  const d = await p.evaluate(() => ['pkKushtetLbl', 'pkMerchLbl'].map(id => { const t = document.querySelector('#' + id + ' .pk-tick'), s = getComputedStyle(t);
    return { w: t.getBoundingClientRect().width, h: t.getBoundingClientRect().height, r: s.borderRadius, bg: s.backgroundColor }; }));
  ok(d.every(x => x.w === 20 && x.h === 20 && x.r === '4px' && x.bg === 'rgba(0, 0, 0, 0)'), '4. web: të dyja kutitë 20 px, kënde 4 px, pa sfond', d);
  await p.fill('#pkEmri', 'besnik'); await p.fill('#pkFjalekalimi', 'sakte123'); await p.fill('#pkPerserit', 'sakte123');
  await p.click('#pkDergo'); await p.waitForTimeout(300);
  ok((await p.textContent('#pkGabim')) === MESAZHI, '5. web: mesazhi i ri', await p.textContent('#pkGabim'));
  ok(!gab.length, '6. pa gabime JS', gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
