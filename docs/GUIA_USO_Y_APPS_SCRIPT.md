# Sistema Integrado de Suministros — Guía de instalación y uso

## Qué hay en el paquete

| Archivo | Para qué sirve |
|---|---|
| `Code.gs` | Servidor: crea la carpeta en Drive, guarda los datos, sincroniza y envía recordatorios |
| `Index.html`, `Styles.html` | Estructura y diseño de la app |
| `AppCore.html` | Motor: base local offline, sincronización, formularios, tablas e impresión |
| `AppModules.html` | Definición de todos los módulos y del menú |
| `AppHome.html` | Pantalla principal, calendario, agenda y notificaciones |
| `AppReports.html` | Reportes de cobro, control de digitación, cuadre y arqueo |
| `AppOps.html` | Caja chica, compras, bodega, uniformes y documentos |
| `AppConfig.html` | Configuración, importación desde Excel, conexión y arranque |
| `appsscript.json` | Ajustes del proyecto (zona horaria de El Salvador, acceso web) |
| `DATOS_INICIALES_caja_chica_y_suministros.json` | **Sus datos ya convertidos** (REGISTRO SUMINISTROS v7 + CAJA CHICA) listos para cargar |
| `Suministros_DEMO_con_datos.html` | Demo con sus datos ya cargados: ábrala con Chrome y explore sin instalar nada (guarda solo en su PC) |

---

## Instalación (unos 15 minutos, una sola vez)

### 1. Crear el proyecto
1. Entre a **script.google.com** con la cuenta de Google donde quiere guardar los datos → **Nuevo proyecto**.
2. Póngale nombre: *Sistema de Suministros*.

### 2. Copiar los archivos
1. En `Code.gs` borre lo que trae y pegue el contenido de **Code.gs**.
2. Botón **＋ › HTML** para crear cada archivo. Use **exactamente estos nombres** (sin “.html”, el editor lo agrega solo):
   `Index`, `Styles`, `AppCore`, `AppModules`, `AppHome`, `AppReports`, `AppOps`, `AppConfig`.
   Pegue en cada uno el contenido del archivo con el mismo nombre.
3. Manifiesto: **⚙️ Configuración del proyecto** → active *“Mostrar el archivo de manifiesto appsscript.json”* → vuelva al editor, abra `appsscript.json` y reemplácelo con el del paquete.

### 3. Instalar (crea la carpeta en Drive y da permisos)
1. Arriba, en el selector de funciones, elija **`instalar`** → **Ejecutar**.
2. Google pedirá permisos: *Revisar permisos › su cuenta › Configuración avanzada › Ir a Sistema de Suministros (no seguro) › Permitir*. (Dice “no seguro” solo porque el script es suyo y no está publicado por Google.)
3. En el registro de ejecución verá la carpeta creada y la **clave de acceso**.

En su Drive aparecerá:
```
📁 SISTEMA SUMINISTROS
   ├─ SUMINISTROS - CONFIGURACION   (configuración + agenda, proveedores, personal, artículos…)
   ├─ SUMINISTROS 2026              (un archivo por año: recibos, estudiantes, caja chica…)
   ├─ 📁 Reportes PDF
   └─ 📁 Respaldos
```

### 4. Publicar la aplicación
1. **Implementar › Nueva implementación** → tipo **Aplicación web**.
2. *Ejecutar como*: **Yo**. *Quién tiene acceso*: **Cualquier usuario** (necesario para la versión offline; los datos están protegidos por la clave de acceso).
3. **Implementar** → copie la **URL** (termina en `/exec`). Guárdela en favoritos: esa es su app.

> Cuando cambie el código en el futuro: **Implementar › Administrar implementaciones › ✏️ › Versión: Nueva versión › Implementar**. La URL no cambia.

### 5. Primer uso
1. Abra la URL. Vaya a **Configuración › General**: revise institución, firmantes, logo, fondo de caja chica, cuota de alimentos.
2. **Configuración › Importar / exportar › ⬆️ Restaurar respaldo** → elija `DATOS_INICIALES_caja_chica_y_suministros.json`. Se cargan todos sus datos y se suben solos a Drive (espere a que el indicador diga *Sincronizado*).
3. **Configuración › Conexión › ⬇️ Descargar versión offline** → guarde `Suministros_Offline.html` en el Escritorio.
4. Opcional: **Configuración › General › ✉️ Recordatorios por correo** para recibir avisos de la agenda en su correo aunque la PC esté apagada.

