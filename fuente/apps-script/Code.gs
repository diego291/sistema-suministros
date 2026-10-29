/**
 * ================================================================
 *  SISTEMA INTEGRADO DE SUMINISTROS  ·  Backend (Google Apps Script)
 *  Versión 1.0
 * ----------------------------------------------------------------
 *  Estructura en Google Drive (se crea sola la primera vez):
 *    📁 SISTEMA SUMINISTROS
 *       ├─ SUMINISTROS - CONFIGURACION   (config + módulos globales)
 *       ├─ SUMINISTROS 2026              (un archivo por año)
 *       ├─ SUMINISTROS 2027 ...
 *       ├─ 📁 Reportes PDF / <año>
 *       └─ 📁 Respaldos
 *
 *  Cada módulo es una hoja. Columnas del sistema:
 *    _id  (identificador)  _upd (última edición, reloj del cliente)
 *    _srv (hora del servidor al guardar)  _del (1 = eliminado)
 *  El resto de columnas son los campos del módulo (se agregan solas
 *  cuando usted crea campos personalizados).
 * ================================================================
 */

var APP_NAME = 'SISTEMA SUMINISTROS';
var SYS_COLS = ['_id', '_upd', '_srv', '_del'];
var CFG_SHEET = 'CONFIG';
var CHUNK = 45000; // tamaño máximo por celda al guardar la configuración

/* ======================= ENTRADAS WEB ======================= */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.cb) return jsonp_(p);
  if (p.ping) return json_({ ok: true, app: APP_NAME, api: 2, t: Date.now() });
  if (!p.clasico && props_().getProperty('REDIRIGIR') === 'si') return paginaRedirigir_();
  var t = HtmlService.createTemplateFromFile('Index');
  t.boot = JSON.stringify({ mode: 'gas', apiUrl: '', token: '' });
  return t.evaluate()
    .setTitle('Sistema de Suministros')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Dirección de la versión web (GitHub Pages). Se puede cambiar con la propiedad WEB_URL. */
var WEB_URL_BASE = 'https://diego291.github.io/sistema-suministros/';
function webUrl_() { return props_().getProperty('WEB_URL') || WEB_URL_BASE; }
/** Cuando está activo, el link de Apps Script abre la versión web (que se actualiza sola desde GitHub) */
function paginaRedirigir_() {
  var u = webUrl_(), clas = ScriptApp.getService().getUrl() + '?clasico=1';
  var h = '<!doctype html><html><head><meta charset="utf-8"><base target="_top"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>body{font-family:Arial,sans-serif;background:#eef2f8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}'
    + '.c{background:#fff;padding:28px 32px;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.12);text-align:center;max-width:420px}'
    + 'h2{color:#1f3864;margin:0 0 8px}a.b{display:inline-block;background:#1f3864;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;margin:12px 0}'
    + 'small a{color:#666}</style></head><body><div class="c"><h2>Sistema de Suministros</h2><p>El sistema ahora se abre en su versión web, que se actualiza sola.</p>'
    + '<a class="b" href="' + u + '">Abrir el sistema</a><br><small><a href="' + clas + '">Usar la versión anterior</a></small></div>'
    + '<script>try{window.top.location.replace(' + JSON.stringify(u) + ')}catch(e){}</script></body></html>';
  return HtmlService.createHtmlOutput(h).setTitle('Sistema de Suministros').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** API para la versión offline (archivo HTML en la PC) */
function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); }
  catch (x) { return json_({ ok: false, error: 'Solicitud inválida' }); }
  var bloqueo = claveBloqueada_(); if (bloqueo) return json_(bloqueo);
  var tok = props_().getProperty('API_TOKEN');
  if (!tok || req.token !== tok) { fallaClave_(); return json_({ ok: false, error: 'AUTH', msg: 'Clave de acceso inválida' }); }
  return json_(dispatch_(req));
}

