// v244: pllaka vektoriale të rreme (skema OpenMapTiles, si OpenFreeMap) për rrethinën e Prishtinës: vendbanime (dhe shtet e
// rajon që S'DUHET të dalin), dyqane (POI), emra rrugësh dhe uji, rrugë, ujë, lumë, kufi, ndërtesë. Shërbehen si te
// tiles.openfreemap.org (TileJSON /planet, pllakat {z}/{x}/{y}.pbf, shkronjat /fonts/...) për testin harta-v244.js.
// Libraritë nga teste/npm (geojson-vt, vt-pbf, smp-noto-glyphs = shkronjat Noto Sans si PBF).
const NM = require('path').join(__dirname, 'npm', 'node_modules');
const kerko = require('module').createRequire(NM + '/'); // sipas emrit të paketës (geojson-vt 4 është ESM, me "exports")
const gvt = kerko('geojson-vt'); const geojsonvt = typeof gvt === 'function' ? gvt : gvt.default;
const vtpbf = kerko('vt-pbf');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const pike = (lng, lat, p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: p });
const vije = (k, p) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: k }, properties: p });
const poli = (k, p) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [k] }, properties: p });
const SHTRESAT = {
  place: [
    pike(21.1655, 42.6629, { class: 'city', name: 'Prishtinë', 'name:sq': 'Prishtinë', rank: 1 }),
    pike(21.0951, 42.6387, { class: 'town', name: 'Fushë Kosovë', rank: 5 }),
    pike(21.1925, 42.6070, { class: 'village', name: 'Hajvali', rank: 8 }),
    pike(21.1580, 42.6720, { class: 'suburb', name: 'Ulpiana', rank: 10 }),
    pike(21.1500, 42.6560, { class: 'neighbourhood', name: 'Dardania', rank: 12 }),
    pike(21.1300, 42.6900, { class: 'hamlet', name: 'Lagja e Re', rank: 14 }),
    pike(20.9000, 42.6000, { class: 'country', name: 'Kosova', rank: 1 }),
    pike(21.3000, 42.7500, { class: 'state', name: 'Rajoni i Prishtinës', rank: 2 })
  ],
  poi: [pike(21.1620, 42.6600, { class: 'shop', subclass: 'supermarket', name: 'Viva Fresh (POI)', rank: 1 }), pike(21.1700, 42.6650, { class: 'cafe', name: 'Kafe (POI)', rank: 1 })],
  transportation_name: [vije([[21.10, 42.64], [21.17, 42.665], [21.25, 42.68]], { class: 'primary', name: 'Rruga B (EMËR RRUGE)' })],
  transportation: [vije([[21.10, 42.64], [21.17, 42.665], [21.25, 42.68]], { class: 'primary' }), vije([[21.15, 42.60], [21.165, 42.70]], { class: 'secondary' }), vije([[21.155, 42.655], [21.175, 42.67]], { class: 'minor' })],
  waterway: [vije([[21.12, 42.60], [21.14, 42.70]], { class: 'river' })],
  water: [poli([[21.20, 42.70], [21.24, 42.70], [21.24, 42.72], [21.20, 42.72], [21.20, 42.70]], { class: 'lake' })],
  water_name: [pike(21.22, 42.71, { class: 'lake', name: 'Liqeni (EMËR UJI)' })],
  boundary: [vije([[20.0, 42.2], [21.8, 42.2], [21.8, 43.2]], { admin_level: 2, maritime: 0, disputed: 0 })],
  building: [poli([[21.160, 42.660], [21.161, 42.660], [21.161, 42.661], [21.160, 42.661], [21.160, 42.660]], { render_height: 10 })]
};
const indekset = Object.fromEntries(Object.entries(SHTRESAT).map(([k, f]) => [k, geojsonvt({ type: 'FeatureCollection', features: f }, { maxZoom: 14, indexMaxZoom: 5, extent: 4096, buffer: 64 })]));
function pllaka(z, x, y) {
  const layers = {};
  for (const [k, ix] of Object.entries(indekset)) { const t = ix.getTile(z, x, y); if (t) layers[k] = t; }
  return Buffer.from(vtpbf.fromGeojsonVt(layers, { version: 2 }));
}
const TILEJSON = { tilejson: '3.0.0', tiles: ['https://tiles.openfreemap.org/planet/20261015_001001_pt/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14, bounds: [-180, -85, 180, 85],
  attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  vector_layers: Object.keys(SHTRESAT).map(id => ({ id, fields: {} })) };
const GLYPHS = path.join(NM, 'smp-noto-glyphs', 'fixtures', 'glyphs');
const kerkuar = [];
// Për Playwright: ctx.route(/tiles\.openfreemap\.org/, rrugaEPllakave)
async function rrugaEPllakave(route) {
  const u = new URL(route.request().url());
  kerkuar.push(u.pathname);
  const KORS = { 'Access-Control-Allow-Origin': '*' };
  if (u.pathname === '/planet') return route.fulfill({ status: 200, contentType: 'application/json', headers: KORS, body: JSON.stringify(TILEJSON) });
  let m = u.pathname.match(/^\/planet\/[^/]+\/(\d+)\/(\d+)\/(\d+)\.pbf$/);
  if (m) return route.fulfill({ status: 200, contentType: 'application/x-protobuf', headers: KORS, body: pllaka(+m[1], +m[2], +m[3]) });
  m = decodeURIComponent(u.pathname).match(/^\/fonts\/([^/]+)\/(\d+-\d+)\.pbf$/);
  if (m) {
    const f = path.join(GLYPHS, m[2] + '.pbf.gz');
    return route.fulfill({ status: 200, contentType: 'application/x-protobuf', headers: KORS, body: fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)) : Buffer.alloc(0) });
  }
  return route.fulfill({ status: 404, headers: KORS, body: '' });
}
module.exports = { rrugaEPllakave, kerkuar, SHTRESAT };
