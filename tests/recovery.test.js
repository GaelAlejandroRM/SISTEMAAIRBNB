'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const nodemailer=require('nodemailer');
const recovery=require('../backend/recovery');
const S=require('../backend/security');
test('recuperación encola mensaje cifrado sin esperar SMTP y conserva respuesta genérica',async()=>{
 const old=nodemailer.createTransport,oldUser=process.env.SMTP_USER,oldPass=process.env.SMTP_PASSWORD;
 process.env.SMTP_USER='sender@example.com';process.env.SMTP_PASSWORD='test-only';
 let mail,tokenHash,job;
 nodemailer.createTransport=()=>({sendMail:async value=>{mail=value;}});
 try{
  const tx=async fn=>fn({query:async(sql,p)=>{
   if(sql.includes('INSERT INTO password_resets')){tokenHash=p[1];return {rowCount:1,rows:[{user_id:'test-user'}]};}
   job={id:p[0],user_id:p[1],token_hash:p[2],payload:p[3],attempts:1,expires_at:new Date(Date.now()+1200000)};return {rowCount:1};
  }});
  const result=await recovery.request(tx,'guest@example.com','https://nomada.example');
  assert.equal(mail,undefined);assert(!job.payload.includes('guest@example.com'));assert(!job.payload.includes('recuperar.html'));
  await recovery.deliver({query:async sql=>sql.startsWith('WITH candidate')?{rows:[job]}:sql.includes('SELECT r.user_id')?{rowCount:1}:{rowCount:1}});
  const token=mail.text.match(/#([a-f0-9]{64})/)[1];
  assert.equal(mail.to,'guest@example.com');assert.equal(tokenHash,S.hash(token));assert(!JSON.stringify(result).includes(token));
  const absent=await recovery.request(async fn=>fn({query:async()=>({rowCount:0})}),'missing@example.com','https://nomada.example');assert.deepEqual(absent,result);
 }finally{nodemailer.createTransport=old;if(oldUser===undefined)delete process.env.SMTP_USER;else process.env.SMTP_USER=oldUser;if(oldPass===undefined)delete process.env.SMTP_PASSWORD;else process.env.SMTP_PASSWORD=oldPass;}
});
test('rechaza enlaces inválidos y contraseñas distintas antes de modificar datos',async()=>{
 const tx=async()=>assert.fail('No debe iniciar transacción');
 await assert.rejects(recovery.reset(tx,'bad','password123456','password123456'),/enlace/);
 await assert.rejects(recovery.reset(tx,'a'.repeat(64),'password123456','different12345'),/coinciden/);
});
test('cambio elimina sesiones y token y no registra la nueva contraseña',async()=>{
 const calls=[];
 await recovery.reset(async fn=>fn({query:async(sql,p)=>{calls.push({sql,p});return {rowCount:1,rows:[{user_id:'test-user'}]};}}),'a'.repeat(64),'new-password-123','new-password-123');
 assert(calls.some(c=>c.sql.startsWith('DELETE FROM sessions')));
 assert(calls.some(c=>c.sql.startsWith('DELETE FROM password_resets')));
 assert(!JSON.stringify(calls).includes('new-password-123'));
});
test('rechaza token vencido o ya utilizado',async()=>{
 await assert.rejects(recovery.reset(async fn=>fn({query:async()=>({rowCount:0,rows:[]})}),'a'.repeat(64),'new-password-123','new-password-123'),/enlace/);
});