/** API para la versión en línea (google.script.run) */
function apiCall(req) {
  req = req || {};
  if (!autorizado_(req)) return { ok: false, error: 'AUTH', msg: 'No autorizado. Ingrese la clave de acceso.' };
  return dispatch_(req);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Conexión alternativa para la versión offline (JSONP): sirve cuando el navegador
 *  bloquea fetch desde un archivo local. La solicitud llega en partes por GET. */
function jsonp_(p) {
  var cb = String(p.cb || 'cb').replace(/[^\w$.]/g, '');
  var out;
  try {
    if (p.ping) out = { ok: true, app: APP_NAME, t: Date.now() };
    else {
      var id = String(p.id || '').replace(/[^\w-]/g, ''), i = Number(p.i) || 0, n = Number(p.n) || 1, d = String(p.d || ''), body = d;
      if (n > 1) {
        var c = CacheService.getScriptCache();
        c.put('jp_' + id + '_' + i, d, 900);
        if (i < n - 1) out = { ok: true, part: i };
        else {
          var keys = []; for (var k = 0; k < n; k++) keys.push('jp_' + id + '_' + k);
          var got = c.getAll(keys); body = '';
          for (k = 0; k < n; k++) { if (got[keys[k]] == null) throw new Error('Se perdió una parte del envío, intente de nuevo'); body += got[keys[k]]; }
          c.removeAll(keys);
        }
      }
      if (!out) {
        var req = JSON.parse(body), tok = props_().getProperty('API_TOKEN');
        var bl = claveBloqueada_();
        if (bl) out = bl;
        else if (!tok || req.token !== tok) { fallaClave_(); out = { ok: false, error: 'AUTH', msg: 'Clave de acceso inválida' }; }
        else out = dispatch_(req);
      }
    }
  } catch (x) { out = { ok: false, error: String((x && x.message) || x) }; }
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/* Seguridad: tras 30 claves equivocadas en 10 minutos, la API se bloquea 10 minutos (evita adivinar la clave) */
function claveBloqueada_() {
  var n = Number(CacheService.getScriptCache().get('fallas_clave') || 0);
  return n >= 30 ? { ok: false, error: 'BLOQUEADO', msg: 'Demasiados intentos con clave equivocada. Espere 10 minutos.' } : null;
}
function fallaClave_() {
  var c = CacheService.getScriptCache(), n = Number(c.get('fallas_clave') || 0) + 1;
  c.put('fallas_clave', String(n), 600);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function autorizado_(req) {
  var tok = props_().getProperty('API_TOKEN');
  if (tok && req.token === tok) return true;
  var act = '', eff = '';
  try { act = Session.getActiveUser().getEmail() || ''; } catch (x) {}
  try { eff = Session.getEffectiveUser().getEmail() || ''; } catch (x) {}
  if (act && eff && act.toLowerCase() === eff.toLowerCase()) return true;
  var permitidos = (props_().getProperty('USUARIOS') || '').toLowerCase().split(/[,;\s]+/);
  if (act && permitidos.indexOf(act.toLowerCase()) >= 0) return true;
  // Si nunca se configuró el sistema, el primer acceso es del dueño
  if (!props_().getProperty('CONFIG_SS_ID')) return true;
  return false;
}

function dispatch_(req) {
  try {
    switch (req.action) {
      case 'ping': return { ok: true, t: Date.now() };
      case 'init': return { ok: true, data: init_() };
      case 'sync': return { ok: true, data: sync_(req) };
      case 'createYear': return { ok: true, data: createYear_(req.year, req.copyFrom, req.copyMods || []) };
      case 'savePdf': return { ok: true, data: savePdf_(req.html, req.name, req.year) };
      case 'pdfBatch': return { ok: true, data: pdfBatch_(req) };
      case 'pdfZip': return { ok: true, data: pdfZip_(req.folderId, req.name) };
      case 'backup': return { ok: true, data: backup_() };
      case 'compact': return { ok: true, data: compact_(req.year) };
      case 'offlineHtml': return { ok: true, data: offlineHtml_() };
      case 'triggers': return { ok: true, data: setTriggers_(req.email, req.digest) };
      case 'users': props_().setProperty('USUARIOS', String(req.users || '')); return { ok: true };
      case 'redirigir': props_().setProperty('REDIRIGIR', req.on ? 'si' : 'no'); if (req.url) props_().setProperty('WEB_URL', String(req.url)); return { ok: true, data: { redirigir: req.on ? 'si' : 'no' } };
      case 'newToken':
        props_().setProperty('API_TOKEN', Utilities.getUuid().replace(/-/g, ''));
        return { ok: true, data: { token: props_().getProperty('API_TOKEN') } };
      default: return { ok: false, error: 'Acción desconocida: ' + req.action };
    }
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

/* ======================= INSTALACIÓN ======================= */

function props_() { return PropertiesService.getScriptProperties(); }

/** Ejecute esta función UNA VEZ desde el editor para crear la estructura y dar permisos. */
function instalar() {
  var r = init_();
  Logger.log('Sistema listo. Carpeta: ' + r.folderUrl);
  Logger.log('Clave de acceso para la versión offline: ' + r.token);
  return r;
}

function setup_() {
  var p = props_();
  var rootId = p.getProperty('ROOT_ID');
  var root = null;
  if (rootId) { try { root = DriveApp.getFolderById(rootId); if (root.isTrashed()) root = null; } catch (x) { root = null; } }
  if (!root) {
    root = DriveApp.createFolder(APP_NAME);
    p.setProperty('ROOT_ID', root.getId());
    root.createFolder('Reportes PDF');
    root.createFolder('Respaldos');
  }
  var cfgId = p.getProperty('CONFIG_SS_ID');
  var ok = false;
  if (cfgId) { try { SpreadsheetApp.openById(cfgId); ok = true; } catch (x) { ok = false; } }
  if (!ok) {
    var ss = SpreadsheetApp.create('SUMINISTROS - CONFIGURACION');
    moveToFolder_(ss.getId(), root);
    var sh = ss.getSheets()[0];
    sh.setName(CFG_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['clave', 'valor']]).setFontWeight('bold');
    sh.getRange('B:B').setNumberFormat('@');
    p.setProperty('CONFIG_SS_ID', ss.getId());
  }
  if (!p.getProperty('API_TOKEN')) p.setProperty('API_TOKEN', Utilities.getUuid().replace(/-/g, ''));
  return root;
}

function moveToFolder_(fileId, folder) {
  var f = DriveApp.getFileById(fileId);
  f.moveTo(folder);
}

function cfgSS_() {
  setup_();
  return SpreadsheetApp.openById(props_().getProperty('CONFIG_SS_ID'));
}

function rootFolder_() { return DriveApp.getFolderById(setup_().getId()); }

function subFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function init_() {
  var root = setup_();
  var cfg = readConfig_();
  var email = '';
  try { email = Session.getEffectiveUser().getEmail(); } catch (x) {}
  return {
    config: cfg,
    years: listYears_(),
    serverTime: Date.now(),
    folderUrl: root.getUrl(),
    token: props_().getProperty('API_TOKEN'),
    webAppUrl: ScriptApp.getService().getUrl(),
    redirigir: props_().getProperty('REDIRIGIR') === 'si',
    email: email,
    users: props_().getProperty('USUARIOS') || '',
    triggers: triggerState_()
  };
}

/* ======================= CONFIGURACIÓN ======================= */

function readConfig_() {
  var sh = cfgSS_().getSheetByName(CFG_SHEET);
  var last = sh.getLastRow();
  if (last < 2) return null;
  var vals = sh.getRange(2, 1, last - 1, 2).getValues();
  var parts = [];
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).indexOf('config_') === 0) parts.push(String(vals[i][1]));
  }
  if (!parts.length) return null;
  try { return JSON.parse(parts.join('')); } catch (x) { return null; }
}

function writeConfig_(cfg) {
  var sh = cfgSS_().getSheetByName(CFG_SHEET);
  var s = JSON.stringify(cfg);
  var rows = [];
  for (var i = 0; i < s.length; i += CHUNK) rows.push(['config_' + rows.length, s.substr(i, CHUNK)]);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 2).clearContent();
  sh.getRange(2, 1, rows.length, 2).setNumberFormat('@').setValues(rows);
}

