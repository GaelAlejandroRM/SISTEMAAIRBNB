'use strict';
function fail(message,status=400) { const e=new Error(message); e.status=status; throw e; }
function text(v,label,max=120,min=1) {
 if(typeof v!=='string'||v.trim().length<min||v.trim().length>max) fail(`${label}: longitud entre ${min} y ${max}.`);
 return v.trim();
}
function integer(v,label,min=1,max=100) {
 if(v===null||v===''||typeof v==='boolean'||!Number.isInteger(Number(v))||Number(v)<min||Number(v)>max) fail(`${label}: entero entre ${min} y ${max}.`);
 return Number(v);
}
function uuid(v) { if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) fail('Identificador inválido.'); return v; }
function today() {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=t=>parts.find(p=>p.type===t).value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
function date(v) {
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)) fail('Fecha inválida.');
 const d=new Date(`${v}T00:00:00Z`);
 if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v) fail('Fecha inválida.');
 return v;
}
function period(b) {
 const arrival=date(b.entrada),departure=date(b.salida);
 if(arrival<today()||departure<=arrival) fail('La entrada no puede ser pasada y la salida debe ser posterior.');
 const nights=(Date.parse(departure)-Date.parse(arrival))/86400000;
 if(nights>365) fail('Esta versión admite estancias de hasta 365 noches.');
 return {arrival,departure,nights};
}
function email(v) { const e=text(v,'Correo',254).toLowerCase(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('Correo inválido.'); return e; }
function images(v) {
 if(!Array.isArray(v)||v.length>5) fail('Máximo 5 fotografías.');
 return v.map(src=>{
  if(typeof src!=='string') fail('Imagen inválida.');
  const m=src.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!m) fail('Solo imágenes PNG o JPEG.');
  const b=Buffer.from(m[2],'base64');
  const valid=m[1]==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(!valid||b.length>500000) fail('Imagen inválida o mayor de 500 KB.');
  return src;
 });
}
function listing(b) {
 const price=Number(b.precio);
 if(!Number.isFinite(price)||price<=0||price>100000||Math.abs(price*100-Math.round(price*100))>.00001) fail('Precio positivo con hasta dos decimales, máximo 100000 MXN.');
 if(typeof b.publicado!=='boolean') fail('Estado de publicación inválido.');
 if(!Array.isArray(b.servicios)||b.servicios.length>30||b.servicios.some(s=>typeof s!=='string'||s.length>100)) fail('Servicios inválidos.');
 const categories=['all','beachfront','cabins','mansions','pools','tiny','views','luxe'];
 const category=b.categoria||'all'; if(!categories.includes(category)) fail('Categoría inválida.');
 return [text(b.titulo,'Título'),text(b.descripcion,'Descripción',5000),text(b.ubicacion,'Ubicación',300),category,Math.round(price*100),integer(b.capacidad,'Capacidad'),JSON.stringify(b.servicios),text(b.caracteristicas||'','Características',2000,0),JSON.stringify(images(b.fotos)),b.publicado];
}
module.exports={fail,text,integer,uuid,today,date,period,email,listing};
