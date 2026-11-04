> Actualización R2: antes de habilitar recuperación en un despliegue remoto,
> aplicar migraciones 3 y 4, configurar SMTP como secreto y desplegar un
> trabajador dedicado con CPU disponible, o integrar una cola administrada.
> El servicio web en Cloud Run no inicia el trabajador local. Ver RECUPERACION.md.
> Esta guía no acredita que ese despliegue se haya realizado.

# Publicar nomada con una dirección run.app

Estado: preparación local, sin despliegue ejecutado. La base existente es nomada
en sistemaairbnb-instance. Estos pasos no ejecutan migraciones ni recrean tablas.

El servicio publicará frontend y backend juntos. Los usuarios accederán con
navegador e internet, sin Node, CLI ni proxy local. La instalación de herramientas
seguirá siendo necesaria para quienes desarrollen desde su computadora.

## 1 Revisar facturación y recuperación antes de publicar

El propietario debe comprobar el plan vigente de Cloud SQL, los costos de Cloud
Run, Cloud Build, Artifact Registry, Secret Manager y los respaldos. No se
garantiza uso gratuito. Configura alertas de presupuesto; las alertas no son un
tope de gasto. Los límites de instancias propuestos aquí limitan el escalado del
servicio, pero no los costos de la base ni el gasto total.

Antes del primer despliegue, toma un respaldo/exportación verificable y revisa
la disponibilidad de respaldos automáticos y recuperación a un momento concreto
en tu plan. Al publicar se reutiliza la base actual; no ejecutar migrate ni tests
contra ella para completar este procedimiento.

## 2 Revisar los cambios locales

Archivos preparados:

- Dockerfile: Node 24, dependencias de producción y usuario sin privilegios root.
- .dockerignore y .gcloudignore: solo se incluyen código de backend/frontend y
  archivos de instalación. .env y credenciales locales quedan fuera.
- backend/config.js: conserva DATABASE_URL para desarrollo y admite PGHOST,
  PGDATABASE, PGUSER y PGPASSWORD para el socket de Cloud SQL.
- backend/server.js: en Cloud Run escucha en 0.0.0.0 y el puerto PORT asignado.
- tests/cloud-config.test.js: pruebas de configuración sin conectarse a la base.

El contenedor arranca con node backend/server.js. No utiliza el npm start local
que carga .env. Las sesiones siguen almacenadas en PostgreSQL; reiniciar el
contenedor no elimina los alojamientos ni las reservas.

Desde SISTEMAAIRBNB se puede verificar la configuración sin usar la base:

```powershell
node --test tests/cloud-config.test.js
```

No subir .env a Git ni colocar contraseñas como argumentos de despliegue.

## 3 Permisos y servicios de Google Cloud

Este bloque es de configuración remota y puede habilitar servicios facturables.
Debe ejecutarlo la persona autorizada, después de revisar el paso 1.

```powershell
gcloud config set project sistemaairbnb
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com --project sistemaairbnb
```

La persona que despliega necesita los permisos de despliegue desde código y
actuar como la cuenta de ejecución. Consulta los roles actuales en la guía de
despliegue enlazada al final; no concedas Owner o Editor a todos los compañeros.
La identidad de Cloud Build necesita roles/run.builder. Puede ser una cuenta
de compilación acordada por el equipo o la identidad predeterminada indicada
por Google Cloud. Confirmar cuál se utilizará antes de asignar permisos.

Crea una identidad dedicada al servicio, si aún no existe:

```powershell
gcloud iam service-accounts create nomada-runtime --display-name "Servicio web de nomada" --project sistemaairbnb
gcloud projects add-iam-policy-binding sistemaairbnb --member="serviceAccount:nomada-runtime@sistemaairbnb.iam.gserviceaccount.com" --role="roles/cloudsql.client"
```

La identidad de ejecución no necesita permisos para crear tablas ni administrar
facturación. El permiso de Google Cloud no sustituye los permisos SQL de
nomada_app, que ya fueron configurados.

## 4 Guardar la contraseña en Secret Manager

En Google Cloud > Secret Manager, crea un secreto llamado nomada-db-password.
Su contenido debe ser únicamente la contraseña de nomada_app, sin comillas ni
saltos de línea añadidos. Se introduce por la consola; no se guarda en el repo.
Conserva el número de versión creado. Los ejemplos siguientes utilizan 1:
si tu versión es otra, sustituye ese número en el despliegue.

Otorga acceso solo a ese secreto:

```powershell
gcloud secrets add-iam-policy-binding nomada-db-password --member="serviceAccount:nomada-runtime@sistemaairbnb.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project sistemaairbnb
```

