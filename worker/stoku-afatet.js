/*
 * Stoku: leximi i fletës së afateve me AI (Cloudflare Worker "stoku-afatet").
 *
 * Pse ekziston: çelësi i AI-së (Gemini ose Claude) s'mund të vendoset në faqe (stoku.site është publike,
 * kushdo do ta shihte dhe do ta përdorte në kurriz tënd). Ky Worker e mban çelësin të fshehur si "Secret"
 * dhe pranon vetëm kërkesa nga përdorues të kyçur në Stoku (verifikohet tokeni i Firebase-it).
 *
 * Variablat (Settings → Variables and Secrets):
 *   GEMINI_API_KEY    (Secret)  çelësi nga https://aistudio.google.com/apikey   → provohet i pari
 *   ANTHROPIC_API_KEY (Secret)  çelësi nga https://console.anthropic.com         → nëse s'ka/dështon Gemini
 *   AI                (Binding "Workers AI") model falas i Cloudflare (Llama 3.2 Vision), rezerva e fundit:
 *                      përdoret kur Gemini s'është i disponueshëm (p.sh. niveli falas i bllokuar në vend, pa pagesë).
 *   KUFIRI            (Binding "KV namespace", v2 / web v298) numëruesi ditor i leximeve për secilën llogari.
 *                      Mund të jetë i njëjti KV si "FOTO" te stoku-push (çelësat këtu nisin me "ai-dita:").
 *                      Pa të, kufiri ditor s'zbatohet (leximi punon si më parë).
 *   KUFIRI_DITOR      (opsional, parazgjedhur: 10) sa fletë në ditë për llogari; administratori s'ka kufi
 *   GEMINI_MODEL      (opsional, parazgjedhur: gemini-3.8-flash)
 *   CLAUDE_MODEL      (opsional, parazgjedhur: claude-sonnet-5)
 *   FIREBASE_PROJECT  (opsional, parazgjedhur: stoku-appi)
 *   LEJO_ORIGJINAT    (opsional, p.sh. "https://stoku.site,https://www.stoku.site")
 *
 * v2 (web v298, pronari: "leje 10 foto ne dite"):
 *   - Kufiri ditor: deri KUFIRI_DITOR lexime të suksesshme në ditë (dita sipas orës së Kosovës) për çdo llogari;
 *     pastaj { gabim: 'kufiri', kufiri } me 429. Llogohen vetëm leximet që kthejnë rreshta (një gabim i AI-së s'llogaritet).
 *     Administratori (mendurberisha) s'ka kufi.
 *   - Leja: Worker-i e lexon lejet/{uid} te Firestore (me tokenin e vetë përdoruesit; rregullat ia lejojnë të vetat).
 *     "afatetAI" (për afatet) ose "stokuImporto" (synim: 'stok'), bashkë me pjesën prind ("afatet" / "stoku").
 *     Pa leje → { gabim: 'leje' } me 403. Kur Firestore s'përgjigjet, s'bllokohet (si te aplikacioni: pa dokument = lejohet).
 */

const ORIGJINAT_PARAZGJEDHUR = ['https://stoku.site', 'https://www.stoku.site', 'https://stoku26.github.io'];
const MADHESIA_MAKS = 16 * 1024 * 1024; // ~12 MB foto (base64): fotot vijnë në rezolucionin e plotë të kamerës
const KUFIRI_PARAZGJEDHUR = 10;
const ADMINI_EMAIL = 'mendurberisha@stoku-app.local';