/* ======================= AÑOS ======================= */

function listYears_() {
  var all = props_().getProperties();
  var ys = [];
  for (var k in all) if (k.indexOf('YEAR_') === 0) ys.push(Number(k.substr(5)));
  ys.sort();
  return ys;
}

function yearSS_(year, create) {
  year = Number(year);
  if (!year) throw new Error('Año inválido');
  var id = props_().getProperty('YEAR_' + year);
  if (id) { try { return SpreadsheetApp.openById(id); } catch (x) { /* archivo borrado: se recrea */ } }
  if (!create) return null;
  var ss = SpreadsheetApp.create('SUMINISTROS ' + year);
  moveToFolder_(ss.getId(), rootFolder_());
  ss.getSheets()[0].setName('LEEME');
  ss.getSheets()[0].getRange(1, 1, 4, 1).setValues([
    ['SISTEMA DE SUMINISTROS — DATOS DEL AÑO ' + year],
    ['Cada hoja es un módulo. No cambie los nombres de las columnas ni la columna _id.'],
    ['Puede consultar, filtrar o copiar datos; para editar, use preferiblemente la aplicación.'],
    ['Columnas: _upd = última edición · _srv = guardado en servidor · _del = 1 si fue eliminado.']
  ]);
  props_().setProperty('YEAR_' + year, ss.getId());
  return ss;
}

