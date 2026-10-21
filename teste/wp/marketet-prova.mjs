// v167: marketet te Worker-i: /orari e ruan `mk`, njoftimi ditor i ndan produktet sipas marketit, ora e merr `mk`
import worker, { njoftimiDitor } from './worker.mjs';
import crypto from 'node:crypto';
const ok = (c, m, x) => console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const b64u = b => Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid = 'uA') => {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
  const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, iat: tS - 10, exp: tS + 3000, auth_time: tS - 10 }));
  const s = crypto.sign('RSA-SHA256', Buffer.from(h + '.' + p), privateKey);
  return h + '.' + p + '.' + b64u(s);
};
globalThis.fetch = async url => {
  url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  return new Response('?', { status: 500 });
};
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { FOTO };
// 1. teksti i njoftimit
const sot = '2026-10-21';
let n = njoftimiDitor([{ e: 'Kos', d: sot, mk: 'Albi Mall' }, { e: 'Bukë', d: sot, mk: 'Albi Mall' }, { e: 'Jogurt', d: sot, mk: 'Viva Fresh' }, { e: 'Ujë', d: '2026-10-25', mk: 'Viva Fresh' }], sot);
ok(n && n.teksti === '3 produkte skadojnë sot. Albi Mall: Kos, Bukë · Viva Fresh: Jogurt.' && n.sot === 3, 'tre produkte në dy markete', n && n.teksti);
n = njoftimiDitor([{ e: 'Kos', d: sot, mk: 'Albi Mall' }], sot);
ok(n.teksti === 'Skadon sot. Albi Mall: Kos.', 'një produkt me market', n.teksti);
n = njoftimiDitor([{ e: 'Kos', d: sot, mk: 'Albi' }, { e: 'Djathë', d: sot }], sot);
ok(n.teksti === '2 produkte skadojnë sot. Albi: Kos · Pa market: Djathë.', 'pa market → "Pa market"', n.teksti);
n = njoftimiDitor(['A', 'B', 'C', 'D', 'E', 'F'].map(e => ({ e, d: sot, mk: 'Albi' })), sot);
ok(n.teksti === '6 produkte skadojnë sot. Albi: A, B, C, D +2.', 'më shumë se 4 në një market → "+2"', n.teksti);
n = njoftimiDitor([{ e: 'Kos', d: sot }, { e: 'Bukë', d: sot }], sot);
ok(n.teksti === '2 produkte skadojnë sot: Kos, Bukë.', 'pa markete: si më parë', n.teksti);
const gjate = njoftimiDitor(Array.from({ length: 30 }, (_, i) => ({ e: 'Produkt shumë i gjatë numër ' + i, d: sot, mk: 'Market ' + (i % 6) })), sot);
ok(gjate.teksti.length <= 220, 'teksti ≤ 220 shenja', gjate.teksti.length);
// 2. /orari e ruan mk; ora e merr
const r = await worker.fetch(new Request('https://w.test/orari', { method: 'POST', headers: { Authorization: 'Bearer ' + bileta('uM'), Origin: 'https://stoku.site', 'Content-Type': 'application/json' },
  body: JSON.stringify({ afatet: [{ i: 'a1', e: 'Kos', b: '1', d: sot, mk: 'Albi Mall' }, { i: 'a2', e: 'Ujë', b: '2', d: '2026-11-30', mk: 'x'.repeat(90) }, { i: 'a3', e: 'Bukë', b: '3', d: sot }] }) }), env, {});
const ruajtur = await FOTO.get('orari-afatet:uM', 'json');
ok(r.status === 200 && ruajtur && ruajtur[0].mk === 'Albi Mall' && ruajtur[1].mk.length === 60 && !('mk' in ruajtur[2]), '/orari: mk ruhet (≤ 60), pa mk s\'shtohet', ruajtur && ruajtur.map(x => x.mk || '-'));
const sekret = 'a'.repeat(64);
const h = crypto.createHash('sha256').update(sekret).digest('hex');
await FOTO.put('ora-tok:' + h, JSON.stringify({ uid: 'uM', emri: 'drini' }));
const rk = await worker.fetch(new Request('https://w.test/ora/krejt?tz=Europe/Belgrade', { headers: { 'X-Stoku-Ora': sekret } }), env, {});
const jk = await rk.json();
ok(jk.ok && jk.krejt.find(x => x.i === 'a1').mk === 'Albi Mall', '/ora/krejt: ora e merr emrin e marketit', jk.krejt && jk.krejt.map(x => x.mk || '-'));
const st = await (await worker.fetch(new Request('https://w.test/', { method: 'GET' }), env, {})).json();
ok(st.versioni === 167, 'versioni 167', st.versioni);
