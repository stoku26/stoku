// stoku-afatet v2 (web v298, pronari: "leje 10 foto ne dite"): kufiri ditor për llogari (KV, dita e Kosovës), leja
// "afatetAI" / "stokuImporto" nga lejet/{uid}, administratori pa kufi; leximi si më parë.
import worker from './afatet-worker.mjs';
import crypto from 'node:crypto';
let g = 0;
const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const b64u = b => Buffer.from(b).toString('base64url');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = Object.assign(publicKey.export({ format: 'jwk' }), { kid: 'k1', alg: 'RS256', use: 'sig' });
const tokeni = (uid, email, ndrysho) => {
  const tani = Math.floor(Date.now() / 1000);
  const k = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
  const t = b64u(JSON.stringify(Object.assign({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, email, iat: tani, exp: tani + 3600 }, ndrysho || {})));
  return k + '.' + t + '.' + b64u(crypto.sign('RSA-SHA256', Buffer.from(k + '.' + t), privateKey));
};
const lejet = { uN: { afatetAI: false }, uS: { stokuImporto: true, stoku: false }, uP: { afatet: false } };
let thirrjetAI = 0, aiDeshton = false;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  if (url.startsWith('https://www.googleapis.com/service_accounts/')) return new Response(JSON.stringify({ keys: [jwk] }));
  const m = url.match(/documents\/lejet\/([^/?]+)$/);
  if (m) {
    const u = decodeURIComponent(m[1]);
    if (u === 'uGabim') return new Response('{}', { status: 503 });
    if (!lejet[u]) return new Response('{}', { status: 404 });
    const f = {}; for (const k in lejet[u]) f[k] = { booleanValue: lejet[u][k] };
    return new Response(JSON.stringify({ fields: { lejet: { mapValue: { fields: f } } } }));
  }
  if (url.startsWith('https://generativelanguage.googleapis.com/')) {
    thirrjetAI++;
    if (aiDeshton) return new Response(JSON.stringify({ error: { message: 'overloaded' } }), { status: 503 });
    const tx = JSON.stringify({ rreshtat: [{ barkodi: '383', emri: 'Ujë', data: '2026-12-31', data_origjinale: '31.12.26', sasia: '6', furnizuesi: '', dyshim: false, x: 0.1, y: 0.2 }] });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: tx }] } }] }));
  }
  return new Response('?', { status: 500 });
};
const kv = new Map(), ttl = [];
const env = { GEMINI_API_KEY: 'x', KUFIRI: { async get(k) { return kv.has(k) ? kv.get(k) : null; }, async put(k, v, o) { kv.set(k, v); ttl.push(o && o.expirationTtl); } } };
const lexo = async (tok, e = env, trup = {}) => {
  const r = await worker.fetch(new Request('https://w.test/', { method: 'POST', headers: { Origin: 'https://stoku.site', 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: JSON.stringify(Object.assign({ image: 'aGVsbG8=', mime: 'image/jpeg', sot: '2026-11-13' }, trup)) }), e);
  return [r.status, await r.json()];
};
// 0. shëndeti
let r0 = await (await worker.fetch(new Request('https://w.test/', { headers: { Origin: 'https://stoku.site' } }), env)).json();
ok(r0.versioni === 3 && r0.kufiri === 10 && r0.ofruesit.join() === 'gemini', '0. GET: versioni 3, kufiri 10', r0);
r0 = await (await worker.fetch(new Request('https://w.test/', { headers: { Origin: 'https://stoku.site' } }), { GEMINI_API_KEY: 'x', KUFIRI_DITOR: '3', KUFIRI: env.KUFIRI })).json();
ok(r0.kufiri === 3, '0. KUFIRI_DITOR ndryshon kufirin', r0.kufiri);
// 1. pa hyrje / token i falsifikuar
let [st, j] = await lexo('a.b.c'); ok(st === 401 && j.gabim === 'pa-hyrje', '1. token i pavlefshëm → pa-hyrje', [st, j]);
[st, j] = await lexo(tokeni('u1', 'agim@stoku-app.local', { aud: 'tjeter' })); ok(st === 401, '1. projekt tjetër → pa-hyrje', st);
// 2. 10 lexime në ditë, i 11-ti refuzohet pa e thirrur AI-në
const t1 = tokeni('u1', 'agim@stoku-app.local');
const mbeten = [];
for (let i = 0; i < 10; i++) { [st, j] = await lexo(t1); mbeten.push(st === 200 ? j.mbeten : 'x' + st); }
ok(mbeten.join() === '9,8,7,6,5,4,3,2,1,0', '2. 10 lexime: mbeten 9…0', mbeten);
ok(j.rreshtat && j.rreshtat[0].barkodi === '383', '2. rreshtat kthehen si më parë', j.rreshtat);
const para = thirrjetAI;
[st, j] = await lexo(t1);
ok(st === 429 && j.gabim === 'kufiri' && j.kufiri === 10 && j.mbeten === 0 && thirrjetAI === para, '2. i 11-ti: kufiri (429), AI-ja s\'thirret', [st, j]);
const celesi = [...kv.keys()][0];
ok(/^ai-dita:u1:\d{4}-\d{2}-\d{2}$/.test(celesi) && kv.get(celesi) === '10' && ttl.every(x => x === 172800), '2. KV: ai-dita:{uid}:{dita}, skadon pas 2 ditësh', [celesi, kv.get(celesi)]);
// 3. tjetri ka kufirin e vet
[st, j] = await lexo(tokeni('u2', 'besa@stoku-app.local')); ok(st === 200 && j.mbeten === 9, '3. llogaria tjetër: kufiri i vet', [st, j.mbeten]);
// 4. administratori: pa kufi, s'llogaritet
// v3: administratori njihet nga uid-ja (edhe me emër tjetër); emri "mendurberisha" me uid tjetër s'është administrator
const tA = tokeni('USfaW6Lbm3dbxEF95aKMKadIaok1', 'emri-i-ri@stoku-app.local');
let okA = 0; for (let i = 0; i < 12; i++) { [st, j] = await lexo(tA); if (st === 200 && j.mbeten === undefined) okA++; }
ok(okA === 12 && ![...kv.keys()].some(k => k.includes(':USfaW6Lbm3dbxEF95aKMKadIaok1:')), '4. administratori (uid-ja, emër tjetër): 12 lexime, pa kufi', okA);
[st, j] = await lexo(tokeni('uA', 'mendurberisha@stoku-app.local'));
ok(st === 200 && j.mbeten === 9, '4. emri "mendurberisha" me uid tjetër: me kufi', [st, j.mbeten]);
// 5. gabimi i AI-së s'llogaritet
aiDeshton = true;
[st, j] = await lexo(tokeni('u3', 'c@stoku-app.local')); ok(st === 502 && j.gabim === 'ai', '5. AI dështon → ai', st);
ok(![...kv.keys()].some(k => k.includes(':u3:')), '5. leximi i dështuar s\'llogaritet');
aiDeshton = false;
// 6. leja
[st, j] = await lexo(tokeni('uN', 'n@stoku-app.local')); ok(st === 403 && j.gabim === 'leje', '6. "Lexo fletën me AI" e fikur → leje', [st, j]);
[st, j] = await lexo(tokeni('uP', 'p@stoku-app.local')); ok(st === 403 && j.gabim === 'leje', '6. "Afatet" e fikur (prindi) → leje', [st, j]);
[st, j] = await lexo(tokeni('uN', 'n@stoku-app.local'), env, { synim: 'stok' }); ok(st === 200, '6. importi i stokut kontrollon "stokuImporto", jo "afatetAI"', st);
[st, j] = await lexo(tokeni('uS', 's@stoku-app.local'), env, { synim: 'stok' }); ok(st === 403 && j.gabim === 'leje', '6. "Stoku" e fikur → importi i stokut: leje', [st, j]);
[st, j] = await lexo(tokeni('uGabim', 'g@stoku-app.local')); ok(st === 200, '6. Firestore s\'përgjigjet: s\'bllokohet', st);
// 7. pa KV: punon si më parë, pa kufi
const pa = { GEMINI_API_KEY: 'x' };
let n7 = 0; for (let i = 0; i < 12; i++) { [st, j] = await lexo(t1, pa); if (st === 200) n7++; }
ok(n7 === 12, '7. pa KV (KUFIRI): pa kufi, si më parë', n7);
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);
