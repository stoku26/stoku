/*
 * stoku-push — Cloudflare Worker që dërgon njoftimet "push" të chat-it (edhe kur Stoku është i mbyllur).
 *
 * Vendoset NJË HERË te Cloudflare (Workers → Create → emri "stoku-push"), me këto "Secrets" (Settings → Variables):
 *   VAPID_PUBLIC   = çelësi publik (i njëjti me PUSH_VAPID te ekipa.js)
 *   VAPID_PRIVATE  = çelësi privat (s'shkruhet kurrë në repo)
 *   VAPID_SUBJECT  = mailto:adresa-jote@... (kërkohet nga Google/Apple/Mozilla, për kontakt)
 *
 * Si punon:
 *   POST /chat  { id }  + "Authorization: Bearer <tokeni i Firebase-it>"
 *     1. lexon mesazhin ekipa_chat/{id} ME TOKENIN E DËRGUESIT (Firestore REST) — rregullat e Firestore-it
 *        vendosin vetë a lejohet (anëtar i ekipës); emri dhe teksti merren nga mesazhi, jo nga kërkesa;
 *     2. mesazhi duhet të jetë i dërguesit dhe i freskët (< 3 min) — s'mund të ridërgohen mesazhe të vjetra;
 *     3. lexon ekipa_push (pajisjet e regjistruara) dhe i dërgon secilës (përveç dërguesit) një njoftim
 *        të enkriptuar (Web Push, RFC 8291 + VAPID RFC 8292). Pajisjet që s'ekzistojnë më (404/410) fshihen.
 *   POST /prove  → njoftim prove vetëm te pajisjet e vetë përdoruesit (p.sh. për ta parë te ora).
 *
 * Pa varësi të jashtme: vetëm WebCrypto e Cloudflare-it.
 */

