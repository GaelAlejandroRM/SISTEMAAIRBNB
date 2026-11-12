'use strict';

const $=selector=>document.querySelector(selector);
const PAGE_SIZE=50;
const state={user:null,view:'resumen',page:0,q:'',filter:'',role:'',rows:[],hasNext:false,sequence:0,busy:false,confirm:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0)/100);
const date=v=>v?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'Sin fecha';
const uuid=v=>`<small class="uuid">${esc(v)}</small>`;
const badge=v=>`<span class="estado ${esc(v)}">${esc(v)}</span>`;
const names={resumen:'Resumen',usuarios:'Usuarios',alojamientos:'Alojamientos',reservas:'Reservaciones',pagos:'Pagos simulados',resenas:'Reseñas',auditoria:'Bitácora'};
const descriptions={resumen:'Supervisa la actividad general de nomada.',usuarios:'Administra cuentas, roles y acceso a la plataforma.',alojamientos:'Revisa las publicaciones y administra su visibilidad.',reservas:'Consulta el historial y los estados de las reservaciones.',pagos:'Consulta operaciones simuladas, sin transacciones bancarias reales.',resenas:'Revisa las opiniones y modera su visibilidad.',auditoria:'Consulta las acciones registradas por la aplicación.'};
const filterOptions={usuarios:[['true','Activas'],['false','Inactivas']],alojamientos:[['false','Sin moderación'],['true','Ocultos por moderación']],reservas:['pendiente','confirmada','rechazada','cancelada','finalizada'].map(v=>[v,v]),pagos:[['aprobado','Aprobados'],['rechazado','Rechazados']],resenas:[['true','Visibles'],['false','Ocultas']]};

function notice(text){$('#mensaje').textContent=text;$('#mensaje').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>{$('#mensaje').hidden=true;},5000);}
function error(e){
 if(e.status===401){location.href='acceso.html?destino=admin.html';return;}
 $('#error-admin').textContent=e.message||'No se pudo completar la operación.';$('#error-admin').hidden=false;
 const dialogs=[...document.querySelectorAll('dialog[open]')];const dialog=dialogs[dialogs.length-1];
 if(dialog){let p=dialog.querySelector('[data-error]');if(!p){p=document.createElement('p');p.dataset.error='';p.setAttribute('role','alert');p.className='peligro';dialog.append(p);}p.textContent=e.message;}
}
function clearError(){$('#error-admin').hidden=true;document.querySelectorAll('[data-error]').forEach(p=>p.remove());}
async function locked(fn){
 if(state.busy)return;state.busy=true;
 const buttons=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);
 try{clearError();await fn();}catch(e){error(e);}finally{state.busy=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});}
}
function header(){return `<div class="encabezado"><div><p class="etiqueta">NOMADA / ADMINISTRACIÓN</p><h1>${names[state.view]}</h1><p class="texto-secundario">${descriptions[state.view]}</p></div></div>`;}
function button(action,id,label,extra=''){return `<button type="button" data-action="${action}" data-id="${esc(id)}" ${extra}>${label}</button>`;}
function stat(label,value,note){return `<article class="indicador"><span>${label}</span><strong>${esc(value)}</strong><small>${note}</small></article>`;}
function summary(s,events){return header()+`
 <section class="indicadores" aria-label="Indicadores generales">
 ${stat('Usuarios',s.usuarios,'Cuentas registradas')}${stat('Alojamientos',s.alojamientos,'Espacios registrados')}${stat('Reservaciones',s.reservaciones,'Histórico de operaciones')}${stat('Pagos simulados',money(s.pagos_simulados_centavos),'Importe aprobado; no son cobros reales')}
 </section><div class="admin-rejilla"><section class="panel"><h2>Estado de la plataforma</h2><ul class="lista-resumen">
 <li>Cuentas inactivas<strong>${esc(s.usuarios_inactivos)}</strong></li><li>Alojamientos moderados<strong>${esc(s.alojamientos_moderados)}</strong></li><li>Solicitudes pendientes<strong>${esc(s.solicitudes_pendientes)}</strong></li><li>Reseñas ocultas<strong>${esc(s.resenas_ocultas)}</strong></li></ul></section>
 <section class="panel"><h2>Actividad reciente</h2>${events.length?events.map(e=>`<article class="registro"><strong>${esc(e.action)}</strong><p>${esc(e.responsable||'Cuenta no disponible')}</p><small>${date(e.created_at)}</small></article>`).join(''):'<p class="texto-secundario">Todavía no hay acciones registradas.</p>'}</section></div>`;}
