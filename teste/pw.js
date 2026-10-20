// Playwright: nga node_modules (nëse është instaluar) ose nga instalimi global i kontejnerit të Claude Code
try { module.exports = require('playwright'); } catch (e) { module.exports = require('/opt/node22/lib/node_modules/playwright'); }
