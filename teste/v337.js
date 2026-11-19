// v337 → v338 (pronari, 18.11.2026): v337 e hoqi 'icon' te njoftimet e telefonit, por Samsung-u vuri djathtas një "S" gri.
//  Pronari: "Jojo logo ndreqe te stokut": logoja e Stoku-t kthehet djathtas (sw.js push, njoftimet.js, app-tel.js).
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
  ok(an && an[0] === 'EKO Vishnje 1L' && an[1].icon === './icon-192.png?v=5' && an[1].badge, '1. push: me logon e Stoku-t (icon) dhe badge', an && an[1]);
  const nj = lx('njoftimet.js'), at = lx('app-tel.js');
  const op = nj.slice(nj.indexOf('function opsionet('), nj.indexOf('function opsionet(') + 400);
  ok(/icon: 'icon-192\.png\?v=5'/.test(op), '2. njoftimet.js (njoftimet ditore): me logon');
  const sn = at.slice(at.indexOf('reg.showNotification(nj.titulli'), at.indexOf('reg.showNotification(nj.titulli') + 300);
  ok(/icon: '\.\/icon-192\.png\?v=5'/.test(sn), '2. app-tel.js: njoftimi me logon');
  ok(+(/v: (\d+)/.exec(lx('versioni.js')) || [])[1] >= 338 && !/v: 337,/.test(lx('teRejat.js')), '0. versioni ≥ 338; pa hyrjen e v337 te teRejat');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
