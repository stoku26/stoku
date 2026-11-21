// v350 / Android Hyrja 110 (pronari: "Hej logo nalt prej barkodit qe bohet logo bone me u shendrru per 1 sekond apet. Tjeter qka mos prek"):
// vetëm koka: barkodi 1 s → skanimi 1 s (2 s). Hyrja mbetet 1.5 s (v349).
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
(async () => {
  const js = lx('logot.js'), sk = lx(K + 'ui/LogoSkanim.kt'), lo = lx(K + 'ui/Logo.kt');
  ok(/stkSkLk\{0%\{transform:translateX\(-153px\)\}50%/.test(js) && /stk-logo--koka \.sk-l\{animation:stkSkLk 2s linear both\}/.test(js) && /classList\.add\('stk-logo--koka', 'stk-logo--skanim'\)/.test(js), '0. web: koka 2 s, barkodi deri 50%');
  ok(/stkSkL\{0%\{transform:translateX\(-153px\)\}60%/.test(js) && /stkSkL 2\.5s linear both/.test(js), '0. web: hyrja e pandryshuar (1.5 s)');
  ok(/KOHA_KOKA_MS = 2000/.test(sk) && /NIS_KOKA = \.5f/.test(sk) && /koka = true\)/.test(lo) && /KOHA_MS = 2500/.test(sk) && /luaj = true\)/.test(lo), '0. Android: koka 2 s (barkod 1 s), hyrja 2.5 s');

  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'duli96', kycurSe: Date.now() });
  const b = await chromium.launch();
  const ne = (p, sel, t) => p.evaluate(([sel, t]) => {
    const s = document.querySelector(sel); if (!s) return null;
    s.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t * 1000; });
    const tr = q => { const m = getComputedStyle(s.querySelector(q)).transform.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; };
    return { luan: s.classList.contains('stk-logo--skanim'), l: tr('.sk-l'), b: tr('.sk-b'), v: +getComputedStyle(s.querySelector('.sk-v')).opacity };
  }, [sel, t]);
  const logoPlote = x => x.l <= 0 && x.l + 150 >= 100.52 && x.b > 100.52 && x.v === 0;
  const barkodPlote = x => x.b <= 0 && x.b + 150 >= 100.52 && x.l + 150 < 0 && x.v === 0;
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'telefoni', faqja = pc ? '/pc.html' : '/index.html';
    const opt = { viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' };
    if (!pc) opt.userAgent = 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile';
    {
      const ctx = await b.newContext(opt); await ctx.route(u => !u.href.startsWith(B), r => r.abort());
      const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
      await p.goto(B + faqja); await p.waitForTimeout(800);
      const S = '#porta svg.stk-logo.stk-logo--skanim';
      const f = [await ne(p, S, 1.4), await ne(p, S, 1.6)];
      ok(barkodPlote(f[0]) && f[1].v === 1, em + ' hyrja: ende 1.5 s (1.4 s barkod, 1.6 s skanim)', f);
      ok(!gab.length, em + ' hyrja: pa gabime JS', gab);
      await ctx.close();
    }
    {
      const ctx = await b.newContext(opt); await ctx.route(u => !u.href.startsWith(B), r => r.abort());
      await F.lidh(ctx, 'uA', 'duli96@stoku-app.local', pc ? 'pc' : 'tel');
      await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
      const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
      await p.goto(B + faqja); await p.waitForTimeout(2500);
      const S = (await p.$('#logoButon svg.stk-logo')) ? '#logoButon svg.stk-logo' : 'svg.stk-logo:not(#porta svg)';
      const f = [await ne(p, S, 0.9), await ne(p, S, 1.1), await ne(p, S, 2.0)];
      ok(f[0] && f[0].luan && barkodPlote(f[0]) && f[1].v === 1 && !barkodPlote(f[1]) && logoPlote(f[2]), em + ' koka: 0.9 s barkod, 1.1 s skanim, 2 s logo', f);
      await p.reload(); await p.waitForTimeout(1500);
      const r = await ne(p, S, 0.5);
      ok(r && !r.luan && logoPlote(r), em + ' koka: pas rifreskimit vetëm logoja (si v349)', r);
      ok(!gab.length, em + ' koka: pa gabime JS', gab);
      await ctx.close();
    }
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
