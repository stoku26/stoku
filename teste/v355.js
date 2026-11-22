// v355 (pronari: "A munesh gjuhen anglisht 100% me ja qit komplet web appit ... Ne web pc mu kon, edhe android app"):
// gjuha e pamjes. Testi: zgjedhja te Cilësimet → Pamja (telefon + PC), ruajtja, dhe një "zvarritës" që hap faqet kryesore në anglisht
// (si vizitor, me të dhënat shembull) e gjen çdo tekst të dukshëm që ka mbetur shqip. Të dhënat e përdoruesit (emrat e produkteve,
// folderave, furnizuesve) s'përkthehen dhe s'numërohen.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const MOCK = () => {
  function u() { var x = sessionStorage.getItem('mockUser'); return x ? { uid: x, email: x + '@stoku-app.local' } : null; }
  window.__stokuCloud = { authGati: true, perdoruesiAktual: u, token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {},
    hyr: async () => ({ ok: true }), regjistrohu: async () => ({ ok: true }) };
};
// Teksti shqip: shkronjat ë/ç ose fjalë shqipe të shpeshta
const SHQIP = /[ëçËÇ]|\b(dhe|të|nuk|për|nga|një|ose|janë|është|s'ka|s'u|kur|te|ku|si|pa|që|ka|ke|ditë|afat|afate|produkte|produkti|folderi|folder[ae]|sot|nesër|skadon|skadojnë|kolegë|grupi|Shto|Ruaj|Fshi|Hiq|Mbyll|Anulo|Kërko|Zgjidh)\b/;
async function mbledh(p, shembull) {
  return p.evaluate(({ SHQIP, shembull }) => {
    const re = new RegExp(SHQIP.slice(1, SHQIP.lastIndexOf('/')));
    const out = new Set();
    const dukshem = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden' || e.hidden) return false; if (e.hasAttribute('data-pa-perkthim')) return false; } return true; };
    const iDhene = t => shembull.some(s => s && t.indexOf(s) !== -1);
    const w = document.createTreeWalker(document.body, 5, null); let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) {
        const t = n.data.trim(); if (!t || !n.parentElement || /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)) continue;
        if (re.test(t) && !iDhene(t) && dukshem(n.parentElement)) out.add(t);
      } else {
        ['placeholder', 'title', 'aria-label'].forEach(a => { const v = n.getAttribute(a); if (v && re.test(v) && !iDhene(v) && dukshem(n)) out.add('[' + a + '] ' + v); });
      }
    }
    return [...out];
  }, { SHQIP: SHQIP.toString(), shembull });
}
async function faqe(b, pc) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
  await p.waitForTimeout(1500);
  return { p, ctx };
}
// Klikon një nga një butonat e dukshëm të një faqeje (pa ata që fshijnë, dalin ose ndërrojnë gjuhën) dhe mbledh tekstet e dritareve
async function butonat(p, emri, nav, shembull, shto, max) {
  const indekso = () => p.evaluate(() => {
    const PA = /sign out|delete|remove|leave|clear|reset|restart|disconnect|log ?out|Shqip|English|install|download|share|print|camera|scan|photo|gallery|excel|pdf|export|import/i;
    const l = [...document.querySelectorAll('button, [role="button"], .kategori-rresht, a[href^="#"]')].filter(b => {
      const r = b.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return false;
      if (b.closest('[data-pa-perkthim]') || b.disabled) return false;
      const t = (b.textContent + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.title || '')).trim();
      return !PA.test(t) && !PA.test(b.id || '');
    });
    l.forEach((b, i) => b.setAttribute('data-zv', i));
    return l.length;
  });
  await nav(); let n = Math.min(await indekso(), max || 30);
  for (let i = 0; i < n; i++) {
    await p.reload(); await p.waitForTimeout(900); await nav(); await indekso();
    try {
      await p.evaluate(i => { const b = document.querySelector('[data-zv="' + i + '"]'); if (b) b.click(); }, i);
      await p.waitForTimeout(500);
      shto(emri + ' #' + i, await mbledh(p, shembull));
    } catch (e) { /* faqja u rihap: vazhdo */ }
  }
}
const klik = async (p, sel) => { try { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await p.waitForTimeout(450); } catch (e) { /* ok */ } };

