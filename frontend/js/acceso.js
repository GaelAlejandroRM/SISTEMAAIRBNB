'use strict';
for(const name of ['login','registro'])document.getElementById(name).addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
 const msg=document.getElementById('resultado');
 try{
  const u=await Nomada.api(`/api/${name}`,'POST',Object.fromEntries(new FormData(form)));
  if(name==='registro'){form.reset();msg.textContent='Cuenta creada. Inicia sesión arriba.';return;}
  const desired=new URLSearchParams(location.search).get('destino');
  location.href=u.rol==='anfitrion'?'anfitrion.html':u.rol==='administrador'?'api/admin/resumen':desired==='viajes.html'?'viajes.html':'huesped.html';
 }catch(e){msg.textContent=e.message;}finally{button.disabled=false;}
});
