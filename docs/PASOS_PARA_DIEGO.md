# Pasos para publicar la versión web (sin tocar la versión actual)

## 0. Copias de seguridad (una vez, antes de todo)
1. En el sistema actual:
   - Configuración › Conexión › **🗄️ Respaldo en Drive**.
   - Importar / exportar › **⬇️ Descargar respaldo**.
2. En Drive: clic derecho en **SISTEMA SUMINISTROS** › **Descargar**.
3. En Apps Script:
   - **Descripción general › Hacer una copia**. Es solo un respaldo: no se usa ni se publica.
   - **Configuración del proyecto › Propiedades de la secuencia de comandos**. Copiar los valores en un documento privado.
4. Revisar que el indicador del sistema actual diga **Sincronizado** (0 pendientes).

## 1. GitHub
1. Crear un repositorio **público** llamado `sistema-suministros`, **vacío** (sin README).
2. Conectarlo a la conversación con Claude. Claude sube los archivos.
3. En el repositorio, ir a **Settings › Pages › Build and deployment › Source: GitHub Actions**.

## 2. Apps Script (implementación nueva; la actual no se toca)
1. Abrir el proyecto en script.google.com.
2. Reemplazar `Code.gs` y `AppConfig` con los de `fuente/apps-script/`. Guardar.
   - Por qué no se afecta la versión actual: la implementación que ya existe sigue fija en su versión anterior hasta que se edite.
3. Ir a **Implementar › Nueva implementación** › ⚙️ Aplicación web:
   - Descripción: `API web`.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**.
   - Pulsar **Implementar**.
4. Copiar la **URL** nueva (termina en `/exec`) y pasársela a Claude. Se guarda en `fuente/web/config.json`; no es secreta.
5. Copiar la **clave de acceso**: en el sistema actual, Configuración › Conexión.

## 3. Usar la web
1. Abrir `https://diego291.github.io/sistema-suministros/`.
2. En la pantalla **Conectar este equipo**: la URL ya aparece. Pegar la clave y pulsar **Conectar**.
3. Instalarla como app: en Chrome o Edge, ícono ⊕ de la barra de direcciones › **Instalar**.
4. Recorrer la lista de verificación de `docs/PLAN_MIGRACION.md` (sección 6). Las dos versiones funcionan al mismo tiempo, con los mismos datos.
