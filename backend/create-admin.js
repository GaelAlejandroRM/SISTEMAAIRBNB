'use strict';
// El administrador se crea mediante consola, nunca mediante registro público.
const {randomUUID}=require('node:crypto');
const {pool,transaction}=require('./db');
const {password}=require('./security');
const {text,email}=require('./validation');
(async()=>{
 try{
  const name=text(process.env.ADMIN_NAME,'ADMIN_NAME');
  const correo=email(process.env.ADMIN_EMAIL);
  const pw=await password(process.env.ADMIN_PASSWORD);
  await transaction(async c=>{
   const id=randomUUID();
   await c.query("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES($1,$2,$3,$4,$5,'administrador')",[id,name,correo,pw.password_hash,pw.salt]);
   await c.query("INSERT INTO audit(actor_id,action,target_id) VALUES($1,'admin.creado.consola',$1)",[id]);
  });console.log('Administrador creado.');
 }catch(e){console.error(e.code==='23505'?'Ese correo ya existe.':e.message);process.exitCode=1;}
 finally{await pool.end();}
})();