function createYear_(year, copyFrom, copyMods) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = yearSS_(year, true);
    if (copyFrom && copyMods && copyMods.length) {
      var src = yearSS_(copyFrom, false);
      if (src) {
        copyMods.forEach(function (mod) {
          var s = src.getSheetByName(mod);
          if (!s || s.getLastRow() < 2) return;
          var data = s.getDataRange().getValues();
          var h = data[0];
          var iDel = h.indexOf('_del'), iSrv = h.indexOf('_srv'), iId = h.indexOf('_id');
          var now = Date.now();
          var out = [h];
          for (var r = 1; r < data.length; r++) {
            if (Number(data[r][iDel]) === 1) continue;
            var row = data[r].slice();
            row[iSrv] = now;
            row[iId] = String(row[iId]) + '_' + year; // id nuevo para el nuevo año
            out.push(row);
          }
          var d = ss.getSheetByName(mod) || ss.insertSheet(mod);
          d.clear();
          d.getRange(1, 1, out.length, h.length).setNumberFormat('@').setValues(out.map(function (row) {
            return row.map(function (v) { return v instanceof Date ? fmtDate_(v) : v; });
          }));
          d.setFrozenRows(1);
          props_().setProperty('V_' + ss.getId() + '_' + mod, String(now));
        });
      }
    }
    return { years: listYears_(), url: ss.getUrl() };
  } finally { lock.releaseLock(); }
}

