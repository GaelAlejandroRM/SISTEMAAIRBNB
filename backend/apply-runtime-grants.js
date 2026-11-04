'use strict';
// Ejecutar con la cuenta propietaria, después de migrar. No modifica credenciales.
const fs=require('node:fs');
const path=require('node:path');
const {pool,transaction}=require('./db');
(async()=>{try{
 const role=process.env.DB_APP_ROLE||'nomada_app';
 if(!/^[a-z_][a-z0-9_]{0,62}$/.test(role))throw new Error('DB_APP_ROLE inválido.');
 const db=(await pool.query('SELECT current_database() db')).rows[0].db;
 const sql=fs.readFileSync(path.join(__dirname,'runtime-grants.sql'),'utf8')
  .replace('GRANT CONNECT ON DATABASE nomada',`GRANT CONNECT ON DATABASE "${db.replaceAll('"','""')}"`)
  .replaceAll('TO nomada_app',`TO "${role}"`);
 await transaction(c=>c.query(sql));console.log('Permisos de ejecución actualizados.');
}catch(e){console.error('No se pudieron aplicar permisos:',e.code||e.message);process.exitCode=1;}finally{await pool.end();}})();
