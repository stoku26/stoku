// v220: "Ke harruar fjalëkalimin?" te porta: kërkesa → kodi 6-shifror (nga administratori) → fjalëkalimi i ri dy herë → hyrja
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
const S = __dirname + '/';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const MOCK = () => {
  window.__hyrjet = [];
  function u() { var x = sessionStorage.getItem('mockUser'); return x ? { uid: x, email: x.replace(/^u_/, '') + '@stoku-app.local' } : null; }
  window.__stokuCloud = { authGati: true, perdoruesiAktual: u, token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {},
    hyr: async (emri, fj) => { window.__hyrjet.push([emri, fj]); if (fj !== 'iRi12345') return { ok: false, kodi: 'auth/invalid-credential' };
      sessionStorage.setItem('mockUser', 'u_' + emri); setTimeout(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi')), 30); return { ok: true }; },
    regjistrohu: async () => ({ ok: false }) };
};
// Worker-i i rremë (163): kodi 123456
function serveri() {
  const st = { aktiv: false, prova: 0, kerkesat: [], menyra: 'ri', skadoi: false };
  st.trajto = async route => {
    const req = route.request();
    if (st.menyra === 'rrjeti') return route.abort();
    const h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'POST, OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    const rr = new URL(req.url()).pathname, b = JSON.parse(req.postData() || '{}');
    st.kerkesat.push([rr, b]);
    const pergj = (s, j) => route.fulfill({ status: s, headers: Object.assign({ 'content-type': 'application/json' }, h), body: JSON.stringify(j) });
    if (st.menyra === 'vjeter') return pergj(401, { ok: false, arsye: 'pa-hyrje' });
    const skadon = Date.now() + 30 * 60000;
    if (rr === '/fjalekalimi/kerko') {
      if (b.emri !== 'agim') return pergj(404, { ok: false, arsye: 's-ekziston' });
      if (st.aktiv) return pergj(200, { ok: true, ekziston: true, skadon });
      st.aktiv = true; st.prova = 0; return pergj(200, { ok: true, skadon });
    }
    if (st.skadoi) return pergj(410, { ok: false, arsye: 'skadoi' });
    if (b.kodi !== '123456') { st.prova++; return pergj(400, { ok: false, arsye: 'kodi', mbetur: 5 - st.prova }); }
    if (rr === '/fjalekalimi/verifiko') return pergj(200, { ok: true });
    if (String(b.fjalekalimi || '').length < 6) return pergj(400, { ok: false, arsye: 'i-dobet' });
    st.aktiv = false; st.fjalekalimi = b.fjalekalimi; return pergj(200, { ok: true });
  };
  return st;
}
async function faqe(b, pc, st, tema) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1280, height: 820 }, serviceWorkers: 'block', colorScheme: tema || 'light' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: tema || 'light' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.route('https://stoku-push.mendurb.workers.dev/fjalekalimi/**', st.trajto);
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
  await p.waitForTimeout(1500);
  return { p, ctx };
}
const duket = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const st = getComputedStyle(e);
  return st.display !== 'none' && st.visibility !== 'hidden' && !!(e.offsetWidth || e.offsetHeight) && !e.closest('.pk-fsheh'); }, sel);
const teksti = (p, sel) => p.evaluate(s => (document.querySelector(s) || {}).textContent || '', sel);
const dergo = async p => { await p.click('#pkRivDergo'); await p.waitForTimeout(450); };