const PROJEKTI = 'stoku-appi';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PROJEKTI + '/databases/(default)/documents';
const ORIGJINAT = ['https://stoku.site', 'https://www.stoku.site', 'https://stoku26.github.io', 'http://127.0.0.1:8765', 'http://localhost:8765'];
const MESAZH_MAKS_MS = 3 * 60 * 1000;

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ORIGJINAT.includes(origin) ? origin : ORIGJINAT[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const pergjigju = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return pergjigju({ ok: true, sherbimi: 'stoku-push', celesat: !!(env.VAPID_PUBLIC && env.VAPID_PRIVATE) });
    if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return pergjigju({ ok: false, arsye: 'mungojne-celesat' }, 500);

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const uid = uidNgaTokeni(token);
    if (!uid) return pergjigju({ ok: false, arsye: 'pa-hyrje' }, 401);
    const rruga = new URL(req.url).pathname.replace(/\/+$/, '');
    let trupi = {};
    try { trupi = await req.json(); } catch (e) { /* bosh */ }

    try {
      let ngarkesa, perKe;
      if (rruga === '/chat') {
        const id = String(trupi.id || '');
        if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return pergjigju({ ok: false, arsye: 'id' }, 400);
        const m = await lexoDoc('ekipa_chat/' + id, token);
        if (!m) return pergjigju({ ok: false, arsye: 's-u-gjet' }, 404);
        if (m.uid !== uid) return pergjigju({ ok: false, arsye: 'jo-i-yti' }, 403);
        if (!(Math.abs(Date.now() - Number(m.koha || 0)) < MESAZH_MAKS_MS)) return pergjigju({ ok: false, arsye: 'i-vjeter' }, 409);
        const tekst = String(m.tekst || '');
        ngarkesa = { lloji: 'chat', titulli: (m.emri || 'Ekipa') + ' · Chat', teksti: tekst.length > 180 ? tekst.slice(0, 177) + '…' : tekst, tag: 'ek-chat-' + id, url: './index.html#ekipa/chat', koha: Number(m.koha) || Date.now() };
        perKe = a => a.uid !== uid;
      } else if (rruga === '/prove') {
        ngarkesa = { lloji: 'prove', titulli: 'Stoku · Provë', teksti: 'Njoftimet punojnë. Kështu do të vijnë mesazhet e chat-it.', tag: 'stoku-prove', url: './index.html#ekipa/chat', koha: Date.now() };
        perKe = a => a.uid === uid;
      } else {
        return pergjigju({ ok: false, arsye: 'rruga' }, 404);
      }

      const teGjitha = await listoPajisjet(token);
      // Një pajisje (endpoint) merr vetëm një njoftim; dhe kurrë njoftimin e mesazhit që e dërgoi vetë
      // (p.sh. një regjistrim i vjetër i një llogarie tjetër në të njëjtin telefon)
      const teMiat = new Set(teGjitha.filter(a => a.uid === uid).map(a => a.endpoint));
      const pare = new Set();
      const pajisjet = teGjitha.filter(perKe).filter(a => {
        if (rruga === '/chat' && teMiat.has(a.endpoint)) return false;
        if (pare.has(a.endpoint)) return false;
        pare.add(a.endpoint); return true;
      });
      const vapid = await pergatitVapid(env);
      let derguar = 0, fshire = 0;
      const dergoKrejt = () => Promise.all(pajisjet.map(async a => {
        try {
          // prekja e njoftimit hap të njëjtin lloj dritareje: kompjuteri → pc.html, telefoni → index.html
          const ng = Object.assign({}, ngarkesa, { url: a.platforma === 'pc' ? './pc.html#/ekipa/chat' : './index.html#ekipa/chat' });
          const st = await dergoPush(a, ng, vapid);
          if (st >= 200 && st < 300) derguar++;
          else if (st === 404 || st === 410) { fshire++; await fshiDoc('ekipa_push/' + a.id, token); }
        } catch (e) { /* një pajisje e prishur s'i ndal të tjerat */ }
      }));
      // Prova me vonesë (deri 10 s): përdoruesi ka kohë ta fikë ekranin e telefonit dhe ta shohë njoftimin në orë
      const vonesa = rruga === '/prove' ? Math.min(10, Math.max(0, Number(trupi.vonesa) || 0)) : 0;
      if (vonesa && ctx && ctx.waitUntil) {
        ctx.waitUntil(new Promise(r => setTimeout(r, vonesa * 1000)).then(dergoKrejt));
        return pergjigju({ ok: true, pajisje: pajisjet.length, vonesa });
      }
      await dergoKrejt();
      return pergjigju({ ok: true, pajisje: pajisjet.length, derguar, fshire });
    } catch (e) {
      return pergjigju({ ok: false, arsye: String(e && e.message || e) }, e && e.status === 403 ? 403 : 500);
    }
  }
};

