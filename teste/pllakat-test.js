// v213: anësorja e PC-së me 3 pllaka (Stoku, Afatet, Grupi): poshtë del vetëm menyja e pllakës aktive; pllaka mban mend
// faqen e fundit; pllaka aktive të kthen te faqja kryesore; numrat te pllakat; titulli i faqes pa "—". (Zëvendëson anesorja-v117.js)
const { chromium } = require('./pw.js');
let gabime = 0;
const ok = (k, m, x) => { if (!k) gabime++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1500, height: 900 }, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(([t, af]) => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'mendurberisha@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'mendurberisha' })); localStorage.setItem('stoku:te-rejat:pare', '999');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2', emri: 'Pije' }, { id: 'f3', emri: 'Fresh' }]));
      const pr = {}; for (let i = 0; i < 5; i++) pr['f' + (1 + i % 3) + '::77' + i] = { barkodi: '77' + i, emri: 'P' + i, sasia: i, kategoriaId: 'f' + (1 + i % 3), prekurSe: t };
      localStorage.setItem('stoku:produktet:v2', JSON.stringify(pr));
      localStorage.setItem('stoku:afatet:v1', JSON.stringify(af));
    }, [t, [{ id: 'a1', emri: 'Skaduar 1', data: d(-3), statusi: 'aktiv', ndryshuarSe: t }, { id: 'a2', emri: 'Skaduar 2', data: d(-1), statusi: 'aktiv', ndryshuarSe: t },
      { id: 'a3', emri: 'Afër', data: d(9), statusi: 'aktiv', ndryshuarSe: t }, { id: 'a4', emri: 'Mirë', data: d(120), statusi: 'aktiv', ndryshuarSe: t }]]);
    const c = await ctx.newPage();
    c.on('pageerror', e => { gabime++; console.log('pageerror', e.message); });
    await c.goto('http://127.0.0.1:8765/pc.html#/ekipa'); await c.waitForTimeout(1500);
    const hash = () => c.evaluate(() => location.hash);
    const gjendja = () => c.evaluate(() => ({
      aktive: ['Stoku', 'Afatet', 'Ekipi'].filter(m => document.getElementById('btnAkord' + m).classList.contains('aktiv')),
      teDukshme: ['Stoku', 'Afatet', 'Ekipi'].filter(m => !document.getElementById('akord' + m + 'Trupi').hidden && document.getElementById('akord' + m + 'Trupi').offsetParent !== null)
    }));
    const vetem = async (m, msg) => { const g = await gjendja(); ok(g.aktive.join() === m && g.teDukshme.join() === m, msg, Object.assign(g, { hash: await hash() })); };
    ok(!/—/.test(await c.title()) && /•/.test(await c.title()), tema + ': titulli i faqes pa "—"', await c.title());
    ok(!(await c.$('.akordion-krye')) && (await c.$$('.sbp-pllake')).length === 3, tema + ': 3 pllaka, pa akordion');
    await vetem('Ekipi', tema + ': te Grupi: vetëm pllaka dhe menyja e Grupit');
    ok(await c.getAttribute('#btnAkordEkipi', 'aria-selected') === 'true' && await c.getAttribute('#btnAkordStoku', 'aria-selected') === 'false', tema + ': aria-selected');
    // numrat te pllakat
    ok((await c.textContent('#pllStokuNen')) === '5', tema + ': Stoku tregon numrin e produkteve', await c.textContent('#pllStokuNen'));
    ok((await c.textContent('#pllAfatetNen')) === '2 skaduar' && (await c.getAttribute('#pllAfatetNen', 'class')) === 'kuqe', tema + ': Afatet tregon të skaduarat me të kuqe', await c.textContent('#pllAfatetNen'));
    // Afatet
    await c.click('#btnAkordAfatet'); await c.waitForTimeout(400);
    ok(/afatet/.test(await hash()), tema + ': pllaka "Afatet" të çon te Afatet', await hash());
    await vetem('Afatet', tema + ': vetëm menyja e Afateve');
    await c.click('#navAfSkaduara'); await c.waitForTimeout(300);
    ok(await c.evaluate(() => document.getElementById('navAfSkaduara').classList.contains('aktiv')), tema + ': "Të skaduara" hapet nga menyja');
    await c.click('#btnAkordAfatet'); await c.waitForTimeout(300);
    ok(await c.evaluate(() => document.getElementById('navAfatet').classList.contains('aktiv')), tema + ': pllaka aktive "Afatet" të kthen te "Afatet e produkteve"');
    // Stoku: mban mend folderin
    await c.click('#btnAkordStoku'); await c.waitForTimeout(400);
    ok(/permbledhja/.test(await hash()), tema + ': pllaka "Stoku" të çon te Përmbledhja', await hash());
    await vetem('Stoku', tema + ': vetëm menyja e Stokut (me folderat)');
    await c.click('#folderat .folder-rresht:has-text("Pije")'); await c.waitForTimeout(300);
    ok(/#\/f\/f2/.test(await hash()), tema + ': folderi "Pije" hapet', await hash());
    await c.click('#btnAkordEkipi'); await c.waitForTimeout(500);
    await vetem('Ekipi', tema + ': pllaka "Grupi"');
    await c.click('#btnAkordStoku'); await c.waitForTimeout(400);
    ok(/#\/f\/f2/.test(await hash()), tema + ': kthimi te "Stoku" të çon te folderi ku ishe (Pije)', await hash());
    await c.click('#btnAkordStoku'); await c.waitForTimeout(400);
    ok(/permbledhja/.test(await hash()), tema + ': pllaka aktive "Stoku" të kthen te Përmbledhja', await hash());
    // Ndryshimi i hash-it (Mbrapa e shfletuesit) e ndërron edhe pllakën
    await c.goBack(); await c.waitForTimeout(400);
    await vetem('Stoku', tema + ': "Mbrapa" te folderi: pllaka mbetet Stoku');
    await c.evaluate(() => { location.hash = '#/afatet'; }); await c.waitForTimeout(400);
    await vetem('Afatet', tema + ': hash #/afatet e ndërron pllakën');
    await c.screenshot({ path: 'pllakat-' + tema + '.png', clip: { x: 0, y: 0, width: 300, height: 900 } });
    await ctx.close();
  }
  await b.close();
  console.log(gabime ? '\n✖ ' + gabime + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(gabime ? 1 : 0);
})();
