// v166: GET /ora/krejt (ora: 8–30 ditë, mbi 30 ditë, kërkimi) + furnizuesi te afatet e orës
import worker from './worker.mjs';
import crypto from 'node:crypto';
const ok = (c, m, x) => console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const b64u = b => Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid = 'uA', email = 'agim@stoku-app.local') => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })); const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, email, iat: tS - 10, exp: tS + 3600 })); return h + '.' + p + '.' + b64u(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)); };
const FSD = new Map(); let rtValid = 'RT-1';
const fsv = v => 'stringValue' in v ? v.stringValue : 'integerValue' in v ? Number(v.integerValue) : 'booleanValue' in v ? v.booleanValue : 'arrayValue' in v ? (v.arrayValue.values || []).map(fsv) : 'mapValue' in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fsv(x)])) : null;
const fsf = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }]));
globalThis.fetch = async (url, opt = {}) => { url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  if (url.startsWith('https://securetoken.googleapis.com/v1/token')) { const rt = new URLSearchParams(opt.body).get('refresh_token'); if (rt !== rtValid) return new Response('{}', { status: 400 }); rtValid = 'RT-2'; return new Response(JSON.stringify({ id_token: bileta('uA'), refresh_token: 'RT-2', user_id: 'uA' })); }
  const m = url.match(/documents\/(.*)$/); if (!m) return new Response('?', { status: 500 });
  const [rr, q] = m[1].split('?'), par = new URLSearchParams(q || '');
  if ((opt.method || 'GET') === 'POST') { const id = par.get('documentId'); const o = Object.fromEntries(Object.entries(JSON.parse(opt.body).fields).map(([k, v]) => [k, fsv(v)])); FSD.set(rr + '/' + id, o); return new Response('{}'); }
  if (rr === 'ekipa_anetaret') return new Response(JSON.stringify({ documents: [['uA', 'agim'], ['uB', 'besa'], ['uC', 'drini']].map(([u, e]) => ({ name: 'p/d/ekipa_anetaret/' + u, fields: fsf({ emri: e }) })) }));
  if (rr === 'ekipa_push') return new Response(JSON.stringify({ documents: [] }));
  if (FSD.has(rr)) return new Response(JSON.stringify({ fields: fsf(Object.fromEntries(Object.entries(FSD.get(rr)).filter(([k, v]) => typeof v !== 'object'))) }));
  return new Response('{}', { status: 404 }); };
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: 'x', VAPID_PRIVATE: 'y', FOTO };
const th = async (rr, { m = 'POST', b, tok, ora } = {}) => { const h = { Origin: 'https://stoku.site' }; if (tok) h.Authorization = 'Bearer ' + tok; if (ora) h['X-Stoku-Ora'] = ora;
  const r = await worker.fetch(new Request('https://w.test' + rr, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined }), env, {}); return [r.status, await r.json()]; };
