# Validación de la entrega

Las secciones iniciales conservan resultados históricos. El estado vigente de la
revisión R2 se resume al final y en CAMBIOS_R2.md; los pendientes anteriores no
representan necesariamente funciones ausentes del código actual.

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

## Módulo administrador del 29 de octubre de 2026

Se ejecutó la batería completa en PostgreSQL local aislado con la cuenta de
permisos limitados: 16 pruebas aprobadas, 0 fallidas, incluyendo los cuatro casos
de configuración de Cloud Run preparados en una tarea anterior. Se ampliaron
los casos administrativos con búsquedas, filtros, resumen y moderación de reseñas.

En Microsoft Edge automatizado se verificaron login y redirección a admin.html,
resumen, desactivación/reactivación de cuenta, cambio de rol, ocultamiento y
restauración de alojamiento, moderación de reseña, consulta de reservas, pagos,
bitácora y detalles. También se comprobó rechazo sin sesión y que un comentario
con HTML se muestra como texto sin crear elementos de imagen. No se registraron
errores JavaScript no controlados. Se inspeccionó una captura de escritorio y
la disposición móvil de 390 píxeles, sin desborde horizontal global.

Las pruebas crearon únicamente fixtures ficticios en nomada_backend_test. No se
crearon cuentas administrativas reales, no se ejecutaron migraciones en Cloud
SQL y no se modificaron datos compartidos. El panel no necesita nuevas tablas.
No se desplegó ni se subieron cambios a GitHub.


## Revisión R2 del 29 de octubre de 2026

24 pruebas aprobadas con PostgreSQL local y cuenta limitada, incluidas cotización,
paginación de 105 alojamientos, perfiles de anfitrión/administrador y cola de correo
con fallo SMTP simulado, reintento y consumo concurrente de token. Las migraciones
1-4 se probaron en nomada_r2_clean_test y se repitieron sin duplicar cambios.
La herramienta apply-runtime-grants.js se probó en esa misma base de pruebas.

Cobertura de módulos cargados, excluyendo tests: 92.84% líneas, 77.50% ramas y
89.04% funciones. No incluye frontend, SQL ni archivos no cargados. Comando:

```powershell
node --test --experimental-test-coverage --test-coverage-exclude='tests/**' tests/*.test.js
```

En Edge se repitieron los flujos administrativos y se verificaron paginación,
filtro previo al límite, disponibilidad de fechas, importe pagado cero sin pago,
impresión sin manejadores inline, perfil de anfitrión y acciones móviles de cuentas.
No hubo errores JavaScript no controlados. Capturas: docs/evidencias-r2/.

El manual R2 conserva el contenido de páginas no modificadas y sus correcciones
previas. Las páginas cambiadas se renderizaron e inspeccionaron. Las páginas
173-176 documentan reglas y límites. No se editaron firmas ni se asignó aceptación.
Cloud SQL, correo real, pgAudit, respaldo/restauración y despliegue no fueron
modificados ni validados. Consulta CAMBIOS_R2.md para actualización controlada.