const UDHEZIMI = (sot) => `Je asistent që lexon fletë me shkrim dore nga një market në Kosovë/Shqipëri.
Fleta përmban produkte me datat e skadimit ("afatet"). Për çdo produkt mund të jenë shkruar: barkodi, emri i produktit,
data e skadimit, sasia dhe furnizuesi (kompania që e sjell produktin ose emri i komercialistit).

Data e sotme: ${sot}.

Detyra: lexo ÇDO rresht/produkt në foto dhe ktheje si JSON. Rregulla:
- RENDITJA: rreshtat në rezultat duhet të jenë në TË NJËJTIN RADHITJE siç janë shkruar në fletë, kolonë pas kolone,
  jo të përzier. Nëse fleta ka MË SHUMË SE NJË KOLONË produktesh (p.sh. e ndarë në gjysmën e majtë dhe të djathtë
  të faqes, ose disa "blloqe" krah për krah), lexoje PARA KREJT kolonën/bllokun MË TË MAJTË nga LART poshtë deri
  në fund, PASTAJ vazhdo me kolonën/bllokun tjetër në të djathtë të tij nga lart poshtë, e kështu me radhë deri
  te kolona/blloku MË I DJATHTË. MOS e lexo rresht-për-rresht përgjatë gjithë gjerësisë së faqes (kjo do t'i
  përzjente produktet e kolonave të ndryshme me njëri-tjetrin).
- Mos shpik asgjë. Nëse një fushë nuk shkruhet ose s'lexohet, lëre bosh ("").
- barkodi: vetëm shifrat, pa hapësira. Kujdes me 0/O, 1/7, 5/S, 8/B.
- emri: siç është shkruar (shqip), me shkronjat ë/ç nëse duken.
- data: data e skadimit në formatin VVVV-MM-DD. Datat në fletë janë DITË.MUAJ.VIT (formati evropian), jo muaj/ditë.
  Viti me 2 shifra (p.sh. 26) = 2026. Nëse shkruhet vetëm muaji dhe viti (p.sh. 10/26), përdor ditën e fundit të muajit.
  Nëse shkruhet vetëm dita dhe muaji, zgjidh vitin më të afërt që nuk është më shumë se 6 muaj në të kaluarën.
- data_origjinale: teksti i datës saktësisht siç shkruhet në fletë.
- sasia: sa copë janë nëse shkruhet sasia/copë/pako; përndryshe bosh "". Zakonisht vetëm numri, p.sh. "12".
  KUJDES: kur punëtorit i del mall tjetër më vonë, e shton në të njëjtën kuti me "+", p.sh. "60+30" ose "20+30+5".
  Atëherë ktheje saktësisht me shenjën "+" (p.sh. "60+30"), MOS i bashko shifrat ("6030" është gabim).
  Nëse s'je i sigurt a është "+" apo shifër tjetër (p.sh. 4 ose 7), vendos dyshim: true.
- furnizuesi: emri i furnizuesit/komercialistit VETËM nëse është QARTAZI i shkruar diku në fletë (edhe nëse
  shkruhet vetëm një herë si titull për disa rreshta, vendose te secili rresht që i përket). KURRË MOS E
  SHPIK: nëse fleta s'ka fare emër furnizuesi/kompanie shkruar askund, lëre bosh ("") te ÇDO rresht — mos
  vendos të njëjtin emër (ose çfarëdo emri) te të gjithë rreshtat thjesht se s'ke gjetur gjë tjetër. Fusha
  bosh ("") është përgjigja e saktë kur furnizuesi s'shkruhet, jo një emër i shpikur.
- dyshim: true nëse s'je i sigurt për ndonjë fushë (shkrim i paqartë, shifra të dyshimta).
- x, y: POZICIONI i rreshtit NË FOTO, si pjesë e gjerësisë/lartësisë së fotos (numra nga 0 deri 1, 0=majtas/lart,
  1=djathtas/poshtë). x: pak PARA fillimit të barkodit/tekstit të atij rreshti (skaji i majtë i rreshtit).
  y: SAKTËSISHT në lartësinë vertikale të QENDRËS SË SHKRONJAVE të atij rreshti — jo maja e rreshtit, jo
  hapësira mbi të, por vetë mesi i tekstit ku është shkruar (p.sh. nëse shifrat e barkodit fillojnë në
  pikselin 300 dhe mbarojnë në pikselin 320 vertikalisht, y duhet të përgjigjet me ~310, jo 295). Kjo
  përdoret për të shënuar numrin e rreshtit mbi foto pranë vetë tekstit, prandaj y duhet të jetë SHUMË i
  saktë për ÇDO rresht veç e veç (mos e llogarit si distancë të barabartë mes rreshtash — rreshtat në
  shkrim dore s'janë të barazlartë, kontrollo secilin individualisht), edhe nëse fleta ka disa kolona
  ose shumë rreshta (40-50+).
- Injoro titujt e tabelës, nënshkrimet dhe shënimet që s'janë produkte.`;

const SKEMA = {
  type: 'object',
  properties: {
    rreshtat: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          barkodi: { type: 'string' },
          emri: { type: 'string' },
          data: { type: 'string' },
          data_origjinale: { type: 'string' },
          sasia: { type: 'string' },
          furnizuesi: { type: 'string' },
          dyshim: { type: 'boolean' },
          x: { type: 'number' },
          y: { type: 'number' }
        },
        required: ['barkodi', 'emri', 'data', 'data_origjinale', 'sasia', 'furnizuesi', 'dyshim', 'x', 'y']
      }
    }
  },
  required: ['rreshtat']
};