/* ======================= SINCRONIZACIÓN ======================= */
/*
 req = {
   year: 2026,
   mods: { recibos: { scope:'y', since: 0, fields:['numero',...], num:['pago',...], changes:[{_id,_upd,_del,...}] }, ... },
   config: {...} (opcional, si cambió en el cliente)
 }
 Respuesta: { serverTime, mods:{ mod:{ rows:[...], ver } }, config? }
*/
function sync_(req) {
  var t0 = Date.now();
  var out = { serverTime: t0 - 5000, mods: {} };
  var mods = req.mods || {};
  var hayCambios = !!req.config;
  for (var m in mods) if (mods[m].changes && mods[m].changes.length) { hayCambios = true; break; }

  var lock = null;
  if (hayCambios) { lock = LockService.getScriptLock(); lock.waitLock(30000); }
  try {
    // ---- configuración (gana la más reciente)
    var srvCfg = readConfig_();
    if (req.config) {
      if (!srvCfg || Number(req.config._upd || 0) >= Number(srvCfg._upd || 0)) {
        writeConfig_(req.config);
        srvCfg = req.config;
      }
    }
    if (srvCfg && Number(srvCfg._upd || 0) > Number(req.cfgUpd || 0)) out.config = srvCfg;

    var allProps = props_().getProperties();
    var cfgSS = null, ySS = null;
    for (var mod in mods) {
      var spec = mods[mod];
      var ss;
      if (spec.scope === 'g') { ss = cfgSS || (cfgSS = cfgSS_()); }
      else { ss = ySS || (ySS = yearSS_(req.year, true)); }
      var verKey = 'V_' + ss.getId() + '_' + mod;
      var ver = Number(allProps[verKey] || 0);
      var since = Number(spec.since || 0);
      var changes = spec.changes || [];

      if (!changes.length && since >= ver && since > 0) { out.mods[mod] = { rows: [], ver: ver }; continue; }

      var sh = ensureSheet_(ss, mod, spec.fields || [], spec.num || []);
      var data = sh.getDataRange().getValues();
      if (changes.length) {
        data = applyChanges_(sh, data, changes);
        ver = Date.now();
        props_().setProperty(verKey, String(ver));
      }
      out.mods[mod] = { rows: rowsSince_(data, since), ver: ver };
    }
  } finally { if (lock) lock.releaseLock(); }
  out.years = listYears_();
  return out;
}

function ensureSheet_(ss, mod, fields, numFields) {
  var sh = ss.getSheetByName(mod);
  var want = SYS_COLS.concat(fields.filter(function (f) { return SYS_COLS.indexOf(f) < 0; }));
  if (!sh) {
    sh = ss.insertSheet(mod);
    sh.getRange(1, 1, 1, want.length).setValues([want]).setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    formatCols_(sh, want, 1, numFields);
    return sh;
  }
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var missing = want.filter(function (f) { return head.indexOf(f) < 0; });
  if (missing.length) {
    if (sh.getMaxColumns() < lastCol + missing.length) sh.insertColumnsAfter(sh.getMaxColumns(), lastCol + missing.length - sh.getMaxColumns());
    sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff');
    formatCols_(sh, missing, lastCol + 1, numFields);
  }
  return sh;
}

function formatCols_(sh, names, startCol, numFields) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    var isNum = n === '_upd' || n === '_srv' || n === '_del' || numFields.indexOf(n) >= 0;
    sh.getRange(1, startCol + i, sh.getMaxRows(), 1).setNumberFormat(isNum ? '0.##' : '@');
    sh.getRange(1, startCol + i).setNumberFormat('@');
  }
}

function applyChanges_(sh, data, changes) {
  var head = data[0].map(String);
  var w = head.length;
  var col = {};
  head.forEach(function (h, i) { col[h] = i; });
  var iId = col._id, iUpd = col._upd, iSrv = col._srv;
  var idRow = {};
  for (var r = 1; r < data.length; r++) if (data[r][iId] !== '') idRow[String(data[r][iId])] = r;
  var now = Date.now();
  var dirty = {}, nuevos = [];

  changes.forEach(function (ch) {
    if (!ch || !ch._id) return;
    var r = idRow[String(ch._id)];
    var row;
    if (r !== undefined) {
      row = data[r];
      if (Number(row[iUpd] || 0) > Number(ch._upd || 0)) {
        // el servidor tiene una versión más nueva: se re-envía al cliente
        row[iSrv] = now; dirty[r] = true; return;
      }
    } else {
      row = new Array(w);
      for (var k = 0; k < w; k++) row[k] = '';
    }
    for (var key in ch) {
      if (key === '_dirty' || col[key] === undefined) continue;
      row[col[key]] = toCell_(ch[key]);
    }
    row[iSrv] = now;
    if (r !== undefined) dirty[r] = true;
    else { idRow[String(ch._id)] = data.length; data.push(row); nuevos.push(row); }
  });

  var dirtyRows = Object.keys(dirty).map(Number);
  var existentes = data.length - nuevos.length;
  if (dirtyRows.length > 25 && existentes > 1) {
    sh.getRange(2, 1, existentes - 1, w).setValues(data.slice(1, existentes));
  } else {
    dirtyRows.forEach(function (r) { sh.getRange(r + 1, 1, 1, w).setValues([data[r]]); });
  }
  if (nuevos.length) {
    var start = existentes + 1;
    if (sh.getMaxRows() < start + nuevos.length) sh.insertRowsAfter(sh.getMaxRows(), start + nuevos.length - sh.getMaxRows() + 50);
    sh.getRange(start, 1, nuevos.length, w).setValues(nuevos);
  }
  return data;
}