// ---------------- Firestore REST (me tokenin e përdoruesit: rregullat vlejnë si në aplikacion) ----------------
function uidNgaTokeni(t) {
  const p = t.split('.');
  if (p.length !== 3) return null;
  try { const o = JSON.parse(new TextDecoder().decode(b64uDekodo(p[1]))); return typeof o.user_id === 'string' ? o.user_id : (o.sub || null); } catch (e) { return null; }
}
function vleraNga(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('mapValue' in v) return objektNga(v.mapValue.fields || {});
  if ('nullValue' in v) return null;
  return null;
}
function objektNga(fields) { const o = {}; for (const k in fields) o[k] = vleraNga(fields[k]); return o; }
async function lexoDoc(rruga, token) {
  const r = await fetch(FS + '/' + rruga, { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 404) return null;
  if (!r.ok) { const e = new Error('firestore-' + r.status); e.status = r.status; throw e; }
  const j = await r.json();
  return objektNga(j.fields || {});
}
async function listoPajisjet(token) {
  const lista = [];
  let faqja = '';
  for (let i = 0; i < 5; i++) {
    const r = await fetch(FS + '/ekipa_push?pageSize=300' + (faqja ? '&pageToken=' + encodeURIComponent(faqja) : ''), { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) { const e = new Error('firestore-' + r.status); e.status = r.status; throw e; }
    const j = await r.json();
    (j.documents || []).forEach(d => {
      const o = objektNga(d.fields || {});
      o.id = d.name.split('/').pop();
      if (o.endpoint && o.p256dh && o.auth && /^https:\/\//.test(o.endpoint)) lista.push(o);
    });
    if (!j.nextPageToken) break;
    faqja = j.nextPageToken;
  }
  return lista;
}
async function fshiDoc(rruga, token) {
  try { await fetch(FS + '/' + rruga, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } }); } catch (e) { /* ok */ }
}

// ---------------- Web Push: VAPID (RFC 8292) + enkriptimi aes128gcm (RFC 8291) ----------------
function b64uDekodo(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const b = atob(s), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function b64uKodo(u) {
  u = new Uint8Array(u);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bashko(...pjeset) {
  const n = pjeset.reduce((a, p) => a + p.length, 0), r = new Uint8Array(n);
  let o = 0;
  pjeset.forEach(p => { r.set(p, o); o += p.length; });
  return r;
}
const tekst = s => new TextEncoder().encode(s);

async function pergatitVapid(env) {
  const pub = b64uDekodo(env.VAPID_PUBLIC);
  const jwk = { kty: 'EC', crv: 'P-256', d: env.VAPID_PRIVATE, x: b64uKodo(pub.slice(1, 33)), y: b64uKodo(pub.slice(33, 65)), ext: true };
  const celesi = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { celesi, publik: env.VAPID_PUBLIC, subjekti: env.VAPID_SUBJECT || 'mailto:stoku@stoku.site', jwt: {} };
}
async function jwtVapid(vapid, aud) {
  const tani = Math.floor(Date.now() / 1000);
  const ruajtur = vapid.jwt[aud];
  if (ruajtur && ruajtur.skadon - tani > 600) return ruajtur.t;
  const krye = b64uKodo(tekst(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  // 1 orë: Apple (web.push.apple.com) i refuzon tokenat me afat të gjatë; Google/Mozilla e pranojnë po ashtu
  const skadon = tani + 3600;
  const trup = b64uKodo(tekst(JSON.stringify({ aud, exp: skadon, sub: vapid.subjekti })));
  const nenshkrimi = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.celesi, tekst(krye + '.' + trup));
  const t = krye + '.' + trup + '.' + b64uKodo(nenshkrimi);
  vapid.jwt[aud] = { t, skadon };
  return t;
}
async function hkdf(salt, ikm, info, gjatesia) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, gjatesia * 8));
}
// Enkripton ngarkesën për një pajisje (aes128gcm). `prova` lejon salt/çelës të caktuar (vetëm për testet).
export async function enkripto(p256dh, authSekret, teDhenat, prova) {
  const uaPub = b64uDekodo(p256dh), auth = b64uDekodo(authSekret);
  const lokal = (prova && prova.lokal) || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', lokal.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, lokal.privateKey, 256));
  const salt = (prova && prova.salt) || crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(auth, ecdh, bashko(tekst('WebPush: info\0'), uaPub, asPub), 32);
  const cek = await hkdf(salt, ikm, tekst('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, tekst('Content-Encoding: nonce\0'), 12);
  const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const rekordi = bashko(teDhenat, new Uint8Array([2])); // 0x02 = rekordi i fundit
  const shifruar = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, rekordi));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return bashko(salt, rs, new Uint8Array([asPub.length]), asPub, shifruar);
}
async function dergoPush(a, ngarkesa, vapid) {
  const url = new URL(a.endpoint);
  const jwt = await jwtVapid(vapid, url.origin);
  const trupi = await enkripto(a.p256dh, a.auth, tekst(JSON.stringify(ngarkesa)));
  const r = await fetch(a.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'vapid t=' + jwt + ', k=' + vapid.publik,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'high'
    },
    body: trupi
  });
  return r.status;
}
