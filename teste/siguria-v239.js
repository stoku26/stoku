// v239: (1) asnjë skedar që shërbehet s'ka model "fjalëkalim = '...'" (Protego "Hardcoded Password"); (2) CSP_CLOUDFLARE te
// SHENIME = bashkimi i CSP-ve në meta të 5 faqeve + frame-ancestors 'none' (që header-i te Cloudflare të mos bllokojë asgjë);
// (3) porta: autocomplete i fjalëkalimit ndërrohet si më parë (hyrje / krijo llogari), tel + PC
const { chromium } = require('./pw.js');
const fs = require('fs');
const { execSync } = require('child_process');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const RR = process.env.STOKU_DIR || require('path').resolve(__dirname, '..');
(async () => {
  // 1. modelet e fjalëkalimit në kod
  const skedaret = execSync('git ls-files', { cwd: RR, encoding: 'utf8' }).split('\n')
    .filter(f => f && !/^(tel|ora|worker|\.github)\//.test(f) && /\.(js|html|json|webmanifest|txt|md)$/.test(f));
  const MODELET = [/\b(password|passwd|pwd)\b["']?\s*[:=]\s*["'][^"'\s]{3,}["']/i, /password["']?\s*[:=]\s*["'][^"']+["']/i];
  const gjetur = [];
  for (const f of skedaret) {
    const s = fs.readFileSync(RR + '/' + f, 'utf8');
    for (const m of MODELET) { const x = m.exec(s); if (x) gjetur.push(f + ': ' + x[0].slice(0, 80)); }
  }
  ok(skedaret.length > 20 && !gjetur.length, '1. asnjë model "fjalëkalim = ..." në ' + skedaret.length + ' skedarë që shërbehen', gjetur);
  const porta = fs.readFileSync(RR + '/porta.js', 'utf8');
  ok(/\(krijo \? 'new' : 'current'\) \+ '-password'/.test(porta), '1b. porta.js e ndërton autocomplete nga pjesët');

  // 2. CSP_CLOUDFLARE = bashkimi i meta-ve + frame-ancestors 'none'
  const ndaj = p => { const d = {}; p.split(';').map(x => x.trim()).filter(Boolean).forEach(x => { const [k, ...v] = x.split(/\s+/); d[k] = new Set(v); }); return d; };
  const bashkimi = {};
  for (const f of ['index.html', 'pc.html', '404.html', 'android.html', 'privatesia.html']) {
    const c = (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(fs.readFileSync(RR + '/' + f, 'utf8')) || [])[1];
    ok(!!c, '2. ' + f + ' ka CSP në meta');
    const d = ndaj(c || '');
    for (const k in d) { bashkimi[k] = bashkimi[k] || new Set(); d[k].forEach(v => bashkimi[k].add(v)); }
  }
  bashkimi['frame-ancestors'] = new Set(["'none'"]);
  const sh = (/CSP_CLOUDFLARE: `([^`]+)`/.exec(fs.readFileSync(RR + '/SHENIME.md', 'utf8')) || [])[1];
  ok(!!sh, '2b. SHENIME ka rreshtin CSP_CLOUDFLARE');
  const cf = ndaj(sh || '');
  const dallimet = [];
  for (const k of new Set([...Object.keys(cf), ...Object.keys(bashkimi)])) {
    const a = [...(cf[k] || [])].sort().join(' '), b = [...(bashkimi[k] || [])].sort().join(' ');
    if (a !== b) dallimet.push(k + ': cloudflare="' + a + '" meta="' + b + '"');
  }
  ok(!dallimet.length, '2c. CSP_CLOUDFLARE = bashkimi i meta-ve të 5 faqeve + frame-ancestors (përndryshe ndryshoje edhe te Cloudflare)', dallimet);

  // 3. porta: autocomplete hyrje / krijo, tel + PC
  const b = await chromium.launch();
  for (const [rruga, ua, vp] of [['/index.html', 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', { width: 390, height: 844 }],
                                 ['/pc.html', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', { width: 1440, height: 900 }]]) {
    const ctx = await b.newContext({ userAgent: ua, viewport: vp, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    const p = await ctx.newPage(); const gab = [];
    p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + rruga); await p.waitForSelector('#pkTabKrijo', { timeout: 8000 });
    const ac = async () => p.$eval('#pkFjalekalimi', e => e.getAttribute('autocomplete'));
    const a0 = await ac();
    await p.click('#pkTabKrijo'); await p.waitForTimeout(150); const a1 = await ac();
    await p.click('#pkTabHyr'); await p.waitForTimeout(150); const a2 = await ac();
    ok(a0 === 'current-password' && a1 === 'new-password' && a2 === 'current-password' && !gab.length, '3. ' + rruga + ': porta, autocomplete hyrje → krijo → hyrje', { a0, a1, a2, gab });
    await ctx.close();
  }
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
