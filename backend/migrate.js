'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {pool,transaction} = require('./db');
(async () => {
 try {
  await transaction(async c => {
   await c.query('SELECT pg_advisory_xact_lock(7193421)');
   await c.query('CREATE TABLE IF NOT EXISTS migrations(version integer PRIMARY KEY, applied_at timestamptz DEFAULT now())');
   const applied = await c.query('SELECT version FROM migrations WHERE version=1');
   if (!applied.rowCount) {
    await c.query(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
    await c.query('INSERT INTO migrations(version) VALUES(1)');
   }
   const second=await c.query('SELECT version FROM migrations WHERE version=2');
   if(!second.rowCount){
    await c.query(fs.readFileSync(path.join(__dirname,'schema-2.sql'),'utf8'));
    await c.query('INSERT INTO migrations(version) VALUES(2)');
   }
   const third=await c.query('SELECT version FROM migrations WHERE version=3');
   if(!third.rowCount){
    await c.query(fs.readFileSync(path.join(__dirname,'schema-3.sql'),'utf8'));
    await c.query('INSERT INTO migrations(version) VALUES(3)');
   }
   const fourth=await c.query('SELECT version FROM migrations WHERE version=4');
   if(!fourth.rowCount){
    await c.query(fs.readFileSync(path.join(__dirname,'schema-4.sql'),'utf8'));
    await c.query('INSERT INTO migrations(version) VALUES(4)');
   }
  });
  console.log('Migraciones 1, 2, 3 y 4 aplicadas o previamente registradas.');
 } catch(e) { console.error(e.message); process.exitCode=1; }
 finally { await pool.end(); }
})();
