# Sistema Integrado de Suministros

Sistema administrativo del área de suministros. Cubre recibos de ingreso, alimentos, caja chica, tesorería, compras, bodega, uniformes, documentos y reportes.

- **Interfaz:** se publica en GitHub Pages. Es instalable como app y abre sin internet.
- **Datos:** quedan en Google Sheets, en el Drive del propietario.
- **API:** Google Apps Script.

> Este repositorio es público y **no contiene datos ni claves**. Los datos están en Google Drive. La clave de acceso se escribe una vez en cada equipo y queda guardada solo en ese navegador.

## Estructura
| Carpeta | Contenido |
|---|---|
| `fuente/apps-script/` | **Fuente única.** Son los 10 archivos del proyecto de Apps Script (`Code.gs`, `Index`, `Styles`, `AppCore`, `AppModules`, `AppHome`, `AppReports`, `AppOps`, `AppConfig`, `appsscript.json`). Se copian tal cual al editor de Apps Script. |
| `fuente/web/` | Lo propio de la web: `config.json` (URL de la API, **sin clave**), `sw.js` (service worker), `pwa.js` e íconos. |
| `herramientas/build_web.py` | Arma `sitio/` (la web) a partir de `fuente/`. Lo ejecuta GitHub Actions en cada cambio. |
| `.github/workflows/pages.yml` | Publica automáticamente en GitHub Pages al subir cambios a `main`. |
| `docs/` | Plan de migración, guía de uso e instalación de Apps Script. |

## Cómo funciona
```
[Navegador / app instalada]  --fetch POST text/plain {action, token, ...}-->  [Apps Script /exec]  -->  [Google Sheets en Drive]
   IndexedDB (copia local + cola sin conexión)            <-- JSON {ok, data} --
```
- **Acciones de la API (`dispatch_` en `Code.gs`):** `ping`, `init`, `sync`, `createYear`, `savePdf`, `pdfBatch`, `pdfZip`, `backup`, `compact`, `offlineHtml`, `triggers`, `users`, `newToken`.
- **Si el navegador bloquea `fetch`:** la app usa la conexión alternativa JSONP (`doGet?cb=`).
- **Triggers:** los recordatorios cada 15 min, el resumen diario y el respaldo de los viernes viven en Apps Script y no dependen de la web.
- **Seguridad:**
  - Clave `API_TOKEN` en las Script Properties.
  - Bloqueo de 10 minutos tras 30 claves equivocadas.
  - La clave nunca va en el repositorio. `build_web.py` revisa que no se publiquen claves ni datos.

## Modos del cliente (`window.__BOOT.mode`)
- `gas`: abierta desde la URL `/exec` de Apps Script. Usa `google.script.run`.
- `web`: GitHub Pages. Usa `fetch` y tiene pantalla de primera conexión, service worker e instalación.
- `file`: archivo HTML suelto (versión offline antigua).

## Para seguir mejorando (en conversaciones futuras)
1. Editar **solo** `fuente/`. Se usa el mismo código para Apps Script y para la web.
2. Probar localmente:
   ```
   python3 herramientas/build_web.py
   python3 -m http.server -d sitio 8080
   ```
3. Subir a `main`: la web se actualiza sola en 1 o 2 minutos.
4. Si cambió algún archivo de `fuente/apps-script/`, también hay que pegarlo en el editor de Apps Script y hacer *Implementar › Administrar implementaciones › ✏️ › Nueva versión* sobre la implementación que usa la web.

**Reglas que hay que cuidar:**
- No escribir `//` dentro de textos o URLs en los `.html`: Apps Script lo confunde con un comentario.
- No declarar el mismo `const` en dos archivos: comparten el ámbito global.
- Los nombres de pestañas y columnas de las hojas los crea `ensureSheet_`. No hay que renombrarlos a mano.
