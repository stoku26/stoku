// v288 / Worker 168: pronari: "edhe nëse jam offline në orë me shku saktë sa ora janë hek produktet". Ora e dorës e dërgon orën kur u
// shtyp heqja ("koha" për një, "kohet" për disa, njësoj si "ids"); serveri e ruan te ora-hequr:{uid}. Kufijtë: vetëm kohë e kaluar deri
// 7 ditë; e ardhshme (ora e dorës përpara), shumë e vjetër ose e pavlefshme → ora e serverit. Ora e vjetër (pa "koha") → si më parë.
import worker from './worker.mjs';
import crypto from 'node:crypto';
let g = 0; const ok = (c, m, x) => { if (!c) g++; console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: 'x', VAPID_PRIVATE: 'y', FOTO };
const sekret = crypto.randomBytes(32).toString('hex');
kv.set('ora-tok:' + crypto.createHash('sha256').update(sekret).digest('hex'), JSON.stringify({ uid: 'uA', emri: 'agim', koha: Date.now() }));
const hiq = async b => { const r = await worker.fetch(new Request('https://w.test/ora/hiq', { method: 'POST', headers: { Origin: 'https://stoku.site', 'X-Stoku-Ora': sekret }, body: JSON.stringify(b) }), env, {}); return [r.status, await r.json()]; };
const hq = () => JSON.parse(kv.get('ora-hequr:uA') || '[]');
const k = id => (hq().find(x => x.i === id) || {}).koha;
const T = Date.now(), ore2 = T - 2 * 3600e3;
let [s] = await hiq({ i: 'a1', zhbej: false, koha: ore2 });
ok(s === 200 && k('a1') === ore2, '1. heqja me orën e shtypjes (2 orë më parë, ora ishte pa internet) ruhet me atë orë', k('a1'));
[s] = await hiq({ ids: ['b1', 'b2', 'b3'], i: '', kohet: [T - 5 * 60e3, T - 4 * 60e3, T - 3 * 60e3] });
ok(s === 200 && k('b1') === T - 5 * 60e3 && k('b2') === T - 4 * 60e3 && k('b3') === T - 3 * 60e3, '2. disa heqje njëherësh: secila me orën e vet', [k('b1') - T, k('b2') - T, k('b3') - T]);
const para = Date.now();
await hiq({ i: 'c1', koha: Date.now() + 3600e3 });
await hiq({ i: 'c2', koha: T - 8 * 864e5 });
await hiq({ i: 'c3', koha: 'x' });
await hiq({ i: 'c4' });
await hiq({ ids: ['c5', 'c6'], i: '', kohet: [T - 60e3] });
await hiq({ ids: ['c7'], i: '' });
const pas = Date.now(), neTani = id => k(id) >= para && k(id) <= pas;
ok(neTani('c1') && neTani('c2') && neTani('c3'), '3. ora e ardhshme / më e vjetër se 7 ditë / e pavlefshme → ora e serverit', [k('c1') - para, k('c2') - para, k('c3') - para]);
ok(neTani('c4') && neTani('c7'), '4. ora e vjetër (pa "koha" / "kohet") → si më parë, ora e serverit');
ok(k('c5') === T - 60e3 && neTani('c6'), '5. "kohet" më e shkurtër se "ids": të mungueshmet → ora e serverit');
// zhbërja s'shton asgjë dhe heq heqjen
await hiq({ i: 'a1', zhbej: true, koha: T - 1000 });
ok(k('a1') === undefined, '6. zhbërja e heq heqjen (koha s\'ka rëndësi)');
// /ora/hequrat e kthen orën e ruajtur te telefoni/PC
const [s2] = [200];
ok(hq().every(x => typeof x.koha === 'number' && x.koha <= pas), '7. të gjitha heqjet kanë orë numerike jo të ardhshme', hq().length);
const src = (await import('node:fs')).readFileSync(new URL('./worker.mjs', import.meta.url), 'utf8');
ok(/const VERSIONI_WORKER = (\d+)/.exec(src)[1] >= 168, '8. VERSIONI_WORKER ≥ 168');
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);
