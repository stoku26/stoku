import worker, { njoftimiDitor, kohaLokale, dergoNjoftimetDitore } from './worker.mjs';
import crypto from 'node:crypto';
import ece from 'http_ece';
const ok = (c, m, x) => console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const b64u = b => Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid = 'uA') => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })); const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, iat: tS - 400 * 86400, exp: tS + 30 * 86400 })); return h + '.' + p + '.' + b64u(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)); };
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
let push = [], statusi = 201;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  if (url.startsWith('https://push.test')) { push.push({ ku: url, ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: statusi }); }
  return new Response('?', { status: 500 });
};
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FOTO };
const thirr = async (trup, tok = bileta()) => { const r = await worker.fetch(new Request('https://w.test/orari', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, Origin: 'https://stoku.site' }, body: JSON.stringify(trup) }), env, {}); return [r.status, await r.json()]; };
const run = (t, c) => worker.scheduled({ scheduledTime: t, cron: c }, env, {});
const pajisja = { endpoint: 'https://push.test/A', p256dh: b64u(ua.getPublicKey()), auth: b64u(auth) };
// 1. tekstet
ok(njoftimiDitor([], '2026-10-01') === null, 'pa afate → asnjë njoftim');
ok(njoftimiDitor([{ e: 'Kos', d: '2026-12-01' }], '2026-10-01') === null, 'afat larg → asnjë');
ok(njoftimiDitor([{ e: 'Kos', d: '2026-09-28' }, { e: 'Ujë', d: '2026-10-03' }], '2026-10-01') === null, 'të skaduarat e vjetra dhe ato të javës → asnjë (vetëm sot)');
let n = njoftimiDitor([{ e: 'Kos', d: '2026-10-01' }, { e: 'Ujë', d: '2026-10-03' }], '2026-10-01'); ok(n.teksti === 'Kos skadon sot. Hiqe nga rafti.' && n.titulli === 'Stoku · Skadon sot', 'një skadon sot', n);
n = njoftimiDitor([{ e: 'A', d: '2026-10-01' }, { e: 'B', d: '2026-10-01' }, { e: 'C', d: '2026-09-01' }], '2026-10-01'); ok(n.teksti === '2 produkte skadojnë sot: A, B.', 'dy sot', n.teksti);
ok(kohaLokale(Date.UTC(2026, 9, 1, 6, 0), 'Europe/Belgrade').minuta === 8 * 60 && kohaLokale(Date.UTC(2026, 9, 1, 23, 30), 'Europe/Belgrade').dita === '2026-10-02', 'zona kohore (Kosovë = UTC+2 në tetor)');
// 2. /orari
let [st, j] = await thirr({ aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja }, 'x.y.z'); ok(st === 401, 'token i rremë → 401', st);
[st] = await thirr({ aktiv: true, ora: '24:10', tz: 'Europe/Belgrade', pajisja }); ok(st === 400, 'ora e pavlefshme → 400', st);
[st] = await thirr({ aktiv: true, ora: '8:5', tz: 'Europe/Belgrade', pajisja }); ok(st === 400, 'formë e keqe → 400', st);
[st] = await thirr({ aktiv: true, ora: '08:00', tz: 'Mars/Olympus', pajisja }); ok(st === 400, 'zonë e pavlefshme → 400', st);
[st] = await thirr({ aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja: { endpoint: 'http://x' } }); ok(st === 400, 'pajisje e keqe → 400', st);
[st, j] = await thirr({ afatet: [{ e: 'Kos Vita', b: '1', d: '2026-10-01' }, { e: 'Ujë', d: '2026-10-02' }, { e: 'Djathë', d: '2026-10-04' }, { e: 'Bukë', d: '2026-10-06' }, { e: 'Bukë', d: '2026-10-07' }, { e: 'X', d: 'gabim' }] }); ok(st === 200 && JSON.parse(kv.get('orari-afatet:uA')).length === 5, 'afatet ruhen (pa datat e gabuara)');
[st, j] = await thirr({ aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', platforma: 'tel', pajisja }); ok(st === 200 && j.aktiv, 'orari ruhet', j);
const ind = JSON.parse(kv.get('orari-indeksi')); const cel = Object.keys(ind)[0];
ok(Object.keys(ind).length === 1 && ind[cel].ora === '08:00' && /^orari:uA:[0-9a-f]{20}$/.test(cel), 'indeksi', ind);
// 3. cron
const ora = (h, m, dita = 1) => Date.UTC(2026, 9, dita, h - 2, m);  // ora e Kosovës → UTC
ind[cel].dita = ''; kv.set('orari-indeksi', JSON.stringify(ind));
push = []; await run(ora(7, 45)); ok(push.length === 0, '07:45 → ende jo');
push = []; await run(ora(8, 0)); ok(push.length === 1 && push[0].ng.teksti === 'Kos Vita skadon sot. Hiqe nga rafti.' && push[0].ng.url === './index.html#afatet', '08:00 → njoftimi', push[0] && push[0].ng);
push = []; await run(ora(8, 15)); ok(push.length === 0, '08:15 → jo sërish të njëjtën ditë');
push = []; await run(ora(8, 0, 2)); ok(push.length === 1, 'ditën tjetër → sërish');
push = []; await run(ora(9, 30, 3)); ok(push.length === 0, 'cron i vonuar > 1 orë → kalohet atë ditë');
// 3b. statusi + health
{ const r = await worker.fetch(new Request('https://w.test/', { method: 'GET' }), env, {}); const h = await r.json(); ok(h.versioni >= 161 && h.cron > 0, 'health: versioni + cron', h); }
[st, j] = await thirr({ statusi: true, pajisja }); ok(st === 200 && j.ekziston && j.rez === 'derguar' && j.afatet === 5 && j.cron > 0, 'statusi i pajisjes', j);
[st, j] = await thirr({ statusi: true, pajisja: { endpoint: 'https://push.test/tjeter' } }); ok(st === 200 && !j.ekziston, 'statusi: pajisje pa orar', j);
// 4. ndryshimi i orës, heqja, pajisja e vdekur
[st, j] = await thirr({ aktiv: true, ora: '18:30', tz: 'Europe/Belgrade', pajisja }); ok(JSON.parse(kv.get('orari-indeksi'))[cel].ora === '18:30', 'ora ndryshohet (e njëjta pajisje, pa dyfishim)');
[st, j] = await thirr({ aktiv: false, pajisja }); ok(!kv.has(cel) && !JSON.parse(kv.get('orari-indeksi'))[cel], 'çaktivizimi e heq');
await thirr({ aktiv: true, ora: '08:00', tz: 'Europe/Belgrade', pajisja });
const i2 = JSON.parse(kv.get('orari-indeksi')); i2[cel].dita = ''; kv.set('orari-indeksi', JSON.stringify(i2));
statusi = 410; push = []; await run(ora(8, 0, 4)); ok(push.length === 1 && !kv.has(cel) && !JSON.parse(kv.get('orari-indeksi'))[cel], 'pajisja e vdekur (410) fshihet');
// 4b. çdo minutë: ora 17:07 me Cron çdo minutë
await thirr({ aktiv: true, ora: '17:07', tz: 'Europe/Belgrade', pajisja });
{ const i3 = JSON.parse(kv.get('orari-indeksi')); i3[cel].dita = ''; kv.set('orari-indeksi', JSON.stringify(i3)); }
statusi = 201;
push = []; await run(ora(17, 6, 6), '* * * * *'); ok(push.length === 0, '17:06 → ende jo');
push = []; await run(ora(17, 7, 6), '* * * * *'); ok(push.length === 1, '17:07 → saktë në minutë');
{ const c = JSON.parse(kv.get('orari-cron')); ok(c.shprehja === '* * * * *' && c.koha === ora(17, 6, 6), 'orari-cron: s\'rishkruhet çdo minutë', c); }
push = []; await run(ora(17, 20, 6), '* * * * *'); ok(JSON.parse(kv.get('orari-cron')).koha === ora(17, 20, 6), 'orari-cron rifreskohet pas 10 min');
{ const r = await worker.fetch(new Request('https://w.test/', { method: 'GET' }), env, {}); const h = await r.json(); ok(h.cronShprehja === '* * * * *', 'health: cronShprehja', h.cronShprehja); }
// 4c. ora ndryshohet në të njëjtën ditë pas dërgimit → vjen edhe në orën e re
{ const i4 = JSON.parse(kv.get('orari-indeksi')); ok(i4[cel].dita === '2026-10-06', 'dita e 6: u dërgua në 17:07', i4[cel]); }
{ const realNow = Date.now; Date.now = () => ora(17, 30, 6);
  await thirr({ aktiv: true, ora: '18:10', tz: 'Europe/Belgrade', pajisja });
  await thirr({ aktiv: true, ora: '18:10', tz: 'Europe/Belgrade', pajisja }); // e njëjta orë sërish: s'ndryshon gjë
  Date.now = realNow; }
push = []; await run(ora(18, 10, 6), '* * * * *'); ok(push.length === 1, 'ora e re po atë ditë → vjen sërish në 18:10');
push = []; await run(ora(18, 11, 6), '* * * * *'); ok(push.length === 0, '18:11 → jo dy herë');
{ const realNow = Date.now; Date.now = () => ora(19, 0, 6); await thirr({ aktiv: true, ora: '18:30', tz: 'Europe/Belgrade', pajisja }); Date.now = realNow; }
push = []; await run(ora(19, 1, 6), '* * * * *'); ok(push.length === 0, 'ora e re që ka kaluar → nga nesër');
// 4d. gabim në dërgim → ruhet te health
{ const pu = FOTO.put; FOTO.put = async (k, x) => { if (k === 'orari-cron') throw new Error('KV put() limit exceeded'); return pu(k, x); };
  await run(ora(20, 0, 7), '0,15,30,45 * * * *'); FOTO.put = pu;
  const r = await worker.fetch(new Request('https://w.test/', { method: 'GET' }), env, {}); const h = await r.json();
  ok(h.cronGabim && /limit exceeded/.test(h.cronGabim.mesazh), 'gabimi i shkrimit të shenjës shfaqet te health', h.cronGabim); }
// 4e. i njëjti gabim s'rishkruhet çdo minutë (kursehen shkrimet e KV-së); "?kv=1" provon shkrimin
{ let n = 0; const pu = FOTO.put; FOTO.put = async (k, x) => { if (k === 'orari-cron-gabim') n++; if (k === 'orari-cron') throw new Error('KV put() limit exceeded'); return pu(k, x); };
  const ce = console.error; console.error = () => {};
  await run(ora(20, 1, 7), '* * * * *'); await run(ora(20, 2, 7), '* * * * *'); await run(ora(20, 12, 7), '* * * * *');
  console.error = ce; FOTO.put = pu;
  ok(n === 1, 'gabimi i njëjtë (i pari 20:00): 20:01 e 20:02 pa shkrim, 20:12 rishkruhet', n); }
{ const g = async () => (await (await worker.fetch(new Request('https://w.test/?kv=1', { method: 'GET' }), env, {})).json()).kv;
  const k1 = await g(); ok(k1 && k1.ok === true && kv.has('kv-prove'), '?kv=1 → shkrimi punon', k1);
  let n = 0; const pu = FOTO.put; FOTO.put = async (k, x) => { n++; return pu(k, x); };
  const k2 = await g(); FOTO.put = pu; ok(k2.ok && n === 0, '?kv=1 sërish brenda 10 min → pa shkrim të ri', n);
  kv.delete('kv-prove'); FOTO.put = async () => { throw new Error('KV put() limit exceeded for the day.'); };
  const k3 = await g(); FOTO.put = pu; ok(k3.ok === false && /limit exceeded/.test(k3.mesazh), '?kv=1 kur KV s\'pranon → mesazhi', k3);
  const h = await (await worker.fetch(new Request('https://w.test/', { method: 'GET' }), env, {})).json(); ok(h.kv === undefined, 'pa ?kv=1 → s\'provohet'); }
// 4f. afatet nga kompjuteri: ruhen vetëm kur përdoruesi ka orar në ndonjë pajisje
{ const [s1, j1] = await thirr({ afatet: [{ e: 'PC', d: '2026-10-09' }], vetemMeOrar: true }, bileta('uZ'));
  ok(s1 === 200 && j1.paOrar && !kv.has('orari-afatet:uZ'), 'PC pa orar → s\'ruhet', j1);
  const [s2, j2] = await thirr({ afatet: [{ e: 'PC', d: '2026-10-09' }], vetemMeOrar: true });
  ok(s2 === 200 && !j2.paOrar && JSON.parse(kv.get('orari-afatet:uA'))[0].e === 'PC', 'PC me orar te telefoni → ruhet', j2); }
// 5. scheduled() pa KV
await worker.scheduled({ scheduledTime: ora(8, 0, 5) }, { VAPID_PUBLIC: 'x', VAPID_PRIVATE: 'y' }, {}); ok(true, 'scheduled pa KV s\'prish asgjë');