function toCell_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string' && v.length > 49000) return v.substr(0, 49000);
  return v;
}

function rowsSince_(data, since) {
  if (data.length < 2) return [];
  var head = data[0].map(String);
  var iSrv = head.indexOf('_srv'), iId = head.indexOf('_id');
  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row[iId] === '' || row[iId] === null) continue;
    if (Number(row[iSrv] || 0) <= since) continue;
    var o = {};
    for (var c = 0; c < head.length; c++) {
      var v = row[c];
      if (v === '' || v === null) continue;
      o[head[c]] = v instanceof Date ? fmtDate_(v) : v;
    }
    out.push(o);
  }
  return out;
}

function fmtDate_(d) {
  var tz = Session.getScriptTimeZone();
  var hasTime = d.getHours() || d.getMinutes();
  return Utilities.formatDate(d, tz, hasTime ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd');
}

/** Borra físicamente las filas marcadas como eliminadas (_del = 1) */
function compact_(year) {
  var res = {};
  var lista = [cfgSS_()];
  var y = yearSS_(year, false);
  if (y) lista.push(y);
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    lista.forEach(function (ss) {
      ss.getSheets().forEach(function (sh) {
        if (sh.getLastRow() < 2) return;
        var data = sh.getDataRange().getValues();
        var iDel = data[0].indexOf('_del');
        if (iDel < 0) return;
        var keep = data.filter(function (r, i) { return i === 0 || Number(r[iDel]) !== 1; });
        var borradas = data.length - keep.length;
        if (!borradas) return;
        sh.getRange(2, 1, data.length - 1, data[0].length).clearContent();
        if (keep.length > 1) sh.getRange(2, 1, keep.length - 1, data[0].length).setValues(keep.slice(1));
        res[ss.getName() + ' / ' + sh.getName()] = borradas;
      });
    });
  } finally { lock.releaseLock(); }
  return res;
}

/* ======================= PDF, RESPALDOS, OFFLINE ======================= */

