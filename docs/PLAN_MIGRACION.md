# Sistema de Suministros: inventario y plan de migración a GitHub

Estado al 29/10/2026. **Todavía no se ha cambiado nada.** Antes de construir, el plan tiene que estar aprobado.

## 1. Inventario

### 1.1 Archivos del proyecto de Apps Script
| Archivo | Qué hace |
|---|---|
| `Code.gs` | Servidor. Hace cuatro cosas: (1) crea y ubica la carpeta y las hojas en Drive; (2) es la API de datos (`dispatch_`), con sincronización incremental, PDF, respaldos y años; (3) sirve la interfaz (`doGet`); (4) envía los recordatorios por correo (triggers). |
| `Index.html` | Estructura de la página. Incluye los demás archivos con `include()`. |
| `Styles.html` | Todo el CSS: tema claro/oscuro, impresión, libreta, calculadora, catálogo. |
| `AppCore.html` | Motor del cliente: base local IndexedDB, cola de cambios, `Sync` (llamadas a la API), formularios, listados, impresión, firmantes, utilidades. |
| `AppModules.html` | Define todos los módulos (campos, tablas, menús), el recibo, uniformes, inventario, cuentas bancarias y la caja chica. |
| `AppHome.html` | Panel principal, calendario y agenda, notificaciones, **libreta** y **calculadora**. |
| `AppReports.html` | Reportes: por grado, rubro, secciones y mes; constancia, cuadre, arqueo, arrendatarios, rendición de cuentas y ficha del alumno. |
| `AppOps.html` | Caja chica (panel, reembolso, recibo RC), compras, bodega, uniformes, documentos e importación de Word. |
| `AppConfig.html` | Configuración (todas las pestañas), catálogo, importación desde Excel, respaldo y restauración, conexión y arranque (`boot`). |
| `appsscript.json` | Zona horaria America/El_Salvador, V8. Aplicación web: ejecutar como **el propietario** y acceso **Cualquier usuario (anónimo)**. |

### 1.2 Funciones del servidor y desde dónde se llaman
**Puntos de entrada**
- `doGet(e)`: sin parámetros devuelve la interfaz (modo "gas"). Con `?ping=1` responde JSON público, solo con el nombre de la app. Con `?cb=` es la conexión alternativa JSONP y exige token.
- `doPost(e)`: API JSON, recibe `text/plain`. **Exige `API_TOKEN`**.
- `apiCall(req)`: lo llama `google.script.run` (es el **único** uso de `google.script.run`, en `AppCore › Sync.call`). Lo autoriza `autorizado_`: token, o que el usuario sea el mismo propietario, o que esté en la lista `USUARIOS`.

**Acciones de `dispatch_`** (las mismas en las tres vías)
| Acción | Función | La usa |
|---|---|---|
| `ping` | — | Prueba de conexión |
| `init` | `init_` | Arranque: configuración, años, URL de la carpeta, token y correo |
| `sync` | `sync_`, `ensureSheet_`, `applyChanges_`, `rowsSince_` | Sincronización automática (cada N segundos) |
| `createYear` | `createYear_`, `yearSS_` | Configuración › Años |
| `savePdf` | `savePdf_` | Botón “☁️ PDF en Drive” de la vista de impresión |
| `pdfBatch`, `pdfZip` | `pdfBatch_`, `pdfZip_` | PDF individuales por lote (opcionalmente por correo) |
| `backup` | `backup_` | Conexión › Respaldo en Drive |
| `compact` | `compact_` | Conexión › Compactar eliminados |
| `offlineHtml` | `offlineHtml_` | Conexión › Descargar versión offline |
| `triggers` | `setTriggers_`, `triggerState_` | Configuración › Recordatorios por correo |
| `users` | — (guarda `USUARIOS`) | Conexión › Usuarios autorizados |
| `newToken` | — (cambia `API_TOKEN`) | Conexión › Generar clave nueva |

**Funciones que corren solas o se ejecutan a mano**
- `instalar()`: se ejecuta una vez desde el editor.
- `revisarRecordatorios()`, `resumenDiario()`, `respaldoAutomatico()`: las corren los triggers.
- Auxiliares: `setup_`, `cfgSS_`, `rootFolder_`, `subFolder_`, `moveToFolder_`, `readConfig_`, `writeConfig_`, `listYears_`, `formatCols_`, `toCell_`, `fmtDate_`, `agendaRows_`, `ocurre_`, `destinatario_`, `ymd_`, `json_`, `jsonp_`, `include`, `props_`.