(async () => {
  const b = await chromium.launch();
  // ===== 1. Telefoni: krejt rruga =====
  {
    const st = serveri();
    const { p, ctx } = await faqe(b, false, st);
    ok(await duket(p, '#pkHarrova'), '1. "Ke harruar fjalëkalimin?" te tabi "Hyr"');
    await p.click('#pkTabKrijo'); await p.waitForTimeout(150);
    ok(!(await duket(p, '#pkHarrova')), '1b. s\'del te "Krijo llogari"');
    await p.click('#pkTabHyr'); await p.fill('#pkEmri', 'Agim');
    await p.screenshot({ path: S + 'riv-0-porta.png' });
    await p.click('#pkHarrova'); await p.waitForTimeout(200);
    ok(await duket(p, '#pkRiv') && !(await duket(p, '#pkForma')) && (await p.inputValue('#pkRivEmri')) === 'Agim', '1c. hapet "Fjalëkalimi i harruar", me emrin e shkruar', await p.inputValue('#pkRivEmri'));
    await p.screenshot({ path: S + 'riv-1-emri.png' });
    await p.fill('#pkRivEmri', ''); await dergo(p);
    ok((await teksti(p, '#pkRivGabim')) === 'Shkruaj emrin e përdoruesit.' && st.kerkesat.length === 0, '1d. pa emër: s\'dërgohet', await teksti(p, '#pkRivGabim'));
    await p.fill('#pkRivEmri', 'nukka'); await dergo(p);
    ok(/S'ka llogari me këtë emër/.test(await teksti(p, '#pkRivGabim')) && await duket(p, '#pkRivEmri'), '1e. llogari që s\'ekziston', await teksti(p, '#pkRivGabim'));
    await p.fill('#pkRivEmri', 'Agim'); await dergo(p);
    const t1 = await teksti(p, '#pkRivTeksti');
    ok(/Kërkesa u dërgua te administratori/.test(t1) && /vlen deri në \d\d:\d\d/.test(t1) && await duket(p, '#pkRivKodi') && (await teksti(p, '#pkRivLlogaria')) === 'Llogaria: agim', '1f. kërkesa u dërgua; hapi i kodit', t1);
    ok(JSON.stringify(st.kerkesat[st.kerkesat.length - 1]) === JSON.stringify(['/fjalekalimi/kerko', { emri: 'agim' }]), '1g. serverit i shkon emri me shkronja të vogla', st.kerkesat[st.kerkesat.length - 1]);
    await p.screenshot({ path: S + 'riv-2-kodi.png' });
    await p.fill('#pkRivKodi', 'ab12'); await dergo(p);
    ok((await p.inputValue('#pkRivKodi')) === '12' && /Shkruaj kodin 6-shifror/.test(await teksti(p, '#pkRivGabim')), '1h. vetëm shifra; kod i shkurtër s\'dërgohet', await p.inputValue('#pkRivKodi'));
    await p.fill('#pkRivKodi', '000000'); await dergo(p);
    ok((await teksti(p, '#pkRivGabim')) === 'Kodi s\'është i saktë. Të kanë mbetur 4 prova.', '1i. kod i gabuar: sa prova kanë mbetur', await teksti(p, '#pkRivGabim'));
    await p.click('#pkRivSerish'); await p.waitForTimeout(450);
    ok(/Kodi është dërguar tashmë te administratori/.test(await teksti(p, '#pkRivTeksti')), '1j. "Dërgo sërish": kodi është dërguar tashmë', await teksti(p, '#pkRivTeksti'));
    // Firebase lajmëron "pa përdorues" ndërkohë: rivendosja mbetet e hapur
    await p.evaluate(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi'))); await p.waitForTimeout(200);
    ok(await duket(p, '#pkRiv') && !(await duket(p, '#pkForma')), '1k. ngjarja e Firebase-it s\'e mbyll rivendosjen');
    await p.fill('#pkRivKodi', '123456'); await dergo(p);
    ok(/Kodi është i saktë/.test(await teksti(p, '#pkRivTeksti')) && await duket(p, '#pkRivFj1') && await duket(p, '#pkRivFj2'), '1l. kodi i saktë: fjalëkalimi i ri dy herë', await teksti(p, '#pkRivTeksti'));
    await p.screenshot({ path: S + 'riv-3-fjalekalimi.png' });
    await p.fill('#pkRivFj1', '123'); await dergo(p);
    ok(/të paktën 6 shenja/.test(await teksti(p, '#pkRivGabim')), '1m. më pak se 6 shenja', await teksti(p, '#pkRivGabim'));
    await p.fill('#pkRivFj1', 'iRi12345'); await p.fill('#pkRivFj2', 'iRi1234X'); await dergo(p);
    ok((await teksti(p, '#pkRivGabim')) === 'Fjalëkalimet nuk përputhen.', '1n. fjalëkalimet s\'përputhen', await teksti(p, '#pkRivGabim'));
    await p.click('#pkRivSy');
    ok((await p.getAttribute('#pkRivFj1', 'type')) === 'text' && (await p.getAttribute('#pkRivFj2', 'type')) === 'text', '1o. syri i shfaq të dy fushat');
    await p.fill('#pkRivFj2', 'iRi12345'); await p.click('#pkRivDergo'); await p.waitForTimeout(2500);
    ok(st.fjalekalimi === 'iRi12345' && JSON.stringify(st.kerkesat[st.kerkesat.length - 1][1]) === JSON.stringify({ emri: 'agim', kodi: '123456', fjalekalimi: 'iRi12345' }), '1p. serveri e ndryshon fjalëkalimin', st.kerkesat[st.kerkesat.length - 1]);
    const hyrjet = await p.evaluate(() => window.__hyrjet);
    ok(JSON.stringify(hyrjet) === JSON.stringify([['agim', 'iRi12345']]), '1q. hyn direkt me fjalëkalimin e ri', hyrjet);
    ok(!(await duket(p, '#porta')) && (await p.evaluate(() => localStorage.getItem('stoku:pronari-uid'))) === 'u_agim', '1r. porta mbyllet: brenda në llogari', await p.evaluate(() => localStorage.getItem('stoku:pronari-uid')));
    await ctx.close();
  }
  // ===== 2. Kthimi, kodi i skaduar, serveri i vjetër, pa internet =====
  {
    const st = serveri();
    const { p, ctx } = await faqe(b, false, st);
    await p.click('#pkHarrova'); await p.waitForTimeout(150);
    await p.click('#pkRivMbrapa'); await p.waitForTimeout(150);
    ok(await duket(p, '#pkForma') && !(await duket(p, '#pkRiv')), '2. "Kthehu te hyrja"');
    await p.click('#pkHarrova'); await p.fill('#pkRivEmri', 'agim'); await dergo(p);
    st.skadoi = true;
    await p.fill('#pkRivKodi', '123456'); await dergo(p);
    ok(await duket(p, '#pkRivEmri') && /Kodi ka skaduar/.test(await teksti(p, '#pkRivGabim')), '2b. kodi skadoi: kthehet te kërkesa e re', await teksti(p, '#pkRivGabim'));
    st.menyra = 'vjeter'; await dergo(p);
    ok(/s'është aktivizuar ende te serveri/.test(await teksti(p, '#pkRivGabim')), '2c. Worker-i i vjetër (pa 163): mesazh i qartë', await teksti(p, '#pkRivGabim'));
    st.menyra = 'rrjeti'; await dergo(p);
    ok(/S'ka lidhje me serverin/.test(await teksti(p, '#pkRivGabim')) && !(await p.isDisabled('#pkRivDergo')), '2d. pa internet: mesazh, butoni punon sërish', await teksti(p, '#pkRivGabim'));
    await ctx.close();
  }
  // ===== 3. Kompjuteri + pamjet (e errët) =====
  {
    const st = serveri();
    const { p, ctx } = await faqe(b, true, st);
    ok(await duket(p, '#pkHarrova'), '3. kompjuteri: "Ke harruar fjalëkalimin?"');
    await p.click('#pkHarrova'); await p.fill('#pkRivEmri', 'agim'); await dergo(p);
    ok(await duket(p, '#pkRivKodi'), '3b. kompjuteri: hapi i kodit');
    await p.screenshot({ path: S + 'riv-pc-kodi.png' });
    await ctx.close();
    const t = await faqe(b, false, serveri(), 'dark');
    await t.p.click('#pkHarrova'); await t.p.fill('#pkRivEmri', 'agim'); await t.p.click('#pkRivDergo'); await t.p.waitForTimeout(450);
    await t.p.screenshot({ path: S + 'riv-2-kodi-dark.png' });
    await t.ctx.close();
  }
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
