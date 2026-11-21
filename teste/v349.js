// v349 / Android Hyrja 109 (pronari: "Bone pas 1.5 sekondave me u ndryshu nga barkodi ne logo stoku. Edhe me u ndryshu qdo her kur e sheh.
// Nese bohesh login niher me u ndryshu prej barkodit ne logo edhe mo me met veq logo stoku deri sa te mbyllet e hapet prap"):
// barkodi 1.5 s → skanimi 1 s; hyrja sa herë del; koka një herë për çdo hapje (sessionStorage / memorie në Android).
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
(async () => {
  // ===== 0. Kodi =====
  const js = lx('logot.js'), sk = lx(K + 'ui/LogoSkanim.kt'), lo = lx(K + 'ui/Logo.kt'), ma = lx(K + 'MainActivity.kt'), pt = lx('porta.js');
  ok(/stkSkL\{0%\{transform:translateX\(-153px\)\}60%/.test(js) && /stkSkB\{0%\{transform:translateX\(-3px\)\}60%/.test(js) && /59\.99%/.test(js) && (js.match(/2\.5s linear both/g) || []).length === 3, '0. web: barkodi 60% e 2.5 s = 1.5 s');
  ok(/sessionStorage\.getItem\(KEY_SKANUAR\)/.test(js) && /sessionStorage\.setItem\(KEY_SKANUAR/.test(js) && !/localStorage\.setItem\(KEY_SKANUAR/.test(js), '0. web: koka shënohet vetëm për këtë hapje');
  ok(/sessionStorage\.removeItem\('stoku:logo:skanuar'\)/.test(pt), '0. web: hyrja e fshin shënimin');
  ok(/KOHA_MS = 2500/.test(sk) && /NIS = \.6f/.test(sk) && /SkanimiILogos\.KOHA_MS, easing/.test(sk) && !/logo_skanuar/.test(sk + lo), '0. Android: 2.5 s, barkodi deri 0.6, pa pref të përhershëm');
  ok(/!SkanimiILogos\.kokaLuajti/.test(lo) && /SkanimiILogos\.kokaLuajti = true/.test(lo) && /savedInstanceState == null\) site\.stoku\.vendas\.ui\.SkanimiILogos\.harro\(\)/.test(ma), '0. Android: koka një herë për hapje (MainActivity e fshin)');
  // Kotlin gjendja() e përkthyer: barkodi deri 0.6
  const gj = p => p >= 1 ? 'logo' : p < .6 ? 'barkod' : 'skanim';
  ok(gj(1.4 / 2.5) === 'barkod' && gj(1.6 / 2.5) === 'skanim' && gj(1) === 'logo', '0. Android: 1.4 s barkod, 1.6 s skanim');

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
    // a. Hyrja: barkod 1.4 s, skanim 1.6 s, logo 2.5 s; edhe pas rifreskimit sërish (sa herë del)
    {
      const ctx = await b.newContext(opt); await ctx.route(u => !u.href.startsWith(B), r => r.abort());
      const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
      await p.goto(B + faqja); await p.waitForTimeout(800);
      const S = '#porta svg.stk-logo.stk-logo--skanim';
      const f = [await ne(p, S, 1.4), await ne(p, S, 1.6), await ne(p, S, 2.5)];
      ok(f[0] && f[0].luan && barkodPlote(f[0]) && f[1].v === 1 && !barkodPlote(f[1]) && logoPlote(f[2]), em + ' a. hyrja: 1.4 s barkod, 1.6 s skanim, 2.5 s logo', f);
      await p.reload(); await p.waitForTimeout(800);
      const r = await ne(p, S, 1.0);
      ok(r && r.luan && barkodPlote(r), em + ' a. hyrja sërish pas rifreskimit: barkod → logo', r);
      ok(!gab.length, em + ' a. pa gabime JS', gab);
      await ctx.close();
    }
    // b. I kyçur: koka një herë; rifreskim = vetëm logo; skedë e re (hapje e re) = sërish një herë
    {
      const ctx = await b.newContext(opt); await ctx.route(u => !u.href.startsWith(B), r => r.abort());
      await F.lidh(ctx, 'uA', 'duli96@stoku-app.local', pc ? 'pc' : 'tel');
      await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:logo:skanuar', '1'); } catch (e) {} });
      const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
      await p.goto(B + faqja); await p.waitForTimeout(3000);
      const S = (await p.$('#logoButon svg.stk-logo')) ? '#logoButon svg.stk-logo' : 'svg.stk-logo:not(#porta svg)';
      const a = await ne(p, S, 0.9), c = await ne(p, S, 2.6); // v350: koka barkod 1 s
      ok(a && a.luan && barkodPlote(a) && logoPlote(c), em + ' b. koka: barkod → logo (shënimi i vjetër s\'e ndal)', [a, c]);
      await p.reload(); await p.waitForTimeout(2000);
      const r = await ne(p, S, 1.0);
      ok(r && !r.luan && logoPlote(r), em + ' b. rifreskim (pa u mbyllur): vetëm logoja', r);
      const p2 = await ctx.newPage(); p2.on('pageerror', e => gab.push(e.message));
      await p2.goto(B + faqja); await p2.waitForTimeout(2000);
      const n = await ne(p2, S, 0.9);
      ok(n && n.luan && barkodPlote(n), em + ' b. e mbyllur e hapur (skedë e re): sërish barkod → logo', n);
      ok(!gab.length, em + ' b. pa gabime JS', gab);
      await ctx.close();
    }
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