### 1.3 Hojas de cálculo y archivos de Drive
Están en la carpeta **SISTEMA SUMINISTROS**. Los IDs se guardan en las Script Properties: no están en el código, y Diego los puede ver ahí.
- **SUMINISTROS - CONFIGURACION** (`CONFIG_SS_ID`)
  - Pestaña `CONFIG`: columnas `clave | valor`. Guarda la configuración en JSON, partida en trozos de 45 000 caracteres.
  - Módulos globales, una pestaña cada uno: `agenda`, `arrendatarios`, `proveedores`, `articulos`, `personal`, `unif_precios`, `plantillas`, `cuentas_banco`, `notas`.
- **SUMINISTROS <año>**, uno por año (`YEAR_2026`, `YEAR_2027`…)
  - Pestaña `LEEME`.
  - Una pestaña por módulo del año: `estudiantes`, `recibos`, `depositos`, `cafetines`, `donaciones`, `devoluciones`, `noremesado`, `banco`, `arqueos`, `cajachica`, `compras`, `cheques`, `movimientos`, `unif_pedidos`, `unif_ventas`, `unif_inv`, `documentos`.
- **Columnas de cada pestaña:**
  - Columnas de sistema: `_id`, `_upd` (hora de edición), `_srv` (hora en que llegó al servidor) y `_del` (1 = eliminado).
  - Después, los campos del módulo. `ensureSheet_` los crea solo, y también los campos personalizados.
- **Subcarpetas:** `Reportes PDF/<año>/…` y `Respaldos/<fecha hora>/`.
- **Archivo suelto:** `Suministros_Offline.html`.

### 1.4 Activadores (triggers)
Son todos por tiempo. No hay triggers al abrir ni al editar.
| Función | Frecuencia | Se crea desde |
|---|---|---|
| `revisarRecordatorios` | cada 15 min | Configuración › Recordatorios por correo |
| `resumenDiario` | diario, 6 a. m. | Configuración › Recordatorios por correo |
| `respaldoAutomatico` | viernes, 5 p. m. | Configuración › Recordatorios por correo |

### 1.5 Servicios de Google que usa
- **SpreadsheetApp:** `openById` y `create`.
- **DriveApp:** carpetas y archivos (PDF, respaldos, offline).
- **MailApp:** `sendEmail` y cuota. No usa GmailApp.
- **PropertiesService:** Script Properties.
- **CacheService:** partes de las solicitudes JSONP.
- **LockService:** bloqueo durante la sincronización.
- **Session:** correo del usuario, del propietario y zona horaria.
- **ScriptApp:** triggers y URL.
- **Utilities:** fechas, UUID, PDF y zip.
- **HtmlService** y **ContentService:** interfaz y JSON.
- **No usa** UrlFetchApp ni librerías de Apps Script.
- **Librerías externas, solo en el navegador:** SheetJS 0.18.5 (cdnjs) para leer y escribir Excel, y la fuente Inter (Google Fonts).

### 1.6 Configuraciones guardadas
- **Script Properties:**
  - `ROOT_ID`, `CONFIG_SS_ID`, `YEAR_<año>`: dónde están los datos.
  - `API_TOKEN`: clave de acceso.
  - `USUARIOS`: correos autorizados.
  - `LAST_REMINDER_CHECK`.
  - `V_<id>_<módulo>`: versión de cada hoja, para no releer las que no cambiaron.
- **Configuración funcional** (institución, firmantes, rubros, productos, alimentos, series, notas, rendición, etc.): está en la **hoja CONFIG**, no en el código. Por eso se conserva sola.
- **En cada navegador** (localStorage/IndexedDB): datos en caché, cambios pendientes, preferencias de vista, calculadora y URL + token en el modo archivo.
- **Constantes del código:** `APP_NAME = 'SISTEMA SUMINISTROS'`, `CFG_SHEET`, `CHUNK`.

### 1.7 Cómo se publica hoy
- Aplicación web, implementación `/exec`.
- **Ejecutar como:** el propietario (Diego). **Acceso:** cualquier usuario, incluso anónimo.
- Protección: sin token o sin ser el propietario no se puede leer ni escribir.
- Hay tres clientes posibles: el link `/exec` (modo gas), el archivo offline (fetch/JSONP) y la demo.

