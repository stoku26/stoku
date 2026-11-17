// v319 (pronari, foto nga LG TV): 1) paneli i hyrjes s'mbulonte krejt ekranin, 2) teksti ngjitur pas ikonave.
// Shkaku: shfletuesi i TV-së është Chrome i vjetër: s'e njeh `inset:` (< 87), `:is()` (< 88), `:has()`/`:focus-visible` në listë
// (hedh krejt rregullin) dhe `gap` te flex-i (< 84). Rregullimi: pa këto në CSS-në tonë + vjeter.js (margin në vend të gap-it).
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
(async () => {
  const sk = ['porta.js', 'index.html', 'pc.html', 'css/stoku.css', 'css/stoku-pc.css'];
  const inset = sk.filter(f => /(^|[\s;{'"])inset\s*:/m.test(lx(f)));
  ok(inset.length === 0, '1. pa `inset:` (TV-ja s\'e njeh)', inset);
  const isS = sk.filter(f => /:is\(|:where\(/.test(lx(f)));
  ok(isS.length === 0, '2. pa `:is(` / `:where(`', isS);
  // :has() ose :focus-visible brenda një liste selektorësh e hedh krejt rregullin në shfletuesit e vjetër
  const lista = [];
  sk.forEach(f => lx(f).split('\n').forEach((l, i) => { const s = l.split('{')[0]; if (/,/.test(s) && /:has\(|:focus-visible/.test(s) && !/^\s*(\/\/|\*|')/.test(l)) lista.push(f + ':' + (i + 1)); }));
  ok(lista.length === 0, '3. :has()/:focus-visible jo në lista selektorësh', lista);
  ok(/vjeter\.js\?v=\d+/.test(lx('index.html')) && /vjeter\.js\?v=\d+/.test(lx('pc.html')) && /vjeter\.js\?v=\d+/.test(lx('sw.js')), '4. vjeter.js në faqe dhe te sw.js');

  const b = await chromium.launch();
  async function hap(f, paGap) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    if (paGap) await ctx.addInitScript(() => { window.__stokuTestPaGap = true; });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + f); await p.waitForTimeout(1500);
    return p;
  }
  for (const f of ['pc.html', 'index.html']) {
    const p = await hap(f, false);
    ok(await p.evaluate(() => !document.documentElement.classList.contains('pa-flex-gap') && !document.querySelector('.pg-r,.pg-c')), '5. ' + f + ': shfletuesi i ri, vjeter.js s\'bën asgjë');
    const po = await p.evaluate(() => { const r = document.getElementById('porta'); if (!r) return null; const b = r.getBoundingClientRect(); return [b.width, b.height]; });
    ok(!po || (po[0] === 1440 && po[1] === 900), '5. ' + f + ': paneli i hyrjes mbulon krejt ekranin', po);
    ok(p.__gab.length === 0, '5. ' + f + ': pa gabime JS', p.__gab);
    await p.context().close();
  }
  // Shfletues pa flex-gap (si TV-ja): gap-i hiqet me CSS, vjeter.js e kthen me margin
  const p = await hap('pc.html', true);
  await p.addStyleTag({ content: '.pg-r,.pg-c,.pg-rw,.pg-cw{gap:0!important;row-gap:0!important;column-gap:0!important}' });
  await p.evaluate(() => { const po = document.getElementById('porta'); if (po) po.remove(); });
  const r = await p.evaluate(() => {
    const bt = document.getElementById('btnShkurtoret'); const st = getComputedStyle(bt);
    const sv = bt.querySelector('svg'), tx = document.createRange(); tx.selectNodeContents(bt);
    const rr = [...tx.getClientRects()].map(x => x.left).filter(x => x > sv.getBoundingClientRect().right - 1);
    return { klasa: document.documentElement.classList.contains('pa-flex-gap'), pg: bt.classList.contains('pg-r'), gap: st.columnGap,
      hapesira: Math.round((rr.length ? Math.min.apply(null, rr) : 0) - sv.getBoundingClientRect().right), n: document.querySelectorAll('.pg-r,.pg-c').length };
  });
  ok(r.klasa && r.pg && r.hapesira >= 4 && r.n > 20, '6. pa flex-gap: hapësira mes ikonës dhe tekstit mbetet (margin)', r);
  ok(p.__gab.length === 0, '6. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? '\nGABIME: ' + g : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
