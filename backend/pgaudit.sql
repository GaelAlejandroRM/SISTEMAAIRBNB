-- Ejecutar como administrador de PostgreSQL DESPUÉS de instalar la extensión
-- compatible con la versión mayor y cargarla en shared_preload_libraries.
-- No cambiar la configuración de una instancia compartida sin coordinarlo.
CREATE EXTENSION IF NOT EXISTS pgaudit;
-- Sustituir nomada_app si se usa otro nombre para la cuenta de ejecución.
ALTER ROLE nomada_app SET pgaudit.log = 'write, ddl, role';
ALTER ROLE nomada_app SET pgaudit.log_parameter = off;
ALTER ROLE nomada_app SET pgaudit.log_statement = off;
ALTER ROLE nomada_app SET pgaudit.log_relation = on;
-- Abrir una conexión NUEVA como nomada_app para verificar:
-- SHOW pgaudit.log;
-- SHOW pgaudit.log_parameter;
-- SELECT extversion FROM pg_extension WHERE extname='pgaudit';
-- Ejecutar una escritura con un dato ficticio y comprobar AUDIT en el log.