export default {
  async fetch(request, env) {
    const origjina = request.headers.get('Origin') || '';
    const lejuara = env.LEJO_ORIGJINAT ? env.LEJO_ORIGJINAT.split(',').map((s) => s.trim()) : ORIGJINAT_PARAZGJEDHUR;
    const origjinaOk = lejuara.includes(origjina) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origjina);
    const cors = {
      'Access-Control-Allow-Origin': origjinaOk ? origjina : lejuara[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const pergjigju = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET') return pergjigju({ ok: true, sherbimi: 'stoku-afatet', versioni: 2, ofruesit: ofruesit(env), kufiri: env.KUFIRI ? kufiriDitor(env) : null });
    if (request.method !== 'POST') return pergjigju({ gabim: 'metoda' }, 405);
    if (!origjinaOk) return pergjigju({ gabim: 'origjina' }, 403);

    // Vetëm përdorues të kyçur në Stoku
    const tokeni = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const projekti = env.FIREBASE_PROJECT || 'stoku-appi';
    const perdoruesi = await verifikoTokenin(tokeni, projekti);
    if (!perdoruesi) return pergjigju({ gabim: 'pa-hyrje' }, 401);

    const gjatesia = +(request.headers.get('Content-Length') || 0);
    if (gjatesia > MADHESIA_MAKS) return pergjigju({ gabim: 'foto-shume-e-madhe' }, 413);
    let trupi;
    try { trupi = await request.json(); } catch (e) { return pergjigju({ gabim: 'json' }, 400); }
    const { image, mime, sot, synim } = trupi || {};
    if (!image || typeof image !== 'string' || image.length > MADHESIA_MAKS) return pergjigju({ gabim: 'pa-foto' }, 400);
    const llojiFotos = /^image\/(jpeg|png|webp)$/.test(mime) ? mime : 'image/jpeg';
    const dataSot = /^\d{4}-\d{2}-\d{2}$/.test(sot || '') ? sot : new Date().toISOString().slice(0, 10);

    // v2: leja dhe kufiri ditor (administratori: pa kufi)
    const admini = perdoruesi.email === ADMINI_EMAIL;
    if (!admini && !(await kaLeje(projekti, tokeni, perdoruesi.uid, synim === 'stok' ? ['stokuImporto', 'stoku'] : ['afatetAI', 'afatet']))) {
      return pergjigju({ gabim: 'leje' }, 403);
    }
    const kufiri = kufiriDitor(env);
    const celesiDites = 'ai-dita:' + perdoruesi.uid + ':' + ditaKosove(Date.now());
    let perdorur = 0;
    if (env.KUFIRI && !admini) {
      try { perdorur = Number(await env.KUFIRI.get(celesiDites)) || 0; } catch (e) { perdorur = 0; }
      if (perdorur >= kufiri) return pergjigju({ gabim: 'kufiri', kufiri, mbeten: 0 }, 429);
    }

    const radha = ofruesit(env);
    if (!radha.length) return pergjigju({ gabim: 'pa-celes' }, 500);
    let gabimiFundit = null;
    for (const o of radha) {
      if (o === 'gemini' && Date.now() < geminiPushonDeri) continue;
      try {
        let rreshtat;
        if (o === 'gemini') rreshtat = await meGemini(env, image, llojiFotos, dataSot);
        else if (o === 'claude') rreshtat = await meClaude(env, image, llojiFotos, dataSot);
        else rreshtat = await meWorkersAI(env, image, dataSot);
        let mbeten;
        if (env.KUFIRI && !admini) {
          perdorur++;
          mbeten = Math.max(0, kufiri - perdorur);
          try { await env.KUFIRI.put(celesiDites, String(perdorur), { expirationTtl: 2 * 86400 }); } catch (e) { /* KV pa shkrime sot: leximi s'ndalet */ }
        }
        return pergjigju({ ok: true, ofruesi: o, rezolucioni: o === 'gemini' ? (GEMINI_REZOLUCIONET[geminiRezolucioniOk] || 'parazgjedhur') : undefined, madhesia: image.length, mbeten, rreshtat });
      } catch (e) {
        gabimiFundit = e;
        // Gemini pa pagesë në vendet ku niveli falas s'lejohet: mos e provo sërish për 10 minuta, kalo te tjetri.
        if (o === 'gemini' && /FAILED_PRECONDITION|billing|not available in your country/i.test(String(e && e.message))) geminiPushonDeri = Date.now() + 10 * 60 * 1000;
      }
    }
    return pergjigju({ gabim: 'ai', detaje: String(gabimiFundit && gabimiFundit.message || gabimiFundit).slice(0, 300) }, 502);
  }
};

// ---------- v2: kufiri ditor dhe leja ----------
function kufiriDitor(env) {
  const n = Math.floor(Number(env.KUFIRI_DITOR));
  return n > 0 ? n : KUFIRI_PARAZGJEDHUR;
}
// Dita sipas orës së Kosovës (kufiri rinis në mesnatë, jo në orën 1 a 2 të natës)
function ditaKosove(ms) {
  try {
    const p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}
// lejet/{uid} te Firestore, me tokenin e përdoruesit. celesat = [leja, prindi]. Si lejet.js: pa dokument ose pa çelës =
// e lejuar; vetëm `false` ndalon. Gabim rrjeti / Firestore: s'bllokohet.
async function kaLeje(projekti, tokeni, uid, celesat) {
  try {
    const r = await fetch('https://firestore.googleapis.com/v1/projects/' + projekti + '/databases/(default)/documents/lejet/' + encodeURIComponent(uid),
      { headers: { Authorization: 'Bearer ' + tokeni } });
    if (r.status === 404) return true;
    if (!r.ok) return true;
    const j = await r.json();
    const lejet = (((j.fields || {}).lejet || {}).mapValue || {}).fields || {};
    return !celesat.some((k) => lejet[k] && lejet[k].booleanValue === false);
  } catch (e) { return true; }
}

let geminiPushonDeri = 0;
function ofruesit(env) {
  const r = [];
  if (env.GEMINI_API_KEY) r.push('gemini');
  if (env.ANTHROPIC_API_KEY) r.push('claude');
  if (env.AI) r.push('cloudflare');
  return r;
}

// Modeli falas i Cloudflare (10.000 "neurons" në ditë falas ≈ disa qindra foto)
let licencaEPranuar = false;
async function meWorkersAI(env, image, sot) {
  const model = env.CF_MODEL || '@cf/meta/llama-3.2-11b-vision-instruct';
  const bin = atob(image);
  const bajte = new Array(bin.length);
  for (let i = 0; i < bin.length; i++) bajte[i] = bin.charCodeAt(i);
  const pyetja = UDHEZIMI(sot) + '\n\nKthe VETËM JSON, pa asnjë tekst tjetër, në formën: {"rreshtat":[{"barkodi":"","emri":"","data":"VVVV-MM-DD","data_origjinale":"","sasia":"","furnizuesi":"","dyshim":false,"x":0,"y":0}]}';
  const dataUrl = 'data:image/jpeg;base64,' + image;
  // Formatet që pranon modeli (API-ja e Cloudflare ka ndryshuar me kohë): provohen me radhë.
  const formatet = [
    () => ({ prompt: pyetja, image: bajte, max_tokens: 2048, temperature: 0 }),
    () => ({ messages: [{ role: 'user', content: [{ type: 'text', text: pyetja }, { type: 'image_url', image_url: { url: dataUrl } }] }], max_tokens: 2048, temperature: 0 }),
    () => ({ messages: [{ role: 'system', content: 'Ti lexon fletë me afate dhe kthen vetëm JSON.' }, { role: 'user', content: pyetja }], image: bajte, max_tokens: 2048, temperature: 0 })
  ];
  let r = null, gabimi = null;
  for (let i = 0; i < formatet.length && r === null; i++) {
    for (let prova = 0; prova < 2 && r === null; prova++) {
      try {
        r = await env.AI.run(model, formatet[i]());
      } catch (e) {
        gabimi = e;
        // Llama 3.2 Vision kërkon pranimin e licencës së Meta-s një herë për llogari (përgjigja vjen si "gabim")
        if (!licencaEPranuar && /agree/i.test(String(e && e.message))) {
          try { await env.AI.run(model, { prompt: 'agree' }); } catch (e2) { /* "Thank you for agreeing" vjen si gabim */ }
          licencaEPranuar = true;
          continue;
        }
        break; // ky format s'pranohet: provo tjetrin
      }
    }
  }
  if (r === null) throw gabimi || new Error('cloudflare-ai');
  return nxirrRreshtat(typeof r === 'string' ? r : (r && (r.response || r.result && r.result.response)) || '');
}

// Rezolucioni me të cilin Gemini e "shikon" foton: ULTRA_HIGH (më i larti, për shkrim dore të imët).
// Nëse modeli s'e pranon, provohet automatikisht me HIGH dhe pastaj me parazgjedhjen.
const GEMINI_REZOLUCIONET = ['MEDIA_RESOLUTION_ULTRA_HIGH', 'MEDIA_RESOLUTION_HIGH', null];
let geminiRezolucioniOk = 0;
async function meGemini(env, image, mime, sot) {
  const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
  let r, j;
  for (let i = geminiRezolucioniOk; i < GEMINI_REZOLUCIONET.length; i++) {
    const foto = { inline_data: { mime_type: mime, data: image } };
    if (GEMINI_REZOLUCIONET[i]) foto.media_resolution = { level: GEMINI_REZOLUCIONET[i] };
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [foto, { text: UDHEZIMI(sot) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SKEMA }
      })
    });
    j = await r.json();
    if (r.ok) { geminiRezolucioniOk = i; break; }
    const rezolucioniSPranohet = r.status === 400 && /media_resolution|resolution/i.test(JSON.stringify(j));
    if (!rezolucioniSPranohet) break;
  }
  if (!r.ok) throw new Error('gemini ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  const tekst = (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || '').join('') || '';
  return nxirrRreshtat(tekst);
}

