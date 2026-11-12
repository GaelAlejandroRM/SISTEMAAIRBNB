'use strict';

const profile=document.getElementById('perfil');
const password=document.getElementById('contrasena');
const status=document.getElementById('resultado');
const back=document.getElementById('volver');
const logout=document.getElementById('salir-perfil');

Nomada.api('/api/yo').then(user=>{
 if(user.rol==='huesped'){
  location.replace('huesped.html?perfil=1');
  return;
 }
 const admin=user.rol==='administrador';
 document.getElementById('titulo-perfil').textContent=admin?'Perfil de administrador':'Mi perfil de anfitrión';
 back.href=admin?'admin.html':'anfitrion.html';
 document.getElementById('acciones-perfil').hidden=false;
 document.getElementById('privacidad-perfil').hidden=admin;
 status.textContent='';
 if(admin)password.hidden=false;
 else{
  for(const key of ['nombre','telefono','ciudad'])profile.elements[key].value=user[key]||'';
  document.getElementById('correo').value=user.email;
  profile.hidden=false;
 }
}).catch(error=>{
 if(error.status===401)location.href='acceso.html';
 else status.textContent=error.message;
});

function submit(form,action){
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;
  try{await action(Object.fromEntries(new FormData(form)));}
  catch(error){status.textContent=error.message;}
  finally{button.disabled=false;}
 });
}
submit(profile,async data=>{
 await Nomada.api('/api/perfil','PUT',data);
 status.textContent='Perfil actualizado.';
});
submit(password,async data=>{
 if(data.nueva!==data.confirmacion)throw new Error('Las contraseñas no coinciden.');
 await Nomada.api('/api/perfil/contrasena','PUT',data);
 password.reset();
 password.hidden=true;
 logout.hidden=true;
 back.href='acceso.html';
 back.textContent='Iniciar sesión';
 status.textContent='Contraseña actualizada. Inicia sesión con la nueva contraseña.';
});
logout.addEventListener('click',async()=>{
 logout.disabled=true;
 try{await Nomada.logout();}
 catch(error){status.textContent=error.message;logout.disabled=false;}
});