---

## Datos ya cargados en el paquete

`DATOS_INICIALES_caja_chica_y_suministros.json` contiene (3,500 registros):

| Origen | Módulo | Registros |
|---|---|---|
| v7 › BD | Estudiantes | 1,358 |
| v7 › RC | Recibos de ingreso | 1,695 |
| v7 › RC A (evento de teatro) | Recibos (rubro *Evento de teatro*) | 25 |
| v7 › RDP | Depósitos | 27 · $17,310.11 |
| v7 › CFN | Cafetines | 8 · $2,600.00 |
| v7 › DNC | Donaciones económicas | 6 · $773.36 |
| v7 › DVL | Devoluciones | 9 · $120.00 |
| v7 › FP | Libro de banco **2024** | 36 · saldo $4,828.70 |
| v7 › Unif Dep 2026 (pedidos 1–3) | Pedidos de uniformes + lista de precios | 68 + 15 |
| v7 › CHUMPAS | Ventas de uniformes | 10 |
| CAJA CHICA › Registro | Registro de caja chica | 193 · saldo $237.32 · caja C10 |
| CAJA CHICA › Directorio | Proveedores | 49 |
| CAJA CHICA › Arqueo | Historial de arqueos | 1 (08/10/2026, cuadra) |
| CAJA CHICA › Config | Firmantes, fondo $300, límite $30, alerta 20 % | — |

Comprobación contra sus Excel: el cuadre da **FALTANTE de $341.00** (igual que su hoja ING/DC), los uniformes de salud dan $2,000.00 y la caja chica da saldo $237.32 en C10.

Cambios que hice al convertir:
- Los 71 recibos que solo tenían la columna *Pago* se clasificaron por su concepto: *Uniformes de salud*, *Fotocopia de fichas*, *Donaciones* y *Alquiler de cafetín (banco)*. Este último se marca como pagado en banco, así que no entra al efectivo del cuadre (igual que en su ING).
- El recibo 16106 no tenía fecha: se le puso la del recibo anterior y se dejó una nota en sus observaciones.
- Se omitieron la fila de totales de RC, las filas vacías y 1 estudiante de BD sin grado. Los NIE con el texto "None" se dejaron vacíos.
- Las chumpas del Excel se marcaron como *entregadas*. Si alguna no lo está, desmárquela en Uniformes › Ventas.
- No se cargaron las hojas de cálculo auxiliares (RPG, RGS, ING, CRS, tablas dinámicas, intramuros, CAM PROMO): el sistema las calcula solo.

## Migrar otros archivos de Excel

En **Configuración › Importar / exportar**: elija el módulo, suba el archivo (o copie las celdas en Excel y péguelas), revise cómo se relacionaron las columnas y pulse *Importar*. Ya reconoce los encabezados de sus archivos:

| Su archivo / hoja | Módulo destino | Evitar duplicados por |
|---|---|---|
| REGISTRO SUMINISTROS › **BD** | Estudiantes | NIE |
| REGISTRO SUMINISTROS › **RC** | Recibos de ingreso | N° de recibo |
| REGISTRO SUMINISTROS › RDP / CFN / DNC / DVL / NR / FP | Depósitos / Cafetines / Donaciones / Devoluciones / No remesado / Libro de banco | — |
| CAJA CHICA › **Registro** | Registro de caja chica | (no verificar) |
| CAJA CHICA › **Directorio** | Directorio de proveedores | Nombre |
| Control de Material Bodega › **BD_DOCENTES** | Personal y docentes | Nombre |
| Donación de material | Movimientos de bodega (tipo ENTRADA - DONACIÓN) | — |

Las filas de totales y las filas vacías se omiten solas. Importe **primero Estudiantes y después Recibos**.

Probado con sus archivos reales: el reporte de 2° Año A General da 30 estudiantes, 28 con pago y $1,119.50; el control de digitación da del 14614 al 16308; la caja chica da un saldo de $237.32 en la caja C10, con $62.68 por reembolsar. Todo coincide con sus Excel.

---

