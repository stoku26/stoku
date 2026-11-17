// v324 / Android Hyrja 86 (pronari):
//  1. Logoja: "Logon 02 e bon ... sa ma high quality ... tjen nloop mos tdoket keq ne nisje edhe mbarim. Kudo qe osht e madhe logoja":
//     barkod → vija e gjelbër → "stoku." (mbetet) → vija → barkod, 6 s në loop pa kërcim; pa valën e v322; ora pa lëvizje
//  2. Hyrja: "Malli dhe afatet, nën kontroll."; ngjyra fikse (pa temat) në web tel, PC, Android; PC e ndarë dysh (ideja 1)
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
(async () => {
  // ===== 0. Kodi =====
  const LM = require(RR + 'logot.js'); const L = LM.StokuLogot || global.StokuLogot || LM;
  ok(!/stkVale|valeKudo/.test(lx('logot.js')) && /stkSkL/.test(lx('logot.js')) && typeof L.barkodi === 'string' && (L.barkodi.match(/M/g) || []).length > 15, '1. web: skanimi në vend të valës');
  const sk = lx(K + 'ui/LogoSkanim.kt');
  ok(!fs.existsSync(RR + K + 'ui/LogoVala.kt') && !fs.existsSync(RR + 'ora/app/src/main/java/site/stoku/ora/LogoVala.kt') && /LogoMeSkanim\(ink,/.test(lx(K + 'ui/Logo.kt')) && /LogoMeSkanim\(n\.ink,/.test(lx(K + 'ui/Logo.kt')),
    '1. Android: skanimi te koka dhe hyrja; ora pa lëvizje');
  // Android: të njëjtat shtylla si web-i
  let s = 7; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const W = [0.9, 1.8, 2.7]; let x = 2, n = 0; while (x < 98) { const w = W[Math.floor(r() * 3)]; n++; x += w + W[Math.floor(r() * 3)]; }
  ok((L.barkodi.match(/M/g) || []).length === n && /s = \(s \* 9301 \+ 49297\) % 233280/.test(sk) && /floatArrayOf\(0\.9f, 1\.8f, 2\.7f\)/.test(sk), '1. Android: barkodi i njëjtë me web-in', n);
  const pt = lx(K + 'ui/Porta.kt'), tm = lx(K + 'ui/Tema.kt');
  ok(/fun Porta\(\) = PortaTema \{/.test(pt) && /fun DukeULidhur\(\) = PortaTema \{/.test(pt) && /val NgjyratEPortes/.test(tm) && (pt.match(/Malli dhe afatet, nën kontroll\./g) || []).length === 2 && !/Regjistrimi i mallit/.test(pt),
    '2. Android: hyrja me ngjyra fikse dhe teksti i ri');
  ok(/stoku-v3(2[4-9]|[3-9]\d)/.test(lx('sw.js')), '0. versionet');

  const b = await chromium.launch();
  async function faqe(pc, tema, reduce) {
    const ctx = await b.newContext({ viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, userAgent: pc ? undefined : 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', serviceWorkers: 'block', reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await ctx.addInitScript(t => { try { localStorage.setItem('stoku:tema', t); } catch (e) {} }, tema);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(2000);
    return p;
  }
  const ne = (p, sel, t) => p.evaluate(([sel, t]) => {
    document.getAnimations().forEach(a => { if (/stkSk/.test(a.animationName)) { a.pause(); a.currentTime = t * 1000; } });
    const s = document.querySelector(sel); if (!s) return null;
    const tr = q => { const m = getComputedStyle(s.querySelector(q)).transform.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; };
    return { l: tr('.sk-l'), b: tr('.sk-b'), v: +getComputedStyle(s.querySelector('.sk-v')).opacity, bk: !!s.querySelector('.lg-bk'), sk: s.classList.contains('stk-logo--skanim') };
  }, [sel, t]);
  // v325: loop-i u zëvendësua me skanimin një herë (teste/v325.js)
  const tel = await faqe(false, 'light');
  ok(!tel.__gab.length, '1. telefoni: pa gabime JS', tel.__gab);
  // Hyrja: ngjyrat fikse edhe me temë të çelët
  const ng = await tel.evaluate(() => { const p = document.getElementById('porta'); return { bg: getComputedStyle(p).backgroundColor, btn: getComputedStyle(document.getElementById('pkDergo')).backgroundColor,
    nen: document.getElementById('pkNen').textContent, tema: document.documentElement.getAttribute('data-tema') }; });
  ok(ng.tema === 'light' && ng.bg === 'rgb(0, 0, 0)' && ng.btn === 'rgb(91, 60, 245)' && ng.nen === 'Malli dhe afatet, nën kontroll.', '2. telefoni: hyrja e zezë me vjollcë edhe me temën e çelët', ng);
  // PC
  const pc = await faqe(true, 'light');
  const d = await pc.evaluate(() => { const p = document.getElementById('porta'), a = p.querySelector('.pk-ana'), dj = p.querySelector('.pk-djathtas');
    const ra = a.getBoundingClientRect(), rd = dj.getBoundingClientRect();
    return { pc: p.classList.contains('porta-pc'), h1: a.querySelector('h1').textContent, pika: a.querySelectorAll('.pk-pika').length, ana: ra.right <= rd.left + 1 && ra.width > 400,
      formaDjathtas: dj.contains(document.getElementById('pkForma')), logoAna: !!a.querySelector('svg.stk-logo--skanim'), bg: getComputedStyle(p).backgroundColor }; });
  ok(d.pc && d.h1 === 'Malli dhe afatet, nën kontroll.' && d.pika === 3 && d.ana && d.formaDjathtas && d.logoAna, '2. PC: e ndarë dysh (majtas logoja me skanim, teksti, 3 pika; djathtas forma)', d);
  await pc.setViewportSize({ width: 900, height: 800 }); await pc.waitForTimeout(200);
  ok(await pc.evaluate(() => !document.getElementById('porta').classList.contains('porta-pc') && getComputedStyle(document.querySelector('#porta .pk-ana')).display === 'none'), '2. PC e ngushtë: si telefoni');
  ok(!pc.__gab.length, '2. PC: pa gabime JS', pc.__gab);
  // "Zvogëlo lëvizjet": pa animacion, vetëm logoja
  const rm = await faqe(false, 'dark', true);
  ok(await rm.evaluate(() => { const s = document.querySelector('#porta .pk-logo svg.stk-logo'); return getComputedStyle(s.querySelector('.sk-l')).animationName === 'none' && /-20/.test(getComputedStyle(s.querySelector('.sk-l')).transform) && /104/.test(getComputedStyle(s.querySelector('.sk-b')).transform); }),
    '1. "zvogëlo lëvizjet": logoja pa lëvizje');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
