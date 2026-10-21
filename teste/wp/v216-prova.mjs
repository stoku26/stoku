// v216: freskia sipas createTime, kufiri i pajisjeve, /orari pastroPajisjen + pajisja i përket një llogarie,
// cron-i riprovon gabimet e përkohshme, /ora/hiq me ids, /ora/shkeput heq ora-ka, gabimet me CORS
import worker from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
const ok = (k, m, x) => console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid) => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })); const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, iat: tS - 100, exp: tS + 3600 })); return h + '.' + p + '.' + b64u(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)); };
const kv = new Map(); let kvHedh = null;
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { if (kvHedh) throw new Error(kvHedh); kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FOTO };
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) });
const tani = Date.now();
// Kërkesa (v221: në vend të chat-it që u hoq): koha e pajisjes 10 min gabim, por serveri e krijoi tani → dërgohet.
// Një tjetër e krijuar para 1 ore → 409.
const feed = {
  k1abcdef: { f: { uid: S('uA'), emri: S('agim'), lloji: S('kerkese-heqje'), produkti: S('Ora e PC-së gabim'), koha: I(tani - 10 * 60000) }, ct: new Date(tani - 5000).toISOString() },
  k2abcdef: { f: { uid: S('uA'), emri: S('agim'), lloji: S('kerkese-heqje'), produkti: S('e vjetër'), koha: I(tani) }, ct: new Date(tani - 3600e3).toISOString() }
};
let statusPush = 201, push = [];
const nPajisje = 45;
const pajisje = Array.from({ length: nPajisje }, (_, i) => ({ name: 'x/grupet/g1/push/u' + i + '_1', fields: { uid: S(i === 0 ? 'uA' : 'u' + i), endpoint: S('https://push.test/' + i), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S('tel'), koha: I(tani - i * 1000) } }));
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  const m = url.match(/\/grupet\/g1\/feed\/([A-Za-z0-9]+)/);
  if (m) return feed[m[1]] ? new Response(JSON.stringify({ fields: feed[m[1]].f, createTime: feed[m[1]].ct })) : new Response('{}', { status: 404 });
  if (url.includes('/grupet/g1/push?')) return new Response(JSON.stringify({ documents: pajisje }));
  if (url.includes('/grupet/g1/anetaret?')) return new Response(JSON.stringify({ documents: pajisje.map(p => ({ name: 'x/grupet/g1/anetaret/' + p.fields.uid.stringValue, fields: {} })) }));
  if (url.startsWith('https://push.test')) { push.push(url.split('/').pop()); return new Response('', { status: statusPush }); }
  return new Response('?', { status: 500 });
};
const tokA = bileta('uA');
const thirrKerkesen = async id => { push = []; const r = await worker.fetch(new Request('https://w.test/kerkese', { method: 'POST', headers: { Authorization: 'Bearer ' + tokA }, body: JSON.stringify({ id, grupi: 'g1' }) }), env); return [r.status, await r.json()]; };
let [st, j] = await thirrKerkesen('k1abcdef');
ok(st === 200, '1. ora e pajisjes 10 min gabim, serveri e krijoi tani: dërgohet', [st, j]);
ok(push.length === 36 && !push.includes('0'), '2. më së shumti 36 pajisje (plani falas: 50 kërkesa), pa dërguesin', push.length);
ok(push.includes('1') && !push.includes('44'), '2b. të regjistruarat së fundi së pari', push.slice(0, 3));
[st, j] = await thirrKerkesen('k2abcdef');
ok(st === 409 && j.arsye === 'i-vjeter', '3. i krijuar para 1 ore (koha e pajisjes "tani"): 409', [st, j]);

