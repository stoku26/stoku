// Ndihmësit e testeve me faqet e vërteta (index.html/pc.html) + SDK-në e vërtetë të Firebase (12.19.0, si te gstatic) +
// emulatorët Auth (9099) dhe Firestore (8089); rregullat nga SHENIME.md (ose RREGULLAT=skedari). Nisja: bash teste/emu/nis.sh
// Faqet: importet e gstatic → SDK-ja e ndërtuar; CSP hiqet; firebase-tel/pc.js lidhen me emulatorët (vetëm në test).
const { chromium } = require('../pw.js');
const fs = require('fs');
const DIR = __dirname;
const BAZA = process.env.BAZA || 'http://127.0.0.1:8765';
const PROJ = 'stoku-appi';
const BUNDLE = fs.readFileSync(DIR + '/fb-krejt.bundle.js', 'utf8');
const ARGS = ['--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests', '--disable-web-security'];
function teksti() { return process.env.RREGULLAT ? fs.readFileSync(process.env.RREGULLAT, 'utf8') : require('./rregullat.js').rregullat(); }
const FS_URL = 'http://127.0.0.1:8089/v1/projects/' + PROJ + '/databases/(default)/documents';
async function vendosRregullat() {
  const r = await fetch('http://127.0.0.1:8089/emulator/v1/projects/' + PROJ + ':securityRules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: teksti() }] } }) });
  if (!r.ok) throw new Error('rregullat: ' + r.status + ' ' + await r.text());
}
async function pastro() {
  await fetch('http://127.0.0.1:8089/emulator/v1/projects/' + PROJ + '/databases/(default)/documents', { method: 'DELETE' });
  for (const pr of [PROJ, 'demo-stoku']) await fetch('http://127.0.0.1:9099/emulator/v1/projects/' + pr + '/accounts', { method: 'DELETE' });
}
async function lista(kol) {
  const r = await fetch(FS_URL + '/' + kol + '?pageSize=300', { headers: { Authorization: 'Bearer owner' } });
  const j = await r.json();
  return (j.documents || []).map(d => ({ id: d.name.split('/').pop(), f: Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, Object.values(v)[0]])) }));
}
async function lexo(p) {
  const r = await fetch(FS_URL + '/' + p, { headers: { Authorization: 'Bearer owner' } });
  if (r.status === 404) return null;
  const d = await r.json();
  return Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, Object.values(v)[0]]));
}
async function faqe(b, pc, emri) {
  const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !/^http:\/\/127\.0\.0\.1:(8089|9099)\//.test(u.href), async route => {
    const u = route.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/__krejt.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: BUNDLE });
    if (/^https:\/\/www\.gstatic\.com\/firebasejs\/.*\/firebase-(app|auth|firestore)\.js$/.test(u)) return route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: "export * from 'https://www.gstatic.com/firebasejs/__krejt.js';" });
    if (u.startsWith('http://127.0.0.1:8089') || u.startsWith('http://127.0.0.1:9099')) {
      const KORS = { 'Access-Control-Allow-Origin': BAZA, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': route.request().headers()['access-control-request-headers'] || '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: KORS });
      try { const res = await route.fetch(); const h = Object.assign({}, res.headers(), KORS); return route.fulfill({ status: res.status(), headers: h, body: await res.body() }); }
      catch (e) { return route.abort(); }
    }
    if (u.startsWith(BAZA)) {
      const path = new URL(u).pathname;
      const res = await route.fetch();
      let body = await res.text();
      const headers = Object.assign({}, res.headers());
      delete headers['content-security-policy'];
      if (/\.html$|\/$/.test(path)) body = body.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
      if (/firebase-(tel|pc)\.js$/.test(path)) {
        body = body.replace('getAuth, createUserWithEmailAndPassword', 'getAuth, connectAuthEmulator, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, createUserWithEmailAndPassword')
          .replace('var auth = getAuth(app);', 'var auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });')
          .replace('import { initializeFirestore,', 'import { connectFirestoreEmulator, initializeFirestore,')
          .replace("var db = initializeFirestore(app, { ignoreUndefinedProperties: true });", "var db = initializeFirestore(app, { ignoreUndefinedProperties: true }); connectFirestoreEmulator(db, '127.0.0.1', 8089); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });");
      }
      if (/\.html$|\/$|\.js$|\.css$/.test(path)) delete headers['content-length'];
      return route.fulfill({ status: res.status(), headers, body });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
  });
  const p = await ctx.newPage(); p.__gab = []; p.__log = [];
  p.on('pageerror', e => p.__gab.push(emri + ': ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || /FirebaseError|permission/i.test(m.text())) p.__log.push(emri + ' ' + m.type() + ': ' + m.text().slice(0, 300)); });
  return { p, ctx };
}
async function regjistrohu(p, emri, pc, merch) {
  await p.goto(BAZA + (pc ? '/pc.html' : '/index.html'));
  await p.waitForSelector('#pkTabKrijo', { state: 'visible', timeout: 20000 });
  await p.click('#pkTabKrijo');
  await p.fill('#pkEmri', emri); await p.fill('#pkFjalekalimi', 'sakte123'); await p.fill('#pkPerserit', 'sakte123');
  if (merch) await p.click('#pkMerchLbl');
  await p.click('#pkDergo');
  await p.waitForFunction(() => !document.getElementById('porta') || getComputedStyle(document.getElementById('porta')).display === 'none' || document.getElementById('porta').hidden, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(3500);
}
module.exports = { vendosRregullat, pastro, lista, lexo, faqe, regjistrohu, BAZA, FS_URL, teksti };
async function nisChromium() { return chromium.launch({ args: ARGS }); }
module.exports.nisChromium = nisChromium;
