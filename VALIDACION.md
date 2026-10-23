# Validación de la entrega

Fecha: 22 de octubre de 2026.
Rama fuente: modulo-huesped, commit f4100e5.

## Backend

Se ejecutaron 12 grupos de pruebas de integración contra PostgreSQL 18 real,
en una instancia aislada dentro del espacio de trabajo. Resultado: 12 aprobados,
0 fallidos. Se repitió la batería con una cuenta de base de datos con los permisos
mínimos del archivo runtime-grants.sql; también aprobaron los 12 grupos.

Cobertura funcional ejercitada:

1. Salud de API y validación de periodos y precios.
2. Registro, inicio de sesión, hash de contraseñas y restricciones de rol.
3. Persistencia, propietario y estado de publicación de alojamientos.
4. Reserva, importe calculado por servidor e idempotencia.
5. Perfil y favoritos persistentes por cuenta.
6. Protección compartida de bloqueos y reservas frente a solapamientos.
7. Dos solicitudes simultáneas: una reserva registrada y un conflicto 409.
8. Confirmación, pago simulado, reintento y privacidad del comprobante.
9. Cancelación de solicitud pendiente, liberación de fechas y notificación.
10. Reseña solo después de estancia finalizada y rechazo de duplicados.
11. Endpoints administrativos, moderación, bitácora y revocación de sesiones.
12. Rechazo de origen externo y cierre de sesión efectivo.

Los casos usan datos ficticios y una base exclusiva de pruebas. No se modificaron
las bases existentes del usuario. Estos resultados no equivalen a un porcentaje
de cobertura de código, a una auditoría de seguridad completa ni a una prueba
de carga con usuarios reales.

## Navegador

Se automatizó Microsoft Edge con dos contextos independientes:

- Registro e inicio de sesión mediante formularios de huésped y anfitrión.
- Creación y publicación de alojamiento desde el formulario del anfitrión.
- Solicitud desde huesped.html de la rama indicada.
- Confirmación por el anfitrión y consulta por el huésped.
- Pago simulado aprobado y actualización de su estado.
- Actualización de teléfono del perfil y navegación por favoritos.
- Consulta del calendario y revisión visual en anchura móvil de 390 píxeles.
- Captura de la pantalla de reservaciones en anchura de escritorio.

Resultado: flujo completado y cero errores JavaScript no controlados durante
la ejecución. No se probaron todos los navegadores ni dispositivos físicos.

## No verificado o pendiente

- Instalación, carga y escritura de logs de pgAudit: extensión no disponible
  en la instancia aislada. Se incluye configuración, no activación confirmada.
- HTTPS, proxy, credenciales productivas y acceso desde otros equipos.
- Envío de correo y recuperación de cuenta.
- Respaldos/restauración y retención real de datos y logs.
- Compatibilidad con posteriores commits de la rama, posteriores a f4100e5.
- Interfaz visual del administrador y políticas de negocio aún no acordadas.

La validación anterior se realizó en la entrega independiente. Posteriormente,
el código se integró en la carpeta Git SISTEMAAIRBNB y el frontend anterior se
respaldó fuera del repositorio. Esta reorganización no ejecuta migraciones ni
modifica datos remotos. No hubo push, merge ni PR durante la reorganización.
