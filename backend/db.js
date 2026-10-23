'use strict';
const { Pool, types } = require('pg');
types.setTypeParser(1082, value => value); // Días civiles sin conversión de zona horaria.
if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en .env.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
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
