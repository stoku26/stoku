// v316 (Worker 173): modeli/versioni i orës, /ora/oret, /ora/shkeput-tel, /ora/emri
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
const sA = crypto.randomBytes(32).toString('hex'), sB = crypto.randomBytes(32).toString('hex');
let [s, j] = await th('/ora/oret', { b: {} }); ok(s === 401, '1. /ora/oret pa llogari → 401');
[s, j] = await th('/ora/oret', { b: {}, tok: bileta() }); ok(s === 200 && j.ok && j.oret.length === 0, '1. pa orë: lista bosh', j);
await th('/ora/kodi', { b: { kodi: '111222', sekret: sA, model: 'Galaxy Watch6 Classic', v: 76 } });
await th('/ora/kodi', { b: { kodi: '333444', sekret: sB, model: 'Galaxy Watch4' } });
[s, j] = await th('/ora/lidh', { b: { kodi: '111222', emri: 'agim', rt: 'RT-1-xxxxxxxxxxxxxxxxxxxxxxx' }, tok: bileta() }); ok(s === 200 && j.ok, '2. ora A u lidh');
[s, j] = await th('/ora/lidh', { b: { kodi: '333444', emri: 'agim' }, tok: bileta() }); ok(s === 200 && j.ok, '2. ora B u lidh');
[s, j] = await th('/ora/oret', { b: {}, tok: bileta() });
const A = (j.oret || []).find(o => o.model === 'Galaxy Watch6 Classic'), B = (j.oret || []).find(o => o.model === 'Galaxy Watch4');
ok(j.ok && j.oret.length === 2 && A && A.v === 76 && A.koha > 0 && A.aktiv > 0 && A.emri === 'agim' && A.id.length === 16 && B, '2. dy orët me modelin, versionin, kohën dhe emrin', j.oret);
[s, j] = await th('/ora/oret', { b: {}, tok: bileta('uB', 'besa@stoku-app.local') }); ok(j.ok && j.oret.length === 0, '2. llogaria tjetër s\'i sheh');
// versioni i ri nga /ora/sot
[s, j] = await th('/ora/sot?v=77&m=' + encodeURIComponent('Galaxy Watch6 Classic'), { m: 'GET', ora: sA }); ok(s === 200 && j.emri === 'agim', '3. /ora/sot punon');
[s, j] = await th('/ora/oret', { b: {}, tok: bileta() }); ok(j.oret.find(o => o.id === A.id).v === 77, '3. versioni i ri (77) u ruajt');
// emri i ri
[s, j] = await th('/ora/emri', { b: { emri: 'duli96' }, tok: bileta() }); ok(s === 200 && j.n === 2, '4. emri i ri te të dy orët', j);
[s, j] = await th('/ora/sot', { m: 'GET', ora: sB }); ok(j.emri === 'duli96', '4. ora e sheh emrin e ri pa u lidhur prapë', j.emri);
[s, j] = await th('/ora/emri', { b: { emri: 'duli96' }, tok: bileta() }); ok(j.n === 0, '4. pa ndryshim: s\'shkruhet sërish');
// shkëputja nga telefoni
[s, j] = await th('/ora/shkeput-tel', { b: { id: A.id }, tok: bileta('uB', 'besa@stoku-app.local') }); ok(s === 404, '5. llogaria tjetër s\'e shkëput dot');
[s, j] = await th('/ora/shkeput-tel', { b: { id: 'x' }, tok: bileta() }); ok(s === 404, '5. id e gabuar → 404');
[s, j] = await th('/ora/shkeput-tel', { b: { id: A.id }, tok: bileta() }); ok(s === 200 && j.ok, '5. ora A u shkëput nga telefoni');
[s, j] = await th('/ora/sot', { m: 'GET', ora: sA }); ok(s === 401, '5. ora A s\'e sheh më llogarinë (401)');
[s, j] = await th('/ora/sot', { m: 'GET', ora: sB }); ok(s === 200, '5. ora B mbetet e lidhur');
[s, j] = await th('/ora/oret', { b: {}, tok: bileta() }); ok(j.oret.length === 1 && j.oret[0].model === 'Galaxy Watch4', '5. mbetet vetëm ora B');
[s, j] = await th('/ora/shkeput-tel', { b: { id: j.oret[0].id }, tok: bileta() }); ok(s === 200 && !kv.has('ora-ka:uA'), '5. edhe B: ora-ka fshihet');
