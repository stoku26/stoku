// v247: harta. Kontrollon:
// 0. njësitë: pa çelës s'ka satelit; me çelës burimi i Esri-t (me token), shtresa e fshehur derisa zgjidhet; mbi satelit
//    vetëm emrat e vendbanimeve (të bardhë) dhe pikat; CSP (5 faqet + CSP_CLOUDFLARE) lejon ibasemaps-api.arcgis.com
// 1. telefoni, administratori, pa çelës: pa butonin "Satelit"; "Marketet në hartë"
// 2. telefoni, administratori, me çelës: "Satelit" → pllakat e Esri-t (vetëm tani), "Powered by Esri", emrat mbeten;
//    zgjedhja mbahet pas rifreskimit; "Hartë" e kthen; pa shkelje CSP
// 3. çelësi refuzohet (401): kthehet te harta + mesazh
// 4. PC, merchandiseri: butoni "Satelit"; kush s'është merchandiser s'e sheh as "Harta" as "Marketet"
// 5. "Ku je?" nga çipi (Stoku dhe Afatet) edhe kur GPS-i e ka gjetur marketin: "Afër teje" me pikat e Stoku-t
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { krijoFirestore } = require('./fs-server.js');
const P = require('./harta-pllakat.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || process.env.BAZA || 'http://127.0.0.1:8765';
const RR = path.join(__dirname, '..');
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const NM = path.join(__dirname, 'npm', 'node_modules');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 200)); } z(false); });
const MAPLIBRE = fs.readFileSync(NM + '/maplibre-gl/dist/maplibre-gl.js');
const KODI = fs.readFileSync(path.join(RR, 'harta.js'), 'utf8');
const CELESI = /var ESRI_CELESI = '[^']*';/;
const meCeles = c => KODI.replace(CELESI, "var ESRI_CELESI = '" + c + "';");
function ngarkoModulin(c) { const m = { exports: {} }; vm.runInNewContext(meCeles(c), { module: m }); return m.exports; }
// PNG 256×256 me një ngjyrë (pllaka e rreme e Esri-t)
function png(w, h, rgb) {
  const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const pjesa = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const h0 = Buffer.alloc(13); h0.writeUInt32BE(w, 0); h0.writeUInt32BE(h, 4); h0[8] = 8; h0[9] = 2;
  const rr = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { rr[1 + x * 3] = rgb[0]; rr[2 + x * 3] = rgb[1]; rr[3 + x * 3] = rgb[2]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pjesa('IHDR', h0), pjesa('IDAT', zlib.deflateSync(Buffer.concat(Array(h).fill(rr)))), pjesa('IEND', Buffer.alloc(0))]);
}
const PLLAKA_ESRI = png(256, 256, [46, 92, 52]);

