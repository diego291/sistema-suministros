/**
 * SISTEMA DE SUMINISTROS · CARGADOR
 *
 * Pegue este archivo UNA sola vez como Code.gs. El servidor (fuente/servidor/Nucleo.gs)
 * se descarga solo desde GitHub cada vez que cambia y se guarda una copia en Drive
 * (carpeta "Código del sistema" dentro de SISTEMA SUMINISTROS).
 *
 * En el editor (menú de funciones, arriba):
 *   activarTodo      → la primera vez: autoriza y descarga el servidor.
 *   actualizarAhora  → trae la última versión sin esperar los 5 minutos.
 *   estadoSistema    → muestra la versión instalada.
 *
 * Volver a una versión anterior sin tocar código:
 *   Configuración del proyecto › Propiedades del script › GH_REF = (commit o etiqueta).
 *   Borrar GH_REF vuelve a la rama main.
 */
var GH_REPO = 'diego291/sistema-suministros';
var GH_RAMA = 'main';
var GH_RUTA = 'fuente/servidor/Nucleo.gs';
var CARGADOR_VERSION = 1;

var REVISAR_CADA = 300;   // segundos entre revisiones de versión nueva
var PARTE = 45000;        // tamaño de cada trozo en la caché
var CK = 'SUMC1_';
var COPIA = 'Nucleo.gs.txt', COPIA_INFO = 'nucleo.json';

/* ============ Entradas que Google llama por su nombre ============ */
function doGet(e) {
  try { return llamar_('doGet', [e]); }
  catch (err) {
    var p = (e && e.parameter) || {}, msg = String((err && err.message) || err);
    if (p.ping || p.cb) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg, cargador: CARGADOR_VERSION })).setMimeType(ContentService.MimeType.JSON);
    return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;padding:24px;max-width:560px"><h2>No se pudo abrir el sistema</h2><p>' +
      msg.replace(/[<>&]/g, '') + '</p><p>Intente de nuevo en unos minutos.</p></div>').setTitle('Sistema de Suministros')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
function doPost(e) {
  try { return llamar_('doPost', [e]); }
  catch (err) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String((err && err.message) || err) })).setMimeType(ContentService.MimeType.JSON); }
}
function apiCall(req) {
  try { return llamar_('apiCall', [req]); }
  catch (err) { return { ok: false, error: String((err && err.message) || err) }; }
}
/** Lo usan las plantillas HTML del proyecto (versión clásica y offline). */
function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

/* Activadores (correo y respaldo): los nombres no cambian. */
function revisarRecordatorios() { return llamar_('revisarRecordatorios', arguments); }
function resumenDiario() { return llamar_('resumenDiario', arguments); }
function respaldoAutomatico() { return llamar_('respaldoAutomatico', arguments); }
function instalar() { return llamar_('instalar', arguments); }

/* ============ Funciones para ejecutar desde el editor ============ */
function activarTodo() {
  permisos_();
  limpiar_(); version_(); nucleo_();
  var s = estado_();
  Logger.log('Listo. Servidor api ' + s.api + ' (' + s.md5 + ') cargado desde GitHub (' + s.ref + ').\nCopia en Drive: carpeta "' + s.respaldo + '".');
  return s;
}
function actualizarAhora() {
  limpiar_(); version_(); nucleo_();
  var s = estado_(); Logger.log('Versión instalada: api ' + s.api + ' (' + s.md5 + '), adoptada ' + s.fecha + ', desde ' + s.ref + '.');
  return s;
}
function estadoSistema() {
  var s = estado_();
  Logger.log('API: ' + s.api + '\nHuella: ' + s.md5 + '\nAdoptada: ' + s.fecha + '\nOrigen: ' + s.repo + ' · ' + s.ref + '\nCopia en Drive: ' + s.respaldo + '\nCargador: ' + s.cargador);
  return s;
}

/* ============ Mecanismo (no hace falta tocar) ============ */
var N_cache_ = null;
function llamar_(nombre, args) {
  var f = nucleo_()(nombre);
  if (typeof f !== 'function') throw new Error('El servidor no tiene la función ' + nombre + '.');
  return f.apply(null, Array.prototype.slice.call(args || []));
}
function compilar_(src) {
  return new Function(src + '\n;return function (n) { return /^[A-Za-z_$][\\w$]*$/.test(n) ? eval("typeof " + n + " === \\"undefined\\" ? undefined : " + n) : undefined; };')();
}
function nucleo_() {
  if (N_cache_) return N_cache_;
  N_cache_ = compilar_(fuente_());
  return N_cache_;
}
function cprops_() { return PropertiesService.getScriptProperties(); }
function ref_() { return String(cprops_().getProperty('GH_REF') || GH_RAMA).trim(); }
function md5_(s) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8)); }
function limpiar_() { var c = CacheService.getScriptCache(); c.remove(CK + 'ver'); c.remove(CK + 'chk'); N_cache_ = null; }