function savePdf_(html, name, year) {
  var root = rootFolder_();
  var folder = subFolder_(subFolder_(root, 'Reportes PDF'), String(year || new Date().getFullYear()));
  var nombre = String(name || 'Reporte').replace(/[\\\/:*?"<>|]/g, '').substr(0, 120);
  var blob = Utilities.newBlob(html, 'text/html', nombre + '.html').getAs('application/pdf').setName(nombre + '.pdf');
  var f = folder.createFile(blob);
  return { url: f.getUrl(), name: f.getName() };
}

/** PDF individuales: un archivo por elemento; opcionalmente lo envía por correo */
function pdfBatch_(req) {
  var folder;
  if (req.folderId) folder = DriveApp.getFolderById(req.folderId);
  else {
    var base = subFolder_(subFolder_(rootFolder_(), 'Reportes PDF'), String(req.year || new Date().getFullYear()));
    folder = base.createFolder(String(req.folderName || 'Lote').replace(/[\\\/:*?"<>|]/g, '').substr(0, 120));
  }
  var out = [];
  (req.items || []).forEach(function (it) {
    var nombre = String(it.name || 'Reporte').replace(/[\\\/:*?"<>|]/g, '').substr(0, 120);
    var html = '<html><head><meta charset="utf-8"><style>' + (req.css || '') + '</style></head><body style="background:#fff">' + it.html + '</body></html>';
    var blob = Utilities.newBlob(html, 'text/html', nombre + '.html').getAs('application/pdf').setName(nombre + '.pdf');
    var f = folder.createFile(blob);
    var enviado = false, error = '';
    if (req.send && it.email) {
      try {
        MailApp.sendEmail({ to: it.email, subject: it.subject || nombre, body: it.body || '', attachments: [blob], name: req.sender || 'Suministros' });
        enviado = true;
      } catch (e) { error = String(e.message || e); }
    }
    out.push({ name: f.getName(), url: f.getUrl(), sent: enviado, error: error });
  });
  return { folderId: folder.getId(), folderUrl: folder.getUrl(), files: out, quota: MailApp.getRemainingDailyQuota() };
}

/** Comprime en .zip todos los PDF de la carpeta del lote */
function pdfZip_(folderId, name) {
  var folder = DriveApp.getFolderById(folderId);
  var blobs = [], it = folder.getFilesByType(MimeType.PDF);
  while (it.hasNext()) blobs.push(it.next().getBlob());
  if (!blobs.length) return { url: '' };
  var zip = Utilities.zip(blobs, String(name || 'Reportes').replace(/[\\\/:*?"<>|]/g, '') + '.zip');
  var f = folder.createFile(zip);
  return { url: f.getUrl(), download: 'https://drive.google.com/uc?export=download&id=' + f.getId() };
}

function backup_() {
  var root = rootFolder_();
  var dest = subFolder_(subFolder_(root, 'Respaldos'), Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm'));
  var ids = [props_().getProperty('CONFIG_SS_ID')];
  listYears_().forEach(function (y) { ids.push(props_().getProperty('YEAR_' + y)); });
  var n = 0;
  ids.forEach(function (id) {
    if (!id) return;
    try { var f = DriveApp.getFileById(id); f.makeCopy(f.getName(), dest); n++; } catch (x) {}
  });
  return { url: dest.getUrl(), files: n };
}

/** Respaldo automático semanal (se activa desde Configuración) */
function respaldoAutomatico() { backup_(); }

function offlineHtml_() {
  setup_();
  var t = HtmlService.createTemplateFromFile('Index');
  t.boot = JSON.stringify({ mode: 'file', apiUrl: ScriptApp.getService().getUrl(), token: props_().getProperty('API_TOKEN') });
  var html = t.evaluate().getContent();
  var root = rootFolder_();
  var name = 'Suministros_Offline.html';
  var it = root.getFilesByName(name);
  while (it.hasNext()) it.next().setTrashed(true);
  var f = root.createFile(name, html, MimeType.HTML);
  return { html: html, url: f.getUrl() };
}

/* ======================= RECORDATORIOS POR CORREO ======================= */

function triggerState_() {
  var st = { email: false, digest: false, backup: false };
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'revisarRecordatorios') st.email = true;
    if (f === 'resumenDiario') st.digest = true;
    if (f === 'respaldoAutomatico') st.backup = true;
  });
  return st;
}

function setTriggers_(email, digest) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'revisarRecordatorios' || f === 'resumenDiario' || f === 'respaldoAutomatico') ScriptApp.deleteTrigger(t);
  });
  if (email) ScriptApp.newTrigger('revisarRecordatorios').timeBased().everyMinutes(15).create();
  if (digest) ScriptApp.newTrigger('resumenDiario').timeBased().atHour(6).everyDays(1).create();
  ScriptApp.newTrigger('respaldoAutomatico').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(17).create();
  props_().setProperty('LAST_REMINDER_CHECK', String(Date.now()));
  return triggerState_();
}

function agendaRows_() {
  var sh = cfgSS_().getSheetByName('agenda');
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues();
  var head = data[0].map(String);
  return data.slice(1).map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i] instanceof Date ? fmtDate_(r[i]) : r[i]; });
    return o;
  }).filter(function (o) { return o._id && Number(o._del) !== 1; });
}

function ymd_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

