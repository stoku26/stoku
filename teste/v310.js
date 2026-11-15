// v310 / Android Hyrja 72: pronari "qomi 10 per dark mode 10 per white mode ... te cilesimet > pamja", pastaj "bone opsion me hi
// nto ... ato dark mode i qet veq te dark mode ... bone mu bo expand edhe minimize" dhe "si duket hiqe komplet".
// Cilësimet → Pamja → "Ngjyrat": rresht që hapet e mbyllet; te "E errët" vetëm 10 të errëtat, te "E çelët" vetëm 10 të çelëtat,
// te "Automatike" dy rreshta. Ngjyrat nga NJË burim (teste/temat-gjenero.py): css/stoku-temat.css, temat.js, Temat.kt.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
const { execFileSync } = require('child_process');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  // 0) statike: skedarët e gjeneruar janë të freskët (gjeneruesi s'ndryshon asgjë)
  const para = ['css/stoku-temat.css', 'temat.js', 'vendas/app/src/main/java/site/stoku/vendas/ui/Temat.kt'].map(lx);
  execFileSync('python3', [__dirname + '/temat-gjenero.py']);
  const pas = ['css/stoku-temat.css', 'temat.js', 'vendas/app/src/main/java/site/stoku/vendas/ui/Temat.kt'].map(lx);
  ok(para.every((x, i) => x === pas[i]), '0. css, temat.js dhe Temat.kt janë të gjeneruara nga teste/temat-gjenero.py');
  const css = pas[0], kt = pas[2];
  ok((css.match(/:root\[data-tema="dark"\]\[data-ngj-e="\d+"\]/g) || []).length === 9 && (css.match(/:root\[data-tema="light"\]\[data-ngj-c="\d+"\]/g) || []).length === 9,
    '0. css: 9 + 9 blloqe (tema 1 = ngjyrat e deritanishme)');
  // Android = web: sfondi dhe ngjyra kryesore e çdo teme
  const web = {}; css.replace(/data-ngj-(e|c)="(\d+)"\] \{[^\n]*\n {2}([^\n]*)/g, (m, k, n, v) => {
    web[k + n] = { bg: /--sb-bg: (#[0-9a-f]{6})/.exec(v)[1], accent: /--sb-accent: (#[0-9a-f]{6})/.exec(v)[1], ink: /--sb-ink: (#[0-9a-f]{6})/.exec(v)[1] };
  });
  const android = {}; kt.replace(/Tema\((\d+), "[^"]+", Ngjyrat(EErreta|ECelet)\.copy\(bg = c\(0x([0-9a-f]{6})\)[^\n]*? ink = c\(0x([0-9a-f]{6})\)[^\n]*? accent = c\(0x([0-9a-f]{6})\)/g,
    (m, n, l, bg, ink, ac) => { android[(l === 'EErreta' ? 'e' : 'c') + n] = { bg: '#' + bg, accent: '#' + ac, ink: '#' + ink }; });
  ok(Object.keys(web).length === 18 && Object.keys(web).every(k => JSON.stringify(web[k]) === JSON.stringify(android[k])), '0. Android i ka të njëjtat ngjyra si web-i', [Object.keys(web).length, Object.keys(android).length]);
  const ih = lx('index.html'), ph = lx('pc.html'), sw = lx('sw.js');
  ok(!/ops-shembull/.test(ih) && /id="temaNgjyrat"/.test(ih) && /id="opsNgjyrat"/.test(ph), '0. "Si duket" (shembulli) u hoq; vendi i "Ngjyrat" te telefoni dhe PC-ja');
  ok([ih, ph].every(h => /css\/stoku-temat\.css\?v=\d+/.test(h) && /temat\.js\?v=\d+/.test(h)) && /'\.\/css\/stoku-temat\.css\?v=\d+'/.test(sw) && /'\.\/temat\.js\?v=\d+'/.test(sw),
    '0. stoku-temat.css dhe temat.js te index.html, pc.html dhe sw.js');
  ok(/stoku:ngjyrat/.test(lx('fillimi-tel.js')) && /stoku:ngjyrat/.test(lx('fillimi-pc.js')), '0. fillimi-tel/pc: ngjyrat para vizatimit');
  const ce = lx('vendas/app/src/main/java/site/stoku/vendas/ui/CilesimetEkrani.kt'), tm = lx('vendas/app/src/main/java/site/stoku/vendas/ui/Tema.kt');
  ok(/GrupiNgjyrave\(/.test(ce) && !/Qumësht i freskët 1L/.test(ce) && /Temat\.eErret\(/.test(tm) && /Temat\.eCelet\(/.test(tm), '0. Android: "Ngjyrat" te Pamja, pa shembullin, tema sipas zgjedhjes');

  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  const b = await chromium.launch();
  async function faqe(pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    return p;
  }
  const gjendja = p => p.evaluate(() => {
    const r = document.documentElement, cs = getComputedStyle(r);
    return { tema: r.getAttribute('data-tema'), e: r.getAttribute('data-ngj-e'), c: r.getAttribute('data-ngj-c'), bg: cs.getPropertyValue('--sb-bg').trim(),
      accent: cs.getPropertyValue('--sb-accent').trim(), meta: document.getElementById('metaTema').getAttribute('content'),
      grupet: [...document.querySelectorAll('.tm-grupi')].filter(x => x.offsetParent).map(x => x.getAttribute('data-k') + ':' + x.querySelector('.tm-krye b').textContent + ':' + x.querySelector('.tm-krye-tekst span').textContent),
      kartela: [...document.querySelectorAll('.tm-karta')].filter(x => x.offsetParent).length, ruajtur: localStorage.getItem('stoku:ngjyrat') };
  });

  // 1) Telefoni
  const t = await faqe(false);
  await t.click('#btnOpsione'); await t.waitForTimeout(300); await t.click('#tabPamja'); await t.waitForTimeout(400);
  await t.click('#segTema button[data-v="dark"]'); await t.waitForTimeout(300);
  let s = await gjendja(t);
  ok(s.tema === 'dark' && s.grupet.join() === 'e:Ngjyrat:1. Mesnata' && s.kartela === 0 && s.bg === '#0f1115', '1. tel "E errët": vetëm "Ngjyrat" (e mbyllur), Mesnata', s);
  await t.click('.tm-grupi[data-k="e"] .tm-krye'); await t.waitForTimeout(300);
  s = await gjendja(t);
  ok(s.kartela === 10 && await t.getAttribute('.tm-grupi[data-k="e"] .tm-krye', 'aria-expanded') === 'true', '1. prekja e hap: 10 të errëtat', s.kartela);
  await t.screenshot({ path: __dirname + '/v310-tel-erret.png' });
  await t.click('.tm-grupi[data-k="e"] .tm-karta[data-n="3"]'); await t.waitForTimeout(300);
  s = await gjendja(t);
  ok(s.e === '3' && s.bg === '#0a1220' && s.accent === '#0e7490' && s.meta === '#0a1220' && s.ruajtur === '{"e":3,"c":1}' && s.kartela === 10 && s.grupet.join() === 'e:Ngjyrat:3. Oqeani',
    '1. Oqeani: ngjyrat ndryshojnë menjëherë, shiriti i telefonit, ruhet, mbetet e hapur', s);
  ok(/E errët · Oqeani/.test(await t.textContent('#tabPamjaStatus')), '1. menyja: "E errët · Oqeani"', await t.textContent('#tabPamjaStatus'));
  await t.screenshot({ path: __dirname + '/v310-tel-oqeani.png' });
  await t.click('.tm-grupi[data-k="e"] .tm-krye'); await t.waitForTimeout(200);
  ok((await gjendja(t)).kartela === 0, '1. prekja tjetër e mbyll');
  await t.click('#segTema button[data-v="light"]'); await t.waitForTimeout(300);
  s = await gjendja(t);
  ok(s.tema === 'light' && s.grupet.join() === 'c:Ngjyrat:1. Letër' && s.bg === '#f6f5f2', '1. "E çelët": vetëm të çelëtat', s);
  await t.click('.tm-grupi[data-k="c"] .tm-krye'); await t.waitForTimeout(200);
  await t.click('.tm-grupi[data-k="c"] .tm-karta[data-n="4"]'); await t.waitForTimeout(300);
  s = await gjendja(t);
  ok(s.c === '4' && s.bg === '#f0f7f3' && s.accent === '#0b7a66' && s.meta === '#f0f7f3' && s.ruajtur === '{"e":3,"c":4}', '1. Mente', s);
  await t.screenshot({ path: __dirname + '/v310-tel-mente.png' });
  await t.click('#segTema button[data-v="auto"]'); await t.waitForTimeout(300);
  s = await gjendja(t);
  ok(s.grupet.join('|') === 'e:Ngjyrat e temës së errët:3. Oqeani|c:Ngjyrat e temës së çelët:4. Mente', '1. "Automatike": dy rreshta', s.grupet);
  // rifreskimi: ngjyrat para vizatimit (fillimi-tel.js)
  await t.click('#segTema button[data-v="dark"]'); await t.waitForTimeout(200);
  await t.reload(); await t.waitForTimeout(300);
  s = await t.evaluate(() => ({ e: document.documentElement.getAttribute('data-ngj-e'), c: document.documentElement.getAttribute('data-ngj-c'), bg: getComputedStyle(document.documentElement).getPropertyValue('--sb-bg').trim() }));
  ok(s.e === '3' && s.c === '4' && s.bg === '#0a1220', '1. pas rifreskimit: Oqeani menjëherë', s);
  ok(!t.__gab.length, '1. pa gabime JS', t.__gab);

  // 2) Kompjuteri
  const p = await faqe(true);
  await p.click('#btnOpsione'); await p.waitForTimeout(400);
  await p.click('#opsTema [data-v="light"]'); await p.waitForTimeout(300);
  s = await gjendja(p);
  ok(s.grupet.join() === 'c:Ngjyrat:1. Letër' && s.kartela === 0, '2. PC "E çelët": vetëm "Ngjyrat" e mbyllur', s);
  await p.click('.tm-grupi[data-k="c"] .tm-krye'); await p.waitForTimeout(200);
  await p.click('.tm-grupi[data-k="c"] .tm-karta[data-n="5"]'); await p.waitForTimeout(300);
  s = await gjendja(p);
  ok(s.c === '5' && s.bg === '#f6f3fc' && s.accent === '#6d28d9' && s.kartela === 10, '2. PC: Livando', s);
  await p.screenshot({ path: __dirname + '/v310-pc-livando.png' });
  await p.click('#opsTema [data-v="dark"]'); await p.waitForTimeout(300);
  s = await gjendja(p);
  ok(s.grupet.join() === 'e:Ngjyrat:1. Mesnata' && s.bg === '#0f1115', '2. PC "E errët": vetëm të errëtat', s);
  await p.click('.tm-grupi[data-k="e"] .tm-krye'); await p.waitForTimeout(200);
  await p.click('.tm-grupi[data-k="e"] .tm-karta[data-n="8"]'); await p.waitForTimeout(300);
  s = await gjendja(p);
  ok(s.e === '8' && s.bg === '#000000' && s.meta === '#000000', '2. PC: E zezë (OLED)', s);
  await p.screenshot({ path: __dirname + '/v310-pc-oled.png' });
  ok(!p.__gab.length, '2. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})();
