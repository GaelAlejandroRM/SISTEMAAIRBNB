# Actualización R2 de Nómada

Fecha: 29 de octubre de 2026. Revisión local del código y del manual proporcionado.
No se ejecutaron cambios en Cloud SQL, no hubo despliegue ni commit/push.

## Actualizar la instalación compartida

Coordinen una sola actualización de la base con el equipo. Conserva abierto el
proxy en 127.0.0.1:5433 y detén únicamente el servidor Node con Ctrl+C.
Desde la raíz de SISTEMAAIRBNB ejecuta:

```powershell
npm.cmd ci
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\actualizar-bd.ps1
npm.cmd start
```

El asistente pide la contraseña de nomada_owner en privado, aplica las migraciones
pendientes y los permisos de nomada_app; no cambia tu .env. Si falla, no continúes
con el arranque hasta revisar el mensaje. La configuración habitual del servidor
debe seguir usando nomada_app. No compartas contraseñas en el chat o Git.
Las migraciones 3 y 4 agregan password_resets y recovery_mail_jobs, respectivamente.
No eliminan usuarios, alojamientos, reservas ni pagos existentes.

## Cambios de código

- Usuarios: botones Desactivar cuenta/Reactivar cuenta, confirmación y vista móvil
  con acciones visibles. Se conserva el editor de roles y sus restricciones.
- Perfil compartido para huésped, anfitrión y administrador: nombre, teléfono y
  ciudad propios; no cambia rol ni correo.
- Comprobante con titular, importe reservado, estado de pago e importe aprobado
  simulado. Un pago pendiente/rechazado muestra cero pagado. Impresión registrada
  desde JS y hoja de impresión específica, sin debilitar la CSP.
- Consulta de disponibilidad/precio al cambiar fechas y capacidad en el detalle;
  permanece la validación transaccional final.
- Catálogo de veinte elementos por página con navegación. Ubicación, capacidad,
  fechas y servicios se filtran antes de limitar resultados. Se evita cargar el
  catálogo completo dentro del panel del huésped.
- Política R2: el huésped solo cancela solicitudes pendientes; confirmadas no se
  cancelan. La variable antigua CANCEL_BEFORE_ARRIVAL no habilita excepciones.
- Bitácora de cambios de perfil, cierre de sesión, acceso rechazado y errores
  internos relevantes. No se registran contraseñas, correos intentados o enlaces.
- Administración separada en backend/admin.js.
- Recuperación: cola cifrada y persistente con hasta cinco intentos SMTP. En local
  el trabajador se inicia con el servidor; Cloud Run necesita un trabajador
  dedicado. Ver RECUPERACION.md antes de configurar producción.

## Manual actualizado

[Documento V1.6 revisión R2](docs/Documento_Nomada_V1.6_Corregido_R2.pdf).
Conserva R1 y sus correcciones. Actualiza tecnologías, sesiones SID, scrypt,
pagos simulados, fotografías en PostgreSQL con límites, administración, perfil,
cancelación y comprobantes. Conserva números de página existentes y agrega
actualización y reglas en páginas 173-176. Ajusta también los casos de prueba
administrativos de la página 154. No completa firmas, responsables ni resultados
pendientes con información supuesta.

## Validación realizada

- Migraciones 1 a 4 desde una base PostgreSQL 18 local vacía, segunda ejecución
  idempotente y aplicación de permisos con la nueva herramienta.
- 24 pruebas aprobadas, cero fallidas, con cuenta de base de datos limitada.
- Cobertura V8 de módulos cargados: 92.84% líneas, 77.50% ramas, 89.04% funciones.
  Excluye frontend, SQL y archivos no instrumentados como migraciones, alta de
  administrador, aplicador de permisos y entrada del trabajador. No es una
  cobertura global del repositorio.
- Edge: paginación 20+3, filtro de servicio, fechas ocupadas/libres, comprobante
  pendiente e impresión, perfil de anfitrión, desactivar/reactivar, panel de
  administrador, moderación, bitácora y vista móvil; sin errores JS no controlados.
- SMTP simulado: cola durable, reintento, enfriamiento, respuesta genérica y
  consumo concurrente de un enlace con revocación de sesiones.
- PDF: revisión visual de las páginas modificadas; contenido textual de las
  páginas conservadas comparado contra R1. Original preservado.

## Pendientes del entorno y aceptación

Entrega real de Gmail, migraciones/permisos en Cloud SQL, HTTPS, trabajador remoto,
respaldos y restauración, pgAudit, medición de carga/disponibilidad, accesibilidad
completa y otros navegadores requieren configuración y pruebas en sus ambientes.
No se consideran aprobados por las verificaciones locales. El equipo debe revisar
el cambio de alcance documental y completar la aceptación y el PR correspondiente.
