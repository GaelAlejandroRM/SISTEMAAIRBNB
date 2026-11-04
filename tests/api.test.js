'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
if(!process.env.TEST_DATABASE_URL||!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test'))throw new Error('Define TEST_DATABASE_URL apuntando a una base cuyo nombre termine en _test. No se usan bases reales.');
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
process.env.PUBLIC_ORIGIN='http://127.0.0.1:3000';
process.env.NODE_ENV='test';
process.env.COOKIE_SECURE='false';
process.env.CANCEL_BEFORE_ARRIVAL='false';
const {server,pool}=require('../backend/server');
const V=require('../backend/validation');
const {password}=require('../backend/security');
let base,host,guest,other,admin,listingId,reservationId;
const stamp=crypto.randomUUID();
async function call(path,method='GET',body,cookie){
 const res=await fetch(base+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),Origin:process.env.PUBLIC_ORIGIN,...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
async function account(role,label){
 const email=`${label}-${stamp}@example.test`,pw='PruebaNomadaSegura2026';
 assert.equal((await call('/api/registro','POST',{nombre:label,email,password:pw,rol:role})).status,201);
 const login=await call('/api/login','POST',{email,password:pw});assert.equal(login.status,200);assert.match(login.cookie,/nomada=/);
 return {cookie:login.cookie,user:login.body,email};
}
const listing=()=>({titulo:'Casa de prueba',descripcion:'Descripción de prueba',ubicacion:'Toluca',precio:'1500.25',capacidad:4,servicios:['Wi-Fi'],caracteristicas:'Jardín',fotos:[],publicado:true});
const addDays=n=>new Date(Date.parse(V.today())+n*86400000).toISOString().slice(0,10);
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(resolve=>server.close(resolve));await pool.end();});
test('salud y validación de periodos',async()=>{
 assert.equal((await call('/api/salud')).status,200);
 assert.throws(()=>V.period({entrada:'2026-02-30',salida:'2026-03-02'}));
 assert.throws(()=>V.period({entrada:addDays(2),salida:addDays(2)}));
 assert.throws(()=>V.listing({...listing(),precio:'NaN'}));
});
test('registro público no permite administradores, autenticación y roles',async()=>{
 assert.equal((await call('/api/registro','POST',{nombre:'Mal',email:`mal-${stamp}@example.test`,password:'PruebaNomadaSegura2026',rol:'administrador'})).status,400);
 host=await account('anfitrion','host');guest=await account('huesped','guest');other=await account('anfitrion','other');
 assert.equal((await call('/api/anfitrion/panel')).status,401);
 assert.equal((await call('/api/anfitrion/panel','GET',undefined,guest.cookie)).status,403);
 assert.equal((await call('/api/admin/usuarios','GET',undefined,host.cookie)).status,403);
 const stored=(await pool.query('SELECT password_hash,salt FROM users WHERE id=$1',[host.user.id])).rows[0];
 assert.notEqual(stored.password_hash,'PruebaNomadaSegura2026');assert.equal(stored.password_hash.length,128);
 const bad=await call('/api/login','POST',{email:host.email,password:'incorrecta'});assert.equal(bad.status,401);
});
test('alojamiento persistente, permisos y publicación',async()=>{
 const created=await call('/api/alojamientos','POST',listing(),host.cookie);assert.equal(created.status,201);listingId=created.body.id;
 assert.equal((await call(`/api/alojamientos/${listingId}`,'PUT',listing(),other.cookie)).status,404);
 assert.equal((await call('/api/alojamientos','POST',listing(),guest.cookie)).status,403);
 const panel=await call('/api/anfitrion/panel','GET',undefined,host.cookie);assert.equal(panel.body.alojamientos[0].id,listingId);
 assert.equal((await call('/api/alojamientos?q=Toluca')).body.some(a=>a.id===listingId),true);
 assert.equal((await call(`/api/alojamientos/${listingId}`,'PUT',{...listing(),publicado:false},host.cookie)).status,200);
 assert.equal((await call(`/api/alojamientos/${listingId}`)).status,404);
 await call(`/api/alojamientos/${listingId}`,'PUT',listing(),host.cookie);
 const image=await call('/api/alojamientos','POST',{...listing(),fotos:['data:image/jpeg;base64,aG9sYQ==']},host.cookie);assert.equal(image.status,400);
});
test('reserva, importe exacto, idempotencia y visibilidad entre roles',async()=>{
 const body={alojamientoId:listingId,entrada:addDays(5),salida:addDays(8),personas:2,claveOperacion:crypto.randomUUID(),totalCentavos:1};
 const r=await call('/api/reservas','POST',body,guest.cookie);assert.equal(r.status,201);reservationId=r.body.id;
 assert.equal(r.body.totalCentavos,450075);
 const retry=await call('/api/reservas','POST',body,guest.cookie);assert.equal(retry.body.id,reservationId);
 assert.equal((await call('/api/reservas','POST',{...body,personas:3},guest.cookie)).status,409);
 assert.equal((await call('/api/reservas','POST',{...body,claveOperacion:crypto.randomUUID()},guest.cookie)).status,409);
 const hostPanel=await call('/api/anfitrion/panel','GET',undefined,host.cookie);assert(hostPanel.body.reservas.some(r=>r.id===reservationId));
 const otherPanel=await call('/api/anfitrion/panel','GET',undefined,other.cookie);assert.equal(otherPanel.body.reservas.length,0);
 const unavailable=await call(`/api/alojamientos?entrada=${body.entrada}&salida=${body.salida}`);assert.equal(unavailable.body.some(a=>a.id===listingId),false);
});
test('perfil y favoritos se guardan por cuenta en PostgreSQL',async()=>{
 assert.equal((await call('/api/perfil','PUT',{nombre:'Huésped actualizado',telefono:'5512345678',ciudad:'Toluca'},guest.cookie)).status,200);
 const profile=await call('/api/yo','GET',undefined,guest.cookie);assert.equal(profile.body.ciudad,'Toluca');
 assert.equal((await call(`/api/favoritos/${listingId}`,'PUT',undefined,guest.cookie)).status,200);
 const panel=await call('/api/huesped/panel','GET',undefined,guest.cookie);assert(panel.body.favoritos.includes(listingId));assert(panel.body.reservas.every(r=>r.huesped==='Huésped actualizado'));
 assert.equal((await call('/api/huesped/panel','GET',undefined,host.cookie)).status,403);
 assert.equal((await call(`/api/favoritos/${listingId}`,'DELETE',undefined,guest.cookie)).status,200);
});
test('bloqueos y reservas comparten protección contra solapamiento',async()=>{
 assert.equal((await call('/api/bloqueos','POST',{alojamientoId:listingId,entrada:addDays(6),salida:addDays(7)},host.cookie)).status,409);
 const block=await call('/api/bloqueos','POST',{alojamientoId:listingId,entrada:addDays(12),salida:addDays(15)},host.cookie);assert.equal(block.status,201);
 assert.equal((await call('/api/reservas','POST',{alojamientoId:listingId,entrada:addDays(13),salida:addDays(14),personas:1,claveOperacion:crypto.randomUUID()},guest.cookie)).status,409);
 assert.equal((await call(`/api/bloqueos/${block.body.id}`,'DELETE',undefined,other.cookie)).status,404);
 assert.equal((await call(`/api/bloqueos/${block.body.id}`,'DELETE',undefined,host.cookie)).status,200);
});
test('solicitudes simultáneas dejan exactamente una reserva',async()=>{
 const payload={alojamientoId:listingId,entrada:addDays(20),salida:addDays(23),personas:2};
 const results=await Promise.all([1,2].map(()=>call('/api/reservas','POST',{...payload,claveOperacion:crypto.randomUUID()},guest.cookie)));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
 const duplicate=await pool.query('SELECT count(*)::int n FROM reservations WHERE listing_id=$1 AND arrival=$2',[listingId,payload.entrada]);assert.equal(duplicate.rows[0].n,1);
});
test('confirmación, pago simulado idempotente y comprobante privado',async()=>{
 assert.equal((await call(`/api/reservas/${reservationId}/estado`,'PATCH',{estado:'confirmada'},other.cookie)).status,404);
 assert.equal((await call(`/api/reservas/${reservationId}/pago`,'POST',{resultado:'aprobado'},guest.cookie)).status,409);
 assert.equal((await call(`/api/reservas/${reservationId}/estado`,'PATCH',{estado:'confirmada'},host.cookie)).status,200);
 const pay=await call(`/api/reservas/${reservationId}/pago`,'POST',{resultado:'aprobado'},guest.cookie);assert.equal(pay.status,200);assert.equal(pay.body.simulated,true);assert.equal(pay.body.amount_cents,450075);
 const repeat=await call(`/api/reservas/${reservationId}/pago`,'POST',{resultado:'rechazado'},guest.cookie);assert.equal(repeat.body.id,pay.body.id);assert.equal(repeat.body.status,'aprobado');
 assert.equal((await call(`/api/reservas/${reservationId}/comprobante`,'GET',undefined,other.cookie)).status,404);
 assert.equal((await call(`/api/reservas/${reservationId}/comprobante`,'GET',undefined,host.cookie)).status,200);
 assert.equal((await call(`/api/reservas/${reservationId}/estado`,'PATCH',{estado:'cancelada'},guest.cookie)).status,409);
 assert.equal((await call(`/api/reservas/${reservationId}/estado`,'PATCH',{estado:'finalizada'},host.cookie)).status,409);
});
test('cancelar pendiente libera disponibilidad y registra notificación',async()=>{
 const b={alojamientoId:listingId,entrada:addDays(30),salida:addDays(32),personas:1,claveOperacion:crypto.randomUUID()};
 const r=await call('/api/reservas','POST',b,guest.cookie);
 assert.equal((await call(`/api/reservas/${r.body.id}/estado`,'PATCH',{estado:'cancelada'},guest.cookie)).status,200);
 assert.equal((await call('/api/reservas','POST',{...b,claveOperacion:crypto.randomUUID()},guest.cookie)).status,201);
 const n=await call('/api/notificaciones','GET',undefined,guest.cookie);assert(n.body.some(n=>n.texto.includes('cancelada')));
});
test('reseñas solo después de estancia finalizada y una por reserva',async()=>{
 assert.equal((await call('/api/resenas','POST',{reservaId:reservationId,puntuacion:5,comentario:'Bien'},guest.cookie)).status,409);
 const pastId=crypto.randomUUID();
 // Fixture de prueba explícito: una estancia pasada. No se permite retroceder fechas vía API.
 await pool.query(`INSERT INTO reservations(id,listing_id,guest_id,arrival,departure,guests,nightly_cents,total_cents,status,operation_key) VALUES($1,$2,$3,$4,$5,1,150025,300050,'confirmada',$6)`,[pastId,listingId,guest.user.id,addDays(-10),addDays(-8),crypto.randomUUID()]);
 assert.equal((await call(`/api/reservas/${pastId}/estado`,'PATCH',{estado:'finalizada'},host.cookie)).status,200);
 assert.equal((await call('/api/resenas','POST',{reservaId:pastId,puntuacion:5,comentario:'Excelente prueba'},guest.cookie)).status,201);
 assert.equal((await call('/api/resenas','POST',{reservaId:pastId,puntuacion:5,comentario:'Duplicada'},guest.cookie)).status,409);
 assert.equal((await call(`/api/alojamientos/${listingId}`)).body.opiniones.length,1);
});
test('administración preparada, moderación, bitácora y revocación de sesiones',async()=>{
 const pw=await password('AdministradorSeguro2026'),adminId=crypto.randomUUID(),adminEmail=`admin-${stamp}@example.test`;
 await pool.query("INSERT INTO users(id,name,email,password_hash,salt,role) VALUES($1,'Admin',$2,$3,$4,'administrador')",[adminId,adminEmail,pw.password_hash,pw.salt]);
 admin=(await call('/api/login','POST',{email:adminEmail,password:'AdministradorSeguro2026'})).cookie;
 for(const route of ['usuarios','alojamientos','reservas','pagos','resenas','auditoria','resumen'])assert.equal((await call('/api/admin/'+route,'GET',undefined,admin)).status,200);
 const users=(await call('/api/admin/usuarios','GET',undefined,admin)).body;assert.equal(users.some(u=>'password_hash'in u),false);
 const filtered=await call(`/api/admin/usuarios?q=${encodeURIComponent(guest.email)}&rol=huesped&estado=true&limit=1`,'GET',undefined,admin);assert.equal(filtered.status,200);assert.equal(filtered.body.length,1);assert.equal(filtered.body[0].id,guest.user.id);
 assert.equal((await call(`/api/admin/usuarios?q=${encodeURIComponent(guest.email)}&rol=anfitrion`,'GET',undefined,admin)).body.length,0);
 const byListing=await call(`/api/admin/reservas?q=${listingId}&estado=confirmada`,'GET',undefined,admin);assert.equal(byListing.status,200);
 const summary=await call('/api/admin/resumen','GET',undefined,admin);assert('solicitudes_pendientes' in summary.body);assert('resenas_ocultas' in summary.body);
 assert.equal((await call(`/api/admin/usuarios/${adminId}`,'PATCH',{activo:false},admin)).status,409);
 assert.equal((await call(`/api/admin/alojamientos/${listingId}`,'PATCH',{moderado:true},admin)).status,200);
 assert.equal((await call(`/api/alojamientos/${listingId}`)).status,404);
 await call(`/api/admin/alojamientos/${listingId}`,'PATCH',{moderado:false},admin);
 const review=(await call('/api/admin/resenas?q=Excelente%20prueba','GET',undefined,admin)).body.find(r=>r.titulo==='Casa de prueba');assert(review);
 assert.equal((await call(`/api/admin/resenas/${review.id}`,'PATCH',{visible:false},admin)).status,200);
 const hidden=(await call(`/api/admin/resenas?q=${review.id}&estado=false`,'GET',undefined,admin)).body;assert.equal(hidden[0].visible,false);
 assert.equal((await call(`/api/admin/resenas/${review.id}`,'PATCH',{visible:true},admin)).status,200);
 assert.equal((await call(`/api/admin/usuarios/${other.user.id}`,'PATCH',{activo:false},admin)).status,200);
 assert.equal((await call('/api/yo','GET',undefined,other.cookie)).status,401);
});
test('cotización consulta disponibilidad y el comprobante distingue pago pendiente de aprobado',async()=>{
 const occupied=await call(`/api/alojamientos/${listingId}/disponibilidad?entrada=${addDays(5)}&salida=${addDays(8)}&personas=2`);
 assert.equal(occupied.status,200);assert.equal(occupied.body.disponible,false);assert.equal(occupied.body.totalCentavos,450075);
 const free=await call(`/api/alojamientos/${listingId}/disponibilidad?entrada=${addDays(70)}&salida=${addDays(72)}&personas=2`);assert.equal(free.body.disponible,true);
 const r=await call('/api/reservas','POST',{alojamientoId:listingId,entrada:addDays(70),salida:addDays(72),personas:2,claveOperacion:crypto.randomUUID()},guest.cookie);
 let receipt=await call(`/api/reservas/${r.body.id}/comprobante`,'GET',undefined,guest.cookie);assert.equal(typeof receipt.body.huesped,'string');assert(receipt.body.huesped.length>0);assert.equal(receipt.body.pago,'pendiente');assert.equal(receipt.body.importePagadoCentavos,0);
 await call(`/api/reservas/${r.body.id}/estado`,'PATCH',{estado:'confirmada'},host.cookie);
 assert.equal((await call(`/api/reservas/${r.body.id}/estado`,'PATCH',{estado:'cancelada'},guest.cookie)).status,409);
 await call(`/api/reservas/${r.body.id}/pago`,'POST',{resultado:'rechazado'},guest.cookie);
 receipt=await call(`/api/reservas/${r.body.id}/comprobante`,'GET',undefined,guest.cookie);assert.equal(receipt.body.pago,'rechazado');assert.equal(receipt.body.importePagadoCentavos,0);
 await call(`/api/reservas/${r.body.id}/pago`,'POST',{resultado:'aprobado'},guest.cookie);
 receipt=await call(`/api/reservas/${r.body.id}/comprobante`,'GET',undefined,guest.cookie);assert.equal(receipt.body.importePagadoCentavos,300050);
});