function filters(){
 const options=filterOptions[state.view];
 return `<form id="filtros-admin" class="filtros-admin"><label class="campo-busqueda">Buscar<input name="q" maxlength="200" value="${esc(state.q)}" placeholder="Nombre, folio o texto"></label>
 ${options?`<label>Estado<select name="estado"><option value="">Todos</option>${options.map(([v,t])=>`<option value="${v}" ${state.filter===v?'selected':''}>${t}</option>`).join('')}</select></label>`:'<label>Acción exacta<input name="estado" maxlength="30" value="'+esc(state.filter)+'" placeholder="Ej. admin.usuario"></label>'}
 ${state.view==='usuarios'?`<label>Rol<select name="rol"><option value="">Todos</option>${['huesped','anfitrion','administrador'].map(v=>`<option value="${v}" ${state.role===v?'selected':''}>${v}</option>`).join('')}</select></label>`:'<span></span>'}
 <button type="submit" class="primario">Aplicar filtros</button></form>`;
}
function table(headers,rows){return `<div class="tabla-contenedor"><table class="admin-tabla ${state.view==='usuarios'?'tabla-cuentas':''}"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;}
function rowsHTML(){
 const row=(cells)=>'<tr>'+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>';
 if(state.view==='usuarios')return table(['Cuenta','Rol','Estado','Registro','Acciones'],state.rows.map(u=>row([
 `<strong>${esc(u.nombre)}</strong><small>${esc(u.email)}</small>${uuid(u.id)}`,esc(u.rol),badge(u.activo?'activa':'inactiva'),date(u.created_at),u.id===state.user.id?'<small>Tu cuenta</small>':`<div class="acciones">${button('usuario',u.id,'Administrar')}${button('estado-cuenta',u.id,u.activo?'Desactivar cuenta':'Reactivar cuenta')}</div>`
 ])));
 if(state.view==='alojamientos')return table(['Alojamiento','Propietario','Publicación','Moderación','Acciones'],state.rows.map(a=>row([
 `<strong>${esc(a.titulo)}</strong><small>${esc(a.ubicacion)}</small>${uuid(a.id)}`,esc(a.propietario),badge(a.publicado?'publicado':'inactivo'),badge(a.moderado?'oculto':'visible'),`<div class="acciones">${button('detalle',a.id,'Detalle')}${button('moderar-alojamiento',a.id,a.moderado?'Restaurar visibilidad':'Ocultar')}</div>`
 ])));
 if(state.view==='reservas')return table(['Folio / alojamiento','Participantes','Estancia','Estado','Importe','Acciones'],state.rows.map(r=>row([
 `<strong>${esc(r.titulo)}</strong>${uuid(r.id)}`,`${esc(r.huesped)}<small>Anfitrión: ${esc(r.anfitrion)}</small>`,`${esc(r.arrival)}<small>al ${esc(r.departure)}</small><small>${r.guests} huéspedes</small>`,badge(r.status),money(r.total_cents),button('detalle',r.id,'Detalle')
 ])));
 if(state.view==='pagos')return table(['Pago / reservación','Titular','Resultado','Importe','Fecha','Acciones'],state.rows.map(p=>row([
 `${uuid(p.id)}<small>Reserva:</small>${uuid(p.reservation_id)}`,`${esc(p.huesped)}<small>${esc(p.titulo)}</small>`,badge(p.status),money(p.amount_cents),date(p.created_at),button('detalle',p.id,'Detalle')
 ])));
 if(state.view==='resenas')return table(['Alojamiento / huésped','Calificación','Comentario','Visibilidad','Acciones'],state.rows.map(r=>row([
 `<strong>${esc(r.titulo)}</strong><small>${esc(r.huesped)}</small>${uuid(r.id)}`,`${r.score} / 5`,`<p class="comentario">${esc(r.comment)}</p>`,badge(r.visible?'visible':'oculto'),button('moderar-resena',r.id,r.visible?'Ocultar':'Restaurar visibilidad')
 ])));
 return table(['Fecha','Responsable','Acción','Objetivo','Acciones'],state.rows.map(a=>row([
 date(a.created_at),`${esc(a.responsable||'No disponible')}${uuid(a.actor_id||'')}`,esc(a.action),uuid(a.target_id||'Sin objetivo'),button('detalle',a.id,'Detalle')
 ])));
}
function listing(){
 const note=state.view==='auditoria'?'Esta es la bitácora de la aplicación. Los logs SQL de pgAudit se consultan por separado en Google Cloud.':state.view==='pagos'?'Los importes pertenecen a pagos simulados. No son transferencias bancarias ni comprobantes fiscales.':state.view==='reservas'?'Consulta administrativa del historial. Las confirmaciones y cancelaciones siguen las reglas y permisos de los módulos correspondientes.':'';
 return header()+(note?`<div class="admin-aviso">${note}</div>`:'')+filters()+`<section class="panel">${state.rows.length?rowsHTML():'<div class="vacio">No se encontraron registros con estos filtros.</div>'}<div class="paginacion"><span>Página ${state.page+1} · ${state.rows.length} registros mostrados</span><div class="acciones"><button type="button" data-page="prev" ${state.page===0?'disabled':''}>Anterior</button><button type="button" data-page="next" ${!state.hasNext?'disabled':''}>Siguiente</button></div></div></section>`;
}
async function load(){
 const sequence=++state.sequence;
 clearError();$('#vista').setAttribute('aria-busy','true');
 $('#vista').innerHTML=header()+'<div class="panel panel-cargando" role="status">Consultando registros…</div>';
 document.querySelectorAll('[data-vista]').forEach(b=>{const active=b.dataset.vista===state.view;b.classList.toggle('activo',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 try{
  if(state.view==='resumen'){
   const [s,events]=await Promise.all([Nomada.api('/api/admin/resumen'),Nomada.api('/api/admin/auditoria?limit=5')]);
   if(sequence!==state.sequence)return;$('#vista').innerHTML=summary(s,events);
  }else{
   const p=new URLSearchParams({limit:PAGE_SIZE+1,offset:state.page*PAGE_SIZE,q:state.q,estado:state.filter,rol:state.role});
   const rows=await Nomada.api(`/api/admin/${state.view}?${p}`);
   if(sequence!==state.sequence)return;state.hasNext=rows.length>PAGE_SIZE;state.rows=rows.slice(0,PAGE_SIZE);$('#vista').innerHTML=listing();
  }
 }catch(e){if(sequence!==state.sequence)return;$('#vista').innerHTML=header()+'<div class="vacio">No fue posible cargar la información. Puedes volver a intentarlo con Actualizar.</div>';error(e);}
 finally{if(sequence===state.sequence)$('#vista').removeAttribute('aria-busy');}
}
function find(id){return state.rows.find(r=>String(r.id)===String(id));}
function openUser(u){
 const f=$('#form-usuario');f.reset();f.elements.id.value=u.id;f.elements.rol.value=u.rol;f.elements.activo.checked=u.activo;
 $('#usuario-identidad').textContent=`${u.nombre} · ${u.email}`;clearError();$('#editar-usuario').showModal();
}
function confirmChange(text,path,body){state.confirm={path,body};$('#detalle-confirmacion').textContent=text;clearError();$('#confirmar-admin').showModal();}
function detail(record){
 const labels={id:'Identificador',owner_id:'Propietario ID',titulo:'Alojamiento',ubicacion:'Ubicación',propietario:'Propietario',price_cents:'Precio por noche',publicado:'Publicado',moderado:'Moderado',guest_id:'Huésped ID',listing_id:'Alojamiento ID',reservation_id:'Reserva ID',huesped:'Huésped',anfitrion:'Anfitrión',arrival:'Entrada',departure:'Salida',guests:'Huéspedes',nightly_cents:'Tarifa por noche',total_cents:'Importe total',fee_cents:'Tarifa de servicio',amount_cents:'Importe',status:'Estado',notes:'Notas',created_at:'Fecha de registro',simulated:'Pago simulado',action:'Acción',actor_id:'Responsable ID',responsable:'Responsable',target_id:'Objetivo ID',operation_key:'Clave de operación'};
 $('#contenido-detalle').innerHTML='<dl class="detalle-lista">'+Object.entries(record).filter(([k])=>k!=='details').map(([k,v])=>`<dt>${esc(labels[k]||k)}</dt><dd>${esc(k.endsWith('_cents')?money(v):k==='created_at'?date(v):typeof v==='boolean'?(v?'Sí':'No'):v??'Sin dato')}</dd>`).join('')+'</dl>'+(record.details?'<h3>Datos de la acción</h3><pre class="json-detalle">'+esc(JSON.stringify(record.details,null,2))+'</pre>':'');
 $('#detalle-admin').showModal();
}
document.querySelectorAll('[data-vista]').forEach(b=>b.addEventListener('click',()=>{if(state.busy)return;state.view=b.dataset.vista;state.page=0;state.q='';state.filter='';state.role='';load();$('#contenido').focus();}));
$('#actualizar').addEventListener('click',()=>{if(!state.busy)load();});
document.querySelectorAll('[data-cerrar]').forEach(b=>b.addEventListener('click',()=>{if(!state.busy)$('#'+b.dataset.cerrar).close();}));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{if(state.busy)e.preventDefault();}));
$('#vista').addEventListener('submit',e=>{
 if(e.target.id!=='filtros-admin')return;e.preventDefault();if(state.busy)return;
 const b=Object.fromEntries(new FormData(e.target));state.q=b.q.trim();state.filter=b.estado||'';state.role=b.rol||'';state.page=0;load();
});
$('#vista').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||state.busy)return;
 if(b.dataset.page){state.page+=b.dataset.page==='next'?1:-1;load();return;}
 const r=find(b.dataset.id);if(!r)return;
 if(b.dataset.action==='usuario')openUser(r);
 if(b.dataset.action==='estado-cuenta')confirmChange(`${r.activo?'Desactivar':'Reactivar'} la cuenta de ${r.nombre}. Se revocarán sus sesiones y se conservará el historial.`,`/api/admin/usuarios/${r.id}`,{activo:!r.activo});
 if(b.dataset.action==='detalle')detail(r);
 if(b.dataset.action==='moderar-alojamiento')confirmChange(`${r.moderado?'Restaurar':'Ocultar'} la visibilidad de «${r.titulo}». La publicación del anfitrión y el historial se conservarán.`,`/api/admin/alojamientos/${r.id}`,{moderado:!r.moderado});
 if(b.dataset.action==='moderar-resena')confirmChange(`${r.visible?'Ocultar':'Restaurar'} la reseña de ${r.huesped}. El registro se conservará.`,`/api/admin/resenas/${r.id}`,{visible:!r.visible});
});
$('#form-usuario').addEventListener('submit',e=>{
 e.preventDefault();if(state.busy)return;const f=e.currentTarget;
 confirmChange('Guardar los cambios de esta cuenta revocará sus sesiones actuales. ¿Deseas continuar?',`/api/admin/usuarios/${f.elements.id.value}`,{activo:f.elements.activo.checked,rol:f.elements.rol.value});
});
$('#form-confirmar').addEventListener('submit',e=>{
 e.preventDefault();if(!state.confirm)return;
 locked(async()=>{const change=state.confirm;const r=await Nomada.api(change.path,'PATCH',change.body);$('#confirmar-admin').close();$('#editar-usuario').close();state.confirm=null;await load();notice(r.mensaje||'Cambio guardado.');});
});
Nomada.require('administrador').then(async u=>{state.user=u;$('#admin-nombre').textContent=u.nombre;$('#comprobando').hidden=true;$('#panel-admin').hidden=false;await load();}).catch(e=>{if(!e.status)$('#comprobando').textContent=e.message;});
