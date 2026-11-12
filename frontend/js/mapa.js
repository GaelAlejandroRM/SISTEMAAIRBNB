'use strict';

window.MapaNomada=(()=>{
 const defaultCenter=[19.289,-99.656];
 let dialog,map,marker,onSelect,library;
 function loadLeaflet(){
  if(!library){
   library=new Promise(resolve=>{
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    stylesheet.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    stylesheet.crossOrigin='anonymous';
    const styleReady=new Promise(done=>{
     stylesheet.onload=()=>done(true);
     stylesheet.onerror=()=>done(false);
    });
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin='anonymous';
    const scriptReady=new Promise(done=>{
     script.onload=()=>done(Boolean(window.L));
     script.onerror=()=>done(false);
    });
    document.head.append(stylesheet,script);
    Promise.all([styleReady,scriptReady]).then(results=>resolve(results.every(Boolean)));
   });
  }
  return library;
 }
 const value=id=>dialog.querySelector('#'+id);
 const coords=()=>[value('mapa-lat'),value('mapa-lon')].map(input=>input.value.trim()===''?NaN:Number(input.value));

 function mark(lat,lon){
  value('mapa-lat').value=lat.toFixed(5);
  value('mapa-lon').value=lon.toFixed(5);
  if(map){
   if(marker)marker.setLatLng([lat,lon]);
   else marker=L.circleMarker([lat,lon],{radius:8,color:'#176653',fillOpacity:.85}).addTo(map);
  }
 }
 function build(){
  dialog=document.createElement('dialog');
  dialog.className='cuenta-dialog';
  dialog.setAttribute('aria-labelledby','mapa-titulo');
  dialog.innerHTML=`<h2 id="mapa-titulo">Seleccionar ubicación</h2>
    <p>Marca un punto en el mapa o escribe las coordenadas.</p>
    <div id="mapa-puntos" aria-label="Mapa para seleccionar un punto"></div>
    <form id="mapa-form">
      <div class="mapa-coordenadas">
       <label>Latitud<input id="mapa-lat" type="number" min="-90" max="90" step="any" required></label>
       <label>Longitud<input id="mapa-lon" type="number" min="-180" max="180" step="any" required></label>
      </div>
      <p id="mapa-estado" role="status"></p>
      <div class="cuenta-acciones"><button class="primario" type="submit">Usar esta ubicación</button><button id="mapa-cancelar" type="button">Cancelar</button></div>
    </form>`;
  document.body.append(dialog);
  value('mapa-cancelar').onclick=()=>dialog.close();
  value('mapa-form').onsubmit=event=>{
   event.preventDefault();
   const [latitud,longitud]=coords();
   if(!Number.isFinite(latitud)||!Number.isFinite(longitud))return;
   dialog.close();
   onSelect({latitud,longitud});
  };
  for(const id of ['mapa-lat','mapa-lon'])value(id).addEventListener('change',()=>{
   const [lat,lon]=coords();
   if(Math.abs(lat)<=90&&Math.abs(lon)<=180){mark(lat,lon);map?.panTo([lat,lon]);}
  });
 }
 async function open(point,select){
  if(!dialog)build();
  onSelect=select;
  value('mapa-form').reset();
  value('mapa-estado').textContent='';
  value('mapa-puntos').hidden=!map;
  dialog.showModal();
  const selected=point?.latitud!=null&&point?.longitud!=null;
  if(selected)mark(Number(point.latitud),Number(point.longitud));
  value('mapa-estado').textContent=map?'':'Cargando mapa…';
  const leafletReady=await loadLeaflet();
  if(!dialog.open||onSelect!==select)return;
  value('mapa-puntos').hidden=!leafletReady;
  if(leafletReady&&!map){
   map=L.map(value('mapa-puntos'));
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   }).on('tileerror',()=>{value('mapa-estado').textContent='El mapa no pudo cargar algunas zonas. Puedes usar coordenadas.';}).addTo(map);
   map.on('click',event=>mark(event.latlng.lat,L.Util.wrapNum(event.latlng.lng,[-180,180])));
  }
  if(marker){marker.remove();marker=null;}
  value('mapa-puntos').hidden=!map;
  if(!map)value('mapa-estado').textContent='El mapa no está disponible. Puedes usar coordenadas.';
  if(!map)return;
  value('mapa-estado').textContent='';
  const current=coords();
  const hasPoint=current.every(Number.isFinite);
  map.setView(hasPoint?current:defaultCenter,hasPoint?12:7);
  map.invalidateSize();
  if(hasPoint)mark(...current);
 }
 function nearby(a,b){
  if(a.latitud==null||a.longitud==null)return false;
  const rad=x=>x*Math.PI/180;
  const h=Math.sin(rad(a.latitud-b.latitud)/2)**2+
    Math.cos(rad(a.latitud))*Math.cos(rad(b.latitud))*Math.sin(rad(a.longitud-b.longitud)/2)**2;
  return h<=Math.sin(25/12742)**2;
 }
 return {open,nearby};
})();