## Novedades v1.3
- **Recibo RC de caja chica con formato oficial:** botón **🧾 Generar recibo** en el registro de caja chica. Original y copia salen en 2 páginas.
- **Ctrl+Enter** en cualquier formulario: guarda y pasa al siguiente registro. En uno nuevo conserva la fecha, el tipo y la categoría.
- **Recibo de ingreso:**
  - Empieza en la **fecha**, con aviso si no es la de hoy.
  - Grado, sección y opción se ven en pequeño, con **✏️** para editar al estudiante. El cambio se aplica a todos sus recibos.
  - Arriba van los **⭐ rubros frecuentes** y el resto queda en **Más rubros**.
- **Rubros ocultos:** ya no alteran los cálculos. *Visible en recibo* solo los oculta al digitar.
- **Arqueo:**
  - Botones **Limpiar** y **Traer último arqueo**.
  - El cuadre descuenta los depósitos hechos después del arqueo, así ya no aparecen como faltantes.
- **Sincronización:** ya no recarga la pantalla mientras trabaja. Los cambios de otros equipos se muestran solos cuando no hay nada abierto.
- **Consulta rápida de alumno:** buscador fijo en el Panel principal y en Recibos/Estudiantes (*Consultar alumno*). Muestra la ficha con alimentos, rubros y recibos. También busca por N° de recibo.
- **Documentos:**
  - **📥 Importar** cartas y formatos de Word (.docx) o texto como plantillas.
  - Posición de las firmas y **recuadro para sello**.
- **Cuentas bancarias** (Tesorería): se eligen en depósitos, cheques y libro de banco. Muestran totales y saldo por cuenta.
- **Estado de cuenta de arrendatarios impreso:** resumen, cuadro por mes y detalle de cada arrendatario, con sus pagos y meses pendientes.
- **Existencias por talla:** conteo, entradas, ajustes y kardex. Las ventas descuentan solas.
- **Selección múltiple:** casillas en todos los listados para **eliminar varios** a la vez, con Deshacer.
- **Rendición de cuentas anual** (Reportes): se genera con un clic. Secciones, textos y orden se configuran sin tocar código.
- **Libreta de notas** (botón en la barra superior, Ctrl+Shift+N): modos **A** lateral, **C** bloc rápido y **D** cuaderno. Se elige en Configuración › General.
- **Calculadora** (botón 🧮 en la barra superior, Ctrl+Shift+K) con 3 pestañas:
  - **Calculadora** con cinta, recibido y vuelto, y *Pasar al recibo*.
  - **Cobro rápido**: conceptos de sus rubros × cantidad, vuelto y *Crear recibo con esto*.
  - **Cuentas** en renglones escritos (ej. `3*5`, `25 - 10%`).
  - Se abre desplegable o se fija 📌 como ventana flotante y se minimiza a burbuja.
- **Catálogo de cobros y productos** (Configuración): rubros, productos, tallas, precios, mínimos, **existencias** y lo **vendido**, todo en un solo lugar. Cualquier rubro (ej. insignias) puede llevar existencias sin tallas.

## Novedades v1.2
- **Uniformes por talla en el recibo:** en el recibo, sección *Uniformes, chumpas y camisas*, agregue filas con producto, talla y cantidad. El precio sale de la configuración y el monto se suma al rubro (uniforme deportivo, chumpas…). Cada fila queda registrada sola en *Uniformes › Ventas y entregas*.
- **Productos, tallas y precios:** en *Configuración › Uniformes y tallas* se configura el costo y el precio por talla, se agregan o eliminan productos y tallas, y se elige a qué rubro suma cada producto.
- **Rubros:** se pueden agregar y eliminar. La unidad se elige de una lista, que se edita en *Catálogos › Unidades de los rubros*.
- **Series de recibos:** cada serie (A y B) lleva su propia numeración y su control de digitación. Los recibos del 1 al 27 son Serie A y el resto Serie B. La serie predeterminada se cambia en *Configuración › General*.
- **📝 Observaciones:** los recibos con observación muestran un ícono, y al pasar el mouse se lee la nota. En *Vista* se pueden filtrar los que tienen observación, los anulados o los que tienen uniformes.
- **Arrendatarios:** catálogo con categoría (cafetín, chalet, local…), cuota y contrato. Un solo recibo puede cubrir varios meses y se genera un registro por cada mes. El *Estado de cuenta* muestra los meses pagados y pendientes, el saldo y permite hacer una *carta de cobro* con un clic.
- **Columnas al imprimir:** los listados preguntan qué columnas imprimir. En cualquier reporte, el botón **🧩 Columnas** de la vista de impresión oculta o muestra columnas y recuerda la elección.
- **PDF individuales por lote:** en los reportes por grado y por rubro, el botón **📑 PDF individuales** crea un PDF por cada sección elegida, en una carpeta de Drive y en un .zip. Se puede asignar el docente guía y enviarle su PDF por correo. Requiere internet; Google permite unos 100 correos por día en cuentas gratuitas.

