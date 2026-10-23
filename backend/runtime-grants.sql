-- Ejecutar como propietario de las tablas. La contraseña del rol se establece
-- mediante \password nomada_app en psql; no escribirla en este archivo.
-- Crear primero: CREATE ROLE nomada_app LOGIN;
GRANT CONNECT ON DATABASE nomada TO nomada_app;
GRANT USAGE ON SCHEMA public TO nomada_app;
GRANT SELECT, INSERT, UPDATE ON users, listings, reservations, payments,
 reviews, notifications TO nomada_app;
GRANT SELECT, INSERT, DELETE ON sessions TO nomada_app;
GRANT SELECT, INSERT, DELETE ON favorites TO nomada_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar TO nomada_app;
GRANT SELECT, INSERT ON audit TO nomada_app;
GRANT USAGE, SELECT ON SEQUENCE audit_id_seq TO nomada_app;
-- No se otorgan DELETE sobre usuarios, reservas o pagos, ni UPDATE/DELETE
-- sobre la bitácora. Las migraciones usan una cuenta distinta, propietaria.
