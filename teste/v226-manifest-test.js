// v226: manifesti me theme_color dhe background_color të errët (#0f1115): shiriti poshtë i Stoku-t të instaluar nga Chrome del i errët,
// Stoku mbetet i instalueshëm, shiriti sipër (meta theme-color) ndjek ende temën, SW i ri instalohet dhe hapet pa internet
const { chromium } = require('./pw.js');
const fs = require('fs');
const RR = require('path').resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const CACHE = /var CACHE = '([^']+)'/.exec(fs.readFileSync(RR + '/sw.js', 'utf8'))[1];
(async () => {
  const m = JSON.parse(fs.readFileSync(RR + '/manifest.webmanifest', 'utf8'));
  ok(m.theme_color === '#0f1115' && m.background_color === '#0f1115', 'manifesti: theme_color dhe background_color #0f1115', { theme_color: m.theme_color, background_color: m.background_color });
  ok(m.display === 'standalone' && m.icons.some(i => i.sizes === '512x512') && m.icons.some(i => i.sizes === '192x192'), 'manifesti: ikonat dhe standalone si më parë');
  for (const f of ['index.html', 'pc.html']) ok(fs.readFileSync(RR + '/' + f, 'utf8').includes('manifest.webmanifest?v=87'), f + ': manifest ?v=87');
  ok(fs.readFileSync(RR + '/sw.js', 'utf8').includes("'./manifest.webmanifest?v=87'"), 'sw.js: manifest ?v=87 te SHELL');
  const b = await chromium.launch();
  for (const [skema, tema, pritet] of [['dark', null, '#0f1115'], ['light', null, '#f6f5f2'], ['light', 'dark', '#0f1115'], ['dark', 'light', '#f6f5f2']]) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, colorScheme: skema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    if (tema) await ctx.addInitScript(t => { try { localStorage.setItem('stoku:tema', t); } catch (e) {} }, tema);
    const p = await ctx.newPage();
    const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/'); await p.waitForTimeout(1500);
    const meta = await p.getAttribute('#metaTema', 'content');
    ok(meta === pritet, 'telefoni ' + skema + (tema ? ', Stoku ' + tema : ', Stoku auto') + ': shiriti sipër (meta theme-color) ' + pritet, meta);
    if (!tema && skema === 'dark') {
      const cdp = await ctx.newCDPSession(p);
      const man = await cdp.send('Page.getAppManifest');
      ok(man.url.includes('manifest.webmanifest?v=87') && !(man.errors || []).length, 'Chrome e lexon manifestin e ri pa gabime', { url: man.url, errors: man.errors });
      const md = JSON.parse(man.data || '{}');
      ok(md.theme_color === '#0f1115' && md.background_color === '#0f1115', 'manifesti që e merr Chrome ka ngjyrat e errëta', { theme_color: md.theme_color, background_color: md.background_color });
      const reg = await p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise(x => setTimeout(() => x(null), 20000))]); return !!(r && r.active); });
      await p.reload(); await p.waitForTimeout(1500);
      const inst = await cdp.send('Page.getInstallabilityErrors');
      ok(reg && !inst.installabilityErrors.length, 'Stoku mbetet i instalueshëm (pa gabime instalimi)', inst.installabilityErrors);
      const c = await p.evaluate(async (n) => { const k = await caches.keys(); const c = await caches.open(n); return { k, ka: (await c.keys()).some(r => r.url.includes('manifest.webmanifest?v=87')) }; }, CACHE);
      ok(c.k.includes(CACHE) && c.ka, 'SW: cache ' + CACHE + ' me manifestin e ri', c.k);
      await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
      ok(await p.evaluate(() => !!document.body.innerText.trim()), 'hapet edhe pa internet');
      await ctx.setOffline(false);
    }
    ok(!gab.length, 'pa gabime në faqe', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '✖ ' + g + ' GABIME' : '✔ Krejt në rregull');
})();