test('catálogo pagina más de cien registros y filtra servicios antes del límite',async()=>{
 const location='Catalogo-'+stamp;
 for(let i=0;i<105;i++)await pool.query("INSERT INTO listings(id,owner_id,title,description,location,price_cents,capacity,published,services) VALUES($1,$2,$3,'Prueba',$4,10000,2,true,$5)",[crypto.randomUUID(),host.user.id,'Catalogo '+i,location,JSON.stringify(i===0?['Servicio exclusivo']:['Wi-Fi'])]);
 const p1=await call('/api/alojamientos?'+new URLSearchParams({q:location,limit:20,offset:0}));
 const p2=await call('/api/alojamientos?'+new URLSearchParams({q:location,limit:20,offset:100}));
 assert.equal(p1.body.length,20);assert.equal(p2.body.length,5);assert(!p1.body.some(a=>p2.body.some(b=>a.id===b.id)));
 const service=await call('/api/alojamientos?'+new URLSearchParams({q:location,limit:20,servicio:'Servicio exclusivo'}));assert.equal(service.body.length,1);
});

test('perfil de anfitrión y administrador registra bitácora y preserva rol y correo',async()=>{
 for(const cookie of [host.cookie,admin]){
  const previous=(await call('/api/yo','GET',undefined,cookie)).body;
  const updated=await call('/api/perfil','PUT',{nombre:'Perfil QA',telefono:'5512345678',ciudad:'Toluca',rol:'huesped',email:'otra@example.test'},cookie);
  assert.equal(updated.status,200);assert.equal(updated.body.rol,previous.rol);assert.equal(updated.body.email,previous.email);
  const entry=await pool.query("SELECT id FROM audit WHERE actor_id=$1 AND action='perfil.actualizado'",[previous.id]);assert(entry.rowCount);
 }
});

