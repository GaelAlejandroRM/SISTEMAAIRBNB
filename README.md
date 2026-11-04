# nomada Backend compartido y pantallas conectadas

Código integrado de huésped, anfitrión y administrador en Node.js y PostgreSQL.
La revisión local R2 del 29 de octubre de 2026 está alineada con
[el manual corregido](docs/Documento_Nomada_V1.6_Corregido_R2.pdf).
Consulta [CAMBIOS_R2.md](CAMBIOS_R2.md) para actualizar migraciones y permisos.
Los cambios locales de esta revisión no se han enviado a GitHub ni desplegado.

## Qué incluye

- Registro público de huéspedes y anfitriones, inicio/cierre de sesión y perfil.
- Contraseñas con scrypt y salt. Sesiones opacas revocables en PostgreSQL y cookie
  HttpOnly, SameSite=Strict, con duración de 8 horas. Esta implementación usa
  sesiones opacas SID, conforme a la descripción actualizada del manual R2.
- Permisos por rol y propietario, consultas parametrizadas, validación de origen
  en escrituras, límite básico de intentos de acceso por IP.
- Alojamientos, precio, servicios, fotografías, publicación y calendario.
- Reservas entre usuarios, historial, confirmación/rechazo, cancelación de
  solicitudes pendientes y finalización después de la fecha de salida.
- Prevención de solapamientos en PostgreSQL para reservas y bloqueos, con
  exclusión GiST y rangos de fechas [entrada, salida).
- Reintentos de reserva sin duplicados mediante clave de operación.
- Pagos exclusivamente simulados, con reintento de rechazado a aprobado.
- Comprobante de operación, reseña después de estancia finalizada,
  notificaciones y favoritos persistentes por huésped.
- Panel de administración en admin.html para usuarios, alojamientos, reservas,
  pagos, reseñas, resumen y bitácora. Ver ADMINISTRADOR.md para el acceso inicial.
- Perfil compartido para todos los roles y acciones explícitas de activar/desactivar cuentas.
- Recuperación por SMTP con enlaces de un solo uso y cola cifrada con reintentos.
- Bitácora de aplicación y guía separada para pgAudit.

## Archivos y dónde acomodarlos

```text
SISTEMAAIRBNB/
  backend/           Servidor, validaciones, SQL y permisos
  frontend/          HTML, CSS y JS conectados de la rama revisada
    index.html       Catálogo público anterior conservado como referencia
    huesped.html     Panel del huésped de tu compañero, conectado
    anfitrion.html   Panel del anfitrión, conectado
    acceso.html      Registro e inicio de sesión
  tests/             Pruebas automáticas de API
  package.json
  package-lock.json
  .env.example
  API.md
  PGAUDIT.md
```

Trabaja y ejecuta npm desde la raíz de `SISTEMAAIRBNB`. El servidor sirve la
carpeta `frontend`: tanto `/` como `/index.html` abren `huesped.html`. Si no hay
una sesión de huésped, se redirige a `acceso.html`. No necesitas Live Server.

`.env` y `node_modules` son archivos locales excluidos de Git. Los colaboradores
deben crear su propio `.env`, instalar con `npm.cmd ci` y contar con acceso al
proyecto Cloud SQL. No necesitan copiar bases de datos ni credenciales de otro
integrante. El ejecutable cloud-sql-proxy.exe permanece fuera del repositorio.

## Conexión existente de Cloud SQL

La base `nomada` ya existe en el entorno compartido. Esta revisión agrega la
migración 4 para la cola y requiere confirmar también la migración 3 y permisos.
No se han aplicado allí durante esta revisión. Consulta CAMBIOS_R2.md antes de iniciar. Para continuar en esta computadora, conserva el proxy abierto en
127.0.0.1:5433 y ejecuta `npm.cmd start` en esta carpeta. El usuario habitual del
backend debe ser `nomada_app`. No vuelvas a crear la base ni las cuentas si ya
existen. Las instrucciones de instalación local siguientes son para un ambiente
nuevo. Las futuras migraciones se ejecutan con la cuenta propietaria, después
de revisar sus cambios.

El proxy se inicia desde la carpeta superior `Codigo`, donde está el ejecutable:

```powershell
.\cloud-sql-proxy.exe --address 127.0.0.1 --port 5433 sistemaairbnb:us-east4:sistemaairbnb-instance
```

## Requisitos

- Node.js 22 o superior con npm.
- PostgreSQL 16, 17 o 18, con la extensión btree_gist disponible.
- Credenciales de una instancia que puedas utilizar para desarrollo.
- pgAudit se instala por separado y debe coincidir con la versión mayor de PostgreSQL.

No necesitas Live Server. Node sirve tanto el frontend como la API.
No hay cuentas ni contraseñas predeterminadas, ni carga automática de ejemplos.
El frontend anterior guardado en localStorage no se importa: sus datos ficticios
no deben confundirse con usuarios o reservaciones del sistema compartido.

## Instalación local

### 1 Crear una base exclusiva del proyecto

Desde psql, conectado con una cuenta con permisos suficientes, ejecuta una sola
vez, usando nombres que no existan ya en tu instancia:

```sql
CREATE ROLE nomada_owner LOGIN;
\password nomada_owner
CREATE ROLE nomada_app LOGIN;
\password nomada_app
CREATE DATABASE nomada OWNER nomada_owner;
```

`\password` solicita la contraseña sin incorporarla al script. No utilices las
cuentas de una base existente del equipo sin coordinarlo.

### 2 Instalar dependencias y configurar la migración

