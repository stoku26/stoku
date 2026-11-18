// v337 (pronari, 18.11.2026, foto e njoftimit): te njoftimet e telefonit logoja del vetëm majtas; pa 'icon' që e nxirrte edhe djathtas
//  (Android). Në iPhone majtas del vetë ikona e aplikacionit (apple-touch-icon). Kompjuteri s'ka njoftime.
const fs = require('fs'), vm = require('vm');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
async function pushMe(ua) {
  const deg = {}, dalja = [];
  const self = { navigator: { userAgent: ua }, addEventListener: (k, f) => { deg[k] = f; }, registration: { showNotification: (t, o) => { dalja.push([t, o]); return Promise.resolve(); } },
    clients: {}, caches: {}, location: { origin: 'https://stoku.site' }, skipWaiting() {} };
  const ctx = { self, importScripts() {}, caches: { open: () => Promise.resolve({ addAll: () => Promise.resolve() }) }, console, Promise, setTimeout, URL, fetch: () => Promise.reject() };
  ctx.navigator = self.navigator; vm.createContext(ctx);
  vm.runInContext(lx('sw.js'), ctx);
  let pr; deg.push({ data: { json: () => ({ titulli: 'EKO Vishnje 1L', teksti: 'Skadon sot', lloji: 'afatet' }) }, waitUntil: p => { pr = p; } });
  await pr; return dalja[0];
}
(async () => {
  const an = await pushMe('Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36');
  ok(an && an[0] === 'EKO Vishnje 1L' && !('icon' in an[1]) && an[1].badge, '1. push në Android: pa icon (vetëm majtas), me badge', an && an[1]);
  const ip = await pushMe('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');
  ok(ip && !('icon' in ip[1]), '1. push në iPhone: pa icon');
  const nj = lx('njoftimet.js'), at = lx('app-tel.js'), ix = lx('index.html');
  const op = nj.slice(nj.indexOf('function opsionet('), nj.indexOf('function opsionet(') + 400);
  ok(!/icon:/.test(op), '2. njoftimet.js (njoftimet ditore të afateve): pa icon');
  const sn = at.slice(at.indexOf('reg.showNotification(nj.titulli'), at.indexOf('reg.showNotification(nj.titulli') + 300);
  ok(sn && !/icon:/.test(sn), '2. app-tel.js: njoftimi pa icon');
  ok(/<link rel="apple-touch-icon" href="apple-touch-icon\.png/.test(ix) && /<link rel="manifest"/.test(ix), '3. iPhone/Android: ikona e aplikacionit (apple-touch-icon, manifest) ekziston për majtas');
  ok(/v: 337/.test(lx('teRejat.js')) && /v: 337/.test(lx('versioni.js')), '0. versioni 337');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
