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

  // ================= Libër pune me disa fletë + stil (për versionin e kompjuterit) =================
  // sheets: [{ name, columns: [{ title, width, type: 'text'|'number'|'date' }], rows: [[...]],
  //            totalLabel?: 'Gjithsej', totalColumns?: [indekset e kolonave numerike që mblidhen],
  //            redZeroColumn?: indeksi i kolonës ku 0 shfaqet me të kuqe }]
  function kolonaShkronje(i) {
    var s = '';
    i = i + 1;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  function emriFletes(emri, zene) {
    var baza = String(emri || 'Fleta').replace(/[\[\]:*?\/\\]/g, ' ').replace(/^'+|'+$/g, '').replace(/\s+/g, ' ').trim() || 'Fleta';
    baza = baza.slice(0, 31);
    var e = baza, n = 2;
    while (zene[e.toLowerCase()]) {
      var prapashtese = ' (' + n + ')';
      e = baza.slice(0, 31 - prapashtese.length) + prapashtese;
      n++;
    }
    zene[e.toLowerCase()] = true;
    return e;
  }

  function dataExcel(ms) {
    var d = new Date(ms);
    return (ms - d.getTimezoneOffset() * 60000) / 86400000 + 25569;
  }

  function stilet() {
    var xmlKok = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return xmlKok +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd.mm.yyyy hh:mm"/></numFmts>' +
      '<fonts count="4">' +
      '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFC62828"/><name val="Calibri"/><family val="2"/></font>' +
      '</fonts>' +
      '<fills count="4">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF1565C0"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="2">' +
      '<border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left/><right/><top style="thin"><color rgb="FF1565C0"/></top><bottom/><diagonal/></border>' +
      '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="8">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
      '<xf numFmtId="1" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
      '<xf numFmtId="1" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';
  }

  function qelize(ref, vlera, lloji, stil) {
    if (vlera === null || vlera === undefined || vlera === '') return '';
    if (lloji === 'number') {
      var n = Number(vlera);
      if (!isFinite(n)) return '';
      return '<c r="' + ref + '" s="' + stil + '"><v>' + n + '</v></c>';
    }
    if (lloji === 'date') {
      var ms = Number(vlera);
      if (!isFinite(ms) || ms <= 0) return '';
      return '<c r="' + ref + '" s="4"><v>' + dataExcel(ms) + '</v></c>';
    }
    return '<c r="' + ref + '" s="' + stil + '" t="inlineStr"><is><t xml:space="preserve">' + escapeXml(vlera) + '</t></is></c>';
  }

  function buildWorkbook(sheets) {
    var xmlKok = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    var zene = {};
    var fletet = (sheets && sheets.length ? sheets : [{ name: 'Fleta', columns: [], rows: [] }]).map(function (sh) {
      return { sh: sh, emri: emriFletes(sh.name, zene) };
    });

    var ct = xmlKok +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    fletet.forEach(function (f, i) {
      ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    });
    ct += '</Types>';

    var rels = xmlKok +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    var emrat = '';
    var wbSheets = '';
    var wbRels = xmlKok + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    var skedaret = [];

    fletet.forEach(function (f, i) {
      var sh = f.sh;
      var cols = sh.columns || [];
      var rows = sh.rows || [];
      var nK = Math.max(cols.length, 1);
      var fundiKol = kolonaShkronje(nK - 1);
      var xmlRows = [];

      // Rreshti i titujve
      var koka = '<row r="1">';
      cols.forEach(function (c, ci) { koka += qelize(kolonaShkronje(ci) + '1', c.title, 'text', 1); });
      xmlRows.push(koka + '</row>');

      rows.forEach(function (r, ri) {
        var nr = ri + 2;
        var x = '<row r="' + nr + '">';
        cols.forEach(function (c, ci) {
          var v = r[ci];
          var stil = c.type === 'number' ? ((sh.redZeroColumn === ci && Number(v) === 0) ? 7 : 3) : (c.type === 'date' ? 4 : 2);
          x += qelize(kolonaShkronje(ci) + nr, v, c.type || 'text', stil);
        });
        xmlRows.push(x + '</row>');
      });

      var fundiTe = rows.length + 1;
      if (sh.totalLabel && rows.length > 0) {
        var nrT = rows.length + 2;
        var x2 = '<row r="' + nrT + '">';
        cols.forEach(function (c, ci) {
          var ref = kolonaShkronje(ci) + nrT;
          if (ci === 0) {
            x2 += '<c r="' + ref + '" s="5" t="inlineStr"><is><t xml:space="preserve">' + escapeXml(sh.totalLabel) + '</t></is></c>';
          } else if ((sh.totalColumns || []).indexOf(ci) !== -1) {
            var shuma = 0;
            rows.forEach(function (r) { shuma += Number(r[ci]) || 0; });
            var L = kolonaShkronje(ci);
            x2 += '<c r="' + ref + '" s="6"><f>SUM(' + L + '2:' + L + fundiTe + ')</f><v>' + shuma + '</v></c>';
          } else {
            x2 += '<c r="' + ref + '" s="5"/>';
          }
        });
        xmlRows.push(x2 + '</row>');
      }

      var zonaFiltrit = 'A1:' + fundiKol + Math.max(fundiTe, 1);
      var colsXml = '';
      if (cols.length) {
        colsXml = '<cols>' + cols.map(function (c, ci) {
          return '<col min="' + (ci + 1) + '" max="' + (ci + 1) + '" width="' + (c.width || 14) + '" customWidth="1"/>';
        }).join('') + '</cols>';
      }

      var sheetXml = xmlKok +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheetViews><sheetView workbookViewId="0"' + (i === 0 ? ' tabSelected="1"' : '') + '>' +
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
        '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="15"/>' +
        colsXml +
        '<sheetData>' + xmlRows.join('') + '</sheetData>' +
        (cols.length && rows.length ? '<autoFilter ref="' + zonaFiltrit + '"/>' : '') +
        '</worksheet>';

      skedaret.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: enc.encode(sheetXml) });
      wbSheets += '<sheet name="' + escapeXml(f.emri) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      wbRels += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      if (cols.length && rows.length) {
        emrat += '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' +
          escapeXml(f.emri.replace(/'/g, "''")) + '\'!$A$1:$' + fundiKol + '$' + fundiTe + '</definedName>';
      }
    });
    wbRels += '<Relationship Id="rId' + (fletet.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
    wbRels += '</Relationships>';

    var workbook = xmlKok +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<bookViews><workbookView activeTab="0"/></bookViews>' +
      '<sheets>' + wbSheets + '</sheets>' +
      (emrat ? '<definedNames>' + emrat + '</definedNames>' : '') +
      '</workbook>';

    return zip([
      { name: '[Content_Types].xml', data: enc.encode(ct) },
      { name: '_rels/.rels', data: enc.encode(rels) },
      { name: 'xl/workbook.xml', data: enc.encode(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(wbRels) },
      { name: 'xl/styles.xml', data: enc.encode(stilet()) }
    ].concat(skedaret));
  }

  // ================= Leximi i një .xlsx (për importin në kompjuter) =================
  // Kthen Promise → [{ name, rows: [[vlera, ...], ...] }]. Përdor DecompressionStream të shfletuesit.
  function lexoU16(b, o) { return b[o] | (b[o + 1] << 8); }
  function lexoU32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  async function hapZip(bajtet) {
    var b = bajtet instanceof Uint8Array ? bajtet : new Uint8Array(bajtet);
    var eocd = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (lexoU32(b, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('jo-zip');
    var n = lexoU16(b, eocd + 10);
    var poz = lexoU32(b, eocd + 16);
    var dec = new TextDecoder('utf-8');
    var hyrjet = {};
    for (var k = 0; k < n; k++) {
      if (lexoU32(b, poz) !== 0x02014b50) break;
      var metoda = lexoU16(b, poz + 10);
      var madhKomp = lexoU32(b, poz + 20);
      var gjEmrit = lexoU16(b, poz + 28), gjExtra = lexoU16(b, poz + 30), gjKoment = lexoU16(b, poz + 32);
      var offsetLokal = lexoU32(b, poz + 42);
      var emri = dec.decode(b.subarray(poz + 46, poz + 46 + gjEmrit));
      hyrjet[emri] = { metoda: metoda, madhKomp: madhKomp, offsetLokal: offsetLokal };
      poz += 46 + gjEmrit + gjExtra + gjKoment;
    }
    async function lexo(emri) {
      var h = hyrjet[emri];
      if (!h) return null;
      var o = h.offsetLokal;
      var fillimi = o + 30 + lexoU16(b, o + 26) + lexoU16(b, o + 28);
      var te = b.subarray(fillimi, fillimi + h.madhKomp);
      if (h.metoda === 0) return dec.decode(te);
      if (h.metoda !== 8) throw new Error('kompresim-i-panjohur');
      if (typeof DecompressionStream === 'undefined') throw new Error('pa-dekompresim');
      var rrjedha = new Blob([te]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(rrjedha).text();
    }
    return { emrat: Object.keys(hyrjet), lexo: lexo };
  }

  function kolonaNgaRef(ref) {
    var m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return -1;
    var n = 0;
    for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }

  function tekstiNyjes(el) {
    // <si> mund të ketë <t> të drejtpërdrejtë ose disa <r><t> (tekst me formatim)
    var ts = el.getElementsByTagNameNS('*', 't');
    var s = '';
    for (var i = 0; i < ts.length; i++) {
      // injoro tekstin fonetik (<rPh>)
      if (ts[i].parentNode && ts[i].parentNode.localName === 'rPh') continue;
      s += ts[i].textContent;
    }
    return s;
  }

  async function read(bajtet) {
    var z = await hapZip(bajtet);
    var par = new DOMParser();
    function xml(t) { return par.parseFromString(t, 'application/xml'); }

    var wbTxt = await z.lexo('xl/workbook.xml');
    if (!wbTxt) throw new Error('jo-xlsx');
    var relsTxt = await z.lexo('xl/_rels/workbook.xml.rels');
    var ssTxt = await z.lexo('xl/sharedStrings.xml');

    var shared = [];
    if (ssTxt) {
      var sis = xml(ssTxt).getElementsByTagNameNS('*', 'si');
      for (var i = 0; i < sis.length; i++) shared.push(tekstiNyjes(sis[i]));
    }
    var objektivat = {};
    if (relsTxt) {
      var rr = xml(relsTxt).getElementsByTagNameNS('*', 'Relationship');
      for (var j = 0; j < rr.length; j++) objektivat[rr[j].getAttribute('Id')] = rr[j].getAttribute('Target');
    }
    var fletet = xml(wbTxt).getElementsByTagNameNS('*', 'sheet');
    var rez = [];
    for (var f = 0; f < fletet.length; f++) {
      var rid = fletet[f].getAttribute('r:id') || fletet[f].getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      var target = objektivat[rid] || ('worksheets/sheet' + (f + 1) + '.xml');
      var shteg = target.charAt(0) === '/' ? target.slice(1) : ('xl/' + target.replace(/^\.\//, ''));
      var shTxt = await z.lexo(shteg);
      if (!shTxt) continue;
      var rreshtat = [];
      var rows = xml(shTxt).getElementsByTagNameNS('*', 'row');
      for (var r = 0; r < rows.length; r++) {
        var nrRreshtit = parseInt(rows[r].getAttribute('r'), 10);
        var idx = isFinite(nrRreshtit) ? nrRreshtit - 1 : rreshtat.length;
        var rresht = [];
        var cs = rows[r].getElementsByTagNameNS('*', 'c');
        for (var c = 0; c < cs.length; c++) {
          var cel = cs[c];
          var kol = kolonaNgaRef(cel.getAttribute('r'));
          if (kol < 0) kol = rresht.length;
          var t = cel.getAttribute('t');
          var vEl = cel.getElementsByTagNameNS('*', 'v')[0];
          var v = vEl ? vEl.textContent : '';
          var vlera;
          if (t === 's') vlera = shared[parseInt(v, 10)] || '';
          else if (t === 'inlineStr') vlera = tekstiNyjes(cel);
          else if (t === 'str' || t === 'e') vlera = v;
          else if (t === 'b') vlera = v === '1';
          else vlera = v === '' ? '' : Number(v);
          rresht[kol] = vlera;
        }
        for (var q = 0; q < rresht.length; q++) if (rresht[q] === undefined) rresht[q] = '';
        rreshtat[idx] = rresht;
      }
      for (var w = 0; w < rreshtat.length; w++) if (!rreshtat[w]) rreshtat[w] = [];
      rez.push({ name: fletet[f].getAttribute('name') || ('Fleta ' + (f + 1)), rows: rreshtat });
    }
    return rez;
  }

  var api = { build: build, buildWorkbook: buildWorkbook, read: read };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuXlsx = api;
})(typeof self !== 'undefined' ? self : this);
