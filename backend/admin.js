'use strict';
// Operaciones administrativas: autorización y consultas separadas del servidor HTTP.
module.exports=({pool,transaction,V,first,audit,notify,body,send})=>{
const {fail}=V;
async function admin(req,res,url,u) {
 if(u.role!=='administrador')fail('Acceso de administrador requerido.',403);
 const p=url.pathname,m=req.method;
 const limit=V.integer(url.searchParams.get('limit')||100,'Límite',1,500);
 const offset=V.integer(url.searchParams.get('offset')||0,'Desplazamiento',0,1000000);
 const search='%'+V.text(url.searchParams.get('q')||'','Búsqueda',200,0)+'%';
 const filter=V.text(url.searchParams.get('estado')||'','Estado',30,0);
 const role=V.text(url.searchParams.get('rol')||'','Rol',30,0);
 const queries={
  '/api/admin/usuarios':`SELECT id,name nombre,email,role rol,active activo,created_at FROM users WHERE concat_ws(' ',name,email,id::text) ILIKE $3 AND ($4='' OR active::text=$4) AND ($5='' OR role=$5) ORDER BY created_at DESC,id LIMIT $1 OFFSET $2`,
  '/api/admin/alojamientos':`SELECT a.id,a.owner_id,a.title titulo,a.location ubicacion,a.price_cents,a.published publicado,a.moderated moderado,u.name propietario FROM listings a JOIN users u ON u.id=a.owner_id WHERE concat_ws(' ',a.title,a.location,u.name,a.id::text) ILIKE $3 AND ($4='' OR a.moderated::text=$4) AND $5::text='' ORDER BY a.created_at DESC,a.id LIMIT $1 OFFSET $2`,
  '/api/admin/reservas':`SELECT r.*,a.title titulo,g.name huesped,h.name anfitrion FROM reservations r JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id JOIN users h ON h.id=a.owner_id WHERE concat_ws(' ',r.id::text,a.title,g.name,h.name) ILIKE $3 AND ($4='' OR r.status=$4) AND $5::text='' ORDER BY r.created_at DESC,r.id LIMIT $1 OFFSET $2`,
  '/api/admin/pagos':`SELECT p.*,a.title titulo,g.name huesped FROM payments p JOIN reservations r ON r.id=p.reservation_id JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id WHERE concat_ws(' ',p.id::text,p.reservation_id::text,a.title,g.name) ILIKE $3 AND ($4='' OR p.status=$4) AND $5::text='' ORDER BY p.created_at DESC,p.id LIMIT $1 OFFSET $2`,
  '/api/admin/resenas':`SELECT re.*,a.title titulo,g.name huesped FROM reviews re JOIN reservations r ON r.id=re.reservation_id JOIN listings a ON a.id=r.listing_id JOIN users g ON g.id=r.guest_id WHERE concat_ws(' ',re.id::text,re.comment,a.title,g.name) ILIKE $3 AND ($4='' OR re.visible::text=$4) AND $5::text='' ORDER BY re.created_at DESC,re.id LIMIT $1 OFFSET $2`,
  '/api/admin/auditoria':`SELECT a.*,u.name responsable FROM audit a LEFT JOIN users u ON u.id=a.actor_id WHERE concat_ws(' ',a.action,a.target_id::text,a.actor_id::text,u.name) ILIKE $3 AND ($4='' OR a.action=$4) AND $5::text='' ORDER BY a.id DESC LIMIT $1 OFFSET $2`
 };
 if(m==='GET'&&queries[p])return send(res,200,(await pool.query(queries[p],[limit,offset,search,filter,role])).rows);
 if(m==='GET'&&p==='/api/admin/resumen')return send(res,200,await first(pool,`SELECT (SELECT count(*) FROM users) usuarios,(SELECT count(*) FROM users WHERE NOT active) usuarios_inactivos,(SELECT count(*) FROM listings) alojamientos,(SELECT count(*) FROM listings WHERE moderated) alojamientos_moderados,(SELECT count(*) FROM reservations) reservaciones,(SELECT count(*) FROM reservations WHERE status='pendiente') solicitudes_pendientes,(SELECT count(*) FROM reviews WHERE NOT visible) resenas_ocultas,(SELECT coalesce(sum(amount_cents),0) FROM payments WHERE status='aprobado') pagos_simulados_centavos`));
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
return admin;
};
