// v345 (Worker 175): GET /fotot e riparon 'indeksi' nga çelësat 'foto:*' kur ka humbur një hyrje (dy ngarkime njëkohësisht)
import worker from './worker.mjs';
import crypto from 'node:crypto';
const ok=(c,m,x)=>console.log((c?'OK ':'GABIM ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));
const b64u=b=>Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg='RS256';
const tani = Math.floor(Date.now()/1000);
const bileta = (u) => { const h=b64u(JSON.stringify({alg:'RS256',kid:'k1',typ:'JWT'})); const p=b64u(JSON.stringify({iss:'https://securetoken.google.com/stoku-appi',aud:'stoku-appi',sub:u,user_id:u,iat:tani-10,exp:tani+3600})); return h+'.'+p+'.'+b64u(crypto.sign('sha256',Buffer.from(h+'.'+p),privateKey)); };
globalThis.fetch = async (url) => { if (String(url).includes('securetoken@system')) return new Response(JSON.stringify({keys:[jwk]}),{headers:{'Cache-Control':'public, max-age=20000'}}); return new Response('?',{status:500}); };
const kv = new Map(); let lista = 0, shkrime = 0;
const FOTO = { async get(k,t){const v=kv.get(k);if(v==null)return null;return t==='json'?JSON.parse(v.v):v.v;},
  async getWithMetadata(k){const v=kv.get(k);return v?{value:v.v,metadata:v.m}:{value:null,metadata:null};},
  async put(k,v,o){shkrime++;kv.set(k,{v:typeof v==='string'?v:'bin',m:o&&o.metadata});}, async delete(k){kv.delete(k);},
  async list(o){lista++; const keys=[...kv.keys()].filter(k=>k.startsWith(o.prefix)).sort();
    // dy faqe, që të provohet edhe cursor-i
    const nga = o.cursor ? Number(o.cursor) : 0, faqe = keys.slice(nga, nga + 2);
    return { keys: faqe.map(k=>({name:k, metadata: kv.get(k).m})), list_complete: nga + 2 >= keys.length, cursor: nga + 2 >= keys.length ? undefined : String(nga + 2) }; } };
const env = { VAPID_PUBLIC:'x', VAPID_PRIVATE:'y', FOTO };
const fotot = async () => { const r = await worker.fetch(new Request('https://w.test/fotot',{headers:{Origin:'https://stoku.site',Authorization:'Bearer '+bileta('uA')}}),env,{}); return (await r.json()).fotot; };
kv.set('foto:uA',{v:'bin',m:{koha:100,lloji:'image/jpeg'}}); kv.set('foto:uB',{v:'bin',m:{koha:200,lloji:'image/jpeg'}}); kv.set('foto:uC',{v:'bin',m:{koha:300,lloji:'image/jpeg'}});
kv.set('indeksi',{v:JSON.stringify({uA:100,uX:50})}); // uB dhe uC humbën (ngarkime njëkohësisht); uX pa foto
let f = await fotot();
ok(JSON.stringify(f)==='{"uA":100,"uB":200,"uC":300}','lista riparohet: uB dhe uC shtohen, uX hiqet', f);
ok(JSON.parse(kv.get('indeksi').v).uC===300 && lista===2,'indeksi u shkrua; dy faqe të listës', {lista});
kv.set('indeksi',{v:JSON.stringify({uA:100})}); const l0 = lista;
f = await fotot(); ok(lista===l0 && JSON.stringify(f)==='{"uA":100}','brenda orës: pa listë (kursehet kufiri)', {lista});
ok((await (await worker.fetch(new Request('https://w.test/'),env,{})).json()).versioni >= 175, 'Worker ≥ 175');
