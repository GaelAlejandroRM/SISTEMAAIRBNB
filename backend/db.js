'use strict';
const { Pool, types } = require('pg');
const { databaseConfig } = require('./config');
types.setTypeParser(1082, value => value); // Días civiles sin conversión de zona horaria.
const pool = new Pool(databaseConfig());
pool.on('error', e => console.error('Error de conexión PostgreSQL:', e.code));
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}
module.exports = { pool, transaction };
