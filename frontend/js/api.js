'use strict';
window.Nomada={
 async api(path,method='GET',body){
  const res=await fetch(path,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json();
  if(!res.ok){const e=new Error(data.error||'No se pudo completar la operación.');e.status=res.status;throw e;}return data;
 },
 async require(role){
  try{const u=await this.api('/api/yo');if(u.rol!==role)throw new Error(`Esta pantalla requiere una cuenta de ${role}.`);return u;}
  catch(e){const pages={anfitrion:'anfitrion.html',huesped:'huesped.html',administrador:'admin.html'};location.href=`acceso.html?destino=${pages[role]||'huesped.html'}`;throw e;}
 },
 // Comprime las imágenes antes de enviarlas al backend.
async prepareImage(file, maxSide=800) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Solo se permiten imágenes PNG o JPEG.');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Cada archivo original debe pesar menos de 8 MB.');
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('No se pudo abrir una imagen.'));
      image.src = url;
    });

    const escala = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(image.width * escala));
    canvas.height = Math.max(1, Math.round(image.height * escala));

    const context = canvas.getContext('2d');

    if (!context) throw new Error('El navegador no pudo procesar la imagen.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', .72);
  } finally {
    URL.revokeObjectURL(url);
  }
},
 watchNotifications(initial,onUpdate){
  let previous=new Set(initial.map(item=>item.id));
  let pending=false,stopped=false;
  const refresh=async()=>{
   if(stopped||pending||document.hidden)return;
   pending=true;
   try{
    const items=await this.api('/api/notificaciones');
    const added=items.filter(item=>!previous.has(item.id)&&!item.leida);
    previous=new Set(items.map(item=>item.id));
    onUpdate(items,added);
   }catch(error){
    if(error.status===401){
     stopped=true;
     clearInterval(timer);
     document.removeEventListener('visibilitychange',refresh);
     location.href='acceso.html';
    }
   }finally{pending=false;}
  };
  const timer=setInterval(refresh,5000);
  document.addEventListener('visibilitychange',refresh);
 },
 async logout(){await this.api('/api/logout','POST',{});location.href='acceso.html';}
};
