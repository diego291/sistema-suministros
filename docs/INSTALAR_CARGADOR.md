# Instalar el cargador (una sola vez)

Después de esto, los cambios del servidor llegan solos desde GitHub. No se vuelve a pegar código ni a crear versiones.

1. Abra el proyecto en script.google.com.
2. Abra `Code.gs`, borre todo y pegue el contenido de `fuente/apps-script/Code.gs` (el cargador). Guarde.
3. Arriba, en el menú de funciones, elija **activarTodo** y pulse **Ejecutar**.
   - Google pedirá permisos otra vez, porque ahora el sistema se conecta a GitHub. Acepte (Avanzado › Ir a… › Permitir).
   - En el registro debe decir: `Listo. Servidor api 5 …`.
4. **Implementar › Administrar implementaciones** › ✏️ en la implementación que usa la web › Versión: **Nueva versión** › **Implementar**. La URL no cambia.
5. Avise a Claude: comprueba que `?ping=1` responda `api: 5` y `cargador: 1`.

Si algo falla: en `Code.gs` use **Historial de versiones** (reloj a la izquierda) para volver al anterior y cree otra **Nueva versión** de la implementación.
