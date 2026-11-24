// v346: "Kushtet e përdorimit" (kushtet.html) dhe lidhja afër Privatësisë kudo: Cilësimet (tel + PC), poshtë hyrjes, Android
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
(async () => {
  // 0. statike
  const k = lx('kushtet.html'), pr = lx('privatesia.html');
  const csp = s => (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(s) || [])[1];
  ok(csp(k) && csp(k) === csp(pr), '0a. kushtet.html ka të njëjtën CSP si privatesia.html');
  ok(!/<script(?![^>]*src=)/.test(k) && !/onclick=/.test(k), '0b. pa skripta inline, pa onclick');
  ok(/href="\/kushtet\.html">Kushtet e përdorimit</.test(pr) && /href="\/privatesia\.html">Privatësia</.test(k), '0c. dy faqet lidhen me njëra-tjetrën');
  const K = 'vendas/app/src/main/java/site/stoku/vendas/';
  const c = lx(K + 'ui/CilesimetEkrani.kt');
  const iP = c.indexOf('"Privatësia"'), iK = c.indexOf('"Kushtet e përdorimit"');
  ok(iP > 0 && iK > iP && iK - iP < 600 && /https:\/\/stoku\.site\/kushtet\.html/.test(c) && /https:\/\/stoku\.site\/terms\.html/.test(c) && /val Kushtet = ikona\(/.test(lx(K + 'ui/Ikonat.kt')), '0d. Android: "Kushtet e përdorimit" menjëherë pas Privatësisë');
  ok(+/v: (\d+)/.exec(lx('versioni.js'))[1] >= 346 && /Hyrja\(104,/.test(lx(K + 'TeRejat.kt')), '0e. versionet');
  const b = await chromium.launch();
  // 1. faqja, e çelët dhe e errët
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, colorScheme: tema, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    const r = await p.goto(B + '/kushtet.html');
    const d = await p.evaluate(() => ({ titulli: document.title, h1: document.querySelector('h1').textContent, h2: [...document.querySelectorAll('h2')].map(x => x.textContent),
      email: [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.href), tekst: document.body.innerText, gjeresia: document.documentElement.scrollWidth, tema: document.documentElement.getAttribute('data-tema') }));
    ok(r.status() === 200 && d.titulli === 'Kushtet e përdorimit • Stoku' && d.h1 === 'Kushtet e përdorimit' && d.h2.length >= 10, tema + ': faqja hapet me të gjitha pjesët', d.h2);
    ok(d.email.length >= 2 && d.email.every(x => x === 'mailto:mendurb@gmail.com'), tema + ': kontakti', d.email);
    ok(!/—/.test(d.tekst) && !/sahat/i.test(d.tekst) && /Republikës së Kosovës/.test(d.tekst) && /Kontrolloje gjithmonë datën/.test(d.tekst), tema + ': pa vizë të gjatë; ligji i Kosovës; data në produkt');
    ok(d.gjeresia <= 390 && d.tema === tema && !gab.length, tema + ': pa rrëshqitje anash, tema e saktë, pa gabime', [d.gjeresia, gab]);
    await p.screenshot({ path: __dirname + '/v346-kushtet-' + tema + '.png' });
    await ctx.close();
  }
  // 2. telefoni dhe PC: poshtë hyrjes dhe te Cilësimet, menjëherë pas Privatësisë
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    const d = await p.evaluate(() => {
      const l = [...document.querySelectorAll('#porta .pk-fund a')].map(a => { const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), tekst: a.textContent, target: a.target, duket: r.width > 0 && r.height > 0 }; });
      const pv = document.getElementById('opsPrivatesia'), ku = document.getElementById('opsKushtet');
      return { l, pas: !!ku && pv.nextElementSibling === ku, tekst: ku && ku.textContent.replace(/\s+/g, ' ').trim() };
    });
    ok(d.l.length === 2 && d.l[0].href === 'privatesia.html' && d.l[1].href === 'kushtet.html' && d.l[1].tekst === 'Kushtet e përdorimit' && d.l[1].target === '_blank' && d.l[1].duket, em + ': poshtë hyrjes "Privatësia · Kushtet e përdorimit"', d.l);
    ok(d.pas && /^Kushtet e përdorimit/.test(d.tekst), em + ': te Cilësimet menjëherë pas Privatësisë', d);
    const hapur = await p.evaluate(() => { const v = []; window.open = (u, t, f) => { v.push([u, t, f]); return null; }; document.getElementById('opsKushtet').click(); return v; });
    ok(hapur.length === 1 && hapur[0][0] === 'kushtet.html' && hapur[0][1] === '_blank', em + ': klikimi e hap kushtet.html', hapur);
    if (!pc) await p.screenshot({ path: __dirname + '/v346-porta-tel.png' });
    ok(!gab.length, em + ': pa gabime JavaScript', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