/** Un núcleo es válido si compila y trae las piezas esenciales. */
function valido_(s) {
  if (!s || s.length < 20000 || !/function dispatch_\(/.test(s) || !/var API_VERSION = \d+/.test(s) || !/function doPost\(/.test(s)) return false;
  try { new Function(s); return true; } catch (e) { Logger.log('El núcleo no compila: ' + e); return false; }
}

function bajar_() {
  var url = 'https://raw.githubusercontent.com/' + GH_REPO + '/' + ref_() + '/' + GH_RUTA + '?t=' + Date.now();
  var opt = { muteHttpExceptions: true, headers: { 'Cache-Control': 'no-cache' } };
  var tk = cprops_().getProperty('GH_TOKEN'); if (tk) opt.headers.Authorization = 'token ' + tk;
  try {
    var r = UrlFetchApp.fetch(url, opt);
    if (r.getResponseCode() === 200) return r.getContentText('UTF-8');
    Logger.log('GitHub respondió ' + r.getResponseCode());
  } catch (e) { Logger.log('No pude leer GitHub: ' + e); }
  return null;
}

/** Versión vigente. Revisa GitHub cada REVISAR_CADA s y adopta la nueva solo si es válida. */
function version_() {
  var c = CacheService.getScriptCache(), cur = null;
  try { cur = JSON.parse(c.get(CK + 'ver') || 'null'); } catch (e) {}
  if (cur && c.get(CK + 'chk')) return cur;
  if (!cur) { try { cur = JSON.parse(leerCopia_(COPIA_INFO) || 'null'); } catch (e) {} }
  var s = bajar_();
  if (s) {
    var h = md5_(s);
    if (!cur || cur.md5 !== h) {
      if (valido_(s)) {
        var api = (s.match(/var API_VERSION = (\d+)/) || [])[1];
        cur = { md5: h, api: Number(api), ref: ref_(), fecha: Utilities.formatDate(new Date(), 'America/El_Salvador', 'yyyy-MM-dd HH:mm') };
        guardarCache_(CK + h, s); N_cache_ = null;
        try { guardarCopia_(COPIA, s); guardarCopia_(COPIA_INFO, JSON.stringify(cur)); } catch (e) { Logger.log('No pude guardar la copia en Drive: ' + e); }
      } else Logger.log('La versión de GitHub no es válida; sigo con la anterior.');
    }
  }
  if (!cur) throw new Error('No pude descargar el servidor desde GitHub y todavía no hay copia en Drive. Ejecute activarTodo en el editor.');
  try { c.put(CK + 'ver', JSON.stringify(cur), 21600); c.put(CK + 'chk', '1', REVISAR_CADA); } catch (e) {}
  return cur;
}
function fuente_() {
  var v = version_(), s = leerCache_(CK + v.md5);
  if (s) return s;
  var b = leerCopia_(COPIA);
  if (b && md5_(b) === v.md5) { guardarCache_(CK + v.md5, b); return b; }
  var g = bajar_();
  if (g && md5_(g) === v.md5) { guardarCache_(CK + v.md5, g); return g; }
  if (b && valido_(b)) return b;
  throw new Error('No encontré el servidor ni en GitHub ni en la copia de Drive.');
}
function guardarCache_(key, s) {
  var n = Math.ceil(s.length / PARTE), o = {};
  o[key + 'n'] = String(n);
  for (var i = 0; i < n; i++) o[key + i] = s.substr(i * PARTE, PARTE);
  try { CacheService.getScriptCache().putAll(o, 21600); } catch (e) { Logger.log('Caché llena: ' + e); }
}
function leerCache_(key) {
  var c = CacheService.getScriptCache(), n = Number(c.get(key + 'n') || 0);
  if (!n) return null;
  var ks = []; for (var i = 0; i < n; i++) ks.push(key + i);
  var m = c.getAll(ks), s = '';
  for (i = 0; i < n; i++) { if (m[ks[i]] == null) return null; s += m[ks[i]]; }
  return s;
}

/* Copia en Drive: "Código del sistema" dentro de la carpeta del sistema (ROOT_ID). */
function carpeta_() {
  var p = cprops_(), id = p.getProperty('COD_DIR');
  if (id) { try { var f0 = DriveApp.getFolderById(id); if (!f0.isTrashed()) return f0; } catch (e) {} }
  var par = null, rid = p.getProperty('ROOT_ID');
  if (rid) { try { par = DriveApp.getFolderById(rid); if (par.isTrashed()) par = null; } catch (e) { par = null; } }
  if (!par) par = DriveApp.getRootFolder();
  var nom = 'Código del sistema', it = par.getFoldersByName(nom), f = it.hasNext() ? it.next() : par.createFolder(nom);
  p.setProperty('COD_DIR', f.getId());
  return f;
}
function guardarCopia_(nombre, texto) {
  var d = carpeta_(), it = d.getFilesByName(nombre);
  if (it.hasNext()) it.next().setContent(texto); else d.createFile(nombre, texto, MimeType.PLAIN_TEXT);
}
function leerCopia_(nombre) {
  try { var it = carpeta_().getFilesByName(nombre); return it.hasNext() ? it.next().getBlob().getDataAsString('UTF-8') : null; }
  catch (e) { return null; }
}
function estado_() {
  var v = version_(), dir = '';
  try { dir = carpeta_().getName(); } catch (e) {}
  return { api: v.api, md5: String(v.md5).slice(0, 8), fecha: v.fecha, repo: GH_REPO, ref: ref_(), respaldo: dir, cargador: CARGADOR_VERSION };
}

/** No se ejecuta en el uso normal: le dice a Google qué permisos necesita el servidor
 *  (el código del servidor ya no está en el proyecto y Google no lo puede leer). */
function permisos_() {
  if (false) {
    DriveApp.getRootFolder(); SpreadsheetApp.openById(''); MailApp.getRemainingDailyQuota();
    ScriptApp.getProjectTriggers(); Session.getActiveUser().getEmail(); LockService.getScriptLock();
    UrlFetchApp.fetch('');
  }
  return true;
}
