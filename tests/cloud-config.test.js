'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {databaseConfig,listenConfig}=require('../backend/config');

test('la configuración local conserva DATABASE_URL y no necesita variables de nube',()=>{
 const c=databaseConfig({DATABASE_URL:'postgresql://example@127.0.0.1:5433/nomada'});
 assert.equal(c.connectionString,'postgresql://example@127.0.0.1:5433/nomada');
 assert.equal(c.max,5);
 assert.equal(listenConfig({}).host,'127.0.0.1');
});
test('Cloud Run escucha en todas las interfaces y en el puerto asignado',()=>{
 assert.deepEqual(listenConfig({K_SERVICE:'nomada',PORT:'8080',HOST:'127.0.0.1'}),{host:'0.0.0.0',port:8080});
});
test('Cloud SQL utiliza el socket y mantiene los caracteres de la contraseña',()=>{
 const env={PGHOST:'/cloudsql/proyecto:region:instancia',PGDATABASE:'nomada',PGUSER:'nomada_app',PGPASSWORD:'ficticia@#/%:clave'};
 const c=databaseConfig(env);
 assert.equal(c.host,env.PGHOST);assert.equal(c.password,env.PGPASSWORD);
 assert.equal(c.database,'nomada');assert(!('connectionString' in c));
});
test('la configuración incompleta o los límites inválidos fallan antes de conectar',()=>{
 assert.throws(()=>databaseConfig({PGHOST:'/cloudsql/instance'}));
 assert.throws(()=>databaseConfig({DATABASE_URL:'postgresql://example',DB_POOL_MAX:'0'}));
 assert.throws(()=>listenConfig({PORT:'0'}));
 assert.throws(()=>listenConfig({PORT:'NaN'}));
});
