const { chromium } = require('./pw.js');
const MOCK = () => {
  window.__dalje = 0;
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'test@stoku-app.local' }), token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async () => ({ ok: false, arsye: 'offline' }),
    ruaj: async () => ({ ok: false }), degjo: () => () => {}, degjoFletet: () => () => {}, dergoFleten: async () => ({ ok: true }), dil: async () => { window.__dalje++; } };
  localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:te-rejat:pare', '999');
};
(async () => {
  const b = await chromium.launch();
  for (const pc of [false, true]) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' } : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('pageerror', e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(1500);
    const kf = pc ? ['#kfTekst', '#kfPo', '#kfJo'] : ['#konfTekst', '#konfPo', '#konfJo'];
    if (pc) await p.evaluate(() => document.getElementById('opsDil').click()); else await p.evaluate(() => document.getElementById('cloudDilBtn').click());
    await p.waitForTimeout(300); await p.click(kf[1]); await p.waitForTimeout(1200);
    const t2 = await p.textContent(kf[0]);
    await p.click(kf[2]); await p.waitForTimeout(300);
    console.log(pc ? 'PC ' : 'TEL', 'paralajmërimi:', /humbin/.test(t2), '| doli pa dashje:', await p.evaluate(() => window.__dalje));
    await ctx.close();
  }
  await b.close();
})();
