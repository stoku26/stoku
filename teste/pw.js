// Playwright: nga node_modules (nëse është instaluar) ose nga instalimi global i kontejnerit të Claude Code
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
// v304: dritarja e detyrueshme e njoftimeve (web-i i telefonit, pas hyrjes me llogari) do t'i bllokonte testet, sepse
// shfletuesi pa ekran (headless) e ka lejen e njoftimeve "denied". Prandaj çdo faqe e testeve merr shenjën
// `window.__stokuPaNjoftime` (app-tel.js `duhenNjoftimet`). Testi që e provon vetë dritaren (v304.js) e fik me
// `require('./pw.js').meNjoftime = true` para se të krijojë kontekste.
const SHENJA = () => { window.__stokuPaNjoftime = true; };
// v327: Kreu (faqja kryesore e telefonit) s'hapet vetë te testet e vjetra (ato nisin nga Malli); testi i Kreut e ndez me `pw.meKreu = true`.
const PA_KREU = () => { window.__stokuPaKreu = true; };
const nis = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async function () {
  const b = await nis.apply(null, arguments);
  const kontekst = b.newContext.bind(b), faqe = b.newPage.bind(b);
  b.newContext = async function () { const c = await kontekst.apply(null, arguments); if (!pw.meNjoftime) await c.addInitScript(SHENJA); if (!pw.meKreu) await c.addInitScript(PA_KREU); return c; };
  b.newPage = async function () { const p = await faqe.apply(null, arguments); if (!pw.meNjoftime) await p.context().addInitScript(SHENJA); if (!pw.meKreu) await p.context().addInitScript(PA_KREU); return p; };
  return b;
};
module.exports = pw;
