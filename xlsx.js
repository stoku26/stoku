/*
 * Krijon një skedar .xlsx të vërtetë pa asnjë librari të jashtme
 * (një .xlsx është vetëm një ZIP me disa skedarë XML).
 * Barkodi ruhet si tekst, kështu zerot në fillim nuk humbasin.
 *
 * Përdorimi: const bytes = StokuXlsx.build(produktet);  // Uint8Array
 * produktet = [{ barkodi, emri, sasia }, ...]
 */
(function (root) {
  'use strict';

  var enc = new TextEncoder();

  var crcTable = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(d) {
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time: time & 0xFFFF, date: date & 0xFFFF };
  }

  // ZIP pa kompresim (method 0 = stored). files: [{ name, data: Uint8Array }]
  function zip(files) {
    var parts = [];
    var central = [];
    var offset = 0;
    var dt = dosDateTime(new Date());

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var crc = crc32(f.data);
      var size = f.data.length;

      var local = new Uint8Array(30 + nameBytes.length);
      var v = new DataView(local.buffer);
      v.setUint32(0, 0x04034b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 0x0800, true);
      v.setUint16(8, 0, true);
      v.setUint16(10, dt.time, true);
      v.setUint16(12, dt.date, true);
      v.setUint32(14, crc, true);
      v.setUint32(18, size, true);
      v.setUint32(22, size, true);
      v.setUint16(26, nameBytes.length, true);
      v.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      parts.push(local, f.data);

      var cen = new Uint8Array(46 + nameBytes.length);
      var c = new DataView(cen.buffer);
      c.setUint32(0, 0x02014b50, true);
      c.setUint16(4, 20, true);
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, dt.time, true);
      c.setUint16(14, dt.date, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, size, true);
      c.setUint32(24, size, true);
      c.setUint16(28, nameBytes.length, true);
      c.setUint16(30, 0, true);
      c.setUint16(32, 0, true);
      c.setUint16(34, 0, true);
      c.setUint16(36, 0, true);
      c.setUint32(38, 0, true);
      c.setUint32(42, offset, true);
      cen.set(nameBytes, 46);
      central.push(cen);

      offset += local.length + size;
    });

    var centralSize = 0;
    central.forEach(function (c) { centralSize += c.length; });

    var end = new Uint8Array(22);
    var e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(4, 0, true);
    e.setUint16(6, 0, true);
    e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true);
    e.setUint32(12, centralSize, true);
    e.setUint32(16, offset, true);
    e.setUint16(20, 0, true);

    var all = parts.concat(central, [end]);
    var total = 0;
    all.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total);
    var pos = 0;
    all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  function escapeXml(t) {
    var s = String(t);
    var r = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      var code = s.charCodeAt(i);
      if (ch === '&') r += '&amp;';
      else if (ch === '<') r += '&lt;';
      else if (ch === '>') r += '&gt;';
      else if (ch === '"') r += '&quot;';
      else if (code < 0x20 && ch !== '\n' && ch !== '\t' && ch !== '\r') { /* hiqet */ }
      else r += ch;
    }
    return r;
  }

  function tekst(t) {
    return '<c t="inlineStr"><is><t xml:space="preserve">' + escapeXml(t) + '</t></is></c>';
  }

  function build(produktet) {
    var xmlKok = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

    var contentTypes = xmlKok +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>';

    var rels = xmlKok +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    var workbook = xmlKok +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Malli" sheetId="1" r:id="rId1"/></sheets></workbook>';

    var workbookRels = xmlKok +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>';

    var rows = [];
    rows.push('<row>' + tekst('Barkodi') + tekst('Emri i produktit') + tekst('Sasia') + '</row>');
    produktet.forEach(function (p) {
      rows.push('<row>' + tekst(p.barkodi) + tekst(p.emri) + '<c><v>' + (p.sasia | 0) + '</v></c></row>');
    });

    var sheet = xmlKok +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<cols>' +
      '<col min="1" max="1" width="22" customWidth="1"/>' +
      '<col min="2" max="2" width="40" customWidth="1"/>' +
      '<col min="3" max="3" width="10" customWidth="1"/>' +
      '</cols><sheetData>' + rows.join('') + '</sheetData></worksheet>';

    return zip([
      { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
      { name: '_rels/.rels', data: enc.encode(rels) },
      { name: 'xl/workbook.xml', data: enc.encode(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
      { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) }
    ]);
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuXlsx = api;
})(typeof self !== 'undefined' ? self : this);
