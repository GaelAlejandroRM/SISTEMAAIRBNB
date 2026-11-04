'use strict';
const crypto=require('node:crypto');
const nodemailer=require('nodemailer');
const S=require('./security');
const {fail}=require('./validation');
const message='Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer tu contraseña.';
function mailer(){
 if(!process.env.SMTP_USER||!process.env.SMTP_PASSWORD)fail('La recuperación por correo aún no está configurada. Contacta al administrador.',503);
 const port=Number(process.env.SMTP_PORT||465);
 return nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.gmail.com',port,secure:port===465,requireTLS:port!==465,
  auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},disableFileAccess:true,disableUrlAccess:true,
  connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
}
function encryptionKey(){return crypto.createHash('sha256').update('nomada-recovery-v1\0'+process.env.SMTP_PASSWORD).digest();}
function encrypt(value){
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');
}
function decrypt(value){
 const data=Buffer.from(value,'base64'),decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),data.subarray(0,12));
 decipher.setAuthTag(data.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8'));
}
async function request(transaction,email,origin){
 mailer(); // Validar configuración antes de aceptar cualquier dirección.
 const token=crypto.randomBytes(32).toString('hex'),tokenHash=S.hash(token);
 await transaction(async c=>{
  const result=await c.query(`INSERT INTO password_resets(user_id,token_hash,expires_at)
   SELECT id,$2,now()+interval '20 minutes' FROM users WHERE email=$1 AND active
   ON CONFLICT(user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,requested_at=now()
   WHERE password_resets.requested_at<now()-interval '2 minutes' RETURNING user_id`,[email,tokenHash]);
  if(result.rowCount)await c.query(`INSERT INTO recovery_mail_jobs(id,user_id,token_hash,payload,expires_at) VALUES($1,$2,$3,$4,now()+interval '20 minutes')`,
   [crypto.randomUUID(),result.rows[0].user_id,tokenHash,encrypt({to:email,url:`${origin}/recuperar.html#${token}`})]);
 });
 // La solicitud no espera al SMTP: cuenta existente e inexistente tienen el mismo resultado público.
 return {mensaje:message};
}
async function deliver(pool){
 if(!process.env.SMTP_USER||!process.env.SMTP_PASSWORD)return false;
 const job=(await pool.query(`WITH candidate AS (
  SELECT id FROM recovery_mail_jobs WHERE completed_at IS NULL AND next_attempt_at<=now()
  AND (leased_until IS NULL OR leased_until<now()) ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
  UPDATE recovery_mail_jobs j SET leased_until=now()+interval '2 minutes',attempts=attempts+1 FROM candidate c WHERE j.id=c.id RETURNING j.*`)).rows[0];
 if(!job)return false;
 const valid=await pool.query(`SELECT r.user_id FROM password_resets r JOIN users u ON u.id=r.user_id WHERE r.user_id=$1 AND r.token_hash=$2 AND r.expires_at>now() AND u.active`,[job.user_id,job.token_hash]);
 if(!valid.rowCount||new Date(job.expires_at)<=new Date()){
  await pool.query("UPDATE recovery_mail_jobs SET completed_at=now(),result='vencido',payload='' WHERE id=$1",[job.id]);return true;
 }
 try{
  const data=decrypt(job.payload);
  await mailer().sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:data.to,subject:'Restablece tu contraseña de Nómada',
   text:`Recibimos una solicitud para restablecer tu contraseña. Abre este enlace, válido por 20 minutos desde la solicitud y para un solo uso:\n\n${data.url}\n\nSi no solicitaste este cambio, ignora el mensaje. Nómada nunca te pedirá tu contraseña por correo.`});
  await pool.query("UPDATE recovery_mail_jobs SET completed_at=now(),result='enviado',payload='' WHERE id=$1",[job.id]);
 }catch(e){
  if(job.attempts>=5)await pool.query("UPDATE recovery_mail_jobs SET completed_at=now(),result='fallido',payload='' WHERE id=$1",[job.id]);
  else await pool.query("UPDATE recovery_mail_jobs SET leased_until=NULL,next_attempt_at=now()+($2*interval '1 second') WHERE id=$1",[job.id,Math.min(300,30*2**(job.attempts-1))]);
  console.error('Correo de recuperación pendiente o fallido; revisa SMTP y el estado de la cola.');
 }
 return true;
}
function startWorker(pool){
 let busy=false,stopped=false;
 const tick=async()=>{if(busy||stopped)return;busy=true;try{
  for(let i=0;i<5&&!stopped;i++)if(!await deliver(pool))break;
  if(process.env.SMTP_USER&&process.env.SMTP_PASSWORD){
   await pool.query("DELETE FROM recovery_mail_jobs WHERE created_at<now()-interval '7 days'");
   await pool.query('DELETE FROM password_resets WHERE expires_at<now()');
  }
 }catch(e){console.error('No se pudo procesar la cola de recuperación:',e.code||'error');}finally{busy=false;}};
 const timer=setInterval(tick,5000);timer.unref();tick();
 return ()=>{stopped=true;clearInterval(timer);};
}
async function reset(transaction,token,password,confirmation){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail('El enlace no es válido o ya venció.',400);
 if(password!==confirmation)fail('Las contraseñas no coinciden.');
 const pw=await S.password(password);
 await transaction(async c=>{
  const result=await c.query(`SELECT r.user_id FROM password_resets r JOIN users u ON u.id=r.user_id
   WHERE r.token_hash=$1 AND r.expires_at>now() AND u.active FOR UPDATE OF r,u`,[S.hash(token)]);
  if(!result.rowCount)fail('El enlace no es válido o ya venció.',400);
  const id=result.rows[0].user_id;
  await c.query('UPDATE users SET password_hash=$1,salt=$2 WHERE id=$3',[pw.password_hash,pw.salt,id]);
  await c.query('DELETE FROM sessions WHERE user_id=$1',[id]);
  await c.query('DELETE FROM password_resets WHERE user_id=$1',[id]);
  await c.query("INSERT INTO audit(actor_id,action,target_id) VALUES($1,'cuenta.recuperada',$1)",[id]);
 });
 return {mensaje:'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'};
}
module.exports={request,reset,deliver,startWorker};