Abre PowerShell en esta carpeta:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Edita temporalmente `DATABASE_URL` de `.env` con la cuenta propietaria:

```dotenv
DATABASE_URL=postgresql://nomada_owner:TU_PASSWORD@127.0.0.1:5432/nomada
```

Si la contraseña contiene caracteres especiales, codifícalos para una URL.
No subas `.env` al repositorio. Aplica las migraciones:

```powershell
npm.cmd run migrate
```

Las migraciones son transaccionales y quedan registradas en `migrations`.
No borran ni reconstruyen bases existentes. Se espera una base nueva para la
primera instalación; si ya tiene tablas de otro sistema, usa otra base o diseña
una migración específica después de revisar su esquema.

### 3 Otorgar permisos mínimos y usar la cuenta de aplicación

Conecta psql a `nomada` como `nomada_owner` y ejecuta:

```sql
\i backend/runtime-grants.sql
```

Ejecuta ese comando desde esta carpeta o usa la ruta absoluta del archivo.
Ahora cambia `DATABASE_URL` de `.env` para utilizar `nomada_app` en lugar de
`nomada_owner`. Node no necesita permisos para crear o borrar tablas.

### 4 Iniciar

```powershell
npm.cmd start
```

Abre exactamente **http://127.0.0.1:3000**.
PUBLIC_ORIGIN debe coincidir con el origen que abre el navegador. No mezcles
`localhost` con `127.0.0.1`, ni abras el HTML con doble clic.

## Cómo comprobar huésped y anfitrión

1. Abre `acceso.html`, registra un anfitrión e inicia sesión.
2. Crea y publica un alojamiento. Puedes subir hasta 5 imágenes PNG/JPEG.
3. En otro perfil de navegador o ventana privada registra un huésped.
4. En `huesped.html` solicita ese alojamiento con fechas libres.
5. En la sesión del anfitrión abre Reservaciones y acepta la solicitud.
6. En el huésped vuelve a Mis reservaciones para refrescar y simula el pago.
7. Revisa el comprobante, notificaciones e ingresos del anfitrión.

Las sesiones se comparten entre pestañas del mismo perfil: para utilizar dos
cuentas simultáneas emplea perfiles distintos o una ventana privada.
Las pantallas consultan cambios al navegar; no se implementaron WebSockets.

## Panel de administrador

Desde PowerShell, con el proxy activo y .env configurado, crea una cuenta
administrativa autorizada mediante el asistente:

```powershell
.\tools\crear-admin.ps1
```

El asistente solicita la contraseña de forma oculta y elimina las variables
temporales al finalizar. No escribe la contraseña en Git ni en .env.
El registro público rechaza el rol administrador. El comando crea una cuenta
nueva; no promueve silenciosamente una existente. Tras iniciar sesión desde
`acceso.html`, el administrador entra al panel `admin.html`. La guía
ADMINISTRADOR.md describe la gestión de cuentas, moderación y seguimiento.

## Reglas configurables

- `SERVICE_FEE_BPS=0`: no se aplica tarifa. `1000` equivaldría a 10 %. Cambiarlo
  solo después de acordar la regla. Cada reserva conserva su importe y tarifa.
- Política R2: el huésped solo puede cancelar solicitudes pendientes. No se
  cancelan confirmadas ni se calculan reembolsos. La variable antigua
  CANCEL_BEFORE_ARRIVAL ya no habilita excepciones.
- Las solicitudes pendientes retienen las fechas y no expiran automáticamente.
  Definir su plazo y proceso de expiración es trabajo pendiente.
- Máximo 365 noches y 100000 MXN por noche, con límite de importe de operación
  de 2147483647 centavos. Son límites de esta implementación, no requisitos
  atribuidos al manual.
- La reseña requiere que el anfitrión marque finalizada una estancia cuya salida
  ya haya ocurrido. No permite reseñar solo por tener reserva confirmada.
- Los roles son exclusivos por cuenta en esta versión. Para probar ambos se
  usan dos cuentas; habilitar una cuenta con varios roles requiere adaptación.

## Pruebas

Usa una base exclusiva cuyo nombre termine en `_test`. Aplica primero las
migraciones con DATABASE_URL apuntando a esa base. Después:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://USUARIO:PASSWORD@127.0.0.1:5432/nomada_test'
npm.cmd test
```

Las pruebas insertan fixtures ficticios. No limpian ni eliminan tablas.
Nunca apuntes TEST_DATABASE_URL a una base de uso real.
Consulta VALIDACION.md para el alcance de la ejecución realizada.

## Pendientes antes de producción

- Verificar entrega real SMTP y trabajador dedicado para despliegues remotos;
  la recuperación y su cola ya están implementadas. Ver RECUPERACION.md.
- Configurar y verificar pgAudit; la extensión no estaba instalada en la
  instancia aislada usada para estas pruebas. Ver PGAUDIT.md.
- HTTPS, cookies Secure, acceso de red a PostgreSQL, respaldos, restauración y
  rotación/retención de logs conforme a la política aprobada.
- Pruebas de carga y compatibilidad en otros navegadores/dispositivos.
- Acordar cualquier ampliación futura de cancelación, retención, expiración,
  reembolsos y cargos; la política actual se documenta en R2.
- Reglas administrativas adicionales que acuerde el equipo.

Para despliegue con HTTPS, configura PUBLIC_ORIGIN, COOKIE_SECURE=true y
NODE_ENV=production. La aplicación rechaza la combinación de producción sin
estas opciones, pero no instala certificados ni configura tu proxy.

No se afirma cumplimiento completo de todos los requisitos del documento.
