// v163: eksporti sipas furnizuesit (tel + PC), tabet në iPhone Safari, hyrja nga fjalëkalimi i ruajtur
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const URL0 = 'http://127.0.0.1:8765/';
(async () => {
  const b = await chromium.launch();
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const afatet = [
    { id: 'a1', barkodi: '1', emri: 'Kos', data: d(3), sasia: 5, furnizuesi: 'Meridian', statusi: 'aktiv', ndryshuarSe: t },
    { id: 'a2', barkodi: '2', emri: 'Ujë', data: d(5), sasia: 2, furnizuesi: 'meridian ', statusi: 'aktiv', ndryshuarSe: t },
    { id: 'a3', barkodi: '3', emri: 'Bukë', data: d(4), sasia: 1, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t },
    { id: 'a4', barkodi: '4', emri: 'Djathë', data: d(6), statusi: 'aktiv', ndryshuarSe: t }
  ];
  // ---------- 1. Telefoni: eksporti sipas furnizuesit ----------
  {
    const F = krijoFirestore({ rregullat: 'reja' });
    F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
    F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet, fshira: {} });
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
    await p.goto(URL0 + 'index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => { window.__ndaj = []; });
    await p.click('#btnAfatet'); await p.waitForTimeout(500);
    await p.click('#afExcel'); await p.waitForTimeout(200); await p.click('#afEksporto'); await p.waitForTimeout(300);
    const opt = await p.$$eval('#axFurn option', l => l.map(o => o.value + '=' + o.textContent));
    ok(await p.isVisible('#axFurn') && opt.join('|') === '=Të gjithë furnizuesit|meridian=Meridian (2)|vipa=Vipa (1)|__pa__=Pa furnizues (1)', '1. tel: lista e furnizuesve (pa dallim shkronjash, "Pa furnizues" në fund)', opt);
    await p.selectOption('#axFurn', 'meridian'); await p.waitForTimeout(150);
    ok(/2 afate të furnizuesit Meridian/.test(await p.textContent('#axNen')), '1. tel: teksti me numrin', await p.textContent('#axNen'));
    // kapet skedari (shkarkim ose "Shpërndaj")
    // v229: eksporti pyet "Dërgo në PC" ose "Shkarko këtu"; këtu: "Shkarko këtu"
    const [shk] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null),
      p.click('#axEksporto').then(() => p.waitForSelector('#dlgKuSkedari.hapur', { timeout: 4000 })).then(() => p.click('#ksKetu'))]);
    let rreshta = null;
    if (shk) {
      const fp = await shk.path(); const buf = require('fs').readFileSync(fp);
      rreshta = await p.evaluate(async (arr) => { const wb = await window.StokuXlsx.read(new Uint8Array(arr).buffer); return { emri: wb[0].name, rows: wb[0].rows.length }; }, [...buf]).catch(e => 'lexim: ' + e.message);
      ok(/^afatet_meridian_/.test(shk.suggestedFilename()), '1. tel: emri i skedarit me furnizuesin', shk.suggestedFilename());
    }
    ok(shk && rreshta && rreshta.emri === 'Meridian', '1. tel: fleta "Meridian"', rreshta);
    await ctx.close();
  }
  // ---------- 2. PC: eksporti sipas furnizuesit ----------
  {
    const F = krijoFirestore({ rregullat: 'reja' });
    F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
    F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet, fshira: {} });
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'pc');
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
    await p.goto(URL0 + 'pc.html#/afatet'); await p.waitForTimeout(2500);
    await p.click('#afBtnExcel'); await p.waitForTimeout(300);
    const opt = await p.$$eval('#aeFurn option', l => l.map(o => o.textContent));
    ok(await p.isVisible('#aeFurn') && opt.length === 4, '2. PC: zgjedhja e furnizuesit', opt);
    await p.selectOption('#aeFurn', 'vipa'); await p.waitForTimeout(150);
    ok(/1 afat të furnizuesit Vipa/.test(await p.textContent('#aeInfo')), '2. PC: teksti', await p.textContent('#aeInfo'));
    const [shk] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('#aeBtn')]);
    ok(shk && /^afatet_vipa_/.test(shk.suggestedFilename()), '2. PC: skedari i Vipës', shk && shk.suggestedFilename());
    if (shk) {
      const buf = require('fs').readFileSync(await shk.path());
      const r = await p.evaluate(async (arr) => { const wb = await window.StokuXlsx.read(new Uint8Array(arr).buffer); return wb.map(f => f.name + ':' + f.rows.length); }, [...buf]).catch(e => 'lexim: ' + e.message);
      ok(Array.isArray(r) && r[0].startsWith('Vipa:'), '2. PC: fleta e parë "Vipa"', r);
    }
    // muaji ndryshon → lista e furnizuesve rifreskohet
    await ctx.close();
  }
  // ---------- 3. iPhone Safari: tabet pa hapësirë shtesë ----------
  {
    const F = krijoFirestore({ rregullat: 'reja' });
    F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
    const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
    for (const [emri, standalone] of [['Safari', false], ['nga ekrani kryesor', true]]) {
      const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', isMobile: true, hasTouch: true });
      await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
      if (standalone) await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
      await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
      const p = await ctx.newPage();
      await p.goto(URL0 + 'index.html'); await p.waitForTimeout(1500);
      const r = await p.evaluate(() => ({ kl: document.documentElement.classList.contains('ios-shfletues'), sab: getComputedStyle(document.documentElement).getPropertyValue('--sab').trim(), h: document.getElementById('tabet').getBoundingClientRect().height, bottom: innerHeight - document.getElementById('tabet').getBoundingClientRect().bottom }));
      ok(standalone ? !r.kl : (r.kl && r.sab === '0px' && Math.round(r.h) === 66 && r.bottom === 0), '3. iPhone ' + emri + ': ' + (standalone ? 'mbetet env()' : '--sab 0, tabet 66px në fund'), r);
      await ctx.close();
    }
  }
  // ---------- 4. Hyrja nga fjalëkalimi i ruajtur (Chrome) ----------
  async function porta(opt) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript((o) => {
      window.__thirrje = [];
      if (o.dil) localStorage.setItem('stoku:porta:dil', '1');
      window.PasswordCredential = function (d) { this.type = 'password'; this.id = d.id; this.password = d.password; this.name = d.name; };
      Object.defineProperty(navigator, 'credentials', { value: {
        get: async (q) => { window.__thirrje.push('get:' + q.mediation); return o.kred ? { type: 'password', id: o.kred[0], password: o.kred[1] } : null; },
        store: async (k) => { window.__thirrje.push('store:' + k.id + ':' + k.password); return k; },
        preventSilentAccess: async () => { window.__thirrje.push('prevent'); }
      } });
      let user = null;
      document.addEventListener('DOMContentLoaded', () => {
        window.__stokuCloud = { authGati: true, perdoruesiAktual: () => user,
          hyr: async (u, p) => { window.__thirrje.push('hyr:' + u + ':' + p); if (p !== 'sakte1') return { ok: false, kodi: 'auth/invalid-credential' }; user = { uid: 'u1', email: u + '@stoku-app.local' }; setTimeout(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi')), 20); return { ok: true }; },
          regjistrohu: async () => ({ ok: false }), dil: async () => {}, token: async () => null };
        window.dispatchEvent(new Event('stoku-cloud-gati'));
      }, { once: true });
    }, opt);
    const p = await ctx.newPage();
    p.on('pageerror', e => { if (!/ekipa|StokuEkipa|cloud/i.test(e.message)) { g++; console.log('pageerror:', e.message); } });
    await p.goto(URL0 + 'index.html'); await p.waitForTimeout(1500);
    return { p, ctx };
  }
  {
    const { p, ctx } = await porta({ kred: ['agim', 'sakte1'] });
    const th = await p.evaluate(() => window.__thirrje);
    ok(th.includes('get:optional') && th.includes('hyr:agim:sakte1') && !(await p.evaluate(() => window.StokuPorta.eHapur())), '4a. pa hyrje (të dhëna të fshira) → hyn vetë me fjalëkalimin e ruajtur', th);
    await ctx.close();
  }
  {
    const { p, ctx } = await porta({ kred: ['agim', 'sakte1'], dil: true });
    const th = await p.evaluate(() => window.__thirrje);
    ok(th.includes('get:silent'), '4b. pas "Dil" me dorë: vetëm pa pyetje (silent)', th);
    await ctx.close();
  }
  {
    const { p, ctx } = await porta({ kred: ['agim', 'gabim'] });
    const th = await p.evaluate(() => window.__thirrje);
    ok(th.includes('hyr:agim:gabim') && await p.evaluate(() => window.StokuPorta.eHapur()) && await p.inputValue('#pkEmri') === 'agim' && /gabim/.test(await p.textContent('#pkGabim')), '4c. fjalëkalim i vjetër → forma me emrin dhe mesazhin', await p.textContent('#pkGabim'));
    await ctx.close();
  }
  {
    const { p, ctx } = await porta({ kred: null });
    await p.fill('#pkEmri', 'agim'); await p.fill('#pkFjalekalimi', 'sakte1'); await p.click('#pkDergo'); await p.waitForTimeout(800);
    const th = await p.evaluate(() => window.__thirrje);
    ok(th.includes('store:agim:sakte1') && !(await p.evaluate(() => window.StokuPorta.eHapur())), '4d. hyrja me dorë → fjalëkalimi i jepet menaxherit (Chrome)', th);
    await p.evaluate(() => window.StokuPorta.dilMeDore());
    ok(await p.evaluate(() => localStorage.getItem('stoku:porta:dil') === '1' && window.__thirrje.includes('prevent')), '4e. "Dil" → preventSilentAccess + shenja');
    await ctx.close();
  }
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK'); await b.close();
})();
