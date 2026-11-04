'use strict';
const {pool}=require('./db');
const {startWorker}=require('./recovery');
if(!process.env.SMTP_USER||!process.env.SMTP_PASSWORD)throw new Error('Configura SMTP antes de iniciar el trabajador de correo.');
const stop=startWorker(pool);
// Mantener vivo este proceso dedicado aunque no existan trabajos pendientes.
const keepAlive=setInterval(()=>{},60000);
process.once('SIGTERM',async()=>{stop();clearInterval(keepAlive);await pool.end();});