async function meClaude(env, image, mime, sot) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || 'claude-sonnet-5',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: image } },
          { type: 'text', text: UDHEZIMI(sot) + '\n\nKthe VETËM JSON, pa tekst tjetër, në formën: {"rreshtat":[{"barkodi":"","emri":"","data":"VVVV-MM-DD","data_origjinale":"","sasia":"","furnizuesi":"","dyshim":false,"x":0,"y":0}]}' }
        ]
      }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('claude ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  const tekst = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  return nxirrRreshtat(tekst);
}

function nxirrRreshtat(tekst) {
  let t = String(tekst || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const i = t.indexOf('{'), f = t.lastIndexOf('}');
  if (i >= 0 && f > i) t = t.slice(i, f + 1);
  const j = JSON.parse(t);
  const rr = Array.isArray(j) ? j : (j.rreshtat || []);
  const pozicioni = (v) => { const n = Number(v); return isFinite(n) ? Math.max(0, Math.min(1, n)) : null; };
  return rr.slice(0, 300).map((rresht) => ({
    barkodi: String(rresht.barkodi || '').slice(0, 64),
    emri: String(rresht.emri || '').slice(0, 120),
    data: String(rresht.data || '').slice(0, 10),
    data_origjinale: String(rresht.data_origjinale || '').slice(0, 40),
    sasia: String(rresht.sasia ?? '').replace(/[^0-9+]/g, '').replace(/^\++|\++$/g, '').replace(/\++/g, '+').slice(0, 40), // "60+30" mbetet me "+", aplikacioni e mbledh (90)
    furnizuesi: String(rresht.furnizuesi || '').slice(0, 80),
    dyshim: !!rresht.dyshim,
    x: pozicioni(rresht.x), // pozicioni i rreshtit në foto (0..1), ose null nëse s'e dha modeli
    y: pozicioni(rresht.y)
  }));
}

// ---------- Verifikimi i tokenit të Firebase (JWT RS256) ----------
let celesatCache = { kur: 0, celesat: null };
async function celesatGoogle() {
  if (celesatCache.celesat && Date.now() - celesatCache.kur < 3600 * 1000) return celesatCache.celesat;
  const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  const j = await r.json();
  celesatCache = { kur: Date.now(), celesat: j.keys || [] };
  return celesatCache.celesat;
}
function b64urlNeBajte(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function verifikoTokenin(tokeni, projekti) {
  try {
    const pjeset = tokeni.split('.');
    if (pjeset.length !== 3) return null;
    const koka = JSON.parse(new TextDecoder().decode(b64urlNeBajte(pjeset[0])));
    const te = JSON.parse(new TextDecoder().decode(b64urlNeBajte(pjeset[1])));
    if (koka.alg !== 'RS256') return null;
    const tani = Math.floor(Date.now() / 1000);
    if (te.aud !== projekti || te.iss !== 'https://securetoken.google.com/' + projekti) return null;
    if (!te.exp || te.exp < tani - 60 || !te.sub) return null;
    const jwk = (await celesatGoogle()).find((k) => k.kid === koka.kid);
    if (!jwk) return null;
    const celesi = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', celesi, b64urlNeBajte(pjeset[2]), new TextEncoder().encode(pjeset[0] + '.' + pjeset[1]));
    return ok ? { uid: te.sub, email: te.email || '' } : null;
  } catch (e) {
    return null;
  }
}
