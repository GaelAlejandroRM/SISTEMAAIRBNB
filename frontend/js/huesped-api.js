'use strict';
const N=window.Nomada;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v/100);
let items=[];
const grid=document.getElementById('property-grid');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const filters=document.createElement('form');filters.className='panel';filters.innerHTML=`
<div class="search-row"><label>Ubicación<input name="q"></label><label>Huéspedes<input name="personas" type="number" min="1" max="100" value="1" required></label></div>
<div class="search-row"><label>Entrada<input name="entrada" type="date" min="${today()}"></label><label>Salida<input name="salida" type="date" min="${today()}"></label></div>
<div class="search-row"><label>Precio máximo por noche<input name="precioMax" type="number" min="1" max="100000"></label><label>Categoría<select name="categoria"><option value="">Todas</option><option value="beachfront">Playa</option><option value="cabins">Cabañas</option><option value="pools">Alberca</option><option value="views">Vistas</option><option value="tiny">Minicasas</option><option value="mansions">Mansiones</option><option value="luxe">Lujo</option></select></label></div>
<button type="submit" class="reserve-btn">Buscar en PostgreSQL</button><p id="catalogo-error" role="status"></p>`;
grid.before(filters);
const session=document.createElement('div');session.className='panel';session.innerHTML='<a href="acceso.html">Iniciar sesión / registrarse</a> · <a href="huesped.html">Mis viajes</a> · <a href="anfitrion.html">Modo anfitrión</a>';filters.before(session);
N.api('/api/yo').then(u=>{session.innerHTML=`${esc(u.nombre)} · ${esc(u.rol)} · <a href="huesped.html">Mis viajes</a> · <a href="anfitrion.html">Anfitrión</a> · <button id="cerrar-sesion">Cerrar sesión</button>`;document.getElementById('cerrar-sesion').onclick=()=>N.logout().catch(e=>alert(e.message));}).catch(()=>{});
async function load(){
 const params=new URLSearchParams();for(const [k,v]of new FormData(filters))if(v)params.set(k,v);
 const error=document.getElementById('catalogo-error');error.textContent='Consultando…';
 try{
  items=await N.api(`/api/alojamientos?${params}`);error.textContent='';
  grid.innerHTML=items.length?items.map(a=>`<article class="listing-card" data-listing="${esc(a.id)}">
  <div class="image-carousel-container">${a.fotos[0]?`<img class="listing-image" src="${esc(a.fotos[0])}" alt="${esc(a.titulo)}">`:'<div class="no-image">Sin fotografía</div>'}</div>
  <div class="listing-info"><h3>${esc(a.titulo)}</h3><p>${esc(a.ubicacion)}</p><p>Hasta ${a.capacidad} huéspedes · ${a.resenas} reseñas</p><strong>${money(a.precioCentavos)} / noche</strong><button type="button" data-detail="${esc(a.id)}">Ver y reservar</button></div></article>`).join(''):'<p>No hay alojamientos publicados para estos filtros. Registra uno desde una cuenta de anfitrión.</p>';
  const counter=document.getElementById('listings-count');if(counter)counter.textContent=`${items.length} resultados (máximo 100 por consulta)`;
 }catch(e){error.textContent=e.message;}
}
filters.addEventListener('submit',e=>{e.preventDefault();load();});
document.getElementById('search-pill-trigger')?.addEventListener('click',()=>filters.scrollIntoView({behavior:'smooth'}));
document.querySelector('.filter-button')?.removeAttribute('onclick');
document.querySelector('.filter-button')?.addEventListener('click',()=>filters.elements.categoria.focus());
import('./data.js').then(({CATEGORIES})=>{
 const target=document.getElementById('categories-scroll');if(!target)return;
 target.innerHTML=CATEGORIES.map(c=>`<button class="category-item" type="button" data-category="${esc(c.id)}">${c.icon}<span>${esc(c.label)}</span></button>`).join('');
 target.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;filters.elements.categoria.value=b.dataset.category==='all'?'':b.dataset.category;load();});
}).catch(()=>{});
const overlay=document.getElementById('listing-modal');
grid.addEventListener('click',async event=>{
 const button=event.target.closest('[data-detail]');if(!button)return;
 try{
  const a=await N.api(`/api/alojamientos/${button.dataset.detail}`);
  const content=document.getElementById('modal-listing-content');
  content.innerHTML=`<button type="button" id="close-detail" class="modal-close-btn" aria-label="Cerrar">✕</button><h2>${esc(a.titulo)}</h2><p>${esc(a.ubicacion)}</p><p>${esc(a.descripcion)}</p>
  <p>${esc(a.servicios.join(' · '))}</p><p>${esc(a.caracteristicas)}</p>
  ${a.fotos.map(src=>`<img src="${esc(src)}" alt="${esc(a.titulo)}" style="max-width:100%;max-height:240px">`).join('')}
  <h3>${money(a.precioCentavos)} / noche</h3><form id="solicitar"><label>Entrada<input name="entrada" type="date" min="${today()}" value="${esc(filters.elements.entrada.value)}" required></label><label>Salida<input name="salida" type="date" min="${today()}" value="${esc(filters.elements.salida.value)}" required></label><label>Huéspedes<input name="personas" type="number" min="1" max="${a.capacidad}" value="${esc(filters.elements.personas.value)}" required></label><p id="importe">Selecciona tus fechas para calcular el importe.</p><button class="reserve-btn">Solicitar reservación</button><p id="reserva-mensaje" role="status"></p></form>
  <h3>Reseñas</h3>${a.opiniones.map(r=>`<p>${r.puntuacion}/5 · ${esc(r.huesped)}<br>${esc(r.comentario)}</p>`).join('')||'<p>Todavía no hay reseñas.</p>'}`;
  overlay.classList.remove('hidden');document.getElementById('close-detail').onclick=()=>overlay.classList.add('hidden');
  const form=document.getElementById('solicitar');let key=null,payloadSignature='';
  const update=()=>{
   const n=(Date.parse(form.elements.salida.value)-Date.parse(form.elements.entrada.value))/86400000;
   document.getElementById('importe').textContent=n>0?`${n} noches · Total ${money(n*a.precioCentavos)} MXN. El servidor validará el importe y la disponibilidad.`:'La salida debe ser posterior a la entrada.';
  };form.addEventListener('input',update);update();
  form.onsubmit=async e=>{
   e.preventDefault();const submit=form.querySelector('button');submit.disabled=true;
   const msg=document.getElementById('reserva-mensaje');
   try{
    const user=await N.api('/api/yo');if(user.rol!=='huesped')throw new Error('Inicia sesión con una cuenta de huésped.');
    const b={...Object.fromEntries(new FormData(form)),alojamientoId:a.id};const signature=JSON.stringify(b);
    if(signature!==payloadSignature){key=crypto.randomUUID();payloadSignature=signature;}
    b.claveOperacion=key;
    const r=await N.api('/api/reservas','POST',b);msg.textContent=`Solicitud registrada. Total ${money(r.totalCentavos)}. Consúltala en Mis viajes.`;submit.hidden=true;load();
   }catch(e){msg.textContent=e.message;}finally{submit.disabled=false;}
  };
 }catch(e){alert(e.message);}
});
overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.add('hidden');});
document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.add('hidden');});
// Los enlaces antiguos de acceso y anfitrión apuntan a las pantallas conectadas.
document.querySelectorAll('a[href="#signup"],a[href="#login"]').forEach(a=>a.href='acceso.html');
document.querySelectorAll('a[href="#host"]').forEach(a=>a.href='anfitrion.html');
document.querySelectorAll('.host-link-btn,.banner-cta').forEach(b=>{b.removeAttribute('onclick');b.onclick=()=>location.href='anfitrion.html';});
load();
