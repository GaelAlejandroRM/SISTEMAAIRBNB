'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pool,transaction}=require('./db');
const V=require('./validation');
const S=require('./security');
const {fail}=V;
const uuid=()=>crypto.randomUUID();
const origin=process.env.PUBLIC_ORIGIN||'http://127.0.0.1:3000';
const feeBps=V.integer(process.env.SERVICE_FEE_BPS||0,'SERVICE_FEE_BPS',0,5000);
if(process.env.NODE_ENV==='production'&&(process.env.COOKIE_SECURE!=='true'||!origin.startsWith('https://'))) throw new Error('Producción requiere HTTPS y COOKIE_SECURE=true.');
const root=path.resolve(__dirname,'../frontend');
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
async function body(req) {
 if(!req.headers['content-type']?.startsWith('application/json')) fail('Se requiere JSON.',415);
 const chunks=[];let bytes=0;
 for await(const chunk of req){bytes+=chunk.length;if(bytes>4000000)fail('Solicitud demasiado grande.',413);chunks.push(chunk);}
 try {const b=JSON.parse(Buffer.concat(chunks).toString()||'{}');if(!b||Array.isArray(b)||typeof b!=='object')fail('JSON inválido.');return b;}
 catch(e){if(e.status)throw e;fail('JSON inválido.');}
}
const first=async(c,sql,p=[]) => (await c.query(sql,p)).rows[0];
async function audit(c,user,action,target,details={}) {await c.query('INSERT INTO audit(actor_id,action,target_id,details) VALUES($1,$2,$3,$4)',[user,action,target,JSON.stringify(details)]);}
async function notify(c,user,message) {await c.query('INSERT INTO notifications(id,user_id,message) VALUES($1,$2,$3)',[uuid(),user,message]);}
async function owner(c,id,user,lock=false) {
 const a=await first(c,`SELECT * FROM listings WHERE id=$1 AND owner_id=$2 ${lock?'FOR UPDATE':''}`,[V.uuid(id),user]);
 if(!a)fail('Alojamiento no encontrado.',404);return a;
}
function mapListing(a) {
 return {id:a.id,titulo:a.title,descripcion:a.description,ubicacion:a.location,categoria:a.category,
  precioCentavos:a.price_cents,capacidad:a.capacity,servicios:a.services,caracteristicas:a.features,
  fotos:a.images,publicado:a.published,moderado:a.moderated,calificacion:Number(a.rating||0),resenas:Number(a.review_count||0)};
}
function mapReservation(r) {return {id:r.id,alojamientoId:r.listing_id,titulo:r.title,huesped:r.guest_name,notas:r.notes||'',tarifaCentavos:r.fee_cents||0,
 entrada:r.arrival,salida:r.departure,personas:r.guests,totalCentavos:r.total_cents,estado:r.status,pago:r.payment_status||'pendiente',creada:r.created_at};}
