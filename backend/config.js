'use strict';

// La misma aplicación utiliza URL local o el socket administrado de Cloud SQL.
function databaseConfig(env = process.env) {
  const max = Number(env.DB_POOL_MAX || 5);
  if (!Number.isInteger(max) || max < 1 || max > 20) {
    throw new Error('DB_POOL_MAX debe ser un entero entre 1 y 20.');
  }
  const common = { max, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 };
  if (env.DATABASE_URL) return { ...common, connectionString: env.DATABASE_URL };
  if (!env.PGHOST || !env.PGDATABASE || !env.PGUSER || !env.PGPASSWORD) {
    throw new Error('Configura DATABASE_URL local o PGHOST, PGDATABASE, PGUSER y PGPASSWORD en Cloud Run.');
  }
  return { ...common, host: env.PGHOST, port: 5432,
    database: env.PGDATABASE, user: env.PGUSER, password: env.PGPASSWORD };
}

function listenConfig(env = process.env) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido.');
  return { port, host: env.K_SERVICE ? '0.0.0.0' : (env.HOST || '127.0.0.1') };
}

module.exports = { databaseConfig, listenConfig };
