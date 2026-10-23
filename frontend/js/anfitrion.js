'use strict';

// Adaptador de almacenamiento local.
// Cuando exista el backend, estas operaciones se sustituirán por llamadas a su API.
const CLAVE = 'nomada_anfitrion_front_v1';
const $ = selector => document.querySelector(selector);
const nuevoId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const vaciarDatos = () => ({
  version: 1,
  demoCargada: false,
  alojamientos: [],
  reservas: [],
  bloqueos: [],
  resenas: [],
  notificaciones: []
});

let datos = vaciarDatos();

const ui = {
  vista: 'resumen',
  busqueda: '',
  estadoReserva: '',
  propiedadCalendario: '',
  mes: hoy().slice(0, 7),
  fotos: [],
  procesandoFotos: false
};

function hoy() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function sumarDias(fecha, cantidad) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + cantidad);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function fechaValida(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const d = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === value;
}

function noches(entrada, salida) {
  return (
    Date.parse(`${salida}T00:00:00Z`) -
    Date.parse(`${entrada}T00:00:00Z`)
  ) / 86400000;
}

function moneda(centavos) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(centavos / 100);
}

function fechaTexto(fecha) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${fecha}T12:00:00`));
}

// Evita interpretar como HTML el texto capturado en los formularios.
function escapar(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function mensaje(texto, error = false) {
  const box = $('#mensaje');
  box.textContent = texto;
  box.classList.toggle('error', error);
  box.hidden = false;

  clearTimeout(mensaje.timer);
  mensaje.timer = setTimeout(() => {
    box.hidden = true;
  }, 6000);
}

async function cargarDatos() {
  datos = await Nomada.api('/api/anfitrion/panel');
  if (!alojamientoPorId(ui.propiedadCalendario)) ui.propiedadCalendario = datos.alojamientos[0]?.id || '';
  render();
}

function notificar(copia, texto) {
  copia.notificaciones.unshift({
    id: nuevoId(),
    texto,
    fecha: new Date().toISOString(),
    leida: false
  });
}

function alojamientoPorId(id) {
  return datos.alojamientos.find(a => a.id === id);
}

function estadoHTML(estado) {
  return `<span class="estado ${escapar(estado)}">${escapar(estado)}</span>`;
}

function vacio(texto) {
  return `<div class="vacio">${escapar(texto)}</div>`;
}

function encabezado(titulo, descripcion, accion = '') {
  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">NÓMADA / ANFITRIÓN</p>
        <h1>${escapar(titulo)}</h1>
        <p class="texto-secundario">${escapar(descripcion)}</p>
      </div>
      ${accion}
    </div>
  `;
}

function indicador(titulo, valor, detalle) {
  return `
    <article class="indicador">
      <span>${escapar(titulo)}</span>
      <strong>${escapar(valor)}</strong>
      <small>${escapar(detalle)}</small>
    </article>
  `;
}

function imagenSegura(src) {
  return typeof src === 'string' &&
    /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(src);
}

function accionesReserva(reserva) {
  const boton = (estado, texto, peligro = false) => `
    <button
      type="button"
      data-reserva="${escapar(reserva.id)}"
      data-estado="${estado}"
      class="${peligro ? 'peligro' : ''}"
    >${texto}</button>
  `;

  if (reserva.estado === 'pendiente' && reserva.entrada >= hoy()) {
    return boton('confirmada', 'Aceptar') +
      boton('rechazada', 'Rechazar', true);
  }

  if (
    reserva.estado === 'confirmada' &&
    reserva.salida <= hoy()
  ) {
    return boton('finalizada', 'Finalizar estancia');
  }

  return '<small>Sin acciones disponibles</small>';
}