## 2. Qué va en GitHub Pages y qué se queda en Apps Script
| GitHub Pages (solo interfaz) | Apps Script (datos y procesos) |
|---|---|
| HTML, CSS y JS de las 8 vistas y módulos | `doPost`/`doGet` como API JSON y el `dispatch_` completo |
| Base local, cola y modo sin conexión (ya existen) | Lectura y escritura en las hojas (sync, años, compactar) |
| Impresión desde el navegador, Excel (SheetJS) e importar Word | PDF en Drive, PDF por lote, zip y correos (MailApp) |
| Manifest + service worker (instalable, abre sin internet) | Triggers: recordatorios, resumen diario y respaldo |
| Calculadora, libreta, ficha y reportes (calculan en el navegador) | Script Properties, token, usuarios e IDs de Drive |

**Dato clave:** el sistema **ya funciona como API**. El servidor ya tiene `doPost` con `text/plain`, la conexión alternativa JSONP y la validación por token. El cliente ya tiene un modo `http` que usa `fetch`. La migración consiste sobre todo en **empaquetar la interfaz para Pages**: no hay que reescribir funciones ni mover datos.

## 3. Arquitectura propuesta (la pedida, con 4 ajustes)
1. **Pages + Apps Script como API, igual a lo pedido.** El único `google.script.run` (`Sync.call` en modo gas) ya tiene su equivalente con `fetch`, con las mismas acciones y la misma respuesta `{ok, data}`. En Pages se usa ese.
2. **Ajuste 1, ejecución en paralelo sin tocar lo actual.** En el mismo proyecto de Apps Script se crea una **implementación nueva** (otra URL `/exec`), y la actual queda fija en su versión. Las dos usan las mismas Script Properties y las mismas hojas. Así el link actual sigue igual mientras se prueba Pages.
   - Advertencia: **no** usar una *copia* del proyecto como API. Una copia no trae las Script Properties y `setup_` crearía una carpeta y hojas nuevas vacías.
3. **Ajuste 2, compilar con GitHub Actions.** La carpeta `fuente/` es la única fuente. Al subir un cambio, una acción arma el sitio y lo publica en Pages. Cada recarga trae la versión nueva: el service worker usa "red primero" para la app y avisa "versión nueva disponible".
4. **Ajuste 3, datos personales fuera del repositorio público.**
   - **No** se suben `DATOS_INICIALES…json`, la demo con datos, los respaldos ni el token. Contienen nombres y NIE de estudiantes.
   - Hay que quitar un nombre real que aparece como ejemplo en Configuración › Firmantes.
   - El repositorio sí puede llevar la URL `/exec`: no es secreta, porque sin el token no da datos.
5. **Ajuste 4, seguridad en dos niveles.**
   - **Nivel 1 (se implementa ahora): token por equipo.** El `API_TOKEN` ya existe. Se escribe una sola vez en cada computadora y queda solo en ese navegador, nunca en el repositorio. Si se pierde un equipo, se cambia con "Generar clave nueva" y los demás equipos la vuelven a escribir. Se envía siempre por POST; el JSONP, que lleva la clave en la URL, queda solo como respaldo y se puede desactivar.
   - **Nivel 2 (opcional): cuenta de Google.** Se inicia sesión con Google en Pages y Apps Script verifica el token de Google contra la lista `USUARIOS`. Requiere crear un ID de cliente OAuth en Google Cloud (es público, se puede poner en el repositorio) y agregar el permiso UrlFetchApp. Es más seguro, pero tiene más pasos; se recomienda después de que todo funcione.

### Lo que no se migra o cambia de forma (con alternativa)
| Qué | Situación | Alternativa |
|---|---|---|
| Triggers y correos | **No se mueven**: siguen en Apps Script igual | Nada que hacer |
| Entrar sin clave al ser el propietario (modo gas) | En Pages no se puede saber la cuenta de Google sin iniciar sesión | Token (nivel 1) o inicio de sesión con Google (nivel 2) |
| “Descargar versión offline” | Ya no hace falta: Pages es instalable y abre sin internet | Se oculta en el modo Pages |
| Datos guardados en el navegador del link actual | Pages es otro sitio, así que **no** ve ese caché local | Antes de cambiar, el indicador del link actual debe decir **Sincronizado** (0 pendientes). Pages descarga todo de Drive |
| Repositorio privado | Pages con repositorio privado requiere GitHub de pago | El repositorio público no tiene datos ni claves |

## 4. Copias de seguridad (antes de tocar nada)
1. **Datos desde la app:**
   - En Configuración › Conexión, pulsar **🗄️ Respaldo en Drive**. Crea copias de las hojas en *Respaldos/fecha*.
   - En Importar / exportar, pulsar **⬇️ Descargar respaldo**. Baja un `.json` a la PC.
