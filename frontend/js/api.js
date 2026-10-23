'use strict';
window.Nomada={
 async api(path,method='GET',body){
  const res=await fetch(path,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json();
  if(!res.ok){const e=new Error(data.error||'No se pudo completar la operación.');e.status=res.status;throw e;}return data;
 },
 async require(role){
  try{const u=await this.api('/api/yo');if(u.rol!==role)throw new Error(`Esta pantalla requiere una cuenta de ${role}.`);return u;}
  catch(e){location.href=`acceso.html?destino=${role==='anfitrion'?'anfitrion.html':'huesped.html'}`;throw e;}
 },
 async logout(){await this.api('/api/logout','POST',{});location.href='acceso.html';}
};
