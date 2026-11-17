// v325 / Android Hyrja 87 (pronari: "nonstop po rrin tu u bo her barkod her logo. Bone kshtu kur e hap ... te porta me u shendrru prej
// barkodit ne logo pas 1 sekonde ... edhe me nejt logo ... masi te bohesh login me pa barkodin mas 1 sekonde me dal logo ... nese e mshel
// ... e e qel mos me u ndrru mo vetem 1 her ... deri ne loginin tjeter"): skanimi NJË herë (barkod 1 s → skanim 1 s → logo), pa loop.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
(async () => {
  // ===== 0. Kodi =====
  const js = lx('logot.js'), sk = lx(K + 'ui/LogoSkanim.kt'), lo = lx(K + 'ui/Logo.kt'), pt = lx(K + 'ui/Porta.kt');
  ok(!/infinite/.test(js) && /stkSkL 2s linear both/.test(js) && /KEY_SKANUAR = 'stoku:logo:skanuar'/.test(js), '0. web: pa loop, 2 s një herë');
  ok(/stoku:logo:skanuar/.test(lx('porta.js')) && /function hap\(mesazh\) \{\n    harroSkaniminEKokes\(\);/.test(lx('porta.js')), '0. web: hyrja e fshin shënimin (koka luan pas hyrjes së radhës)');
  ok(!/rememberInfiniteTransition/.test(sk) && /tween\(2000/.test(sk) && /KEY_SKANUAR = "logo_skanuar"/.test(sk) && /luaj = true\)/.test(lo) && /prefsOse\(SkanimiILogos\.KEY_SKANUAR, ""\) != "1"/.test(lo) && /SkanimiILogos\.harro\(\)/.test(pt),
    '0. Android: një herë; hyrja gjithmonë, koka një herë pas hyrjes');

  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'duli96', kycurSe: Date.now() });
  const b = await chromium.launch();
  const UA = 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile';
  const ne = (p, sel, t) => p.evaluate(([sel, t]) => {
    const s = document.querySelector(sel); if (!s) return null;
    s.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = t * 1000; });
    const tr = q => { const m = getComputedStyle(s.querySelector(q)).transform.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; };
    return { luan: s.classList.contains('stk-logo--skanim'), l: tr('.sk-l'), b: tr('.sk-b'), v: +getComputedStyle(s.querySelector('.sk-v')).opacity };
  }, [sel, t]);
  const logoPlote = x => x.l <= 0 && x.l + 150 >= 100.52 && x.b > 100.52 && x.v === 0;
  const barkodPlote = x => x.b <= 0 && x.b + 150 >= 100.52 && x.l + 150 < 0 && x.v === 0;
  // 1. Hyrja (pa llogari): barkodi 1 s, pastaj skanimi, pastaj logoja mbetet; shënimi i vjetër fshihet
  {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('stoku:logo:skanuar', '1'); sessionStorage.setItem('x', '1'); } } catch (e) {} });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(800);
    const S = '#porta .pk-logo svg.stk-logo';
    const f = { a: await ne(p, S, 0.5), b: await ne(p, S, 1.5), c: await ne(p, S, 2.5), d: await ne(p, S, 60) };
    ok(f.a.luan && barkodPlote(f.a), '1. hyrja: 0.5 s = barkodi', f.a);
    ok(f.b.v === 1 && f.b.l + 150 > 0 && f.b.b > -3 && f.b.b < 104, '1. hyrja: 1.5 s = skanimi', f.b);
    ok(logoPlote(f.c) && logoPlote(f.d), '1. hyrja: 2.5 s dhe 60 s = logoja (s\'kthehet më në barkod)', [f.c, f.d]);
    ok(await p.evaluate(() => localStorage.getItem('stoku:logo:skanuar')) === null, '1. hyrja e fshin shënimin e kokës');
    ok(await p.evaluate(() => !document.querySelector('#logoButon svg.stk-logo').classList.contains('stk-logo--skanim')), '1. koka s\'luan prapa hyrjes');
    ok(!gab.length, '1. pa gabime JS', gab);
    await ctx.close();
  }
  // 2. I kyçur: koka luan një herë; pas mbylljes/hapjes (rifreskimit) vetëm logoja
  {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, 'uA', 'duli96@stoku-app.local', 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(2500);
    const S = '#logoButon svg.stk-logo';
    const a = await ne(p, S, 0.5), c = await ne(p, S, 2.5);
    ok(a.luan && barkodPlote(a) && logoPlote(c), '2. pas hyrjes: koka barkod → logo një herë', [a, c]);
    ok(await p.evaluate(() => localStorage.getItem('stoku:logo:skanuar')) === '1', '2. u shënua që u pa');
    await p.reload(); await p.waitForTimeout(2500);
    const r = await ne(p, S, 0.5);
    ok(!r.luan && logoPlote(r), '2. pas rihapjes: vetëm logoja (pa barkod)', r);
    ok(!gab.length, '2. pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