test('recuperación persistente reintenta SMTP, respeta enfriamiento y consume un solo enlace concurrente',async()=>{
 const R=require('../backend/recovery'),mailer=require('nodemailer'),{transaction}=require('../backend/db');
 const original=mailer.createTransport;process.env.SMTP_USER='qa@example.test';process.env.SMTP_PASSWORD='test-secret-only';
 let emailMessage,failDelivery=true;
 mailer.createTransport=()=>({sendMail:async value=>{if(failDelivery)throw new Error('SMTP simulado');emailMessage=value;}});
 try{
  const response=await call('/api/recuperacion','POST',{email:guest.email});assert.equal(response.status,200);
  const job=(await pool.query('SELECT * FROM recovery_mail_jobs WHERE user_id=$1 ORDER BY created_at DESC',[guest.user.id])).rows[0];assert(job);assert(!job.payload.includes(guest.email));
  const same=await call('/api/recuperacion','POST',{email:guest.email});assert.deepEqual(same.body,response.body);
  assert.equal((await pool.query('SELECT id FROM recovery_mail_jobs WHERE user_id=$1',[guest.user.id])).rowCount,1);
  const absent=await call('/api/recuperacion','POST',{email:`ausente-${stamp}@example.test`});assert.deepEqual(absent.body,response.body);
  await R.deliver(pool);let failed=(await pool.query('SELECT * FROM recovery_mail_jobs WHERE id=$1',[job.id])).rows[0];assert.equal(failed.completed_at,null);assert.equal(failed.attempts,1);
  await pool.query('UPDATE recovery_mail_jobs SET next_attempt_at=now() WHERE id=$1',[job.id]);failDelivery=false;await R.deliver(pool);assert(emailMessage);
  const token=emailMessage.text.match(/#([a-f0-9]{64})/)[1];
  const results=await Promise.allSettled([1,2].map(()=>R.reset(transaction,token,'NuevaPruebaSegura2026','NuevaPruebaSegura2026')));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await call('/api/yo','GET',undefined,guest.cookie)).status,401);
  const done=(await pool.query('SELECT * FROM recovery_mail_jobs WHERE id=$1',[job.id])).rows[0];assert.equal(done.result,'enviado');assert.equal(done.payload,'');
 }finally{mailer.createTransport=original;delete process.env.SMTP_USER;delete process.env.SMTP_PASSWORD;}
});

test('origen externo rechazado y logout invalida sesión',async()=>{
 const external=await fetch(base+'/api/logout',{method:'POST',headers:{Origin:'https://otro.example',Cookie:host.cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(external.status,403);
 assert.equal((await call('/api/logout','POST',{},host.cookie)).status,200);
 assert.equal((await call('/api/yo','GET',undefined,host.cookie)).status,401);
 const event=await pool.query("SELECT id FROM audit WHERE actor_id=$1 AND action='sesion.cierre'",[host.user.id]);assert(event.rowCount);
});
