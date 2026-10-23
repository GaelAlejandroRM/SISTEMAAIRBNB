'use strict';
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const {fail,text}=require('./validation');
const derive=promisify(crypto.scrypt);
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
async function password(value,salt=crypto.randomBytes(16).toString('hex')) {
 if(typeof value!=='string'||value.length<12||value.length>128) fail('Contraseña entre 12 y 128 caracteres.');
 return {salt,password_hash:(await derive(value,salt,64)).toString('hex')};
}
async function verify(value,user) {
 if(typeof value!=='string'||value.length>128) return false;
 const candidate=await derive(value,user?.salt||'0'.repeat(32),64);
 return crypto.timingSafeEqual(candidate,Buffer.from(user?.password_hash||'00'.repeat(64),'hex'))&&Boolean(user);
}
const publicUser=u=>({id:u.id,nombre:u.name,email:u.email,telefono:u.phone,ciudad:u.city||'',miembroDesde:String(new Date(u.created_at).getFullYear()),rol:u.role,activo:u.active});
const cookieToken=req=>req.headers.cookie?.match(/(?:^|;\s*)nomada=([a-f0-9]{64})/)?.[1];
async function auth(req,pool,role) {
 const token=cookieToken(req); if(!token) fail('Inicia sesión para continuar.',401);
 const {rows}=await pool.query(`SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
  WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`,[hash(token)]);
 if(!rows[0]) fail('La sesión no es válida o la cuenta está desactivada.',401);
 if(role&&!role.includes(rows[0].role)) fail('No tienes permiso para esta operación.',403);
 return rows[0];
}
function sessionCookie(token,clear=false) {
 return `nomada=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}`+
  (process.env.COOKIE_SECURE==='true'?'; Secure':'');
}
module.exports={hash,password,verify,publicUser,cookieToken,auth,sessionCookie};