## Eliminar varios registros a la vez
En cualquier listado marque las casillas de la izquierda (la casilla del encabezado marca toda la página). Aparece una barra con **Seleccionar los N filtrados**, **Exportar selección** y **🗑️ Eliminar seleccionados**. Justo después de eliminar aparece **Deshacer** por unos segundos. Al borrar recibos en lote, también se quitan sus ventas de uniformes.

## Existencias de uniformes por talla (Uniformes y ventas › Existencias por talla)
1. Pulse **📋 Registrar existencia actual** y escriba cuántas unidades tiene hoy de cada talla (conteo físico).
2. Desde ahí, **cada venta descuenta sola**: las filas por talla del recibo o lo que registre en *Ventas y entregas*.
3. **Entradas** (compras nuevas), **ajustes** y **bajas** con los botones de arriba. Un pedido a proveedor marcado como **Recibido** también suma.
4. Columnas: *Existencia física* (lo que hay en bodega), *Vendido sin entregar* y **Disponible** (lo que se puede vender). Toque una talla para ver su kardex.
5. Al digitar un recibo, cada talla muestra cuántas hay disponibles, por ejemplo *8 (disp. 12)*.
Puede volver a contar cuando quiera: el nuevo conteo reemplaza la existencia de esa talla desde esa fecha.

## Recibos RC de caja chica (formato oficial)
- **Desde el registro:** en *Caja chica › Registro de caja chica*, cada gasto con recibo (RC…) tiene el botón **🧾 Generar recibo**. Elija *Solo original* o *Original y copia*: la copia sale en **otra página**, marcada ORIGINAL / COPIA.
- **Recibo nuevo o reimpresión:** en *Caja chica › Recibo (sin factura)* deje el número sugerido para uno nuevo, o escriba un RC existente: los datos se cargan solos del registro y del directorio (DUI, fecha de emisión, dirección).
- ISSS, AFP y 10 % de renta (solo para servicios de personas naturales sin factura) se descuentan y el **líquido recibido** es lo que se registra como gasto.
- Firmantes del recibo: *Configuración › Firmantes › Recibo RC de caja chica* (por defecto la Concejal de los maestros, el Presidente y la Tesorera).

## Firmas y sello en cartas (Documentos › Generar documento)
En el recuadro **✍️ Firmas y sello** elija la **posición de las firmas** (centro, izquierda o derecha), el **espacio para firmar** (normal, amplio o muy amplio) y el **recuadro para sello** (a la derecha o izquierda de las firmas, o debajo al centro, a la izquierda o a la derecha). Se aplica al documento que está haciendo; con **Guardar como predeterminado de la plantilla** queda fijo para esa plantilla. También se configura al editar la plantilla.

## Calendario de trabajo (Inicio › Calendario)
- **Panel del día:** toque un día y escriba una **nota**, un **recordatorio**, una tarea o una actividad. Puede ponerle hora, aviso y prioridad; Enter guarda.
- **Pendientes a la vista:** cada día muestra cuántas cosas faltan. Los días pasados con pendientes se marcan en rojo, y las notas aparecen en amarillo con 📝.
- **Mover actividades:** arrastre una actividad a otro día para cambiarle la fecha.
- **Vistas y filtros:** Mes, Semana y Lista, con filtro por tipo y opción *Solo pendientes*. Se puede imprimir la agenda del mes.
- **Todo está conectado:** el calendario, la agenda, las tareas pendientes, la pantalla de inicio y las notificaciones usan los mismos datos.

