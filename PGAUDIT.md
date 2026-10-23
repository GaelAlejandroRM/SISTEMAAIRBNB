# Configuración de pgAudit

pgAudit complementa la tabla audit de la aplicación. Registra operaciones SQL
mediante el sistema de logs de PostgreSQL; la tabla audit identifica las acciones
del usuario autenticado, sus objetivos y la fecha.

Esta entrega no instala binarios ni cambia el servicio PostgreSQL existente.
pgAudit no estaba disponible en la instancia aislada de prueba; su activación
y sus logs no se consideran verificados.

## Instalación y activación

1. Confirma la versión mayor de PostgreSQL con `SELECT version();`.
2. Instala la distribución de pgAudit compatible con esa versión y plataforma.
   Para PostgreSQL 18 corresponde la rama/versión 18 de pgAudit. No copies una DLL
   de otra versión mayor. En Windows verifica el proveedor del paquete y sus
   dependencias antes de instalar; no se incluye un binario en esta entrega.
3. Como administrador del servidor, edita la configuración de la instancia
   acordada y agrega pgaudit a shared_preload_libraries, conservando las otras
   bibliotecas existentes. Ejemplo si la lista está vacía:

```conf
shared_preload_libraries = 'pgaudit'
logging_collector = on
log_destination = 'csvlog'
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = '1d'
log_rotation_size = '100MB'
log_line_prefix = '%m [%p] user=%u db=%d app=%a '
log_statement = 'none'
log_parameter_max_length = 0
log_parameter_max_length_on_error = 0
```

4. Reinicia únicamente la instancia correspondiente, en una ventana de
   mantenimiento acordada. Recargar configuración no sustituye este reinicio.
5. Conecta como administrador a la base nomada y ejecuta backend/pgaudit.sql.
   Primero se crea la extensión y después se configura pgaudit.log.
6. Abre una conexión nueva como nomada_app y comprueba los SHOW/SELECT del archivo.
7. Realiza una escritura con datos ficticios y verifica una entrada AUDIT en el
   archivo de log. Conserva evidencia sin datos personales ni credenciales.

## Protección y alcance

Se propone auditar write, ddl y role; añadir read requiere revisar volumen,
privacidad y rendimiento. `pgaudit.log_parameter=off` y
`pgaudit.log_statement=off` evitan que los logs de auditoría incluyan valores de
parámetros o sentencias completas. No sustituyen la revisión del resto de logs,
consultas SQL manuales y herramientas que también puedan registrar información.

Con el pool de conexiones, pgAudit identifica al rol técnico nomada_app. Para
identificar a la persona que aceptó una reserva consulta la bitácora audit;
no se debe atribuir automáticamente ese nombre a un usuario SQL independiente.

Los logs deben tener acceso restringido y respaldo/retención acordados.
Rotar archivos no implementa por sí mismo su eliminación al vencer un plazo.
La cuenta de aplicación no recibe permisos de superusuario ni permisos para
alterar su configuración de auditoría.

Fuente oficial: https://github.com/pgaudit/pgaudit
