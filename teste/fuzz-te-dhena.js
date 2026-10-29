// Të dhëna të çuditshme/të dëmtuara në localStorage dhe cloud: faqet s'duhet të rrëzohen
const { chromium } = require('./pw.js');
const gabime = [];
const cloud = { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2' }, null, { id: 'f3', emri: '' }],
  produktet: [{ barkodi: '1', emri: null, sasia: 3, kategoriaId: 'f1', prekurSe: 1 }, { barkodi: '2', emri: 'Pa sasi', kategoriaId: 'f1' },
    { barkodi: 3, emri: 'Barkod numër', sasia: 2, kategoriaId: 'f1' }, null, { barkodi: '4', emri: 'Folder i humbur', sasia: 'x', kategoriaId: 'zzz', prekurSe: 5 },
    { barkodi: '5', emri: 'Negativ', sasia: -4, kategoriaId: 'f2', prekurSe: 2 }],
  afatet: [{ id: 'a1', emri: 'Pa datë', statusi: 'aktiv' }, { id: 'a2', data: '2026-02-30', emri: 'Datë e gabuar' }, { id: 'a3', data: '2020-01-01', emri: null, barkodi: '', sasia: '' },
    null, { emri: 'Pa id' }, { id: 'a4', data: '2027-01-01', emri: 'Hequr pa kohë', statusi: 'hequr' }, { id: 'a5', data: '2026-10-05', emri: 'Sasi tekst', sasia: 'dhjetë', furnizuesi: 42 }],
  fshira: null, rendiKoha: 'abc' };
const MOCK = (c) => {
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'test@stoku-app.local' }), token: async () => 't',
    merr: async () => ({ ok: true, gjendja: JSON.parse(JSON.stringify(c)) }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(JSON.parse(JSON.stringify(c))) }),
    ruaj: async () => ({ ok: true }), degjo: () => () => {}, degjoFletet: () => () => {}, dergoFleten: async () => ({ ok: true }) };
  localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:te-rejat:pare', '999');
};
(async () => {
  const b = await chromium.launch();
  for (const pc of [false, true]) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1500, height: 900 }, serviceWorkers: 'block' } : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(MOCK, cloud);
    const p = await ctx.newPage();
    const em = pc ? 'PC' : 'TEL';
    p.on('pageerror', e => gabime.push(em + ' pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) gabime.push(em + ' console: ' + m.text().slice(0, 200)); });
    p.on('dialog', d => d.accept());
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(1500);
    const klik = async s => { try { await p.click(s, { timeout: 1500 }); await p.waitForTimeout(250); } catch (e) { gabime.push(em + ' s\'u klikua ' + s); } };
    if (pc) {
      for (const h of ['#/te-gjitha', '#/afatet', '#/f/f1', '#/f/f2', '#/ekipa', '#/permbledhja']) { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(400); }
      try { await p.fill('#kerkoGlobal', 'a', { timeout: 1500 }); } catch (e) { gabime.push(em + ' kerkoGlobal'); } await p.waitForTimeout(300);
    } else {
      await klik('.folder-karta'); try { await p.click('#btnKerko', { timeout: 1500 }); await p.fill('#kerko', 'n', { timeout: 1500 }); } catch (e) { gabime.push(em + ' #kerko s\'u duk (folderi s\'u hap?)'); } await p.waitForTimeout(200); await p.goBack(); await p.waitForTimeout(400); console.log('TEL pas mbrapa:', p.url());
      await klik('#btnAfatet'); for (const f of ['skaduar', 'afer', 'hequr', 'aktive']) { try { await p.click('#afFiltrat button[data-f="' + f + '"]', { timeout: 800 }); await p.waitForTimeout(150); } catch (e) {} }
      try { await p.fill('#afKerko', 'a', { timeout: 1500 }); } catch (e) { gabime.push(em + ' #afKerko s\'u duk'); } await p.waitForTimeout(200);
      await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(300);
      await klik('#btnEkipi'); await klik('#btnOpsione');
    }
    console.log(em, 'url:', p.url());
    await ctx.close();
  }
  console.log(gabime.length ? 'GABIME:\n' + gabime.join('\n') : 'Asnjë gabim');
  await b.close();
})();