const sekret = crypto.randomBytes(32).toString('hex'), sekret2 = crypto.randomBytes(32).toString('hex');
let [s, j] = await th('/ora/kodi', { b: { kodi: '12345', sekret } }); ok(s === 400, 'kodi i gabuar → 400');
[s, j] = await th('/ora/kodi', { b: { kodi: '482913', sekret } }); ok(s === 200 && j.lidhur === false, 'sahati regjistron kodin', j);
[s, j] = await th('/ora/kodi', { b: { kodi: '482913', sekret: sekret2 } }); ok(s === 409, 'kodi i zënë nga sahat tjetër → 409');
[s, j] = await th('/ora/sot', { m: 'GET', ora: sekret }); ok(s === 401 && j.arsye === 'pa-lidhje', 'pa lidhje → 401');
[s, j] = await th('/ora/lidh', { b: { kodi: '482913' } }); ok(s === 401, 'lidhja pa llogari → 401');
[s, j] = await th('/ora/lidh', { b: { kodi: '111111' }, tok: bileta() }); ok(s === 404, 'kod që s\'ekziston → 404');
// afatet nga PC me vetemMeOrar: s'ruhen pa orë/orar
[s, j] = await th('/orari', { b: { afatet: [{ e: 'X', d: '2026-10-02' }], vetemMeOrar: true }, tok: bileta() }); ok(j.paOrar, 'pa sahat e pa orar → s\'ruhen');
[s, j] = await th('/ora/lidh', { b: { kodi: '482 913', emri: 'agim', rt: 'RT-1-xxxxxxxxxxxxxxxxxxxxxxx' }, tok: bileta() }); ok(s === 200 && j.ok, 'telefoni e lidh sahatin', j);
[s, j] = await th('/ora/kodi', { b: { kodi: '482913', sekret } }); ok(s === 200 && j.lidhur === true && j.emri === 'agim', 'sahati e sheh që u lidh', j);
const sot = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' });
const dita = n => { const d = new Date(sot + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
let g = 0; const ok2 = (c, m, x) => { if (!c) g++; ok(c, m, x); };
[s, j] = await th('/orari', { b: { afatet: [{ i: 'k1', e: 'Kos', b: '3800001', d: dita(-1), f: 'Vipa' }, { i: 'k2', e: 'Djathë', b: '3800002', d: sot }, { i: 'k3', e: 'Ujë Rugove', b: '3800003', d: dita(5), f: 'Rugove' },
  { i: 'k4', e: 'Lëng', b: '3800004', d: dita(20), f: 'Frutex' }, { i: 'k5', e: 'Oriz', b: '3800005', d: dita(90), f: 'Meridian', s: 4 }, { i: 'k6', e: 'Sallam', b: '3800006', d: dita(30), f: 'X'.repeat(200) }] }, tok: bileta() });
ok2(s === 200, 'afatet me furnizues ruhen');
[s, j] = await th('/ora/krejt', { m: 'GET' }); ok2(s === 401, '/ora/krejt pa orë → 401');
[s, j] = await th('/ora/krejt?tz=Europe/Belgrade', { m: 'GET', ora: sekret });
ok2(s === 200 && j.ok && j.krejt.length === 6 && j.dita === sot && j.d7 === dita(7) && j.d30 === dita(30), '/ora/krejt: krejt afatet, me kufijtë 7 dhe 30 ditë', { n: j.krejt && j.krejt.length, d7: j.d7, d30: j.d30 });
ok2(j.krejt.map(x => x.i).join() === 'k1,k2,k3,k4,k6,k5', 'sipas datës', j.krejt.map(x => x.i));
ok2(j.krejt.find(x => x.i === 'k5').f === 'Meridian' && j.krejt.find(x => x.i === 'k5').s === 4 && j.krejt.find(x => x.i === 'k6').f.length === 80 && !('f' in j.krejt.find(x => x.i === 'k2')), 'furnizuesi (≤ 80 shenja) dhe sasia', j.krejt.find(x => x.i === 'k5'));
const gjelbra = j.krejt.filter(x => x.d > j.d30).map(x => x.i), muaj = j.krejt.filter(x => x.d > j.d7 && x.d <= j.d30).map(x => x.i);
ok2(gjelbra.join() === 'k5' && muaj.join() === 'k4,k6', 'ndarja: mbi 30 ditë = k5; 8–30 ditë = k4, k6', { gjelbra, muaj });
[s, j] = await th('/ora/hiq', { b: { i: 'k5' }, ora: sekret });
[s, j] = await th('/ora/krejt', { m: 'GET', ora: sekret }); ok2(!j.krejt.some(x => x.i === 'k5'), 'e hequra nga ora s\'del më');
[s, j] = await th('/ora/sot', { m: 'GET', ora: sekret }); ok2(s === 200 && j.sot.length === 1, '/ora/sot si më parë', j.sot);
console.log(g ? 'GABIME ' + g : 'KREJT OK');