## Alimentos (meses y pendientes)
En **Configuración › General › Alimentos** se marcan los **meses en que se cobran alimentos** (por defecto, de febrero a noviembre = 10) y la cuota mensual. También se elige cómo calcular lo pendiente:
- **Todo el año** (predeterminado): un estudiante con 5 meses pagados debe 5 meses ($7.50).
- **Hasta la fecha**: compara solo con los meses que ya pasaron.

La constancia muestra qué meses cubre lo pagado y cuáles faltan (por ejemplo: *cubre febrero a junio · pendientes julio a noviembre*). Si un recibo tiene el monto de alimentos pero no la cantidad de meses, los meses se calculan como monto ÷ cuota.

## Firmantes
En **Configuración › Firmantes** se agregan o quitan las personas que firman (nombre y cargo, tal como se imprimen). Para cada documento se elige quién firma y en qué orden: reembolso de caja chica, arqueo, cuadre, reportes, constancia, estado de cuenta de arrendatarios, voucher, existencias y recibo. Abajo hay una vista previa. Cada firmante también puede usarse en las plantillas de cartas con su clave, por ejemplo `{{concejal_maestros}}` o `{{cargo_concejal_maestros}}`.

## Cómo funciona offline

- La app **siempre guarda primero en su computadora** (base de datos del navegador) y sube los cambios a Drive en segundo plano. El indicador de arriba a la derecha muestra el estado: *Sincronizado*, *X pendientes* o *Sin conexión*.
- **Si se cae el internet con la app abierta**: siga trabajando normalmente. Al volver la conexión, sube todo solo.
- **Para abrirla sin internet**: use `Suministros_Offline.html` (Configuración › Conexión). Ábralo con Chrome o Edge **siempre desde la misma ubicación** (los datos locales quedan ligados a ese archivo en ese navegador).
- **Otra computadora**: abra la URL o copie el archivo offline; la primera vez descarga todos los datos del año. Si le pide la *clave de acceso*, está en Configuración › Conexión del equipo principal.
- Si dos equipos editan el mismo registro, gana la edición más reciente.

## Velocidad y bloques por año
- Cada año es un archivo independiente, así que el sistema no se vuelve lento con los años.
- Las búsquedas, filtros y reportes se calculan en su equipo (milisegundos, aun con miles de registros). La sincronización solo envía lo que cambió.
- Año nuevo: **Configuración › Años › Crear año** (puede copiar la base de estudiantes). Cambie de año con el selector de arriba.

## Personalización
- **Rubros y precios**: agregue, desactive, reordene y fije precios (Configuración › Rubros).
- **Catálogos**: grados, secciones, categorías, tipos, tallas, unidades… (Configuración › Catálogos).
- **Campos personalizados** en cualquier módulo, renombrar u ocultar campos, quitar módulos del menú (Configuración › Módulos y campos).
- **Plantillas de documentos** con campos `{{variables}}` (Documentos › Plantillas).
- Colores, logo, firmantes y modo oscuro (🌓).

## Imprimir
Todo reporte abre una **vista de impresión** → *Imprimir / Guardar PDF* (en el diálogo de Chrome elija “Guardar como PDF”, tamaño Carta) o *☁️ PDF en Drive* (lo guarda en `Reportes PDF/<año>`).

## Respaldos
- Automático cada viernes 5:00 p. m. (al activar los recordatorios) y manual en Configuración › Conexión › *Respaldo en Drive*.
- *Descargar respaldo* (.json) en Configuración › Importar / exportar guarda todo lo del equipo.
- Edite los datos desde la app, no directamente en las hojas de Google: los cambios hechos a mano en las hojas no se sincronizan.

## Si algo falla
| Síntoma | Solución |
|---|---|
| La versión offline dice “Sin conexión con Google” | Configuración › Conexión › **🩺 Probar conexión**: indica el paso que falla y cómo arreglarlo. Si el navegador bloquea la conexión normal, el sistema usa sola una conexión alternativa |
| Pide “clave de acceso” | Cópiela de Configuración › Conexión en el equipo principal |
| “Error de sync” | Revise que la implementación tenga acceso “Cualquier usuario” y que sea la versión más reciente |
| No descarga Excel o no lee .xlsx en modo offline | Esa función necesita internet la primera vez; copie y pegue las celdas |
| Datos raros en un equipo | Configuración › Conexión › *Reiniciar datos de este equipo* (vuelve a descargar de Drive) |