2. **Hojas en Drive:** clic derecho en la carpeta **SISTEMA SUMINISTROS** › **Descargar**. Baja un .zip con todo en Excel.
3. **Proyecto de Apps Script:**
   - Descripción general › **Hacer una copia**, solo como respaldo: no se ejecuta ni se publica.
   - Guardar también el .zip del proyecto que generé.
4. **Script Properties:** Configuración del proyecto › *Propiedades de la secuencia de comandos*. Copiar en un documento privado los valores de `ROOT_ID`, `CONFIG_SS_ID`, `YEAR_…`, `API_TOKEN` y `USUARIOS`.
5. **Implementación actual:** Implementar › Administrar implementaciones. Anotar la URL y el número de versión.

## 5. Construcción por partes (después de la aprobación)
1. **Repositorio y fuente:**
   - Estructura `fuente/` con los 10 archivos y los scripts de compilación.
   - `.gitignore` que bloquea datos y respaldos.
   - `README` con instrucciones para conversaciones futuras.
2. **Compilación para Pages:**
   - `sitio/` con `index.html`, `app.css`, `app.js`, `config.js` (solo la URL), `manifest.webmanifest`, `sw.js` e íconos.
   - Workflow de GitHub Actions que compila y publica.
   - Prueba: carga sin errores y las 50+ vistas se abren.
3. **Conexión Pages → API:**
   - Modo "web": `fetch` POST `text/plain` y JSONP solo de respaldo.
   - Pantalla de primer uso: URL ya puesta + escribir la clave.
   - Prueba contra la implementación nueva: init, sync, PDF y respaldo.
4. **Sin conexión e instalación:**
   - El service worker guarda la app; los datos ya se guardan en IndexedDB.
   - Prueba: abrir sin internet, consultar y registrar, y que suba al volver la conexión.
5. **Seguridad nivel 1:**
   - Revisión de `autorizado_`, desactivar la clave en URL si no se usa y límite de intentos.
   - Este cambio va en la implementación nueva; la actual no se toca.
6. **Ejecución en paralelo y verificación** con la lista de la sección 6.
7. **Cambio definitivo,** solo cuando Diego lo apruebe. El link actual puede seguir vivo como respaldo.

## 6. Lista de verificación (función por función)
- [ ] Abrir Pages, escribir la clave: dice “Sincronizado” y aparecen los mismos años.
- [ ] Recibos: crear, editar, anular y eliminar en Pages, y verlo en el link actual (y al revés).
- [ ] Series A/B, control de digitación, ficha del alumno y búsqueda por recibo.
- [ ] Reportes por grado, rubro, secciones y mes. Constancia con los mismos montos.
- [ ] Cuadre y arqueo: mismas cifras en las dos versiones.
- [ ] Caja chica: registro, Ctrl+Enter, recibo RC, reembolso y arqueo de caja chica.
- [ ] Tesorería: depósitos con cuenta, libro de banco, arrendatarios (estado de cuenta impreso), donaciones y devoluciones.
- [ ] Compras, bodega, uniformes, existencias y kardex.
- [ ] Documentos: generar, importar Word, firmas y sello.
- [ ] Rendición de cuentas, catálogo, libreta y calculadora.
- [ ] Imprimir / PDF del navegador, **PDF en Drive** y PDF individuales por lote (y correo).
- [ ] Respaldo en Drive, compactar, crear año, usuarios y generar clave nueva.
- [ ] Recordatorios por correo: siguen llegando (triggers intactos).
- [ ] Sin internet: abre, consulta, registra y sincroniza al volver.
- [ ] Instalar como app (Chrome/Edge): ícono, abre en ventana propia y se actualiza al recargar.
- [ ] Configuración: la institución, los firmantes, los rubros y los productos son iguales en ambas versiones.

## 7. Lo que Diego tendrá que hacer (pasos simples)
1. Hacer las copias de seguridad de la sección 4.
2. Crear en GitHub un repositorio **público**, por ejemplo `sistema-suministros`, y conectarlo a esta conversación.
3. En Apps Script:
   - Implementar › **Nueva implementación** › Aplicación web, ejecutar como **Yo**, acceso **Cualquier usuario**.
   - Copiar la URL nueva. La actual no se toca.
4. En GitHub: Settings › Pages › Source: **GitHub Actions**.
5. Abrir el sitio `https://<usuario>.github.io/sistema-suministros/` y escribir la clave una vez por equipo.
6. Recorrer la lista de verificación y avisar.