(async () => {
  const b = await chromium.launch();
  const mbetur = {};
  const shto = (ku, l) => l.forEach(t => { (mbetur[t] = mbetur[t] || new Set()).add(ku); });
  // ===== 1. Telefoni =====
  {
    const { p, ctx } = await faqe(b, false);
    await klik(p, '#pkVizitor'); await p.waitForTimeout(1800);
    ok((await p.evaluate(() => window.StokuGjuha && window.StokuGjuha.gjuha())) === 'sq', '1. parazgjedhja: shqip');
    await klik(p, '#btnOpsione'); await klik(p, '#tabPamja');
    ok(await p.evaluate(() => document.querySelectorAll('#segGjuha button').length === 2 && document.querySelector('#segGjuha button.aktiv').dataset.v === 'sq'), '1a. Pamja ka "Gjuha" me Shqip/English (Shqip aktiv)');
    await Promise.all([p.waitForNavigation(), p.evaluate(() => document.querySelector('#segGjuha button[data-v="en"]').click())]);
    await p.waitForTimeout(1800);
    ok((await p.evaluate(() => localStorage.getItem('stoku:gjuha'))) === 'en' && (await p.evaluate(() => document.documentElement.lang)) === 'en', '1b. "English" ruhet dhe faqja rihapet në anglisht');
    const shembull = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}'); const f = JSON.parse(localStorage.getItem('stoku:folderat:v1') || '[]');
      const af = JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]');
      return [].concat(Object.values(pr).map(x => x.emri), Object.values(pr).map(x => x.furnizuesi), (Array.isArray(f) ? f : Object.values(f)).map(x => x && x.emri), af.map(x => x.emri), af.map(x => x.furnizuesi), af.map(x => x.marketi)).filter(Boolean); });
    shto('tel/ballina', await mbledh(p, shembull));
    ok(/Home|Stock|Expiry/.test(await p.textContent('#tabet')), '1c. tabet në anglisht', await p.textContent('#tabet'));
    for (const t of ['#tabMalli', '#btnAfatet', '#btnEkipi', '#tabBallina']) { await klik(p, t); shto('tel ' + t, await mbledh(p, shembull)); }
    await klik(p, '#tabMalli'); await klik(p, '.folder-karta'); shto('tel/folderi', await mbledh(p, shembull));
    await klik(p, '#btnOpsione'); shto('tel/cilesimet', await mbledh(p, shembull));
    const kat = await p.evaluate(() => [...document.querySelectorAll('.kategori-rresht[data-faqe]')].map(e => e.id).filter(Boolean));
    for (const k of kat) { await klik(p, '#btnOpsione'); await klik(p, '#' + k); shto('tel/cil ' + k, await mbledh(p, shembull)); }
    for (const [emri, nav] of [['tel/malli', async () => { await klik(p, '#tabMalli'); }], ['tel/folderi', async () => { await klik(p, '#tabMalli'); await klik(p, '.folder-karta'); }],
      ['tel/afatet', async () => { await klik(p, '#btnAfatet'); }], ['tel/grupi', async () => { await klik(p, '#btnEkipi'); }], ['tel/ballina', async () => { await klik(p, '#tabBallina'); }]]) {
      await butonat(p, emri, nav, shembull, shto, 30);
    }
    // kthimi në shqip
    await klik(p, '#btnOpsione'); await klik(p, '#tabPamja');
    await Promise.all([p.waitForNavigation(), p.evaluate(() => document.querySelector('#segGjuha button[data-v="sq"]').click())]);
    await p.waitForTimeout(1500);
    ok((await p.evaluate(() => document.documentElement.lang)) === 'sq' && /Malli|Afatet/.test(await p.textContent('#tabet')), '1d. "Shqip" e kthen pamjen shqip');
    await ctx.close();
  }
  // ===== 2. PC =====
  {
    const { p, ctx } = await faqe(b, true);
    await klik(p, '#pkVizitor'); await p.waitForTimeout(1800);
    await klik(p, '#btnOpsione');
    ok(await p.evaluate(() => document.querySelectorAll('#opsGjuha button').length === 2), '2. PC: Pamja ka "Gjuha"');
    await Promise.all([p.waitForNavigation(), p.evaluate(() => document.querySelector('#opsGjuha button[data-v="en"]').click())]);
    await p.waitForTimeout(1800);
    ok((await p.evaluate(() => document.documentElement.lang)) === 'en', '2a. PC në anglisht');
    const shembull = await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}'); const af = JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]');
      const f = JSON.parse(localStorage.getItem('stoku:folderat:v1') || '[]');
      return [].concat(Object.values(pr).map(x => x.emri), Object.values(pr).map(x => x.furnizuesi), (Array.isArray(f) ? f : Object.values(f)).map(x => x && x.emri), af.map(x => x.emri), af.map(x => x.furnizuesi), af.map(x => x.marketi)).filter(Boolean); });
    for (const h of ['#/ballina', '#/malli', '#/afatet', '#/grupi']) { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(700); shto('pc ' + h, await mbledh(p, shembull)); }
    await klik(p, '#btnOpsione');
    const fq = await p.evaluate(() => [...document.querySelectorAll('.ops-nav button[data-faqe], [data-faqe]')].filter(e => e.tagName === 'BUTTON').map(e => e.dataset.faqe));
    for (const f of [...new Set(fq)]) { await klik(p, 'button[data-faqe="' + f + '"]'); shto('pc/cil ' + f, await mbledh(p, shembull)); }
    for (const h of ['#/ballina', '#/malli', '#/afatet', '#/grupi']) {
      await butonat(p, 'pc ' + h, async () => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(600); }, shembull, shto, 30);
    }
    await ctx.close();
  }
  await b.close();
  const l = Object.keys(mbetur);
  fs.writeFileSync(__dirname + '/r5-v355-mbetur.txt', l.map(t => t + '\t' + [...mbetur[t]].join(', ')).join('\n'));
  ok(l.length === 0, '3. asnjë tekst shqip i mbetur në pamjet e hapura (anglisht)', l.length + ' (lista: teste/r5-v355-mbetur.txt)');
  // Rregulla e përhershme: çdo tekst i pamjes ka përkthim (web + Android)
  const nx = require('child_process').spawnSync('python3', [__dirname + '/perkthimi-nxirr.py', 'krejt'], { encoding: 'utf8' });
  const pa = JSON.parse(nx.stdout || '[]');
  ok(pa.length === 0, '4. çdo tekst i pamjes (web + Android) ka anglisht te perkthimi/en.json', pa.slice(0, 10));
  const fj = fs.readFileSync(__dirname + '/../perkthimi-en.js', 'utf8'), en = JSON.parse(fs.readFileSync(__dirname + '/../perkthimi/en.json', 'utf8'));
  ok(fj.indexOf(JSON.stringify(en.fjalet).slice(0, 200)) !== -1 && JSON.parse(fs.readFileSync(__dirname + '/../vendas/app/src/main/assets/en.json', 'utf8')).modelet.length === en.modelet.length,
    '4a. perkthimi-en.js dhe assets/en.json të gjeneruara nga en.json (python3 teste/perkthimi-gjenero.py)');
  console.log(g ? 'GABIME: ' + g : 'KREJT OK');
  process.exit(g ? 1 : 0);
})();