// /orari: e njëjta pajisje, dy llogari
const pajisja = { endpoint: 'https://push.test/X', p256dh: b64u(ua.getPublicKey()), auth: b64u(auth) };
const orari = async (uid, trup) => { const r = await worker.fetch(new Request('https://w.test/orari', { method: 'POST', headers: { Authorization: 'Bearer ' + bileta(uid), Origin: 'https://stoku.site' }, body: JSON.stringify(trup) }), env, {}); return [r.status, await r.json(), r.headers.get('Access-Control-Allow-Origin')]; };
await orari('uA', { aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja });
let ind = JSON.parse(kv.get('orari-indeksi'));
ok(Object.keys(ind).length === 1 && Object.keys(ind)[0].indexOf('orari:uA:') === 0, '4. orari i agimit', Object.keys(ind));
// agimi doli pa internet (orari s'u hoq); besa hyn në të njëjtën pajisje dhe kërkon pastrimin
[st, j] = await orari('uB', { pastroPajisjen: true, pajisja });
ind = JSON.parse(kv.get('orari-indeksi'));
ok(st === 200 && j.pastruar === 1 && Object.keys(ind).length === 0 && ![...kv.keys()].some(k => k.indexOf('orari:uA:') === 0), '5. pastroPajisjen: orari i agimit për këtë pajisje hiqet', [j, Object.keys(ind)]);
[st, j] = await orari('uB', { pastroPajisjen: true, pajisja });
ok(st === 200 && j.pastruar === 0, '5b. sërish: asgjë për të hequr', j);
// agimi e ndez sërish, pastaj besa e ndez orarin e vet: i agimit për këtë pajisje hiqet
await orari('uA', { aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja });
await orari('uB', { aktiv: true, ora: '09:00', tz: 'Europe/Belgrade', pajisja });
ind = JSON.parse(kv.get('orari-indeksi'));
ok(Object.keys(ind).length === 1 && Object.keys(ind)[0].indexOf('orari:uB:') === 0, '6. orari i ri i besës e heq të agimit (një pajisje = një llogari)', Object.keys(ind));
// e njëjta orë sërish: indeksi s'rishkruhet
let shkrime = 0; const putVjeter = FOTO.put; FOTO.put = async (k, x) => { if (k === 'orari-indeksi') shkrime++; return putVjeter(k, x); };
await orari('uB', { aktiv: true, ora: '09:00', tz: 'Europe/Belgrade', pajisja });
FOTO.put = putVjeter;
ok(shkrime === 0, '7. e njëjta orë: orari-indeksi s\'rishkruhet', shkrime);
// KV plot: gabim JSON me CORS (jo "s'ka lidhje")
kvHedh = 'KV put() limit exceeded for the day';
let r3 = await orari('uB', { aktiv: true, ora: '10:00', tz: 'Europe/Belgrade', pajisja });
kvHedh = null;
ok(r3[0] === 500 && r3[1].arsye === 'kv-limit' && r3[2] === 'https://stoku.site', '8. KV plot: 500 me CORS dhe arsye "kv-limit"', r3);

// Cron: 503 → riprovohet minutën tjetër; 3 prova → mjaft
kv.set('orari-afatet:uB', JSON.stringify([{ e: 'Kos', d: '2026-10-01' }]));
ind = JSON.parse(kv.get('orari-indeksi')); const cel = Object.keys(ind)[0]; ind[cel].dita = ''; kv.set('orari-indeksi', JSON.stringify(ind));
const ora = (h, m) => Date.UTC(2026, 9, 1, h - 2, m);
statusPush = 503; push = [];
await worker.scheduled({ scheduledTime: ora(9, 0) }, env, {});
await worker.scheduled({ scheduledTime: ora(9, 1) }, env, {});
ok(push.length === 2 && JSON.parse(kv.get('orari-indeksi'))[cel].dita === '', '9. 503: riprovohet në minutën tjetër', [push.length, JSON.parse(kv.get('orari-indeksi'))[cel]]);
statusPush = 201;
await worker.scheduled({ scheduledTime: ora(9, 2) }, env, {});
await worker.scheduled({ scheduledTime: ora(9, 3) }, env, {});
ind = JSON.parse(kv.get('orari-indeksi'));
ok(push.length === 3 && ind[cel].dita === '2026-10-01' && ind[cel].rez === 'derguar' && ind[cel].prova === undefined, '10. prova e tretë shkon; pastaj jo më sot', [push.length, ind[cel]]);
statusPush = 503; push = []; ind[cel].dita = ''; kv.set('orari-indeksi', JSON.stringify(ind));
for (let m = 0; m < 6; m++) await worker.scheduled({ scheduledTime: ora(9, 10 + m) }, env, {});
ok(push.length === 3 && JSON.parse(kv.get('orari-indeksi'))[cel].dita === '2026-10-01', '11. tri gabime: mjaft për sot (s\'provohet pa fund)', push.length);

