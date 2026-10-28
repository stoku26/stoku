// Kamera e rreme për testet e skanimit (v260–v262): Chromium me pajisje video të rreme + BarcodeDetector i rremë.
// Çdo thirrje e detect() merr elementin e radhës nga window.__leximet:
//   null                         → kuadër pa barkod
//   [kodi, formati, pozita]      → një barkod; pozita: 'brenda' (parazgjedhur), 'jashte' (poshtë kutisë), 'gjysme' (del jashtë)
//   [[kodi, formati, pozita], …] → disa barkode në të njëjtin kuadër
// Kur radha mbaron: kuadra pa barkod. window.__bip numëron tingujt (oscilatorët), window.__thirrje thirrjet e detect().
// Koordinatat: figura që lexohet = kutia + 10% anash dhe 35% lart/poshtë (figuraNenKuti te app-tel.js).
const { krijoFirestore } = require('./fs-server.js');
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';

const SKRIPTI = () => {
  try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'uA', emri: 'mendurberisha' })); localStorage.setItem('stoku:pronari-uid', 'uA'); } catch (e) {}
  window.__leximet = []; window.__thirrje = 0; window.__bip = 0; window.__tPare = 0; window.__tDritare = 0; window.__perseri = 0;
  const kuti = (c, poz) => {
    const W = c.width, H = c.height, kx = W * 0.1 / 1.2, kw = W / 1.2, ky = H * 0.35 / 1.7, kh = H / 1.7;
    if (poz === 'jashte') return { x: kx + kw * 0.2, y: ky + kh * 1.03, width: kw * 0.6, height: kh * 0.28 };
    if (poz === 'gjysme') return { x: kx + kw * 0.2, y: ky + kh * 0.7, width: kw * 0.6, height: kh * 0.5 };
    return { x: kx + kw * 0.2, y: ky + kh * 0.25, width: kw * 0.6, height: kh * 0.5 };
  };
  window.BarcodeDetector = class { constructor() {} static async getSupportedFormats() { return ['ean_13', 'code_128', 'qr_code']; }
    async detect(c) {
      window.__thirrje++;
      const x = window.__leximet.length ? window.__leximet.shift() : null;
      if (!x) return [];
      if (!window.__tPare) window.__tPare = performance.now();
      const l = Array.isArray(x[0]) ? x : [x];
      return l.map(b => ({ rawValue: b[0], format: b[1], boundingBox: kuti(c, b[2]) }));
    } };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) { const o = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__bip++; return o.apply(this, arguments); }; }
  window.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('dlgProdukt');
    if (d) new MutationObserver(() => { if (d.classList.contains('hapur') && !window.__tDritare) { window.__tDritare = performance.now(); window.__tentimeNeDritare = window.__thirrje; } }).observe(d, { attributes: true, attributeFilter: ['class'] });
    const h = document.getElementById('skanHint'); // sa herë u shfaq "Skano përsëri"
    if (h) new MutationObserver(() => { if (h.classList.contains('perseri')) window.__perseri++; }).observe(h, { attributes: true, attributeFilter: ['class'] });
  });
};

async function hapFaqen(chromium) {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: Date.now() });
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.grantPermissions(['camera'], { origin: BAZA });
  await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
  await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', 'tel');
  await ctx.addInitScript(SKRIPTI);
  const p = await ctx.newPage(); p.__gab = [];
  p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  return { b, p };
}

// Hap kamerën me leximet e dhëna; pret derisa të lexohen krejt dhe edhe 12 kuadra të tjerë (ose derisa të hapet dritarja),
// sepse kamera mund të ndizet ngadalë; pastaj edhe `pritje` ms. Kthen gjendjen.
async function skano(p, leximet, pritje) {
  await p.evaluate(l => { window.__leximet = l.slice(); window.__thirrje = 0; window.__bip = 0; window.__tPare = 0; window.__tDritare = 0; window.__perseri = 0; window.__tentimeNeDritare = 0; }, leximet);
  await p.click('#btnKamera');
  await p.waitForFunction(x => window.__tDritare || (window.__leximet.length === 0 && window.__thirrje >= x), leximet.length + 12, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(pritje);
  return p.evaluate(() => ({ dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'), kodi: document.getElementById('dlgKodi').textContent,
    kamera: document.getElementById('kamera').classList.contains('hapur'), hint: document.getElementById('skanHint').textContent,
    perseri: window.__perseri, bip: window.__bip, thirrje: window.__thirrje,
    pas: window.__tDritare && window.__tPare ? Math.round(window.__tDritare - window.__tPare) : null, tentimeNeDritare: window.__tentimeNeDritare }));
}
async function mbyll(p) {
  await p.evaluate(() => { document.getElementById('dlgProdukt').classList.remove('hapur'); });
  if (await p.evaluate(() => document.getElementById('kamera').classList.contains('hapur'))) await p.click('#mbyllKamere');
  await p.waitForTimeout(300);
}

module.exports = { hapFaqen, skano, mbyll, BAZA };
