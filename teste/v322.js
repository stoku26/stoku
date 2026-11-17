// v322 / Android / ora (pronari: "bone logon 17 ne krejta ku osht qajo logo qe shkrun qashtu gat, amo masi ta kryn me u nal pa u
// vrejt si loop dmth me perfundu sakt jo me met keq"): shkronjat e "stoku." anohen si valë NJË herë dhe ndalen saktë në 0°.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const B = 'http://127.0.0.1:8765';

(async () => {
  // ===== 0. Kodi: Android + ora =====
  const lv = lx('vendas/app/src/main/java/site/stoku/vendas/ui/LogoVala.kt'), lo = lx('ora/app/src/main/java/site/stoku/ora/LogoVala.kt');
  const kyce = s => /floatArrayOf\(0f, \.15f, \.35f, \.55f, \.75f, 1f\)/.test(s) && /floatArrayOf\(0f, 9f, -7f, 4f, -1\.5f, 0f\)/.test(s) && /ZGJATJA = 1\.4f/.test(s) && /VONESA = 0\.08f/.test(s);
  ok(kyce(lv) && kyce(lo), '0. Android + ora: të njëjtat pika kyçe si web-i (përfundon në 0°)');
  const logo = lx('vendas/app/src/main/java/site/stoku/vendas/ui/Logo.kt');
  ok(/LogoMeVale\("porta"/.test(logo) && /LogoMeVale\("koka"/.test(logo), '0. Android: hyrja dhe koka me valë');
  ok(/LogoMeVale\(Modifier\.height\(18\.dp\)\)/.test(lx('ora/app/src/main/java/site/stoku/ora/MainActivity.kt')) && /R\.drawable\.logo_stoku/.test(lo), '0. ora: logoja me valë (shtigjet nga drawable)');
  const js = lx('logot.js');
  ok(/stkVale\{0%\{transform:rotate\(0deg\)\}15%\{transform:rotate\(9deg\)\}35%\{transform:rotate\(-7deg\)\}/.test(js) && /100%\{transform:rotate\(0deg\)\}/.test(js) && /prefers-reduced-motion/.test(js), '0. web: keyframes përfundojnë në 0°, pa lëvizje kur kërkohet');
  ok(/stoku-v3(2[2-9]|[3-9]\d)/.test(lx('sw.js')) && /logot\.js\?v=\d/.test(lx('sw.js')), '0. versionet');

  // ===== 1. Web =====
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'duli96', kycurSe: Date.now() });
  const b = await chromium.launch();
  async function faqe(pcF, kyc) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    if (kyc) await F.lidh(ctx, 'uA', 'duli96@stoku-app.local', pcF ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pcF ? 'pc.html' : 'index.html'));
    return p;
  }
  const gjendja = (p, sel) => p.evaluate(sel => [...document.querySelectorAll(sel)].map(svg => {
    const sh = [...svg.querySelectorAll('.lg-sh')];
    return { n: sh.length, a: svg.querySelectorAll('.lg-a').length, vale: svg.classList.contains('stk-logo--vale'),
      anim: sh.map(x => getComputedStyle(x).animationName + ' ' + getComputedStyle(x).animationDuration + ' ' + getComputedStyle(x).animationDelay),
      tr: sh.map(x => getComputedStyle(x).transform) };
  }), sel);
  const tel = await faqe(false, true);
  await tel.waitForTimeout(400);
  let s = await gjendja(tel, '#logoButon svg.stk-logo');
  ok(s.length === 1 && s[0].n === 5 && s[0].a === 1 && s[0].vale, '1. telefoni: koka me 5 shkronja veç e veç + pika', s[0] && { n: s[0].n, a: s[0].a });
  ok(s[0].anim.every((x, i) => x === 'stkVale 1.4s ' + (i * 0.08).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + 's' || x === 'stkVale 1.4s ' + (i * 0.08) + 's'), '1. vala: 1.4 s, njëra pas tjetrës (0.08 s)', s[0].anim);
  ok(s[0].tr.some(x => x !== 'none' && x !== 'matrix(1, 0, 0, 1, 0, 0)'), '1. gjatë valës shkronjat anohen', s[0].tr);
  await tel.waitForTimeout(2200);
  s = await gjendja(tel, '#logoButon svg.stk-logo');
  ok(s[0].tr.every(x => x === 'none' || x === 'matrix(1, 0, 0, 1, 0, 0)'), '1. pas valës: saktë në pozitën normale (pa kënd)', s[0].tr);
  ok(await tel.evaluate(() => { const b1 = document.querySelector('#logoButon svg.stk-logo').getBoundingClientRect(); return b1.width > 100; }), '1. madhësia e logos s\'ndryshon');
  ok(!tel.__gab.length, '1. pa gabime JS', tel.__gab);
  // Hyrja (porta): logoja nga svgLogo
  const pt = await faqe(false, false);
  await pt.waitForTimeout(1500);
  s = await gjendja(pt, '#porta .pk-logo svg.stk-logo');
  ok(s.length === 1 && s[0].n === 5 && s[0].vale && /^stkVale 1\.4s/.test(s[0].anim[0]), '1. hyrja: logoja me valë', s[0] && s[0].anim);
  ok(await pt.evaluate(() => window.StokuLogot.shkronjat(window.StokuLogot.svgLogo().match(/d="([^"]+)"/)[1] ? document.querySelector('#porta .lg-sh').getAttribute('d') : '').length === 1 &&
    document.querySelectorAll('#stkValeStil').length === 1), '1. stili i valës vetëm një herë');
  // PC
  const pc = await faqe(true, true);
  await pc.waitForTimeout(300);
  s = await gjendja(pc, '.sbp-brand svg.stk-logo, svg.stk-logo--pc');
  ok(s.length >= 1 && s[0].n === 5 && s[0].vale, '1. PC: logoja me valë', s[0] && s[0].n);
  await pc.waitForTimeout(2300);
  s = await gjendja(pc, 'svg.stk-logo--pc');
  ok(s[0].tr.every(x => x === 'none' || x === 'matrix(1, 0, 0, 1, 0, 0)'), '1. PC: ndalet saktë', s[0].tr);
  ok(!pc.__gab.length && !pt.__gab.length, '1. pa gabime JS (PC, hyrja)', [pc.__gab, pt.__gab]);
  // Pa lëvizje kur sistemi e kërkon
  const ctxR = await b.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  await ctxR.route(u => !u.href.startsWith(B), r => r.abort());
  const pr = await ctxR.newPage(); await pr.goto(B + '/index.html'); await pr.waitForTimeout(500);
  ok(await pr.evaluate(() => [...document.querySelectorAll('svg.stk-logo .lg-sh')].every(x => getComputedStyle(x).animationName === 'none')), '1. "zvogëlo lëvizjet": pa valë');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
