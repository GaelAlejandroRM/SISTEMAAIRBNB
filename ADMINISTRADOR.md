# Módulo de administrador

Entrada: http://127.0.0.1:3000/admin.html. Requiere una cuenta activa con rol
administrador; el registro público no permite crear ese rol. El inicio de sesión
en acceso.html redirige automáticamente a la pantalla correspondiente.

## Primera cuenta

Si ya existe un administrador, inicia sesión con esa cuenta. Para crear una
nueva cuenta autorizada, abre PowerShell en SISTEMAAIRBNB, conserva el proxy
funcionando y ejecuta:

```powershell
.\tools\crear-admin.ps1
```

Si PowerShell bloquea este script local por la política de ejecución, puedes
invocarlo en un proceso dedicado sin cambiar la política global del equipo:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\crear-admin.ps1
```

El script solicita nombre, correo y contraseña, utiliza el comando existente
de creación de administrador y no escribe la contraseña en .env ni en Git.
No se crea ninguna cuenta automáticamente al abrir la página. Quien tenga
acceso SQL de escritura debe proteger sus credenciales técnicas: la restricción
de registro público no sustituye los permisos de PostgreSQL.

## Funciones

- Resumen con usuarios, alojamientos, reservas e importe de pagos simulados.
- Usuarios: búsqueda por nombre/correo/ID, filtros de rol y estado, activación,
  desactivación y cambio de rol con confirmación. Guardar revoca sesiones.
- Alojamientos: consulta, búsqueda, detalles y moderación sin borrar historial.
- Reservaciones: consulta administrativa de estado, participantes, fechas e
  importe. No cambia los estados por fuera de las reglas del anfitrión/huésped.
- Pagos: consulta y detalle de operaciones simuladas. No altera importes ni
  procesa datos bancarios.
- Reseñas: consulta y ocultamiento/restauración con confirmación.
- Bitácora: acciones de aplicación, responsable, objetivo y detalles. No muestra
  ni reemplaza los logs de pgAudit.

Las listas muestran 50 filas por página con búsqueda y filtros en el servidor.
Actualizar vuelve a consultar PostgreSQL. No hay un botón de borrado de usuarios,
reservas ni pagos. No se permite quitar el propio acceso administrativo o dejar
sin un administrador activo. Los cambios de rol siguen las restricciones que
ya impone el backend a propietarios de alojamientos.

No requiere nuevas tablas ni migraciones. Los permisos administrativos se
comprueban en el servidor, además de la comprobación de acceso del frontend.
Los cambios quedan locales hasta que el equipo los confirme y suba a Git.


## Acciones explícitas R2

En Usuarios cada cuenta ajena muestra Administrar y Desactivar cuenta o Reactivar
cuenta. No es necesario abrir el editor para cambiar el acceso. Se pide confirmar,
se revocan sesiones y se conserva el historial. En móvil las cuentas se muestran
apiladas para que las acciones no queden fuera de la pantalla. Mi perfil abre
perfil.html para editar nombre, teléfono y ciudad del administrador.
