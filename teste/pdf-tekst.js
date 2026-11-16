// v317: PDF-ja e afateve tani del me compress: true (vizatimet e faqeve të ngjeshura me Flate). Testet e lexojnë tekstin si latin1:
// ky ndihmës i hap rrjedhat e ngjeshura ("stream … endstream") që regex-et e vjetra të gjejnë sërish "(Produkti 80)" etj.
const zlib = require('zlib');
module.exports = function tekstiPdf(b64) {
  const b = Buffer.from(b64, 'base64'), s = b.toString('latin1');
  return s.replace(/stream\r?\n([\s\S]*?)\r?\nendstream/g, (krejt, trupi) => {
    try { return 'stream\n' + zlib.inflateSync(Buffer.from(trupi, 'latin1')).toString('latin1') + '\nendstream'; } catch (e) { return krejt; }
  });
};
