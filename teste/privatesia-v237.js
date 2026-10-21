// v237: faqja "Privatësia" (privatesia.html), /.well-known/security.txt, lidhjet te porta, Cilësimet (tel + PC) dhe <link rel="privacy-policy">
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
(async () => {
  const b = await chromium.launch();
  // 1. faqja vetë, e çelët dhe e errët, në telefon
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, colorScheme: tema, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    const r = await p.goto(B + '/privatesia.html');
    const d = await p.evaluate(() => ({ titulli: document.title, h2: [...document.querySelectorAll('h2')].map(x => x.textContent), email: [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.href),
      tekst: document.body.innerText, gjeresia: document.documentElement.scrollWidth, tema: document.documentElement.getAttribute('data-tema'), bg: getComputedStyle(document.body).backgroundColor }));
    ok(r.status() === 200 && d.titulli === 'Privatësia • Stoku' && d.h2.length >= 8, tema + ': faqja hapet me krejt pjesët', d.h2);
    ok(d.email.length >= 3 && d.email.every(x => x === 'mailto:mendurb@gmail.com'), tema + ': kontakti mendurb@gmail.com', d.email);
    ok(!/—/.test(d.tekst) && /cookies/.test(d.tekst) && /Agjencia për Informim dhe Privatësi/.test(d.tekst), tema + ': pa vizë të gjatë, me cookies dhe AIP');
    ok(d.gjeresia <= 390 && d.tema === tema && !gab.length, tema + ': pa rrëshqitje anash, tema e saktë, pa gabime', [d.gjeresia, d.tema, d.bg, gab]);
    await p.screenshot({ path: __dirname + '/v237-privatesia-' + tema + '.png', fullPage: false });
    await ctx.close();
  }
  // 2. security.txt dhe _config.yml
  const st = fs.readFileSync(__dirname + '/../.well-known/security.txt', 'utf8');
  const exp = Date.parse((st.match(/^Expires: (.+)$/m) || [])[1]);
  ok(/^Contact: mailto:mendurb@gmail\.com$/m.test(st) && exp > Date.now() && exp < Date.now() + 366 * 864e5 && /^Canonical: https:\/\/stoku\.site\/\.well-known\/security\.txt$/m.test(st), 'security.txt: Contact, Expires (< 1 vit), Canonical', st);
  ok(/include: \[".well-known"\]/.test(fs.readFileSync(__dirname + '/../_config.yml', 'utf8')), '_config.yml: GitHub Pages e publikon .well-known');
  // 3. telefoni dhe PC: <link rel>, porta, Cilësimet
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    const d = await p.evaluate(() => {
      const a = document.querySelector('#porta .pk-fund a'); const r = a && a.getBoundingClientRect();
      return { rel: (document.querySelector('link[rel="privacy-policy"]') || {}).getAttribute ? document.querySelector('link[rel="privacy-policy"]').getAttribute('href') : null,
        porta: a && { href: a.getAttribute('href'), tekst: a.textContent, target: a.target, duket: r.width > 0 && r.height > 0 } };
    });
    ok(d.rel === 'privatesia.html', em + ': <link rel="privacy-policy">', d.rel);
    ok(d.porta && d.porta.href === 'privatesia.html' && d.porta.tekst === 'Privatësia' && d.porta.target === '_blank' && d.porta.duket, em + ': lidhja "Privatësia" poshtë hyrjes', d.porta);
    if (!pc) await p.screenshot({ path: __dirname + '/v237-porta-tel.png' });
    const hapur = await p.evaluate(() => { const v = []; window.open = (u, t, f) => { v.push([u, t, f]); return null; }; document.getElementById('opsPrivatesia').click(); return v; });
    ok(hapur.length === 1 && hapur[0][0] === 'privatesia.html' && hapur[0][1] === '_blank', em + ': Cilësimet → "Privatësia" e hap faqen', hapur);
    ok(!gab.length, em + ': pa gabime JavaScript', gab);
    await ctx.close();
  }
  // 4. Cilësimet e hapura (pamja), tel dhe PC, me llogari
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  for (const pc of [false, true]) {
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    const p = await ctx.newPage();
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(3000);
    await p.click('#btnOpsione').catch(() => {}); await p.waitForTimeout(700);
    if (!pc) await p.evaluate(() => { const e = document.getElementById('opsPrivatesia'); e && e.scrollIntoView({ block: 'center' }); });
    const r = await p.evaluate(() => { const e = document.getElementById('opsPrivatesia'); const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, tekst: e.textContent.trim() }; });
    ok(r.w > 0 && r.h > 0 && /Privatësia/.test(r.tekst), (pc ? 'PC' : 'tel') + ': "Privatësia" duket te Cilësimet', r);
    await p.screenshot({ path: __dirname + '/v237-cilesimet-' + (pc ? 'pc' : 'tel') + '.png' });
    await ctx.close();
  }
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
