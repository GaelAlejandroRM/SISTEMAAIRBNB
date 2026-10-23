'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v/100);
async function load(){
 const [reservas,notificaciones]=await Promise.all([Nomada.api('/api/reservas'),Nomada.api('/api/notificaciones')]);
 document.getElementById('viajes').innerHTML=reservas.map(r=>`<article class="panel"><h2>${esc(r.titulo)}</h2><p>${esc(r.entrada)} al ${esc(r.salida)} · ${r.personas} huéspedes</p><p>Estado: ${esc(r.estado)} · Pago simulado: ${esc(r.pago)}</p><strong>${money(r.totalCentavos)}</strong><p>Folio ${esc(r.id)}</p><div class="acciones">
 ${r.estado==='pendiente'?`<button data-cancelar="${r.id}">Cancelar solicitud</button>`:''}
 ${r.estado==='confirmada'&&r.pago!=='aprobado'?`<button data-pago="${r.id}" data-resultado="aprobado">Simular pago aprobado</button><button data-pago="${r.id}" data-resultado="rechazado">Simular pago rechazado</button>`:''}
 <button data-comprobante="${r.id}">Ver comprobante</button></div>
 ${r.estado==='finalizada'?`<form data-resena="${r.id}"><label>Calificación<select name="puntuacion"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><label>Reseña<textarea name="comentario" maxlength="2000" required></textarea></label><button>Publicar reseña</button></form>`:''}</article>`).join('')||'<p>No tienes reservaciones.</p>';
 document.getElementById('avisos').innerHTML=notificaciones.map(n=>`<p>${esc(n.texto)}</p>`).join('')||'<p>Sin notificaciones.</p>';
}
document.getElementById('viajes').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 try{
  if(b.dataset.cancelar){if(!confirm('¿Cancelar esta solicitud pendiente?'))return;await Nomada.api(`/api/reservas/${b.dataset.cancelar}/estado`,'PATCH',{estado:'cancelada'});}
  else if(b.dataset.pago){await Nomada.api(`/api/reservas/${b.dataset.pago}/pago`,'POST',{resultado:b.dataset.resultado});}
  else if(b.dataset.comprobante){const r=await Nomada.api(`/api/reservas/${b.dataset.comprobante}/comprobante`);alert(`COMPROBANTE DE OPERACIÓN SIMULADA\nFolio: ${r.id}\n${r.titulo}\n${r.entrada} al ${r.salida}\nTotal: ${money(r.totalCentavos)} MXN\nPago: ${r.pago}\nNo es comprobante fiscal ni bancario.`);return;}
  else return;await load();document.getElementById('estado').textContent='Operación guardada.';
 }catch(error){document.getElementById('estado').textContent=error.message;}
});
document.getElementById('viajes').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.target;if(!form.dataset.resena)return;const b=form.querySelector('button');b.disabled=true;
 try{await Nomada.api('/api/resenas','POST',{...Object.fromEntries(new FormData(form)),reservaId:form.dataset.resena});await load();document.getElementById('estado').textContent='Reseña publicada.';}catch(error){document.getElementById('estado').textContent=error.message;}finally{b.disabled=false;}
});
Nomada.require('huesped').then(load).catch(e=>{document.getElementById('estado').textContent=e.message;});