(async () => {
  // ================= 0. Njësitë =================
  ok(CELESI.test(KODI), '0. harta.js ka ESRI_CELESI');
  ok(require('../harta.js').kaSatelit() && /^AAPT/.test(KODI.match(CELESI)[0].split("'")[1]), '0. v249: çelësi i Esri-t është vendosur (API key i ArcGIS)');
  const S0 = ngarkoModulin(''), S1 = ngarkoModulin('celes-prove');
  const st0 = S0.stili({ tema: 'light', pikat: [], satelit: true });
  ok(!S0.kaSatelit() && !st0.sources.satelit && !st0.layers.some(l => l.id === 'satelit') && st0.layers.find(l => l.id === 'rruget').layout.visibility === 'visible', '0. pa çelës: pa satelit (edhe kur kërkohet)');
  const stH = S1.stili({ tema: 'light', pikat: [], satelit: false }), stS = S1.stili({ tema: 'dark', pikat: [], satelit: true });
  const vis = (st, id) => (st.layers.find(l => l.id === id).layout || {}).visibility;
  ok(S1.kaSatelit() && stH.sources.satelit.tiles[0] === 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=celes-prove' && stH.sources.satelit.type === 'raster', '0. me çelës: Esri World Imagery me token', stH.sources.satelit.tiles);
  ok(/Powered by .*Esri/.test(stH.sources.satelit.attribution) && /Earthstar Geographics/.test(stH.sources.satelit.attribution), '0. atribuimi i Esri-t');
  ok(vis(stH, 'satelit') === 'none' && vis(stH, 'rruget') === 'visible' && vis(stH, 'uji') === 'visible', '0. "Hartë": shtresa satelitore e fshehur (s\'kërkon pllaka)');
  ok(vis(stS, 'satelit') === 'visible' && ['uji', 'lumenjte', 'rruget', 'rruget-kufi', 'rruget-vogla'].every(id => vis(stS, id) === 'none') && stS.layers[1].id === 'satelit', '0. "Satelit": imazhi poshtë, pa ujë e rrugë');
  ok(stS.layers.filter(l => l.type === 'symbol').map(l => l.id).join() === 'vendbanimet,pikat-emri' && stS.layers.find(l => l.id === 'vendbanimet').paint['text-color'][4] === '#ffffff', '0. mbi satelit vetëm emrat e vendbanimeve (të bardhë) dhe pikat');
  const gj = S1.pikatGeoJson([{ id: 'a', uid: 'pika', emri: 'A', lat: 42.6, lng: 21.1, tjeter: true }, { id: 'b', uid: 'u1', emri: 'B', lat: 42.6, lng: 21.2 }]);
  ok(gj.features[0].properties.tjeter === true && gj.features[1].properties.tjeter === false, '0. pikat e të tjerëve (tjeter) për ngjyrën e zbehtë');
  const shenime = fs.readFileSync(path.join(RR, 'SHENIME.md'), 'utf8');
  ok(/CSP_CLOUDFLARE: `[^`]*connect-src [^;`]*https:\/\/ibasemaps-api\.arcgis\.com/.test(shenime), '0. CSP_CLOUDFLARE lejon ibasemaps-api.arcgis.com');
  const faqet = ['index.html', 'pc.html', 'privatesia.html', '404.html', 'android.html'].filter(f => !/connect-src [^;"]*https:\/\/ibasemaps-api\.arcgis\.com/.test(fs.readFileSync(path.join(RR, f), 'utf8')));
  ok(!faqet.length, '0. CSP në 5 faqet lejon ibasemaps-api.arcgis.com', faqet);
  ok(/Esri \(pamja satelitore/.test(fs.readFileSync(path.join(RR, 'privatesia.html'), 'utf8')), '0. Privatësia përmend Esri-n');

  // ================= Faqet =================
  const t = Date.now();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('pikat/p1', { emri: 'Albi 34', lat: 42.6610, lng: 21.1600, krijuarNga: 'u1', krijuarNgaEmri: 'drini', krijuarSe: t, ndryshuarSe: t });
  F.S.docs.set('pikat/p5', { emri: 'Meridian Ulpiana', lat: 42.6635, lng: 21.1630, krijuarNga: 'u2', krijuarNgaEmri: 'besa', krijuarSe: t, ndryshuarSe: t });
  const MK1 = [{ id: 'm1', emri: 'Albi 34', lat: 42.6610, lng: 21.1600, p: 'p1', ndryshuarSe: t - 9000 }];
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  // o: { pc, celesi, esriGabim, marketet, geo, pamja }
  async function faqe(uid, emri, o) {
    o = o || {};
    const opt = o.pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true };
    if (o.geo) { opt.geolocation = o.geo; opt.permissions = ['geolocation']; }
    const ctx = await b.newContext(opt);
    ctx.__esri = [];
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u === S1.MAPLIBRE_JS) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: MAPLIBRE });
      if (/^https:\/\/tiles\.openfreemap\.org\//.test(u)) return P.rrugaEPllakave(r);
      if (/^https:\/\/ibasemaps-api\.arcgis\.com\//.test(u)) {
        ctx.__esri.push(u);
        if (o.esriGabim) return r.fulfill({ status: 401, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"error":{"code":498,"message":"Invalid token."}}' });
        return r.fulfill({ status: 200, contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, body: PLLAKA_ESRI });
      }
      if (u.startsWith(PUSH)) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
      return r.abort();
    });
    // harta.js me çelësin e provës (ose pa çelës), si të ishte vendosur në repo
    await ctx.route(u => u.href.startsWith(BAZA) && u.pathname === '/harta.js', r => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: meCeles(o.celesi || '') }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', o.pc ? 'pc' : 'tel', { afatet: [] });
    if (o.marketet) await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, o.marketet);
    if (o.pamja) await ctx.addInitScript(v => { if (!localStorage.getItem('stoku:harta:pamja')) localStorage.setItem('stoku:harta:pamja', v); }, o.pamja);
    await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (o.pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && r.width > 0 && r.height > 0; }, s);
  const hartaGati = p => p.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded() && i.map.areTilesLoaded()); });
  const emratNeHarte = p => p.evaluate(() => window.StokuHarta.eFundit.map.queryRenderedFeatures().filter(f => f.layer.type === 'symbol').map(f => f.layer.id + ':' + (f.properties.emri || f.properties.name)));
  const shtresa = (p, id) => p.evaluate(x => { const m = window.StokuHarta.eFundit.map; return m.getLayer(x) ? m.getLayoutProperty(x, 'visibility') || 'visible' : 'mungon'; }, id);
  const butoni = p => p.evaluate(() => { const b = document.querySelector('#htHarta .ht-pamja-btn'); return b ? b.textContent + '|' + b.getAttribute('aria-pressed') : ''; });
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  async function hapHarten(p) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    if (await p.evaluate(() => document.getElementById('kategoriMenu').style.display === 'none')) { await p.click('#opsPrapa'); await p.waitForTimeout(200); }
    await p.click('#tabHarta'); await p.waitForTimeout(400);
  }

  // ================= 1. Pa çelës =================
  const { p: a0 } = await faqe('uA', 'mendurberisha');
  await a0.click('#btnOpsione'); await a0.waitForTimeout(500);
  ok(await prit(async () => await duket(a0, '#tabHarta') && (await a0.textContent('#tabHartaStatus')) === 'Marketet në hartë'), '1. admini: "Harta · Marketet në hartë"', await a0.textContent('#tabHartaStatus'));
  await hapHarten(a0);
  ok(await prit(async () => await hartaGati(a0), 30000), '1. harta u hap');
  ok(!(await a0.$('#htHarta .ht-pamja-btn')) && await shtresa(a0, 'satelit') === 'mungon', '1. pa çelës: pa butonin "Satelit"');
  ok(!a0.__gab.length && !(await a0.evaluate(() => window.__csp)).length, '1. pa gabime, pa CSP', [a0.__gab, await a0.evaluate(() => window.__csp)]);

  // ================= 2. Me çelës =================
  const { p: a1, ctx: c1 } = await faqe('uA', 'mendurberisha', { celesi: 'celes-prove' });
  await hapHarten(a1);
  ok(await prit(async () => await hartaGati(a1), 30000), '2. harta u hap');
  ok(await butoni(a1) === 'Satelit|false' && await duket(a1, '#htHarta .ht-pamja-btn') && await shtresa(a1, 'satelit') === 'none', '2. butoni "Satelit"; shtresa satelitore e fshehur', await butoni(a1));
  await a1.waitForTimeout(800);
  ok(c1.__esri.length === 0 && !(await duket(a1, '#htHarta .ht-esri')), '2. asnjë kërkesë te Esri para se të zgjidhet "Satelit"', c1.__esri.length);
  await a1.click('#htHarta .ht-pamja-btn');
  ok(await prit(async () => await shtresa(a1, 'satelit') === 'visible' && await butoni(a1) === 'Hartë|true'), '2. "Satelit": shtresa del, butoni bëhet "Hartë"', await butoni(a1));
  ok(await prit(async () => c1.__esri.length > 0) && c1.__esri.every(u => /\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+\?token=celes-prove$/.test(u)), '2. pllakat nga Esri me çelësin', c1.__esri.slice(0, 2));
  // sa janë hapur burimet (5 s pas hapjes) "Powered by Esri" është brenda tyre; pastaj del si etiketë që s'palohet
  ok(await prit(async () => await duket(a1, '#htHarta .ht-esri') && (await a1.textContent('#htHarta .ht-esri')) === 'Powered by Esri' && await a1.evaluate(() => !document.querySelector('#htHarta .maplibregl-compact-show')), 12000), '2. "Powered by Esri" në hartë (pas palosjes së burimeve)');
  ok(await shtresa(a1, 'rruget') === 'none' && await shtresa(a1, 'uji') === 'none', '2. mbi satelit pa rrugë e ujë të vizatuara');
  ok(await prit(async () => await hartaGati(a1), 20000) && await prit(async () => (await emratNeHarte(a1)).some(x => /^vendbanimet:Prishtinë$/.test(x)) && (await emratNeHarte(a1)).includes('pikat-emri:Albi 34')), '2. emrat e vendbanimeve dhe pikat mbeten mbi satelit', await emratNeHarte(a1));
  ok(await a1.evaluate(() => /Esri/.test(document.querySelector('#htHarta .maplibregl-ctrl-attrib').textContent)), '2. atribuimi i Esri-t te burimet e hartës');
  ok(await a1.evaluate(() => localStorage.getItem('stoku:harta:pamja')) === 'satelit', '2. zgjedhja ruhet në pajisje');
  await a1.screenshot({ path: __dirname + '/v247-tel-satelit.png' });
  ok(!(await a1.evaluate(() => window.__csp)).length && !a1.__gab.length, '2. pa shkelje të CSP-së, pa gabime JS', [await a1.evaluate(() => window.__csp), a1.__gab]);
  await a1.reload(); await a1.waitForTimeout(2500);
  await hapHarten(a1);
  ok(await prit(async () => await hartaGati(a1), 30000) && await prit(async () => await shtresa(a1, 'satelit') === 'visible' && await butoni(a1) === 'Hartë|true'), '2. pas rifreskimit hapet vetë "Satelit"', await butoni(a1));
  await a1.click('#htHarta .ht-pamja-btn');
  ok(await prit(async () => await shtresa(a1, 'satelit') === 'none' && await shtresa(a1, 'rruget') === 'visible' && await butoni(a1) === 'Satelit|false' && !(await duket(a1, '#htHarta .ht-esri'))), '2. "Hartë": kthehet harta e zakonshme', await butoni(a1));
  ok(await a1.evaluate(() => localStorage.getItem('stoku:harta:pamja')) === 'harta', '2. ... dhe mbahet mend');
  ok(!(await a1.evaluate(() => window.__csp)).length && !a1.__gab.length, '2. pa shkelje të CSP-së, pa gabime JS (pas rifreskimit)', [await a1.evaluate(() => window.__csp), a1.__gab]);

  // ================= 3. Çelësi refuzohet =================
  const { p: a2 } = await faqe('uA', 'mendurberisha', { celesi: 'celes-gabim', esriGabim: true, pamja: 'satelit' });
  await hapHarten(a2);
  ok(await prit(async () => /Pamja satelitore s'u hap/.test(await toast(a2)), 20000), '3. mesazhi "Pamja satelitore s\'u hap…"', await toast(a2));
  ok(await prit(async () => await shtresa(a2, 'satelit') === 'none' && await butoni(a2) === 'Satelit|false'), '3. kthehet vetë te harta', await butoni(a2));
  ok(await a2.evaluate(() => localStorage.getItem('stoku:harta:pamja')) === 'satelit', '3. zgjedhja s\'fshihet (herën tjetër provohet sërish)');
  ok(!a2.__gab.length, '3. pa gabime JS', a2.__gab);

  // ================= 4. PC: merchandiseri; kush s'është merchandiser =================
  const { p: pb, ctx: cpb } = await faqe('u2', 'besa', { pc: true, celesi: 'celes-prove' });
  await pb.click('#btnOpsione'); await pb.waitForTimeout(400);
  ok(await prit(async () => await duket(pb, '#opsSkedaHarta') && (await pb.textContent('#opsHartaNen')) === 'Marketet në hartë'), '4. PC besa: "Harta · Marketet në hartë"');
  await pb.click('#opsSkedaHarta'); await pb.waitForTimeout(400);
  ok(await prit(async () => await hartaGati(pb), 30000) && await butoni(pb) === 'Satelit|false', '4. PC: butoni "Satelit"');
  ok(await prit(async () => /Albi 34E shtoi drini/.test(await pb.textContent('#htLista')) && /Meridian UlpianaE shtove ti/.test(await pb.textContent('#htLista'))), '4. PC besa: krejt marketet e Stoku-t te lista ("E shtove ti" për pikën e saj)', await pb.textContent('#htLista'));
  await pb.click('#htHarta .ht-pamja-btn');
  ok(await prit(async () => await shtresa(pb, 'satelit') === 'visible' && cpb.__esri.length > 0), '4. PC: sateliti');
  await pb.screenshot({ path: __dirname + '/v247-pc-satelit.png' });
  ok(!pb.__gab.length && !(await pb.evaluate(() => window.__csp)).length, '4. PC: pa gabime, pa CSP', [pb.__gab, await pb.evaluate(() => window.__csp)]);
  await cpb.close();
  const { p: ag } = await faqe('u3', 'agim', { celesi: 'celes-prove' });
  await ag.click('#btnOpsione'); await ag.waitForTimeout(800);
  ok(!(await duket(ag, '#tabHarta')) && !(await duket(ag, '#tabMarketet')), '4. agim (s\'është merchandiser): pa "Harta", pa "Marketet"');
  const { p: pg } = await faqe('u3', 'agim', { pc: true, celesi: 'celes-prove' });
  await pg.click('#btnOpsione'); await pg.waitForTimeout(800);
  ok(!(await duket(pg, '#opsSkedaHarta')), '4. PC agim: pa "Harta"');

  // ================= 5. "Ku je?" nga çipi, kur GPS-i e ka gjetur marketin =================
  const { p: d } = await faqe('u1', 'drini', { marketet: MK1, geo: { latitude: 42.6610, longitude: 21.1600, accuracy: 15 } });
  const cipi = () => d.evaluate(() => { const c = document.querySelector('.sb-home-krye .mk-chip'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });
  ok(await prit(async () => /Je te\s*Albi 34/.test(await cipi())), '5. GPS-i e gjeti: "Je te Albi 34" (çipi te Stoku)', await cipi());
  await d.evaluate(() => document.querySelector('.sb-home-krye .mk-chip').click()); await d.waitForTimeout(400);
  const dlg = () => d.evaluate(() => ({ hapur: document.getElementById('dlgMarketi').classList.contains('hapur'), nen: document.getElementById('mkdNen').textContent, lista: [...document.querySelectorAll('#mkdLista > *')].map(x => (x.className || '') + ':' + x.textContent.replace(/\s+/g, ' ').trim()) }));
  let dd = await dlg();
  ok(dd.hapur && dd.lista.some(x => /mk-dlg-titull:Afër teje/.test(x)) && dd.lista.some(x => /^mk-afer:Meridian Ulpiana/.test(x)), '5. çipi: "Ku je?" me "Afër teje" (Meridian Ulpiana)', dd.lista);
  ok(dd.lista.some(x => /Albi 34/.test(x)) && dd.lista.some(x => /Krejt marketet/.test(x)) && /Nëse GPS-i s'e ka gjetur mirë, zgjidhe vetë/.test(dd.nen), '5. edhe marketet e mia + "zgjidhe vetë"', dd);
  await d.evaluate(() => [...document.querySelectorAll('#mkdLista .mk-afer')].find(x => /Meridian Ulpiana/.test(x.textContent)).click());
  ok(await prit(async () => /Meridian Ulpiana/.test(await cipi())), '5. zgjedhja me dorë: "Je te Meridian Ulpiana" (v250: ishte tashmë te lista, nga pikat)', [await cipi(), await toast(d)]);
  const ls = await d.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  ok(ls.length === 2 && ls.some(m => m.p === 'p5') && await d.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketi:aktiv') || '{}').menyra) === 'dore', '5. marketi i ri i lidhur me pikën; zgjedhja "me dorë"', ls);
  // Afatet: çipi mbetet, me krejt opsionet
  await d.evaluate(() => document.getElementById('btnAfatet').click()); await d.waitForTimeout(600);
  ok(await duket(d, '#afMarketi') && /Meridian Ulpiana/.test(await d.textContent('#afMarketiEmri')), '5. Afatet: çipi "Je te Meridian Ulpiana"');
  await d.click('#afMarketi'); await d.waitForTimeout(400);
  dd = await dlg();
  ok(dd.hapur && dd.lista.some(x => /Albi 34/.test(x)) && dd.lista.some(x => /Meridian Ulpiana/.test(x)), '5. Afatet: "Ku je?" me të dy marketet, për ta ndërruar sërish', dd.lista);
  await d.evaluate(() => [...document.querySelectorAll('#mkdLista button')].find(x => /Albi 34/.test(x.textContent)).click());
  ok(await prit(async () => /Albi 34/.test(await d.textContent('#afMarketiEmri'))), '5. u kthye te Albi 34 me dorë');
  ok(!d.__gab.length, '5. pa gabime JS', d.__gab);

  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