// Ora: /ora/hiq me ids, /ora/shkeput
const sekret = crypto.randomBytes(32).toString('hex');
const h = crypto.createHash('sha256').update(sekret).digest('hex');
const sekret2 = crypto.randomBytes(32).toString('hex'), h2 = crypto.createHash('sha256').update(sekret2).digest('hex');
kv.set('ora-tok:' + h, JSON.stringify({ uid: 'uB', emri: 'besa', koha: tani })); kv.set('ora-tok:' + h2, JSON.stringify({ uid: 'uB', emri: 'besa', koha: tani }));
kv.set('ora-ka:uB', JSON.stringify([h, h2]));
const oraT = async (rr, trup) => { const r = await worker.fetch(new Request('https://w.test' + rr, { method: 'POST', headers: { 'X-Stoku-Ora': sekret }, body: JSON.stringify(trup) }), env, {}); return [r.status, await r.json()]; };
[st, j] = await oraT('/ora/hiq', { ids: ['a1', 'a2', 'a3'] });
ok(st === 200 && JSON.parse(kv.get('ora-hequr:uB')).map(x => x.i).join() === 'a1,a2,a3', '12. /ora/hiq me ids: të tria në një shkrim', kv.get('ora-hequr:uB'));
[st, j] = await oraT('/ora/hiq', { i: 'a2', zhbej: true });
ok(st === 200 && JSON.parse(kv.get('ora-hequr:uB')).map(x => x.i).join() === 'a1,a3', '13. zhbëj (i vjetër, një id) punon ende', kv.get('ora-hequr:uB'));
[st, j] = await oraT('/ora/hiq', { ids: [] });
ok(st === 400, '14. pa id → 400', st);
[st, j] = await oraT('/ora/shkeput', {});
ok(st === 200 && !kv.get('ora-tok:' + h) && JSON.parse(kv.get('ora-ka:uB')).join() === h2 && !!kv.get('ora-hequr:uB'), '15. shkëputja e njërës orë: ora tjetër mbetet në ora-ka, heqjet e pazbatuara mbeten', [kv.get('ora-ka:uB'), kv.get('ora-hequr:uB')]);
const oraT2 = async (rr, trup) => { const r = await worker.fetch(new Request('https://w.test' + rr, { method: 'POST', headers: { 'X-Stoku-Ora': sekret2 }, body: JSON.stringify(trup) }), env, {}); return [r.status, await r.json()]; };
[st, j] = await oraT2('/ora/shkeput', {});
ok(st === 200 && !kv.get('ora-ka:uB') && !!kv.get('ora-hequr:uB'), '15b. shkëputja e orës së fundit heq ora-ka (heqjet mbeten për telefonin)', [kv.get('ora-ka:uB'), kv.get('ora-hequr:uB')]);
kv.set('ora-ka:uC', '1'); kv.set('ora-tok:' + h, JSON.stringify({ uid: 'uC', emri: 'c', koha: tani }));
[st, j] = await oraT('/ora/shkeput', {});
ok(st === 200 && kv.get('ora-ka:uC') === '1', '15c. vlera e vjetër "1" (pa numër orësh) mbetet', kv.get('ora-ka:uC'));
// /orari me orë të pavlefshme s'fshin asgjë
await orari('uA', { aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja });
const paraKeq = Object.keys(JSON.parse(kv.get('orari-indeksi'))).sort().join();
const rk = await orari('uB', { aktiv: true, ora: '25:00', tz: 'Europe/Belgrade', pajisja });
ok(rk[0] === 400 && Object.keys(JSON.parse(kv.get('orari-indeksi'))).sort().join() === paraKeq && [...kv.keys()].some(k => k.indexOf('orari:uA:') === 0), '16. kërkesë e pavlefshme (ora 25:00): orari i tjetrit mbetet', paraKeq);
// pastroPajisjen + edheTimin: edhe orari i vet hiqet
const re = await orari('uA', { pastroPajisjen: true, edheTimin: true, pajisja });
ok(re[1].pastruar >= 1 && ![...kv.keys()].some(k => k.indexOf('orari:uA:') === 0), '17. pastroPajisjen me edheTimin heq edhe orarin e vet', re[1]);
