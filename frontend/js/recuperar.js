'use strict';
let token=location.hash.slice(1);
if(token){history.replaceState(null,'',location.pathname);document.getElementById('solicitud').hidden=true;document.getElementById('cambio').hidden=false;}
for(const id of ['pedir','restablecer'])document.getElementById(id).addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),status=document.getElementById('resultado');
 const data=Object.fromEntries(new FormData(form));
 if(id==='restablecer'&&data.password!==data.confirmacion){status.textContent='Las contraseñas no coinciden.';return;}
 button.disabled=true;status.textContent='Procesando…';
 try{const result=await Nomada.api(id==='pedir'?'/api/recuperacion':'/api/recuperacion/restablecer','POST',id==='pedir'?data:{...data,token});
  status.textContent=result.mensaje;form.reset();if(id==='restablecer'){token='';document.getElementById('cambio').hidden=true;}
 }catch(e){status.textContent=e.message;}finally{button.disabled=false;}
});