const attempts=new Map();
function limit(req) {
 const now=Date.now();for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);
 const key=req.socket.remoteAddress;const v=attempts.get(key)||{n:0,until:now+600000};
 attempts.set(key,v);if(++v.n>60)fail('Demasiados intentos. Espera 10 minutos.',429);
}
async function route(req,res,url) {
 const p=url.pathname,m=req.method;
 if(!['GET','HEAD'].includes(m)&&req.headers.origin!==origin)fail('Origen no autorizado. Abre la página desde PUBLIC_ORIGIN.',403);
 if(p==='/api/salud'&&m==='GET'){await pool.query('SELECT 1');return send(res,200,{estado:'ok',baseDeDatos:'PostgreSQL'});}
 if(p==='/api/config'&&m==='GET')return send(res,200,{serviceFeeBps:feeBps,cancelBeforeArrival:process.env.CANCEL_BEFORE_ARRIVAL==='true'});
 if(p==='/api/registro'&&m==='POST') {
  limit(req);const b=await body(req);const name=V.text(b.nombre,'Nombre'),email=V.email(b.email);
  if(!['huesped','anfitrion'].includes(b.rol))fail('Solo puedes registrar cuentas de huésped o anfitrión.');
  const pw=await S.password(b.password);
  const result=await transaction(async c=>{
   const u=await first(c,'INSERT INTO users(id,name,email,password_hash,salt,role) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[uuid(),name,email,pw.password_hash,pw.salt,b.rol]);
   await audit(c,u.id,'usuario.registro',u.id);return S.publicUser(u);
  });return send(res,201,result);
 }
 if(p==='/api/login'&&m==='POST') {
  limit(req);const b=await body(req);const email=V.email(b.email);
  const u=await first(pool,'SELECT * FROM users WHERE email=$1',[email]);
  if(!await S.verify(b.password,u)||!u.active)fail('Credenciales incorrectas o cuenta desactivada.',401);
  const token=crypto.randomBytes(32).toString('hex');
  await transaction(async c=>{
   await c.query('DELETE FROM sessions WHERE expires_at<=now()');
   const old=S.cookieToken(req);if(old)await c.query('DELETE FROM sessions WHERE token_hash=$1',[S.hash(old)]);
   await c.query("INSERT INTO sessions VALUES($1,$2,now()+interval '8 hours')",[S.hash(token),u.id]);
   await audit(c,u.id,'sesion.inicio',u.id);
  });res.setHeader('Set-Cookie',S.sessionCookie(token));return send(res,200,S.publicUser(u));
 }
 if(p==='/api/logout'&&m==='POST') {
  const token=S.cookieToken(req);if(token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[S.hash(token)]);
  res.setHeader('Set-Cookie',S.sessionCookie('',true));return send(res,200,{mensaje:'Sesión cerrada.'});
 }
 // Catálogo público: no expone correos, contraseñas ni reservaciones de terceros.
 if(p==='/api/alojamientos'&&m==='GET') {
  const q=V.text(url.searchParams.get('q')||'','Ubicación',300,0);
  const category=url.searchParams.get('categoria')||'';
  const guests=V.integer(url.searchParams.get('personas')||1,'Huéspedes');
  let dates=null;if(url.searchParams.has('entrada')||url.searchParams.has('salida'))dates=V.period(Object.fromEntries(url.searchParams));
  const max=V.integer(url.searchParams.get('precioMax')||100000,'Precio máximo',1,100000);
  const offset=V.integer(url.searchParams.get('offset')||0,'Página',0,1000000);
  const rows=(await pool.query(`SELECT a.*,
   (SELECT avg(re.score) FROM reviews re JOIN reservations r ON r.id=re.reservation_id WHERE r.listing_id=a.id AND re.visible) rating,
   (SELECT count(*) FROM reviews re JOIN reservations r ON r.id=re.reservation_id WHERE r.listing_id=a.id AND re.visible) review_count
   FROM listings a JOIN users u ON u.id=a.owner_id
   WHERE a.published AND NOT a.moderated AND u.active AND a.capacity >= $1
   AND (a.location ILIKE $2 OR a.title ILIKE $2) AND ($3='' OR a.category=$3)
   AND a.price_cents <= $4
   AND ($5::date IS NULL OR NOT EXISTS(SELECT 1 FROM calendar c WHERE c.listing_id=a.id AND daterange(c.arrival,c.departure,'[)') && daterange($5::date,$6::date,'[)')))
   ORDER BY a.created_at DESC,a.id LIMIT 100 OFFSET $7`,[guests,`%${q}%`,category,max*100,dates?.arrival||null,dates?.departure||null,offset])).rows;
  return send(res,200,rows.map(mapListing));
 }
 let hit=p.match(/^\/api\/alojamientos\/([^/]+)$/);
 if(hit&&m==='GET') {
  const a=await first(pool,`SELECT a.* FROM listings a JOIN users u ON u.id=a.owner_id WHERE a.id=$1 AND a.published AND NOT a.moderated AND u.active`,[V.uuid(hit[1])]);
  if(!a)fail('Alojamiento no encontrado.',404);
  const reviews=(await pool.query(`SELECT re.score puntuacion,re.comment comentario,u.name huesped,re.created_at fecha FROM reviews re JOIN reservations r ON r.id=re.reservation_id JOIN users u ON u.id=r.guest_id WHERE r.listing_id=$1 AND re.visible ORDER BY re.created_at DESC LIMIT 100`,[a.id])).rows;
  return send(res,200,{...mapListing(a),opiniones:reviews});
 }
 const u=await S.auth(req,pool);
 if(p==='/api/yo'&&m==='GET')return send(res,200,S.publicUser(u));
 if(p==='/api/perfil'&&m==='PUT') {
  const b=await body(req);const r=await first(pool,'UPDATE users SET name=$1,phone=$2,city=$3 WHERE id=$4 RETURNING *',[V.text(b.nombre,'Nombre'),V.text(b.telefono||'','Teléfono',30,0),V.text(b.ciudad||'','Ciudad',200,0),u.id]);
  return send(res,200,S.publicUser(r));
 }
 if(p==='/api/notificaciones'&&m==='GET')return send(res,200,(await pool.query('SELECT id,message texto,created_at fecha,read leida FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[u.id])).rows);
 if(p==='/api/notificaciones'&&m==='PATCH'){await pool.query('UPDATE notifications SET read=true WHERE user_id=$1',[u.id]);return send(res,200,{mensaje:'Notificaciones leídas.'});}
 if(p==='/api/reservas'&&m==='GET') {
  const scope=u.role==='anfitrion'?'a.owner_id=$1':'r.guest_id=$1';
  const rows=(await pool.query(`SELECT r.*,a.title,g.name guest_name,p.status payment_status FROM reservations r JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id LEFT JOIN payments p ON p.reservation_id=r.id WHERE ${scope} ORDER BY r.created_at DESC LIMIT 500`,[u.id])).rows;
  return send(res,200,rows.map(mapReservation));
 }
 if(p==='/api/reservas'&&m==='POST') {
  if(u.role!=='huesped')fail('Solo el huésped puede solicitar una reserva.',403);
  const b=await body(req),period=V.period(b),listingId=V.uuid(b.alojamientoId),key=V.text(b.claveOperacion,'Clave de operación',100),guests=V.integer(b.personas,'Huéspedes'),notes=V.text(b.notas||'','Notas',2000,0);
  const result=await transaction(async c=>{
   // Serializa reintentos de una operación incluso si cambian de alojamiento.
   await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${u.id}:${key}`]);
   const previous=await first(c,'SELECT * FROM reservations WHERE guest_id=$1 AND operation_key=$2',[u.id,key]);
   if(previous){
    if(previous.listing_id!==listingId||previous.arrival!==period.arrival||previous.departure!==period.departure||previous.guests!==guests||previous.notes!==notes)fail('La clave de operación ya tiene otros datos.',409);
    return mapReservation(previous);
   }
   const a=await first(c,'SELECT * FROM listings WHERE id=$1 FOR UPDATE',[listingId]);
   const host=a&&await first(c,'SELECT active FROM users WHERE id=$1',[a.owner_id]);
   if(!a||!a.published||a.moderated||!host.active)fail('Alojamiento no disponible.',409);
   if(a.owner_id===u.id||guests>a.capacity)fail('Capacidad o solicitante inválidos.');
   const subtotal=a.price_cents*period.nights,fee=Math.round(subtotal*feeBps/10000),total=subtotal+fee;
   if(total>2147483647)fail('El importe supera el máximo por operación de esta versión.');
   const r=await first(c,`INSERT INTO reservations(id,listing_id,guest_id,arrival,departure,guests,nightly_cents,total_cents,operation_key,notes,fee_cents) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,[uuid(),a.id,u.id,period.arrival,period.departure,guests,a.price_cents,total,key,notes,fee]);
   await notify(c,a.owner_id,`Nueva solicitud para ${a.title}.`);await notify(c,u.id,`Solicitud registrada para ${a.title}.`);await audit(c,u.id,'reserva.creada',r.id);
   return mapReservation(r);
  });return send(res,201,result);
 }
 hit=p.match(/^\/api\/reservas\/([^/]+)\/estado$/);
 if(hit&&m==='PATCH') {
  const b=await body(req),reservationId=V.uuid(hit[1]);
  await transaction(async c=>{
   const r=await first(c,'SELECT r.*,a.owner_id,a.title FROM reservations r JOIN listings a ON a.id=r.listing_id WHERE r.id=$1 FOR UPDATE OF r',[reservationId]);
   if(!r||![r.owner_id,r.guest_id].includes(u.id))fail('Reserva no encontrada.',404);
   let valid=false;
   if(u.id===r.owner_id&&r.status==='pendiente')valid=['confirmada','rechazada'].includes(b.estado)&&r.arrival>=V.today();
   if(u.id===r.guest_id&&r.status==='pendiente'&&b.estado==='cancelada')valid=true;
   if(u.id===r.owner_id&&r.status==='confirmada'&&b.estado==='finalizada'&&r.departure<=V.today())valid=true;
   if(r.status==='confirmada'&&b.estado==='cancelada'&&process.env.CANCEL_BEFORE_ARRIVAL==='true'&&r.arrival>V.today())valid=true;
   if(!valid)fail('Cambio no permitido. Revisa el estado o la política de cancelación.',409);
   await c.query('UPDATE reservations SET status=$1 WHERE id=$2',[b.estado,r.id]);
   await notify(c,r.owner_id,`Reserva de ${r.title}: ${b.estado}.`);await notify(c,r.guest_id,`Tu reserva de ${r.title}: ${b.estado}.`);await audit(c,u.id,'reserva.estado',r.id,{estado:b.estado});
  });return send(res,200,{mensaje:'Estado actualizado.'});
 }
 hit=p.match(/^\/api\/reservas\/([^/]+)\/pago$/);
 if(hit&&m==='POST') {
  const b=await body(req);if(!['aprobado','rechazado'].includes(b.resultado))fail('Resultado simulado inválido.');
  const result=await transaction(async c=>{
   const r=await first(c,'SELECT * FROM reservations WHERE id=$1 AND guest_id=$2 FOR UPDATE',[V.uuid(hit[1]),u.id]);
   if(!r)fail('Reserva no encontrada.',404);
   if(r.status!=='confirmada')fail('El anfitrión debe confirmar antes de simular el pago.',409);
   const previous=await first(c,'SELECT * FROM payments WHERE reservation_id=$1',[r.id]);
   if(previous?.status==='aprobado')return previous;
   const payment=await first(c,`INSERT INTO payments(id,reservation_id,amount_cents,status) VALUES($1,$2,$3,$4) ON CONFLICT(reservation_id) DO UPDATE SET status=EXCLUDED.status,created_at=now() RETURNING *`,[uuid(),r.id,r.total_cents,b.resultado]);
   const a=await first(c,'SELECT owner_id FROM listings WHERE id=$1',[r.listing_id]);
   await notify(c,u.id,`Pago simulado ${b.resultado}.`);await notify(c,a.owner_id,`Pago simulado ${b.resultado} para una reserva.`);await audit(c,u.id,'pago.simulado',r.id,{resultado:b.resultado});return payment;
  });return send(res,200,result);
 }
 hit=p.match(/^\/api\/reservas\/([^/]+)\/comprobante$/);
 if(hit&&m==='GET') {
  const r=await first(pool,`SELECT r.*,a.title,p.id payment_id,p.status payment_status,p.simulated FROM reservations r JOIN listings a ON a.id=r.listing_id LEFT JOIN payments p ON p.reservation_id=r.id WHERE r.id=$1 AND (r.guest_id=$2 OR a.owner_id=$2)`,[V.uuid(hit[1]),u.id]);
  if(!r)fail('Reserva no encontrada.',404);return send(res,200,{...mapReservation(r),moneda:'MXN',simulado:true,pagoId:r.payment_id});
 }
 if(p==='/api/resenas'&&m==='POST') {
  const b=await body(req);if(u.role!=='huesped')fail('Solo el huésped puede reseñar.',403);
  await transaction(async c=>{
   const r=await first(c,'SELECT * FROM reservations WHERE id=$1 AND guest_id=$2 FOR UPDATE',[V.uuid(b.reservaId),u.id]);
   if(!r||r.status!=='finalizada'||r.departure>V.today())fail('La reseña requiere una estancia finalizada.',409);
   const reviewId=uuid();await c.query('INSERT INTO reviews(id,reservation_id,score,comment) VALUES($1,$2,$3,$4)',[reviewId,r.id,V.integer(b.puntuacion,'Calificación',1,5),V.text(b.comentario,'Comentario',2000)]);await audit(c,u.id,'resena.creada',reviewId);
  });return send(res,201,{mensaje:'Reseña publicada.'});
 }
 if(p==='/api/huesped/panel'&&m==='GET') {
  if(u.role!=='huesped')fail('Acceso de huésped requerido.',403);
  const listings=(await pool.query(`SELECT DISTINCT a.*,host.active host_active FROM listings a JOIN users host ON host.id=a.owner_id WHERE (a.published AND NOT a.moderated AND host.active) OR EXISTS(SELECT 1 FROM reservations r WHERE r.listing_id=a.id AND r.guest_id=$1) OR EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id=a.id AND f.user_id=$1) ORDER BY a.created_at DESC LIMIT 500`,[u.id])).rows.map(a=>({...mapListing(a),publicado:a.published&&!a.moderated&&a.host_active}));
  const rows=(await pool.query(`SELECT r.*,a.title,g.name guest_name,p.status payment_status FROM reservations r JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id LEFT JOIN payments p ON p.reservation_id=r.id WHERE r.guest_id=$1 ORDER BY r.created_at DESC`,[u.id])).rows.map(mapReservation);
  const reviews=(await pool.query(`SELECT re.id,re.reservation_id "reservaId",r.listing_id "alojamientoId",g.name huesped,re.score puntuacion,re.comment comentario,re.created_at::date fecha,(r.guest_id=$1) propia FROM reviews re JOIN reservations r ON r.id=re.reservation_id JOIN users g ON g.id=r.guest_id JOIN listings a ON a.id=r.listing_id WHERE re.visible AND (r.guest_id=$1 OR (a.published AND NOT a.moderated)) ORDER BY re.created_at DESC LIMIT 1000`,[u.id])).rows;
  const favs=(await pool.query('SELECT listing_id FROM favorites WHERE user_id=$1',[u.id])).rows.map(r=>r.listing_id);
  const notifications=(await pool.query('SELECT id,message texto,created_at fecha,read leida FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[u.id])).rows;
  return send(res,200,{alojamientos:listings,reservas:rows,resenas:reviews,bloqueos:[],notificaciones:notifications,favoritos:favs,perfil:S.publicUser(u),serviceFeeBps:feeBps});
 }
 hit=p.match(/^\/api\/favoritos\/([^/]+)$/);
 if(hit&&['PUT','DELETE'].includes(m)) {
  if(u.role!=='huesped')fail('Acceso de huésped requerido.',403);
  const listingId=V.uuid(hit[1]);
  if(m==='PUT'){
   const a=await first(pool,'SELECT a.id FROM listings a JOIN users u ON u.id=a.owner_id WHERE a.id=$1 AND a.published AND NOT a.moderated AND u.active',[listingId]);if(!a)fail('Alojamiento no disponible.',404);
   await pool.query('INSERT INTO favorites(user_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,listingId]);
  }else await pool.query('DELETE FROM favorites WHERE user_id=$1 AND listing_id=$2',[u.id,listingId]);
  return send(res,200,{mensaje:'Favoritos actualizados.'});
 }
 // API de anfitrión. Los identificadores recibidos siempre se validan contra el propietario.
 if(p==='/api/anfitrion/panel'&&m==='GET') {
  if(u.role!=='anfitrion')fail('Acceso de anfitrión requerido.',403);
  const listings=(await pool.query('SELECT * FROM listings WHERE owner_id=$1 ORDER BY created_at DESC',[u.id])).rows.map(mapListing);
  const reservations=(await pool.query(`SELECT r.*,a.title,g.name guest_name,p.status payment_status FROM reservations r JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id LEFT JOIN payments p ON p.reservation_id=r.id WHERE a.owner_id=$1 ORDER BY r.created_at DESC`,[u.id])).rows.map(mapReservation);
  const blocks=(await pool.query(`SELECT c.id,c.listing_id "alojamientoId",c.arrival entrada,c.departure salida FROM calendar c JOIN listings a ON a.id=c.listing_id WHERE a.owner_id=$1 AND c.kind='bloqueo'`,[u.id])).rows;
  const reviews=(await pool.query(`SELECT re.id,r.listing_id "alojamientoId",g.name huesped,re.score puntuacion,re.comment comentario,re.created_at fecha FROM reviews re JOIN reservations r ON r.id=re.reservation_id JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id WHERE a.owner_id=$1 AND re.visible ORDER BY re.created_at DESC`,[u.id])).rows;
  const notifications=(await pool.query('SELECT id,message texto,created_at fecha,read leida FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[u.id])).rows;
  return send(res,200,{alojamientos:listings,reservas:reservations,bloqueos:blocks,resenas:reviews,notificaciones:notifications,hoy:V.today(),cancelacionPrevia:process.env.CANCEL_BEFORE_ARRIVAL==='true'});
 }
 if(p==='/api/alojamientos'&&m==='POST') {
  if(u.role!=='anfitrion')fail('Acceso de anfitrión requerido.',403);
  const values=V.listing(await body(req));const listingId=uuid();
  await transaction(async c=>{
   await c.query(`INSERT INTO listings(id,owner_id,title,description,location,category,price_cents,capacity,services,features,images,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[listingId,u.id,...values]);await audit(c,u.id,'alojamiento.creado',listingId);
  });return send(res,201,{id:listingId});
 }
 hit=p.match(/^\/api\/alojamientos\/([^/]+)$/);
 if(hit&&m==='PUT') {
  if(u.role!=='anfitrion')fail('Acceso de anfitrión requerido.',403);
  const values=V.listing(await body(req));const listingId=V.uuid(hit[1]);
  await transaction(async c=>{
   await owner(c,listingId,u.id,true);
   await c.query(`UPDATE listings SET title=$1,description=$2,location=$3,category=$4,price_cents=$5,capacity=$6,services=$7,features=$8,images=$9,published=$10 WHERE id=$11`,[...values,listingId]);await audit(c,u.id,'alojamiento.actualizado',listingId);
  });return send(res,200,{mensaje:'Alojamiento guardado.'});
 }
 if(p==='/api/bloqueos'&&m==='POST') {
  if(u.role!=='anfitrion')fail('Acceso de anfitrión requerido.',403);
  const b=await body(req),period=V.period(b);const blockId=uuid();
  await transaction(async c=>{await owner(c,b.alojamientoId,u.id,true);await c.query("INSERT INTO calendar(id,listing_id,arrival,departure,kind) VALUES($1,$2,$3,$4,'bloqueo')",[blockId,b.alojamientoId,period.arrival,period.departure]);await audit(c,u.id,'calendario.bloqueado',blockId);});return send(res,201,{id:blockId});
 }
 hit=p.match(/^\/api\/bloqueos\/([^/]+)$/);
 if(hit&&m==='DELETE') {
  if(u.role!=='anfitrion')fail('Acceso de anfitrión requerido.',403);
  await transaction(async c=>{
   const row=await first(c,`DELETE FROM calendar c USING listings a WHERE c.id=$1 AND c.listing_id=a.id AND a.owner_id=$2 AND c.kind='bloqueo' RETURNING c.id`,[V.uuid(hit[1]),u.id]);
   if(!row)fail('Bloqueo no encontrado.',404);await audit(c,u.id,'calendario.liberado',row.id);
  });return send(res,200,{mensaje:'Periodo liberado.'});
 }
 if(p.startsWith('/api/admin/'))return admin(req,res,url,u);
 fail('Ruta no encontrada.',404);
}
async function admin(req,res,url,u) {
 if(u.role!=='administrador')fail('Acceso de administrador requerido.',403);
 const p=url.pathname,m=req.method;
 const limit=V.integer(url.searchParams.get('limit')||100,'Límite',1,500);
 const offset=V.integer(url.searchParams.get('offset')||0,'Desplazamiento',0,1000000);
 const queries={
  '/api/admin/usuarios':'SELECT id,name nombre,email,role rol,active activo,created_at FROM users ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',
  '/api/admin/alojamientos':'SELECT id,owner_id,title titulo,published publicado,moderated moderado FROM listings ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',
  '/api/admin/reservas':'SELECT * FROM reservations ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',
  '/api/admin/pagos':'SELECT * FROM payments ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',
  '/api/admin/resenas':'SELECT * FROM reviews ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',
  '/api/admin/auditoria':'SELECT * FROM audit ORDER BY id DESC LIMIT $1 OFFSET $2'
 };
 if(m==='GET'&&queries[p])return send(res,200,(await pool.query(queries[p],[limit,offset])).rows);
 if(m==='GET'&&p==='/api/admin/resumen')return send(res,200,await first(pool,`SELECT (SELECT count(*) FROM users) usuarios,(SELECT count(*) FROM listings) alojamientos,(SELECT count(*) FROM reservations) reservaciones,(SELECT coalesce(sum(amount_cents),0) FROM payments WHERE status='aprobado') pagos_simulados_centavos`));
 let hit=p.match(/^\/api\/admin\/usuarios\/([^/]+)$/);
 if(hit&&m==='PATCH') {
  const b=await body(req),target=V.uuid(hit[1]);
  if(typeof b.activo!=='boolean')fail('Envía activo como booleano.');
  if(b.rol&&!['huesped','anfitrion','administrador'].includes(b.rol))fail('Rol inválido.');
  await transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(7193422)');
   const previous=await first(c,'SELECT * FROM users WHERE id=$1 FOR UPDATE',[target]);if(!previous)fail('Usuario no encontrado.',404);
   const role=b.rol||previous.role;
   if(target===u.id&&(!b.activo||role!=='administrador'))fail('No puedes quitar tu propio acceso de administrador.',409);
   if(previous.role!==role&&await first(c,'SELECT id FROM listings WHERE owner_id=$1 LIMIT 1',[target]))fail('No cambies el rol de una cuenta que posee alojamientos.',409);
   if(previous.role==='administrador'&&previous.active&&(!b.activo||role!=='administrador')){
    const count=await first(c,"SELECT count(*)::int n FROM users WHERE role='administrador' AND active");if(count.n<=1)fail('Debe permanecer un administrador activo.',409);
   }
   await c.query('UPDATE users SET active=$1,role=$2 WHERE id=$3',[b.activo,role,target]);await c.query('DELETE FROM sessions WHERE user_id=$1',[target]);await audit(c,u.id,'admin.usuario',target,{activo:b.activo,rol:role});
  });return send(res,200,{mensaje:'Cuenta actualizada y sesiones revocadas.'});
 }
 hit=p.match(/^\/api\/admin\/alojamientos\/([^/]+)$/);
 if(hit&&m==='PATCH') {
  const b=await body(req);if(typeof b.moderado!=='boolean')fail('Envía moderado como booleano.');
  await transaction(async c=>{const a=await first(c,'UPDATE listings SET moderated=$1 WHERE id=$2 RETURNING id,owner_id',[b.moderado,V.uuid(hit[1])]);if(!a)fail('Alojamiento no encontrado.',404);await notify(c,a.owner_id,`Moderación de alojamiento: ${b.moderado?'oculto':'visible'}.`);await audit(c,u.id,'admin.alojamiento',a.id,{moderado:b.moderado});});return send(res,200,{mensaje:'Moderación actualizada.'});
 }
 hit=p.match(/^\/api\/admin\/resenas\/([^/]+)$/);
 if(hit&&m==='PATCH') {
  const b=await body(req);if(typeof b.visible!=='boolean')fail('Envía visible como booleano.');
  await transaction(async c=>{const r=await first(c,'UPDATE reviews SET visible=$1 WHERE id=$2 RETURNING id',[b.visible,V.uuid(hit[1])]);if(!r)fail('Reseña no encontrada.',404);await audit(c,u.id,'admin.resena',r.id,{visible:b.visible});});return send(res,200,{mensaje:'Moderación actualizada.'});
 }
 fail('Ruta administrativa no encontrada.',404);
}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 try {
  const url=new URL(req.url,origin);
  if(url.pathname.startsWith('/api/'))return await route(req,res,url);
  if(req.method!=='GET')fail('Método no permitido.',405);
  let file=['/','/index.html'].includes(url.pathname)?'huesped.html':decodeURIComponent(url.pathname).slice(1);
  if(file.split('/').some(s=>s.startsWith('.'))||! /\.(html|css|js|png|jpg|jpeg|svg|webp|ico)$/.test(file))fail('Archivo no encontrado.',404);
  file=path.resolve(root,file);if(!file.startsWith(root+path.sep))fail('Archivo no encontrado.',404);
  const stat=await fs.promises.stat(file).catch(()=>null);if(!stat?.isFile())fail('Archivo no encontrado.',404);
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]});fs.createReadStream(file).pipe(res);
 }catch(e){
  const pgErrors={'23P01':[409,'El periodo se superpone con una reserva o bloqueo.'],'23505':[409,'El registro ya existe o la operación ya fue registrada.'],'22P02':[400,'Identificador o dato inválido.'],'23514':[400,'Los datos no cumplen las restricciones.'],'23503':[409,'El registro relacionado no existe.']};
  const mapped=pgErrors[e.code];const status=mapped?.[0]||e.status||500;
  if(status===500)console.error('Error interno:',e.code||e.name);
  if(!res.headersSent)send(res,status,{error:mapped?.[1]||(e.status?e.message:'No se pudo completar la operación.')});else res.end();
 }
});
if(require.main===module)server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`nomada disponible en ${origin}`));
module.exports={server,pool};
