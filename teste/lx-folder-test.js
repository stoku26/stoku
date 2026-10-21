// v208: PC "Kontrollo fletën e lexuar" (stok): zgjedhja e folderit e ngushtë + "+ Folder i ri…" si në telefon
const { chromium } = require('./pw.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(); const err = [];
  for (const tema of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'mendurberisha@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
        degjo: () => () => {}, degjoFletet: cb => { window.__cbFletet = cb; return () => {}; }, fshijFleten: async () => ({ ok: true }) };
      if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1');
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', '1'); localStorage.setItem('stoku:te-rejat:pare', '999');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2', emri: 'Pije' }]));
      localStorage.setItem('stoku:produktet:v2', '{}');
    });
    const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message));
    await p.goto('http://127.0.0.1:8765/pc.html'); await p.waitForTimeout(1200);
    const T = '[' + tema + ']';
    const fleta = { id: 'flX', lloji: 'stok', krijuarSe: Date.now(), nga: 'mendurberisha', foto: '', rreshtat: [{ barkodi: '3860001234567', emri: 'Ujë Rugove 1.5L', sasia: 150, furnizuesi: 'Meka' }, { barkodi: '5449000000996', emri: 'Coca-Cola 0.5L', sasia: 120, furnizuesi: 'Coca-Cola' }] };
    await p.evaluate(f => window.__cbFletet([f]), fleta); await p.waitForTimeout(300);
    await p.click('#toastBtn'); await p.waitForTimeout(400);
    const w = await p.evaluate(() => document.getElementById('lxFolderi').getBoundingClientRect().width);
    const opsionet = await p.$$eval('#lxFolderi option', x => x.map(o => o.textContent));
    ok(await p.isVisible('#lxFolderKuti') && w <= 270 && opsionet.join('|') === 'Ushqimore|Pije|+ Folder i ri…', T + ' zgjedhja e folderit e ngushtë, me "+ Folder i ri…"', { w, opsionet });
    await p.screenshot({ path: __dirname + '/lx-folder-' + tema + '.png', clip: { x: 0, y: 0, width: 1600, height: 420 } });
    // "+ Folder i ri…" → dialogu i folderit mbi kontrollin e fletës; "Anulo" (Esc) e mbyll vetëm atë
    await p.selectOption('#lxFolderi', '__ri__'); await p.waitForTimeout(300);
    const zFl = await p.evaluate(() => [getComputedStyle(document.getElementById('dlgFolder')).zIndex, getComputedStyle(document.getElementById('dlgLexim')).zIndex]);
    ok(await p.evaluate(() => document.getElementById('dlgFolder').classList.contains('hapur')) && (await p.inputValue('#lxFolderi')) === 'f1' && +zFl[0] > +zFl[1], T + ' hapet "Folder i ri" mbi fletën (zgjedhja mbetet Ushqimore)', zFl);
    await p.screenshot({ path: __dirname + '/lx-folder-ri-' + tema + '.png' });
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    ok(!(await p.evaluate(() => document.getElementById('dlgFolder').classList.contains('hapur'))) && await p.evaluate(() => document.getElementById('dlgLexim').classList.contains('hapur')) && (await p.inputValue('#lxFolderi')) === 'f1', T + ' Esc mbyll vetëm "Folder i ri"; fleta mbetet e hapur');
    // krijo folderin e ri
    await p.selectOption('#lxFolderi', '__ri__'); await p.waitForTimeout(250);
    await p.fill('#flEmri', 'Pije Freskuese'); await p.click('#flRuaj'); await p.waitForTimeout(300);
    const fid = await p.inputValue('#lxFolderi'), emriSel = await p.$eval('#lxFolderi', s => s.options[s.selectedIndex].textContent);
    ok(emriSel === 'Pije Freskuese' && await p.evaluate(() => document.getElementById('dlgLexim').classList.contains('hapur')) && !/folder/.test(await p.evaluate(() => location.hash)), T + ' folderi i ri krijohet dhe zgjidhet; fleta mbetet e hapur', { emriSel, hash: await p.evaluate(() => location.hash) });
    // importi shkon te folderi i ri
    await p.click('#lxRuaj'); await p.waitForTimeout(500);
    const pr = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}'));
    const neRi = Object.keys(pr).filter(k => k.indexOf(fid + '::') === 0);
    ok(neRi.length === 2, T + ' produktet u importuan te "Pije Freskuese"', Object.keys(pr));
    await ctx.close();
  }
  ok(!err.length, 'pa gabime në faqe', err);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();
