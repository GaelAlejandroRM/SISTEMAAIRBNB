'use strict';
const form=document.getElementById('perfil'),status=document.getElementById('resultado');
Nomada.api('/api/yo').then(u=>{
 for(const key of ['nombre','telefono','ciudad'])form.elements[key].value=u[key]||'';
 document.getElementById('correo').value=u.email;
 document.getElementById('volver').href={anfitrion:'anfitrion.html',huesped:'huesped.html',administrador:'admin.html'}[u.rol];
 form.hidden=false;status.textContent='Los campos con * son obligatorios.';
}).catch(e=>{if(e.status===401)location.href='acceso.html';else status.textContent=e.message;});
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;
 try{await Nomada.api('/api/perfil','PUT',Object.fromEntries(new FormData(form)));status.textContent='Perfil actualizado.';}
 catch(e){status.textContent=e.message;}finally{button.disabled=false;}
});