/** ¿El evento ocurre en la fecha (yyyy-MM-dd)? Soporta repeticiones */
function ocurre_(ev, fecha) {
  var f0 = String(ev.fecha || '').substr(0, 10);
  if (!f0) return false;
  if (fecha < f0) return false;
  if (ev.hasta && fecha > String(ev.hasta).substr(0, 10)) return false;
  var rep = String(ev.repetir || 'No');
  if (rep === 'No' || !rep) return fecha === f0;
  var a = new Date(f0 + 'T12:00:00'), b = new Date(fecha + 'T12:00:00');
  var dias = Math.round((b - a) / 86400000);
  if (rep === 'Diario') return true;
  if (rep === 'Lunes a viernes') { var wd = b.getDay(); return wd >= 1 && wd <= 5; }
  if (rep === 'Semanal') return dias % 7 === 0;
  if (rep === 'Quincenal') return dias % 14 === 0;
  if (rep === 'Mensual') return a.getDate() === b.getDate();
  if (rep === 'Anual') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
  return fecha === f0;
}

function destinatario_() {
  var cfg = readConfig_() || {};
  var mail = (cfg.notif && cfg.notif.correo) || '';
  if (!mail) { try { mail = Session.getEffectiveUser().getEmail(); } catch (x) {} }
  return mail;
}

function revisarRecordatorios() {
  var p = props_();
  var last = Number(p.getProperty('LAST_REMINDER_CHECK') || (Date.now() - 15 * 60000));
  var now = Date.now();
  var hoy = ymd_(new Date());
  var mail = destinatario_();
  if (!mail) return;
  var avisos = [];
  agendaRows_().forEach(function (ev) {
    if (String(ev.hecho) === 'true' || ev.hecho === true) return;
    if (String(ev.hechos || '').split(',').indexOf(hoy) >= 0) return;
    var rec = ev.recordar === '' || ev.recordar === undefined ? -1 : Number(ev.recordar);
    if (rec < 0 || !ocurre_(ev, hoy)) return;
    var hora = String(ev.hora || '07:00');
    var t = new Date(hoy + 'T' + (hora.length === 5 ? hora : '07:00') + ':00').getTime() - rec * 60000;
    if (t > last && t <= now) avisos.push(ev);
  });
  p.setProperty('LAST_REMINDER_CHECK', String(now));
  if (!avisos.length) return;
  var body = avisos.map(function (e) {
    return '• ' + (e.hora ? e.hora + ' — ' : '') + e.titulo + (e.lugar ? ' (' + e.lugar + ')' : '') + (e.descripcion ? '\n   ' + e.descripcion : '');
  }).join('\n');
  MailApp.sendEmail(mail, '⏰ Recordatorio: ' + avisos[0].titulo + (avisos.length > 1 ? ' y ' + (avisos.length - 1) + ' más' : ''),
    'Actividades próximas:\n\n' + body + '\n\n— Sistema de Suministros');
}

function resumenDiario() {
  var mail = destinatario_();
  if (!mail) return;
  var hoy = ymd_(new Date());
  var evs = agendaRows_().filter(function (e) { return ocurre_(e, hoy) && !(String(e.hecho) === 'true' || e.hecho === true) && String(e.hechos || '').split(',').indexOf(hoy) < 0; });
  var vencidas = agendaRows_().filter(function (e) {
    return (String(e.repetir || 'No') === 'No') && String(e.fecha).substr(0, 10) < hoy && !(String(e.hecho) === 'true' || e.hecho === true);
  });
  if (!evs.length && !vencidas.length) return;
  evs.sort(function (a, b) { return String(a.hora || '99').localeCompare(String(b.hora || '99')); });
  var txt = 'AGENDA DE HOY (' + hoy + ')\n\n' + (evs.map(function (e) { return '• ' + (e.hora || 'Todo el día') + ' — ' + e.titulo; }).join('\n') || 'Sin actividades.');
  if (vencidas.length) txt += '\n\nPENDIENTES ATRASADAS (' + vencidas.length + ')\n' + vencidas.slice(0, 30).map(function (e) { return '• ' + e.fecha + ' — ' + e.titulo; }).join('\n');
  MailApp.sendEmail(mail, '📅 Agenda de hoy · ' + evs.length + ' actividad(es)', txt + '\n\n— Sistema de Suministros');
}