En la nube no se configura DATABASE_URL ni se utiliza 127.0.0.1:5433. El socket
administrado es /cloudsql/sistemaairbnb:us-east4:sistemaairbnb-instance.
PGPASSWORD se entrega mediante el secreto y conserva los caracteres originales
de la contraseña, sin codificación de URL.

## 5 Desplegar inicialmente con acceso privado

Ejecutar en PowerShell desde la raíz SISTEMAAIRBNB, con los cambios revisados.
Este comando construye una imagen y crea un servicio que puede generar costos.
No es una simulación. Detenerse si el equipo aún no autorizó la publicación.

```powershell
gcloud run deploy nomada-web `
  --source . `
  --project sistemaairbnb `
  --region us-east4 `
  --execution-environment gen2 `
  --service-account nomada-runtime@sistemaairbnb.iam.gserviceaccount.com `
  --add-cloudsql-instances sistemaairbnb:us-east4:sistemaairbnb-instance `
  --set-env-vars "NODE_ENV=production,COOKIE_SECURE=true,PUBLIC_ORIGIN=https://configuracion-pendiente.invalid,PGHOST=/cloudsql/sistemaairbnb:us-east4:sistemaairbnb-instance,PGDATABASE=nomada,PGUSER=nomada_app,DB_POOL_MAX=5,CANCEL_BEFORE_ARRIVAL=false,SERVICE_FEE_BPS=0" `
  --set-secrets "PGPASSWORD=nomada-db-password:1" `
  --min-instances 0 `
  --max-instances 1 `
  --concurrency 20 `
  --cpu 1 `
  --memory 512Mi `
  --timeout 60 `
  --no-allow-unauthenticated
```

Si pregunta por crear el repositorio de imágenes necesario para el despliegue,
revisa y acepta únicamente si estás autorizado. Si aparece un error IAM,
identifica la identidad y el permiso faltante; no cambies permisos a ciegas.

El origen temporal .invalid impide escrituras desde navegador hasta configurar
la URL real. El servicio permanece privado durante esta preparación.

## 6 Configurar la dirección real y comprobar en privado

```powershell
$nomadaUrl = gcloud run services describe nomada-web --region us-east4 --project sistemaairbnb --format="value(status.url)"
gcloud run services update nomada-web --region us-east4 --project sistemaairbnb --update-env-vars "PUBLIC_ORIGIN=$nomadaUrl"
```

La URL debe empezar con https:// y terminar en run.app. No se compra un dominio.
Para probar el servicio privado, utiliza la autenticación de Cloud Run con una
cuenta que tenga permiso de invocación, o el proxy local de gcloud run services
proxy. Comprueba /api/salud antes de habilitar acceso público. No pegues tokens
de acceso en mensajes, archivos de Git ni capturas.

## 7 Publicar el enlace después de la revisión

Este paso permite que cualquier persona abra las páginas; la aplicación conserva
el inicio de sesión y permisos para sus operaciones protegidas. Requiere acuerdo
del equipo sobre abrir el registro al público, porque cualquiera podrá crear
una cuenta huésped o anfitrión con el comportamiento actual.

```powershell
gcloud run services add-iam-policy-binding nomada-web --region us-east4 --project sistemaairbnb --member="allUsers" --role="roles/run.invoker"
```

Si la organización impide allUsers, detente y revisa la alternativa autorizada
con su administrador. No desactives políticas de la organización para resolverlo.

Abre la URL real en un navegador y otro dispositivo. Prueba acceso, alojamiento,
reserva, confirmación, pago simulado y persistencia. No es necesario abrir el
proxy de tu computadora: Cloud Run conecta directamente con Cloud SQL.

El límite de intentos de acceso del backend es básico y se guarda en memoria;
debe revisarse junto con controles de abuso antes de un uso público sostenido.
Esta preparación no certifica seguridad, carga ni disponibilidad productiva.

## 8 Cambios posteriores

Las actualizaciones del código requieren un nuevo despliegue o configurar un
flujo de entrega continua autorizado. Subir un commit a GitHub, por sí solo,
no actualiza Cloud Run con esta configuración manual. Las migraciones futuras
se ejecutan de forma controlada con la cuenta propietaria, no al arrancar el
servicio, y primero deben probarse en un ambiente separado.

Las versiones de la imagen y del secreto deben revisarse en cada actualización.
Volver a una revisión anterior de Cloud Run no revierte los datos de PostgreSQL.

Fuentes oficiales:

- https://docs.cloud.google.com/run/docs/deploying-source-code
- https://docs.cloud.google.com/sql/docs/postgres/connect-run
- https://docs.cloud.google.com/run/docs/configuring/services/secrets
- https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/backups
