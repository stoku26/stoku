import { enkripto } from './worker.mjs';
import worker from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
// "Pajisja" (marrësi): çelës ECDH + auth
const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
const auth = crypto.randomBytes(16);
const mesazhi = JSON.stringify({ titulli: 'Stoku · Grupi', teksti: 'Përshëndetje! ë ç 😀' });
const shifra = await enkripto(b64u(ua.getPublicKey()), b64u(auth), new TextEncoder().encode(mesazhi));
const hapur = ece.decrypt(Buffer.from(shifra), { version: 'aes128gcm', privateKey: ua, authSecret: auth });
console.log(hapur.toString() === mesazhi ? 'OK  enkriptimi (http_ece e hap saktë)' : 'GABIM enkriptimi: ' + hapur);
// VAPID: çelësat + JWT i verifikuar me Node
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:test@stoku.site' };
// Simulo Firestore + shërbimin push
let kapur = [];
const tani = Date.now();
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  // v221: chat-i u hoq; tubacioni i njoftimeve (enkriptimi, VAPID, pajisjet e vdekura) provohet me /kerkese
  if (url.includes('/ekipa_feed/k1abcdef')) return new Response(JSON.stringify({ fields: { uid: { stringValue: 'uA' }, emri: { stringValue: 'agim' }, lloji: { stringValue: 'kerkese-heqje' }, produkti: { stringValue: 'Kos Vita' }, barkodi: { stringValue: '3900123' }, koha: { integerValue: String(tani) } } }));
  if (url.includes('/ekipa_feed/vjeter1')) return new Response(JSON.stringify({ fields: { uid: { stringValue: 'uA' }, emri: { stringValue: 'agim' }, lloji: { stringValue: 'kerkese-heqje' }, produkti: { stringValue: 'x' }, koha: { integerValue: String(tani - 3600e3) } } }));
  if (url.includes('/ekipa_push?')) return new Response(JSON.stringify({ documents: [
    { name: 'x/ekipa_push/uA_1', fields: { uid: { stringValue: 'uA' }, endpoint: { stringValue: 'https://push.test/A' }, p256dh: { stringValue: b64u(ua.getPublicKey()) }, auth: { stringValue: b64u(auth) } } },
    { name: 'x/ekipa_push/uB_1', fields: { uid: { stringValue: 'uB' }, endpoint: { stringValue: 'https://fcm.googleapis.com/fcm/send/B' }, p256dh: { stringValue: b64u(ua.getPublicKey()) }, auth: { stringValue: b64u(auth) } } },
    { name: 'x/ekipa_push/uC_1', fields: { uid: { stringValue: 'uC' }, endpoint: { stringValue: 'https://push.test/vdekur' }, p256dh: { stringValue: b64u(ua.getPublicKey()) }, auth: { stringValue: b64u(auth) } } }] }));
  if (opt.method === 'DELETE') { kapur.push('FSHI ' + url.split('/').pop()); return new Response('{}'); }
  if (url.startsWith('https://push.test/vdekur')) return new Response('', { status: 410 });
  if (url.startsWith('https://fcm') || url.startsWith('https://push.test')) { kapur.push({ url, opt }); return new Response('', { status: 201 }); }
  return new Response('?', { status: 500 });
};
const tok = 'x.' + b64u(JSON.stringify({ user_id: 'uA', sub: 'uA' })) + '.y';
const thirr = async (rr, trup) => { const r = await worker.fetch(new Request('https://w.test' + rr, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, Origin: 'https://stoku.site' }, body: JSON.stringify(trup) }), env); return [r.status, await r.json(), r.headers.get('access-control-allow-origin')]; };
let [st, j, co] = await thirr('/kerkese', { id: 'k1abcdef' });
console.log(st === 200 && j.derguar === 1 && j.fshire === 1 ? 'OK ' : 'GABIM', '/kerkese', st, JSON.stringify(j), 'CORS', co);
const fcm = kapur.find(x => x.url && x.url.includes('fcm'));
const h = fcm.opt.headers;
const [t, k] = h.Authorization.replace('vapid t=', '').split(', k=');
const [hh, pp, ss] = t.split('.');
const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(v.getPublicKey().subarray(1, 33)), y: b64u(v.getPublicKey().subarray(33)) }, format: 'jwk' });
const ver = crypto.verify('sha256', Buffer.from(hh + '.' + pp), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(ss, 'base64url'));
const pl = JSON.parse(Buffer.from(pp, 'base64url'));
console.log(ver && pl.aud === 'https://fcm.googleapis.com' && k === env.VAPID_PUBLIC ? 'OK ' : 'GABIM', 'VAPID JWT', JSON.stringify(pl));
const ng = ece.decrypt(Buffer.from(fcm.opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString();
console.log(/agim i kërkon grupit ta heqë nga rafti: Kos Vita \(3900123\)/.test(ng) && /Stoku · Hiqe nga rafti/.test(ng) ? 'OK ' : 'GABIM', 'ngarkesa te pajisja:', ng);
console.log(kapur.includes('FSHI uC_1') ? 'OK ' : 'GABIM', 'pajisja e vdekur u fshi');
console.log(!kapur.some(x => x.url && x.url.endsWith('/A')) ? 'OK ' : 'GABIM', 'dërguesi s\'e merr njoftimin e vet');
kapur = [];
[st, j] = await thirr('/kerkese', { id: 'vjeter1' }); console.log(st === 409 ? 'OK ' : 'GABIM', 'kërkesë e vjetër refuzohet', st);
[st, j] = await thirr('/chat', { id: 'k1abcdef' }); console.log(st === 404 && j.arsye === 'rruga' && !kapur.length ? 'OK ' : 'GABIM', 'v221: /chat u hoq (404, pa asnjë lexim/dërgim)', st, JSON.stringify(j), kapur.length);
[st, j] = await thirr('/prove', {}); console.log(st === 404 && !kapur.length ? 'OK ' : 'GABIM', '/prove u hoq (404)', st);
let r = await worker.fetch(new Request('https://w.test/kerkese', { method: 'POST', body: '{}' }), env); console.log(r.status === 401 ? 'OK ' : 'GABIM', 'pa token → 401');