function tablaReservas(reservas) {
  if (!reservas.length) return vacio('No hay reservaciones para mostrar.');

  return `
    <div class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>Huésped / alojamiento</th>
            <th>Estancia</th>
            <th>Estado</th>
            <th>Importe</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${reservas.map(r => {
            const a = alojamientoPorId(r.alojamientoId);

            return `
              <tr>
                <td>
                  <strong>${escapar(r.huesped)}</strong>
                  <small>${escapar(a?.titulo || 'Alojamiento no disponible')}</small>
                  <small>Folio · ${escapar(r.id.slice(0, 8))}</small>
                </td>
                <td>
                  ${fechaTexto(r.entrada)}
                  <small>al ${fechaTexto(r.salida)}</small>
                  <small>${r.personas} huésped(es)</small>
                </td>
                <td>${estadoHTML(r.estado)}</td>
                <td>
                  ${moneda(r.totalCentavos)}
                  <small>Pago simulado: ${escapar(r.pago)}</small>
                </td>
                <td>
                  <div class="acciones">${accionesReserva(r)}</div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function vistaResumen() {
  const pendientes = datos.reservas.filter(r => r.estado === 'pendiente');
  const publicados = datos.alojamientos.filter(a => a.publicado);

  const importe = datos.reservas
    .filter(r => ['confirmada', 'finalizada'].includes(r.estado))
    .reduce((suma, r) => suma + r.totalCentavos, 0);

  return encabezado(
    'Bienvenido a tu espacio',
    'Organiza tus alojamientos y prepara tu próxima bienvenida.',
    '<button type="button" class="primario" data-nuevo>+ Nuevo alojamiento</button>'
  ) + `
    <section class="bienvenida">
      <div>
        <p class="etiqueta">CADA ESPACIO TIENE UNA HISTORIA</p>
        <h2>Haz que cada estancia se sienta como llegar a casa.</h2>
        <p>Tu calendario, tus solicitudes y tus alojamientos, en un solo lugar.</p>
      </div>
      <div class="bienvenida-icono" aria-hidden="true">⌂</div>
    </section>

    <section class="indicadores" aria-label="Indicadores del anfitrión">
      ${indicador('Alojamientos', datos.alojamientos.length, 'Guardados en PostgreSQL')}
      ${indicador('Publicados', publicados.length, 'Activos para consulta pública')}
      ${indicador('Solicitudes', pendientes.length, 'Pendientes de respuesta')}
      ${indicador('Importe reservado', moneda(importe), 'Importe reservado; no equivale a cobros')}
    </section>

    <section class="panel">
      <h2>Solicitudes pendientes</h2>
      ${tablaReservas(pendientes)}
    </section>
  `;
}

function vistaAlojamientos() {
  const consulta = ui.busqueda.toLocaleLowerCase('es');

  const alojamientos = datos.alojamientos.filter(a =>
    `${a.titulo} ${a.ubicacion}`.toLocaleLowerCase('es').includes(consulta)
  );

  return encabezado(
    'Mis alojamientos',
    'Administra la información y publicación de tus espacios.',
    '<button type="button" class="primario" data-nuevo>+ Nuevo alojamiento</button>'
  ) + `
    <form id="form-busqueda" class="filtros">
      <label>
        Buscar alojamiento
        <input name="busqueda" value="${escapar(ui.busqueda)}"
               placeholder="Nombre o ubicación">
      </label>
      <button type="submit">Buscar</button>
    </form>

    ${alojamientos.length ? `
      <div class="rejilla-alojamientos">
        ${alojamientos.map(a => {
          const foto = a.fotos.find(imagenSegura);

          return `
            <article class="alojamiento">
              ${foto
                ? `<img src="${escapar(foto)}" alt="${escapar(a.titulo)}">`
                : '<div class="sin-foto" aria-label="Sin fotografía">⌂</div>'}

              <div class="alojamiento-contenido">
                ${estadoHTML(a.publicado ? 'publicado' : 'inactivo')}
                <h2>${escapar(a.titulo)}</h2>
                <p>${escapar(a.ubicacion)}</p>
                <p>${a.capacidad} huésped(es)</p>
                <strong class="precio">${moneda(a.precioCentavos)} / noche</strong>

                <div class="acciones">
                  <button type="button" data-editar="${escapar(a.id)}">
                    Ver / editar
                  </button>

                  <button type="button" data-publicar="${escapar(a.id)}">
                    ${a.publicado ? 'Desactivar' : 'Publicar'}
                  </button>

                  <button type="button" data-calendario="${escapar(a.id)}">
                    Calendario
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    ` : vacio('No hay alojamientos. Crea tu primer espacio.')}
  `;
}

function opcionesAlojamientos() {
  return datos.alojamientos.map(a => `
    <option value="${escapar(a.id)}"
      ${a.id === ui.propiedadCalendario ? 'selected' : ''}>
      ${escapar(a.titulo)}
    </option>
  `).join('');
}

function calendarioHTML() {
  const [year, month] = ui.mes.split('-').map(Number);
  const inicio = new Date(year, month - 1, 1);
  const totalDias = new Date(year, month, 0).getDate();
  const desplazamiento = (inicio.getDay() + 6) % 7;

  let html = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    .map(d => `<div class="dia-semana">${d}</div>`).join('');

  html += '<div></div>'.repeat(desplazamiento);

  for (let dia = 1; dia <= totalDias; dia++) {
    const fecha = `${ui.mes}-${String(dia).padStart(2, '0')}`;

    const reserva = datos.reservas.find(r =>
      r.alojamientoId === ui.propiedadCalendario &&
      ['pendiente', 'confirmada', 'finalizada'].includes(r.estado) &&
      r.entrada <= fecha &&
      r.salida > fecha
    );

    const bloqueo = datos.bloqueos.some(b =>
      b.alojamientoId === ui.propiedadCalendario &&
      b.entrada <= fecha &&
      b.salida > fecha
    );

    const pasado = fecha < hoy();

    const clase = reserva
      ? 'ocupado'
      : bloqueo
        ? 'bloqueado'
        : pasado
          ? 'pasado'
          : '';

    const etiqueta = reserva
      ? reserva.estado
      : bloqueo
        ? 'Bloqueado'
        : pasado
          ? 'Pasado'
          : 'Disponible';

    html += `
      <div class="dia ${clase}">
        ${dia}
        <small>${escapar(etiqueta)}</small>
      </div>
    `;
  }

  return html;
}

function vistaCalendario() {
  const titulo = encabezado(
    'Calendario',
    'Consulta las estancias y define los periodos no disponibles.'
  );

  if (!datos.alojamientos.length) {
    return titulo + vacio('Primero registra un alojamiento.');
  }

  if (!alojamientoPorId(ui.propiedadCalendario)) {
    ui.propiedadCalendario = datos.alojamientos[0].id;
  }

  const alojamiento = alojamientoPorId(ui.propiedadCalendario);
  const bloqueos = datos.bloqueos.filter(
    b => b.alojamientoId === ui.propiedadCalendario
  );

  return titulo + `
    <section class="panel">
      <div class="filtros">
        <label>
          Alojamiento
          <select id="cal-alojamiento">${opcionesAlojamientos()}</select>
        </label>

        <label>
          Mes
          <input id="cal-mes" type="month" value="${escapar(ui.mes)}">
        </label>
      </div>

      ${!alojamiento.publicado ? `
        <p class="texto-secundario">
          Alojamiento desactivado: conserva su calendario y sus reservaciones.
        </p>
      ` : ''}

      <p class="leyenda">
        Verde: disponible · Azul: solicitud o estancia · Beige: bloqueo.
      </p>

      <div class="calendario">${calendarioHTML()}</div>
    </section>

    <section class="panel">
      <h2>Bloquear fechas</h2>
      <p class="texto-secundario">
        Las fechas futuras están disponibles por defecto.
        El periodo incluye la entrada y excluye la salida.
      </p>

      <form id="form-bloqueo">
        <div class="form-grid">
          <label>
            Desde *
            <input type="date" name="entrada" min="${hoy()}" required>
          </label>

          <label>
            Hasta, sin incluir *
            <input type="date" name="salida" min="${hoy()}" required>
          </label>
        </div>

        <button class="primario" type="submit">Guardar bloqueo</button>
      </form>
    </section>

    <section class="panel">
      <h2>Periodos bloqueados</h2>

      ${bloqueos.length ? bloqueos.map(b => `
        <div class="registro">
          <p>${fechaTexto(b.entrada)} al ${fechaTexto(b.salida)} (salida)</p>
          <button type="button" data-liberar="${escapar(b.id)}">
            Liberar periodo
          </button>
        </div>
      `).join('') : '<p class="texto-secundario">No hay bloqueos registrados.</p>'}
    </section>
  `;
}

function vistaReservas() {
  const estados = [
    '', 'pendiente', 'confirmada', 'finalizada', 'rechazada', 'cancelada'
  ];

  const reservas = datos.reservas.filter(
    r => !ui.estadoReserva || r.estado === ui.estadoReserva
  );

  return encabezado(
    'Reservaciones',
    'Solicitudes e historial de tus alojamientos.'
  ) + `
    <div class="filtros">
      <label>
        Estado
        <select id="filtro-reserva">
          ${estados.map(estado => `
            <option value="${estado}"
              ${estado === ui.estadoReserva ? 'selected' : ''}>
              ${estado || 'Todos los estados'}
            </option>
          `).join('')}
        </select>
      </label>
    </div>

    <p class="texto-secundario">
      Aceptar y rechazar actualiza el estado en PostgreSQL.
      La cancelación de reservas confirmadas queda pendiente de la política del proyecto.
    </p>

    <section class="panel">${tablaReservas(reservas)}</section>
  `;
}

function vistaIngresos() {
  const vigentes = datos.reservas.filter(
    r => ['confirmada', 'finalizada'].includes(r.estado)
  );

  const total = vigentes.reduce((suma, r) => suma + r.totalCentavos, 0);

  const pagado = vigentes
    .filter(r => r.pago === 'aprobado')
    .reduce((suma, r) => suma + r.totalCentavos, 0);

  const [year, month] = ui.mes.split('-').map(Number);
  const inicio = `${ui.mes}-01`;

  const fin = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const diasMes = new Date(year, month, 0).getDate();

  const nochesOcupadas = vigentes.reduce((suma, r) => {
    const desde = r.entrada > inicio ? r.entrada : inicio;
    const hasta = r.salida < fin ? r.salida : fin;

    return suma + Math.max(0, noches(desde, hasta));
  }, 0);

  const nochesTotales = datos.alojamientos.length * diasMes;
  const ocupacion = nochesTotales
    ? (nochesOcupadas / nochesTotales) * 100
    : 0;

  return encabezado(
    'Ingresos y ocupación',
    'Importes registrados en PostgreSQL. Los pagos son simulados.'
  ) + `
    <div class="filtros">
      <label>
        Mes de ocupación
        <input type="month" id="ingresos-mes" value="${escapar(ui.mes)}">
      </label>
    </div>

    <section class="indicadores">
      ${indicador('Importe reservado', moneda(total), 'Histórico: confirmadas y finalizadas')}
      ${indicador('Pagos simulados', moneda(pagado), 'Pagos simulados aprobados')}
      ${indicador('Noches ocupadas', nochesOcupadas, `Dentro de ${ui.mes}`)}
      ${indicador('Ocupación', `${ocupacion.toFixed(1)} %`, 'Sobre todos los alojamientos registrados')}
    </section>

    <section class="panel">
      <h2>Importe por alojamiento</h2>
      <p class="texto-secundario">
        Importe bruto histórico, sin comisiones, impuestos ni reembolsos.
      </p>

      ${datos.alojamientos.length ? `
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Alojamiento</th>
                <th>Reservaciones</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${datos.alojamientos.map(a => {
                const reservas = vigentes.filter(r => r.alojamientoId === a.id);
                const importe = reservas.reduce(
                  (suma, r) => suma + r.totalCentavos, 0
                );

                return `
                  <tr>
                    <td>${escapar(a.titulo)}</td>
                    <td>${reservas.length}</td>
                    <td>${moneda(importe)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : vacio('Registra un alojamiento para ver el desglose.')}
    </section>
  `;
}

function vistaResenas() {
  return encabezado(
    'Reseñas',
    'Opiniones asociadas a estancias finalizadas.'
  ) + (datos.resenas.length ? `
    <section class="panel">
      ${datos.resenas.map(r => {
        const alojamiento = alojamientoPorId(r.alojamientoId);

        return `
          <article class="registro">
            <div class="estrellas"
                 aria-label="${r.puntuacion} de 5 estrellas">
              ${'★'.repeat(r.puntuacion)}${'☆'.repeat(5 - r.puntuacion)}
            </div>
            <h3>${escapar(alojamiento?.titulo || 'Alojamiento')}</h3>
            <p>${escapar(r.comentario)}</p>
            <small>
              ${escapar(r.huesped)} · ${fechaTexto(r.fecha.slice(0,10))}
            </small>
          </article>
        `;
      }).join('')}
    </section>
  ` : vacio('Todavía no hay reseñas.'));
}

function vistaNotificaciones() {
  return encabezado(
    'Notificaciones',
    'Actividad registrada en tu cuenta.',
    '<button id="marcar-leidas" type="button">Marcar todas como leídas</button>'
  ) + (datos.notificaciones.length ? `
    <section class="panel">
      ${datos.notificaciones.map(n => `
        <article class="registro ${n.leida ? '' : 'sin-leer'}">
          <p>${escapar(n.texto)}</p>
          <small>${escapar(new Date(n.fecha).toLocaleString('es-MX'))}</small>
        </article>
      `).join('')}
    </section>
  ` : vacio('No hay notificaciones.'));
}

function render() {
  const vistas = {
    resumen: vistaResumen,
    alojamientos: vistaAlojamientos,
    calendario: vistaCalendario,
    reservas: vistaReservas,
    ingresos: vistaIngresos,
    resenas: vistaResenas,
    notificaciones: vistaNotificaciones
  };

  $('#vista').innerHTML = vistas[ui.vista]();

  document.querySelectorAll('[data-vista]').forEach(button => {
    const activo = button.dataset.vista === ui.vista;

    button.classList.toggle('activo', activo);

    if (activo) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function abrirEditor(id) {
  const form = $('#form-alojamiento');
  const a = alojamientoPorId(id);

  form.reset();

  form.elements.id.value = a?.id || '';
  form.elements.titulo.value = a?.titulo || '';
  form.elements.descripcion.value = a?.descripcion || '';
  form.elements.ubicacion.value = a?.ubicacion || '';
  form.elements.precio.value = a ? a.precioCentavos / 100 : '';
  form.elements.capacidad.value = a?.capacidad || 1;
  form.elements.caracteristicas.value = a?.caracteristicas || '';
  form.elements.publicado.checked = Boolean(a?.publicado);

  form.querySelectorAll('[name="servicio"]').forEach(input => {
    input.checked = Boolean(a?.servicios.includes(input.value));
  });

  ui.fotos = [...(a?.fotos || [])];
  $('#titulo-editor').textContent = a ? 'Editar alojamiento' : 'Nuevo alojamiento';

  renderFotos();
  $('#editor').showModal();
}

function renderFotos() {
  $('#fotos-preview').innerHTML = ui.fotos
    .map((src, index) => `
      <div>
        <img src="${escapar(src)}" alt="Fotografía ${index + 1}">
        <button type="button" data-quitar-foto="${index}">
          Quitar fotografía
        </button>
      </div>
    `).join('');
}

// Comprime las imágenes antes de enviarlas al backend.
async function comprimirImagen(file) {
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

    const escala = Math.min(1, 800 / Math.max(image.width, image.height));
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
}

$('#fotos').addEventListener('change', async event => {
  const input = event.currentTarget;
  const files = [...input.files];
  const guardar = $('#form-alojamiento [type="submit"]');

  try {
    if (ui.fotos.length + files.length > 5) {
      throw new Error('Puedes guardar hasta 5 fotografías por alojamiento.');
    }

    ui.procesandoFotos = true;
    guardar.disabled = true;
    input.disabled = true;

    const nuevas = [];

    // Procesamiento secuencial para limitar el uso de memoria.
    for (const file of files) {
      nuevas.push(await comprimirImagen(file));
    }

    ui.fotos.push(...nuevas);
    renderFotos();
  } catch (e) {
    mensaje(e.message, true);
  } finally {
    ui.procesandoFotos = false;
    guardar.disabled = false;
    input.disabled = false;
    input.value = '';
  }
});

$('#fotos-preview').addEventListener('click', event => {
  const button = event.target.closest('[data-quitar-foto]');
  if (!button || ui.procesandoFotos) return;

  ui.fotos.splice(Number(button.dataset.quitarFoto), 1);
  renderFotos();
});

function cerrarEditor() {
  if (ui.procesandoFotos) {
    mensaje('Espera a que terminen de procesarse las fotografías.', true);
    return;
  }

  $('#editor').close();
}

$('#cerrar-editor').addEventListener('click', cerrarEditor);
$('#cancelar-editor').addEventListener('click', cerrarEditor);

$('#editor').addEventListener('cancel', event => {
  if (ui.procesandoFotos) event.preventDefault();
});


$('#form-alojamiento').addEventListener('submit', async event => {
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('[type="submit"]');
  if(ui.procesandoFotos)return mensaje('Espera a que terminen las fotografías.',true);
  button.disabled=true;
  try {
    const b=Object.fromEntries(new FormData(form));
    const id=b.id;delete b.id;
    b.servicios=new FormData(form).getAll('servicio');delete b.servicio;
    b.fotos=ui.fotos;b.publicado=form.elements.publicado.checked;
    const previous=alojamientoPorId(id);b.categoria=previous?.categoria||'all';
    await Nomada.api(id?`/api/alojamientos/${id}`:'/api/alojamientos',id?'PUT':'POST',b);
    $('#editor').close();await cargarDatos();mensaje('Alojamiento guardado en PostgreSQL.');
  } catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
});
document.querySelectorAll('[data-vista]').forEach(button => {
 button.addEventListener('click',async()=>{
  ui.vista=button.dataset.vista;
  try{await cargarDatos();$('#contenido').focus();}catch(e){mensaje(e.message,true);}
 });
});
$('#vista').addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button)return;
 try {
  if(button.hasAttribute('data-nuevo'))return abrirEditor();
  if(button.dataset.editar)return abrirEditor(button.dataset.editar);
  if(button.dataset.calendario){ui.propiedadCalendario=button.dataset.calendario;ui.vista='calendario';return render();}
  button.disabled=true;
  if(button.dataset.publicar){
   const a=alojamientoPorId(button.dataset.publicar);
   await Nomada.api(`/api/alojamientos/${a.id}`,'PUT',{...a,precio:a.precioCentavos/100,publicado:!a.publicado});
  }else if(button.dataset.liberar){
   if(!confirm('¿Liberar este periodo?'))return;
   await Nomada.api(`/api/bloqueos/${button.dataset.liberar}`,'DELETE');
  }else if(button.dataset.reserva){
   if(!confirm(`¿Cambiar a ${button.dataset.estado}?`))return;
   await Nomada.api(`/api/reservas/${button.dataset.reserva}/estado`,'PATCH',{estado:button.dataset.estado});
  }else if(button.id==='marcar-leidas')await Nomada.api('/api/notificaciones','PATCH',{});
  else return;
  await cargarDatos();mensaje('Operación guardada.');
 }catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
});
$('#vista').addEventListener('change',event=>{
 const input=event.target;
 if(input.id==='cal-alojamiento')ui.propiedadCalendario=input.value;
 else if(['cal-mes','ingresos-mes'].includes(input.id)){if(!/^\d{4}-\d{2}$/.test(input.value))return;ui.mes=input.value;}
 else if(input.id==='filtro-reserva')ui.estadoReserva=input.value;
 else return;render();
});
$('#vista').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target,b=Object.fromEntries(new FormData(form));
 if(form.id==='form-busqueda'){ui.busqueda=b.busqueda.trim();return render();}
 if(form.id!=='form-bloqueo')return;
 const button=form.querySelector('button');button.disabled=true;
 try{b.alojamientoId=ui.propiedadCalendario;await Nomada.api('/api/bloqueos','POST',b);await cargarDatos();mensaje('Bloqueo guardado.');}
 catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
});
$('#cargar-demo').addEventListener('click',()=>Nomada.logout().catch(e=>mensaje(e.message,true)));
document.querySelector('main').hidden=true;
document.querySelector('aside').hidden=true;
Nomada.require('anfitrion').then(async user=>{
 document.querySelector('.sidebar-pie strong').textContent=user.nombre;
 await cargarDatos();document.querySelector('main').hidden=false;document.querySelector('aside').hidden=false;
}).catch(e=>mensaje(e.message,true));
