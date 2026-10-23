'use strict';

/**
 * NÓMADA - Espacio del Huésped
 * Frontend y Gestión de Pantallas de Huésped
 * Conectado al backend compartido y PostgreSQL
 */

const CLAVE_ANFITRION = 'nomada_anfitrion_front_v1';
const CLAVE_FAVORITOS = 'nomada_huesped_favoritos_v1';
const CLAVE_PERFIL = 'nomada_huesped_perfil_v1';
const CLAVE_NOTIF_HUESPED = 'nomada_huesped_notificaciones_v1';

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const nuevoId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Base de datos compartida con anfitrion.js
let datos = {
  version: 1,
  demoCargada: false,
  alojamientos: [],
  reservas: [],
  bloqueos: [],
  resenas: [],
  notificaciones: []
};

// Estado específico del huésped
let favoritos = [];
let perfil = {
  nombre: 'Huésped Nómada',
  email: 'viajero@nomada.mx',
  telefono: '+52 55 1234 5678',
  ciudad: 'Ciudad de México, México',
  miembroDesde: '2026'
};
let notificacionesHuesped = [];

// Estado de UI del módulo de huésped
const ui = {
  vista: 'explorar',
  filtroDestino: '',
  filtroLlegada: '',
  filtroSalida: '',
  filtroHuespedes: 1,
  filtroServicio: 'todos',
  pestanaViajes: 'todas',
  alojamientoModal: null,
  reservaModal: null,
  puntuacionSeleccionada: 5
};

// Fotografías curadas de alta calidad para demostración si un alojamiento no tiene fotos subidas
const FOTOS_FALLBACK = ['public/sin-foto.svg'];

/* ==========================================================================
   UTILIDADES
   ========================================================================== */
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

function noches(entrada, salida) {
  if (!entrada || !salida) return 0;
  const n = (Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${entrada}T00:00:00Z`)) / 86400000;
  return isNaN(n) || n <= 0 ? 0 : Math.round(n);
}

function moneda(centavos) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format((centavos || 0) / 100);
}

function fechaTexto(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${fecha}T12:00:00`));
}

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
  if (!box) return;
  box.textContent = texto;
  box.classList.toggle('error', error);
  box.hidden = false;

  clearTimeout(mensaje.timer);
  mensaje.timer = setTimeout(() => {
    box.hidden = true;
  }, 5000);
}

function obtenerFotoAlojamiento(alojamiento, indice = 0) {
  if (alojamiento.fotos && alojamiento.fotos.length > indice && alojamiento.fotos[indice]) {
    return alojamiento.fotos[indice];
  }
  if (alojamiento.fotos && alojamiento.fotos.length > 0 && alojamiento.fotos[0]) {
    return alojamiento.fotos[0];
  }
  // Fallback determinista basado en el ID
  const hash = Math.abs((alojamiento.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return FOTOS_FALLBACK[(hash + indice) % FOTOS_FALLBACK.length];
}

function calcularCalificacionAlojamiento(alojamientoId) {
  const resenas = datos.resenas.filter(r => r.alojamientoId === alojamientoId);
  if (!resenas.length) {
    return { promedio: 5.0, total: 0, nueva: true };
  }
  const suma = resenas.reduce((acc, r) => acc + (Number(r.puntuacion) || 5), 0);
  return {
    promedio: Number((suma / resenas.length).toFixed(1)),
    total: resenas.length,
    nueva: false
  };
}

/* ==========================================================================
   ALMACENAMIENTO Y SINCRONIZACIÓN
   ========================================================================== */

let disponibles=null;
async function cargarDatos() {
  datos=await Nomada.api('/api/huesped/panel');
  favoritos=datos.favoritos;perfil=datos.perfil;notificacionesHuesped=datos.notificaciones;
  const p=new URLSearchParams({personas:ui.filtroHuespedes,q:ui.filtroDestino});
  if(ui.filtroLlegada||ui.filtroSalida){p.set('entrada',ui.filtroLlegada);p.set('salida',ui.filtroSalida);}
  disponibles=new Set((await Nomada.api('/api/alojamientos?'+p)).map(a=>a.id));
  actualizarInfoSidebar();actualizarBadgesNav();render();
}
function actualizarInfoSidebar() {
  const nombreSidebar = $('#nombre-sidebar');
  const avatarSidebar = $('#avatar-sidebar');
  if (nombreSidebar) nombreSidebar.textContent = perfil.nombre;
  if (avatarSidebar) avatarSidebar.textContent = (perfil.nombre || 'H').charAt(0).toUpperCase();
}

function actualizarBadgesNav() {
  const badgeViajes = $('#badge-viajes');
  const badgeFavoritos = $('#badge-favoritos');
  const badgeNotificaciones = $('#badge-notificaciones');

  const viajesActivos = datos.reservas.filter(r => ['pendiente', 'confirmada'].includes(r.estado)).length;
  if (badgeViajes) {
    badgeViajes.textContent = viajesActivos;
    badgeViajes.hidden = viajesActivos === 0;
  }

  const totalFavs = favoritos.length;
  if (badgeFavoritos) {
    badgeFavoritos.textContent = totalFavs;
    badgeFavoritos.hidden = totalFavs === 0;
  }

  const notifsNoLeidas = notificacionesHuesped.filter(n => !n.leida).length;
  if (badgeNotificaciones) {
    badgeNotificaciones.textContent = notifsNoLeidas;
    badgeNotificaciones.hidden = notifsNoLeidas === 0;
  }
}

/* ==========================================================================
   VISTAS DEL HUÉSPED
   ========================================================================== */

// VISTA 1: EXPLORAR ESTANCIAS
function vistaExplorar() {
  const destinoBusqueda = ui.filtroDestino.trim().toLowerCase();
  const filtroServicio = ui.filtroServicio;

  // Filtrar alojamientos que estén publicados y cumplan con los criterios
  let alojamientos = datos.alojamientos.filter(a => a.publicado !== false && (!disponibles || disponibles.has(a.id)));

  if (destinoBusqueda) {
    alojamientos = alojamientos.filter(a =>
      (a.titulo || '').toLowerCase().includes(destinoBusqueda) ||
      (a.ubicacion || '').toLowerCase().includes(destinoBusqueda) ||
      (a.descripcion || '').toLowerCase().includes(destinoBusqueda)
    );
  }

  if (ui.filtroHuespedes > 1) {
    alojamientos = alojamientos.filter(a => (a.capacidad || 1) >= ui.filtroHuespedes);
  }

  if (filtroServicio && filtroServicio !== 'todos') {
    alojamientos = alojamientos.filter(a =>
      Array.isArray(a.servicios) && a.servicios.includes(filtroServicio)
    );
  }

  const serviciosDisponibles = ['todos', 'Wi-Fi', 'Alberca', 'Cocina', 'Estacionamiento', 'Jardín', 'Aire acondicionado'];

  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">EXPLORA Y ENCUENTRA TU PRÓXIMO DESTINO</p>
        <h1>Alojamientos en Nómada</h1>
        <p class="texto-secundario">Casas completas, cabañas de descanso y residencias exclusivas listas para recibirte.</p>
      </div>
      <div class="indicador-total-disponibles">
        <span class="badge-capacidad" style="position: static; background: var(--verde-claro); color: var(--verde-oscuro); border: 1px solid #cce2d6;">
          ${alojamientos.length} opción(es) disponible(s)
        </span>
      </div>
    </div>

    <!-- Barra interactiva de búsqueda -->
    <div class="caja-busqueda-huesped">
      <form id="form-busqueda-huesped" class="form-busqueda-grid">
        <div class="campo-busqueda">
          <label for="busqueda-destino">Destino o palabras clave</label>
          <input
            id="busqueda-destino"
            name="destino"
            type="text"
            placeholder="Ej. Cancún, Valle de Bravo, alberca..."
            value="${escapar(ui.filtroDestino)}"
          />
        </div>

        <div class="campo-busqueda">
          <label for="busqueda-llegada">Llegada</label>
          <input
            id="busqueda-llegada"
            name="llegada"
            type="date"
            min="${hoy()}"
            value="${escapar(ui.filtroLlegada)}"
          />
        </div>

        <div class="campo-busqueda">
          <label for="busqueda-salida">Salida</label>
          <input
            id="busqueda-salida"
            name="salida"
            type="date"
            min="${ui.filtroLlegada ? sumarDias(ui.filtroLlegada, 1) : sumarDias(hoy(), 1)}"
            value="${escapar(ui.filtroSalida)}"
          />
        </div>

        <div class="campo-busqueda">
          <label for="busqueda-huespedes">Huéspedes</label>
          <select id="busqueda-huespedes" name="huespedes">
            <option value="1" ${ui.filtroHuespedes === 1 ? 'selected' : ''}>1 huésped</option>
            <option value="2" ${ui.filtroHuespedes === 2 ? 'selected' : ''}>2 huéspedes</option>
            <option value="4" ${ui.filtroHuespedes === 4 ? 'selected' : ''}>4+ huéspedes</option>
            <option value="6" ${ui.filtroHuespedes === 6 ? 'selected' : ''}>6+ huéspedes</option>
          </select>
        </div>

        <div class="busqueda-acciones">
          <button type="submit" class="primario">
            <span>⌕ Buscar</span>
          </button>
          ${(ui.filtroDestino || ui.filtroLlegada || ui.filtroSalida || ui.filtroHuespedes > 1 || ui.filtroServicio !== 'todos') ? `
            <button type="button" id="limpiar-busqueda" class="secundario-btn" title="Restablecer filtros">
              ✕
            </button>
          ` : ''}
        </div>
      </form>
    </div>

    <!-- Chips de categorías / servicios -->
    <div class="chips-filtros" role="toolbar" aria-label="Filtrar por servicios">
      ${serviciosDisponibles.map(servicio => `
        <button
          type="button"
          class="chip-filtro ${ui.filtroServicio === servicio ? 'activo' : ''}"
          data-servicio="${servicio}"
        >
          ${servicio === 'todos' ? '✨ Todos los servicios' : servicio}
        </button>
      `).join('')}
    </div>

    <!-- Rejilla de Alojamientos -->
    ${alojamientos.length ? `
      <div class="rejilla-huesped">
        ${alojamientos.map(a => {
          const esFav = favoritos.includes(a.id);
          const fotoPrincipal = obtenerFotoAlojamiento(a, 0);
          const calif = calcularCalificacionAlojamiento(a.id);

          return `
            <article class="tarjeta-alojamiento" data-alojamiento-id="${escapar(a.id)}">
              <div class="tarjeta-imagen-wrapper">
                <img
                  src="${escapar(fotoPrincipal)}"
                  alt="${escapar(a.titulo)}"
                  class="tarjeta-imagen"
                  loading="lazy"
                />
                
                <button
                  type="button"
                  class="boton-favorito ${esFav ? 'activo' : ''}"
                  data-toggle-fav="${escapar(a.id)}"
                  aria-label="${esFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
                  title="${esFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
                >
                  ${esFav ? '♥' : '♡'}
                </button>

                <span class="badge-capacidad">
                  Hasta ${a.capacidad || 1} huésped(es)
                </span>
              </div>

              <div class="tarjeta-cuerpo">
                <div class="tarjeta-cabecera">
                  <div>
                    <h3 class="tarjeta-titulo">${escapar(a.titulo)}</h3>
                    <div class="tarjeta-ubicacion">
                      <span>📍 ${escapar(a.ubicacion)}</span>
                    </div>
                  </div>

                  <div class="tarjeta-rating" title="Calificación promedio">
                    <span class="icono-estrella">★</span>
                    <span>${calif.promedio}</span>
                    <small style="color: var(--secundario);">(${calif.total})</small>
                  </div>
                </div>

                ${Array.isArray(a.servicios) && a.servicios.length ? `
                  <div class="tarjeta-servicios">
                    ${a.servicios.slice(0, 3).map(s => `
                      <span class="chip-servicio">${escapar(s)}</span>
                    `).join('')}
                    ${a.servicios.length > 3 ? `<span class="chip-servicio">+${a.servicios.length - 3}</span>` : ''}
                  </div>
                ` : ''}

                <div class="tarjeta-pie">
                  <div class="tarjeta-precio">
                    <span class="precio-valor">${moneda(a.precioCentavos)}</span>
                    <span class="precio-unidad">por noche</span>
                  </div>

                  <button
                    type="button"
                    class="primario boton-ver-alojamiento"
                    data-ver-detalle="${escapar(a.id)}"
                  >
                    Ver y reservar
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="vacio">
        <div class="vacio-icono">⌂</div>
        <h3>No se encontraron alojamientos con estos filtros</h3>
        <p>Prueba con otros términos de búsqueda, modifica las fechas o limpia los filtros.</p>
        <button type="button" class="primario" id="btn-reset-filtros">Ver todos los alojamientos</button>
      </div>
    `}
  `;
}

// VISTA 2: MIS RESERVACIONES / MIS VIAJES
function vistaViajes() {
  const reservas = datos.reservas;

  // Filtrado según la pestaña activa
  const reservasFiltradas = ui.pestanaViajes === 'todas'
    ? reservas
    : reservas.filter(r => r.estado === ui.pestanaViajes);

  // Estadísticas rápidas del huésped
  const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const finalizadas = reservas.filter(r => r.estado === 'finalizada').length;
  const pendientes = reservas.filter(r => r.estado === 'pendiente').length;

  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">TUS ESTANCIAS Y VIAJES</p>
        <h1>Mis reservaciones</h1>
        <p class="texto-secundario">Consulta el estado de tus solicitudes, revisa itinerarios y descarga tus comprobantes.</p>
      </div>

      <button type="button" class="primario" data-ir-explorar>
        + Explorar nuevos destinos
      </button>
    </div>

    <!-- Indicadores de viajes -->
    <div class="indicadores">
      <div class="indicador">
        <span>Próximos viajes</span>
        <strong>${confirmadas}</strong>
        <small>Listos para disfrutar</small>
      </div>
      <div class="indicador">
        <span>Solicitudes pendientes</span>
        <strong>${pendientes}</strong>
        <small>Esperando confirmación del anfitrión</small>
      </div>
      <div class="indicador">
        <span>Estancias completadas</span>
        <strong>${finalizadas}</strong>
        <small>Viajes realizados con éxito</small>
      </div>
    </div>

    <!-- Pestañas de estado -->
    <div class="pestanas-viajes" role="tablist">
      <button type="button" class="pestana-btn ${ui.pestanaViajes === 'todas' ? 'activa' : ''}" data-pestana="todas">
        Todas (${reservas.length})
      </button>
      <button type="button" class="pestana-btn ${ui.pestanaViajes === 'confirmada' ? 'activa' : ''}" data-pestana="confirmada">
        Confirmadas (${confirmadas})
      </button>
      <button type="button" class="pestana-btn ${ui.pestanaViajes === 'pendiente' ? 'activa' : ''}" data-pestana="pendiente">
        Pendientes (${pendientes})
      </button>
      <button type="button" class="pestana-btn ${ui.pestanaViajes === 'finalizada' ? 'activa' : ''}" data-pestana="finalizada">
        Finalizadas (${finalizadas})
      </button>
      <button type="button" class="pestana-btn ${ui.pestanaViajes === 'cancelada' ? 'activa' : ''}" data-pestana="cancelada">
        Canceladas (${reservas.filter(r => r.estado === 'cancelada').length})
      </button>
    </div>

    <!-- Lista de reservaciones -->
    ${reservasFiltradas.length ? `
      <div class="lista-viajes">
        ${reservasFiltradas.map(r => {
          const a = datos.alojamientos.find(item => item.id === r.alojamientoId);
          const foto = a ? obtenerFotoAlojamiento(a, 0) : FOTOS_FALLBACK[0];
          const duracionNoches = noches(r.entrada, r.salida);
          const yaTieneResena = datos.resenas.some(res => res.reservaId === r.id && res.propia);

          return `
            <article class="tarjeta-viaje" data-reserva-id="${escapar(r.id)}">
              <div class="tarjeta-viaje-foto">
                <img src="${escapar(foto)}" alt="${escapar(a?.titulo || 'Alojamiento')}">
              </div>

              <div class="tarjeta-viaje-detalles">
                <span class="viaje-codigo">Código: ${escapar(r.id.slice(0, 8).toUpperCase())}</span>
                <h3>${escapar(a?.titulo || 'Alojamiento en Nómada')}</h3>
                <p class="texto-secundario" style="margin-bottom: 4px;">📍 ${escapar(a?.ubicacion || 'Ubicación reservada')}</p>

                <div class="viaje-fechas">
                  <span>📅 ${fechaTexto(r.entrada)} — ${fechaTexto(r.salida)}</span>
                  <span class="viaje-noches">(${duracionNoches} noche${duracionNoches === 1 ? '' : 's'})</span>
                </div>

                <div class="viaje-metas">
                  <span>👥 ${r.personas} persona(s)</span>
                  <span>•</span>
                  <span>Huésped: <strong>${escapar(r.huesped)}</strong></span>
                </div>
              </div>

              <div class="tarjeta-viaje-acciones">
                <span class="estado ${escapar(r.estado)}">${escapar(r.estado)}</span>

                <div class="viaje-total">
                  <strong>${moneda(r.totalCentavos)}</strong>
                  <small>Pago simulado: ${escapar(r.pago || 'aprobado')}</small>
                </div>

                <div class="viaje-botones">
                  ${r.estado==='confirmada' && r.pago!=='aprobado' ? `<button type="button" class="primario" data-pagar="${r.id}" data-resultado="aprobado">Simular pago aprobado</button><button type="button" data-pagar="${r.id}" data-resultado="rechazado">Simular pago rechazado</button>` : ''}
                  <button
                    type="button"
                    class="secundario-btn"
                    data-ver-voucher="${escapar(r.id)}"
                    title="Ver comprobante e itinerario detallado"
                  >
                    📄 Comprobante
                  </button>

                  ${r.estado === 'pendiente' ? `
                    <button
                      type="button"
                      class="peligro"
                      data-cancelar-reserva="${escapar(r.id)}"
                      title="Cancelar esta reservación"
                    >
                      Cancelar
                    </button>
                  ` : ''}

                  ${r.estado === 'finalizada' && !yaTieneResena ? `
                    <button
                      type="button"
                      class="secundario-btn"
                      data-abrir-resena="${escapar(r.id)}"
                      style="color: #b47814; border-color: #eddcb0;"
                    >
                      ${yaTieneResena ? '★ Reseña enviada' : '★ Dejar reseña'}
                    </button>
                  ` : ''}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="vacio">
        <div class="vacio-icono">✈</div>
        <h3>No tienes reservaciones en esta sección</h3>
        <p>Cuando solicites una estancia en Nómada, podrás consultar el comprobante, las fechas y los detalles aquí.</p>
        <button type="button" class="primario" data-ir-explorar>Explorar alojamientos disponibles</button>
      </div>
    `}
  `;
}

// VISTA 3: FAVORITOS
function vistaFavoritos() {
  const alojamientosFavoritos = datos.alojamientos.filter(a => favoritos.includes(a.id));

  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">LISTA DE DESEOS</p>
        <h1>Alojamientos favoritos</h1>
        <p class="texto-secundario">Tus lugares preferidos guardados para planear tu próxima escapada.</p>
      </div>

      ${alojamientosFavoritos.length ? `
        <button type="button" class="secundario-btn" id="vaciar-favoritos">
          Vaciar lista de favoritos
        </button>
      ` : ''}
    </div>

    ${alojamientosFavoritos.length ? `
      <div class="rejilla-huesped">
        ${alojamientosFavoritos.map(a => {
          const fotoPrincipal = obtenerFotoAlojamiento(a, 0);
          const calif = calcularCalificacionAlojamiento(a.id);

          return `
            <article class="tarjeta-alojamiento" data-alojamiento-id="${escapar(a.id)}">
              <div class="tarjeta-imagen-wrapper">
                <img
                  src="${escapar(fotoPrincipal)}"
                  alt="${escapar(a.titulo)}"
                  class="tarjeta-imagen"
                  loading="lazy"
                />
                
                <button
                  type="button"
                  class="boton-favorito activo"
                  data-toggle-fav="${escapar(a.id)}"
                  aria-label="Quitar de favoritos"
                  title="Quitar de favoritos"
                >
                  ♥
                </button>

                <span class="badge-capacidad">
                  Hasta ${a.capacidad || 1} huésped(es)
                </span>
              </div>

              <div class="tarjeta-cuerpo">
                <div class="tarjeta-cabecera">
                  <div>
                    <h3 class="tarjeta-titulo">${escapar(a.titulo)}</h3>
                    <div class="tarjeta-ubicacion">
                      <span>📍 ${escapar(a.ubicacion)}</span>
                    </div>
                  </div>

                  <div class="tarjeta-rating" title="Calificación promedio">
                    <span class="icono-estrella">★</span>
                    <span>${calif.promedio}</span>
                    <small>(${calif.total})</small>
                  </div>
                </div>

                <div class="tarjeta-pie">
                  <div class="tarjeta-precio">
                    <span class="precio-valor">${moneda(a.precioCentavos)}</span>
                    <span class="precio-unidad">por noche</span>
                  </div>

                  <button
                    type="button"
                    class="primario boton-ver-alojamiento"
                    data-ver-detalle="${escapar(a.id)}"
                  >
                    Reservar ahora
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="vacio">
        <div class="vacio-icono">♡</div>
        <h3>No tienes alojamientos guardados en favoritos</h3>
        <p>Haz clic en el corazón de cualquier alojamiento que te guste en la pantalla de Explorar para tenerlo a mano.</p>
        <button type="button" class="primario" data-ir-explorar>Explorar alojamientos</button>
      </div>
    `}
  `;
}

// VISTA 4: MIS RESEÑAS
function vistaResenas() {
  const resenasHuesped = datos.resenas.filter(r => r.propia);

  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">OPINIONES DE LA COMUNIDAD</p>
        <h1>Mis reseñas y calificaciones</h1>
        <p class="texto-secundario">Tus comentarios y evaluaciones compartidas sobre alojamientos en los que te has hospedado.</p>
      </div>
    </div>

    ${resenasHuesped.length ? `
      <div class="resenas-grid">
        ${resenasHuesped.map(r => {
          const a = datos.alojamientos.find(item => item.id === r.alojamientoId);

          return `
            <article class="tarjeta-resena">
              <div class="resena-cabecera">
                <div>
                  <h3 style="margin-bottom: 2px;">${escapar(a?.titulo || 'Alojamiento en Nómada')}</h3>
                  <small class="texto-secundario">📍 ${escapar(a?.ubicacion || 'México')} · ${fechaTexto(r.fecha.slice(0,10))}</small>
                </div>

                <div class="estrellas" aria-label="${r.puntuacion} de 5 estrellas">
                  ${'★'.repeat(r.puntuacion)}${'☆'.repeat(5 - r.puntuacion)}
                </div>
              </div>

              <p class="resena-comentario">"${escapar(r.comentario)}"</p>
              <small class="texto-secundario">Publicado por ${escapar(r.huesped)}</small>
            </article>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="vacio">
        <div class="vacio-icono">☆</div>
        <h3>Aún no has escrito ninguna reseña</h3>
        <p>Una vez que completes una estancia, podrás calificar tu experiencia para guiar a otros viajeros.</p>
        <button type="button" class="primario" data-vista-btn="viajes">Ir a mis reservaciones</button>
      </div>
    `}
  `;
}

// VISTA 5: NOTIFICACIONES
function vistaNotificaciones() {
  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">CENTRO DE AVISOS</p>
        <h1>Notificaciones</h1>
        <p class="texto-secundario">Avisos de tus reservaciones, cambios de estado y novedades del sistema.</p>
      </div>

      ${notificacionesHuesped.length ? `
        <button type="button" class="secundario-btn" id="marcar-todas-leidas">
          Marcar todas como leídas
        </button>
      ` : ''}
    </div>

    <div class="panel" style="padding: 0; overflow: hidden;">
      ${notificacionesHuesped.length ? `
        <div>
          ${notificacionesHuesped.map(n => `
            <div class="registro-notif ${n.leida ? '' : 'sin-leer'}">
              <div>
                <p>${escapar(n.texto)}</p>
                <small>${new Date(n.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</small>
              </div>

              ${!n.leida ? `
                <span class="badge-capacidad" style="position: static; font-size: 10px; background: var(--verde-claro); color: var(--verde);">
                  Nueva
                </span>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="vacio" style="border: none;">
          <div class="vacio-icono">○</div>
          <h3>No tienes notificaciones pendientes</h3>
          <p>Te avisaremos en cuanto el anfitrión confirme o responda a tus solicitudes de reservación.</p>
        </div>
      `}
    </div>
  `;
}

// VISTA 6: MI PERFIL DE HUÉSPED
function vistaPerfil() {
  const totalViajes = datos.reservas.length;
  const totalNoches = datos.reservas.reduce((sum, r) => sum + noches(r.entrada, r.salida), 0);
  const totalResenas = datos.resenas.filter(r => r.huesped === perfil.nombre).length;

  return `
    <div class="encabezado">
      <div>
        <p class="etiqueta">CUENTA DEL VIAJERO</p>
        <h1>Mi perfil de huésped</h1>
        <p class="texto-secundario">Administra tus datos personales y consulta el resumen de tus viajes en Nómada.</p>
      </div>
    </div>

    <div class="perfil-grid">
      <!-- Columna Lateral: Tarjeta Resumen -->
      <div class="perfil-tarjeta-lateral">
        <div class="perfil-avatar-grande" id="perfil-avatar-letra">
          ${(perfil.nombre || 'H').charAt(0).toUpperCase()}
        </div>

        <h3 id="perfil-nombre-tarjeta">${escapar(perfil.nombre)}</h3>
        <p class="texto-secundario" style="margin-bottom: 12px;">${escapar(perfil.ciudad)}</p>

        <span class="perfil-badge-verificado">
          Cuenta autenticada
        </span>

        <p class="texto-secundario" style="font-size: 12px; margin-bottom: 16px;">
          Miembro de Nómada desde ${escapar(perfil.miembroDesde)}
        </p>

        <div class="perfil-stats-resumen">
          <div class="perfil-stat-item">
            <strong>${totalViajes}</strong>
            <small>Viajes</small>
          </div>
          <div class="perfil-stat-item">
            <strong>${totalNoches}</strong>
            <small>Noches</small>
          </div>
          <div class="perfil-stat-item">
            <strong>${favoritos.length}</strong>
            <small>Favoritos</small>
          </div>
          <div class="perfil-stat-item">
            <strong>${totalResenas}</strong>
            <small>Reseñas</small>
          </div>
        </div>
      </div>

      <!-- Columna Principal: Formulario de Edición -->
      <div class="perfil-formulario-panel">
        <h2>Información del viajero</h2>
        <p class="texto-secundario">
          Estos datos se utilizarán automáticamente cuando reserves un alojamiento y para tus comprobantes.
        </p>

        <form id="form-perfil-huesped">
          <label>
            Nombre completo *
            <input
              type="text"
              name="nombre"
              value="${escapar(perfil.nombre)}"
              required
            />
          </label>

          <label>
            Correo electrónico *
            <input
              type="email"
              name="email"
              value="${escapar(perfil.email)}"
              readonly
            />
          </label>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <label>
              Teléfono de contacto
              <input
                type="tel"
                name="telefono"
                value="${escapar(perfil.telefono)}"
              />
            </label>

            <label>
              Ciudad / País de residencia
              <input
                type="text"
                name="ciudad"
                value="${escapar(perfil.ciudad)}"
              />
            </label>
          </div>

          <div class="acciones-modal" style="margin-top: 18px;">
            <button type="submit" class="primario">
              Guardar cambios del perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/* ==========================================================================
   RENDER PRINCIPAL
   ========================================================================== */
function render() {
  const vistas = {
    explorar: vistaExplorar,
    viajes: vistaViajes,
    favoritos: vistaFavoritos,
    resenas: vistaResenas,
    notificaciones: vistaNotificaciones,
    perfil: vistaPerfil
  };

  const contenedor = $('#vista');
  if (contenedor && vistas[ui.vista]) {
    contenedor.innerHTML = vistas[ui.vista]();
  }

  // Actualizar título de la barra superior
  const titulos = {
    explorar: 'Explorar estancias',
    viajes: 'Mis reservaciones',
    favoritos: 'Favoritos guardados',
    resenas: 'Mis opiniones',
    notificaciones: 'Notificaciones',
    perfil: 'Mi perfil'
  };
  const tituloBarra = $('#titulo-pagina-barra');
  if (tituloBarra) tituloBarra.textContent = titulos[ui.vista] || 'Huésped';

  // Actualizar estado activo en los botones de navegación de la barra lateral
  $$('[data-vista]').forEach(btn => {
    const activo = btn.dataset.vista === ui.vista;
    btn.classList.toggle('activo', activo);
    if (activo) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  actualizarBadgesNav();
}

/* ==========================================================================
   MODAL: DETALLES DE ALOJAMIENTO Y COTIZADOR DE RESERVAS
   ========================================================================== */
function abrirDetalleAlojamiento(alojamientoId) {
  const a = datos.alojamientos.find(item => item.id === alojamientoId);
  if (!a) {
    mensaje('Alojamiento no encontrado.', true);
    return;
  }

  ui.alojamientoModal = a;

  const foto1 = obtenerFotoAlojamiento(a, 0);
  const foto2 = obtenerFotoAlojamiento(a, 1);
  const foto3 = obtenerFotoAlojamiento(a, 2);
  const calif = calcularCalificacionAlojamiento(a.id);
  const resenasAlojamiento = datos.resenas.filter(r => r.alojamientoId === a.id);

  // Fechas por defecto: mañana por 3 noches
  const fechaLlegadaDefecto = ui.filtroLlegada || sumarDias(hoy(), 1);
  const fechaSalidaDefecto = ui.filtroSalida || sumarDias(fechaLlegadaDefecto, 3);
  const nochesDefecto = noches(fechaLlegadaDefecto, fechaSalidaDefecto);
  const subtotalDefecto = (a.precioCentavos * nochesDefecto);
  const tarifaServicioDefecto = Math.round(subtotalDefecto * datos.serviceFeeBps / 10000);
  const totalDefecto = subtotalDefecto + tarifaServicioDefecto;

  $('#detalle-titulo').textContent = a.titulo;

  $('#detalle-cuerpo').innerHTML = `
    <!-- Columna Izquierda: Información del Alojamiento -->
    <div class="detalle-info-col">
      <div class="modal-galeria">
        <img src="${escapar(foto1)}" alt="${escapar(a.titulo)}" class="modal-foto-principal">
        <div class="modal-fotos-secundarias">
          <img src="${escapar(foto2)}" alt="${escapar(a.titulo)} 2" class="modal-foto-secundaria">
          <img src="${escapar(foto3)}" alt="${escapar(a.titulo)} 3" class="modal-foto-secundaria">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <span class="badge-capacidad" style="position: static; background: var(--verde-claro); color: var(--verde-oscuro); border: 1px solid #cce2d6;">
          Capacidad: hasta ${a.capacidad || 1} personas
        </span>
        <span class="badge-capacidad" style="position: static; margin-left: 8px; background: #fff8e6; color: #8c6a1e; border: 1px solid #eddcb0;">
          ★ ${calif.promedio} (${calif.total} evaluaciones)
        </span>
      </div>

      <h2>Acerca de este espacio</h2>
      <p style="color: var(--texto); line-height: 1.7; margin-bottom: 24px; white-space: pre-line;">
        ${escapar(a.descripcion || 'Sin descripción disponible.')}
      </p>

      ${a.caracteristicas ? `
        <h3>Otras características</h3>
        <p style="color: var(--secundario); margin-bottom: 24px;">${escapar(a.caracteristicas)}</p>
      ` : ''}

      <h3>Servicios que ofrece el alojamiento</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px;">
        ${Array.isArray(a.servicios) && a.servicios.length ? a.servicios.map(s => `
          <span class="chip-filtro" style="cursor: default; background: #f2f6f4; border-color: #d8e5df; color: var(--verde-oscuro);">
            ✓ ${escapar(s)}
          </span>
        `).join('') : '<p class="texto-secundario">Servicios básicos incluidos.</p>'}
      </div>

      <!-- Sección de Reseñas del Alojamiento -->
      <div style="border-top: 1px solid var(--borde); padding-top: 24px;">
        <h3>Opiniones de otros huéspedes (${resenasAlojamiento.length})</h3>
        ${resenasAlojamiento.length ? `
          <div style="display: grid; gap: 14px; margin-top: 14px;">
            ${resenasAlojamiento.map(r => `
              <div style="padding: 14px; background: var(--fondo); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <strong>${escapar(r.huesped)}</strong>
                  <span class="estrellas" style="font-size: 14px;">${'★'.repeat(r.puntuacion)}${'☆'.repeat(5 - r.puntuacion)}</span>
                </div>
                <p style="font-size: 13.5px; margin: 0; color: var(--texto);">"${escapar(r.comentario)}"</p>
                <small class="texto-secundario">${fechaTexto(r.fecha.slice(0,10))}</small>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="texto-secundario" style="margin-top: 8px;">Aún no hay reseñas registradas para este espacio. ¡Sé el primero en alojarte y dejar tu opinión!</p>
        `}
      </div>
    </div>

    <!-- Columna Derecha: Tarjeta de Cotización y Reserva -->
    <div class="tarjeta-reserva-cotizador">
      <div class="cotizador-precio-header">
        <div>
          <span class="cotizador-precio">${moneda(a.precioCentavos)}</span>
          <span class="texto-secundario" style="font-size: 13px;"> / noche</span>
        </div>
        <div style="font-weight: 700; font-size: 13px;">
          ★ ${calif.promedio}
        </div>
      </div>

      <form id="form-reservar-estancia">
        <input type="hidden" name="alojamientoId" value="${escapar(a.id)}">

        <div class="cotizador-inputs">
          <div class="fechas-split">
            <div class="fecha-box">
              <label for="res-llegada">LLEGADA</label>
              <input
                type="date"
                id="res-llegada"
                name="llegada"
                min="${hoy()}"
                value="${fechaLlegadaDefecto}"
                required
              />
            </div>

            <div class="fecha-box">
              <label for="res-salida">SALIDA</label>
              <input
                type="date"
                id="res-salida"
                name="salida"
                min="${sumarDias(fechaLlegadaDefecto, 1)}"
                value="${fechaSalidaDefecto}"
                required
              />
            </div>
          </div>

          <div class="huespedes-box">
            <label for="res-personas">HUÉSPEDES</label>
            <select id="res-personas" name="personas">
              ${Array.from({ length: a.capacidad || 1 }, (_, i) => i + 1).map(num => `
                <option value="${num}" ${num === Math.min(ui.filtroHuespedes, a.capacidad || 1) ? 'selected' : ''}>
                  ${num} huésped${num > 1 ? 'es' : ''}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="datos-viajero-form">
          <label>
            Nombre del huésped *
            <input
              type="text"
              name="huespedNombre"
              value="${escapar(perfil.nombre)}"
              readonly
            />
          </label>

          <label>
            Correo electrónico para confirmación *
            <input
              type="email"
              name="huespedEmail"
              value="${escapar(perfil.email)}"
              readonly
            />
          </label>

          <label>
            Mensaje o notas para el anfitrión (opcional)
            <textarea
              name="notas"
              rows="2"
              placeholder="Hora aproximada de llegada, motivo de viaje, requerimientos..."
            ></textarea>
          </label>
        </div>

        <!-- Desglose dinámico de costos -->
        <div class="desglose-costos" id="desglose-costos">
          <div class="fila-costo">
            <span id="costo-noches-label">${moneda(a.precioCentavos)} x ${nochesDefecto} noches</span>
            <span id="costo-noches-valor">${moneda(subtotalDefecto)}</span>
          </div>

          <div class="fila-costo">
            <span>Tarifa configurada de servicio</span>
            <span id="costo-tarifa-valor">${moneda(tarifaServicioDefecto)}</span>
          </div>

          <div class="fila-costo total">
            <span>Total aproximado</span>
            <span id="costo-total-valor" style="color: var(--verde);">${moneda(totalDefecto)}</span>
          </div>
        </div>

        <button type="submit" class="primario boton-reservar-grande">
          Solicitar reservación
        </button>

        <p class="texto-secundario" style="text-align: center; font-size: 11.5px; margin-top: 10px; margin-bottom: 0;">
          Demostración: no se realiza ningún cobro bancario real.
        </p>
      </form>
    </div>
  `;

  // Añadir eventos a inputs de fecha para recalcular en tiempo real
  const inputLlegada = $('#res-llegada');
  const inputSalida = $('#res-salida');

  function actualizarCalculoCostos() {
    const llegadaVal = inputLlegada.value;
    const salidaVal = inputSalida.value;
    const n = noches(llegadaVal, salidaVal);

    if (n <= 0) {
      $('#costo-noches-label').textContent = 'Fechas inválidas';
      $('#costo-noches-valor').textContent = '$0.00';
      $('#costo-tarifa-valor').textContent = '$0.00';
      $('#costo-total-valor').textContent = '$0.00';
      return;
    }

    const sub = a.precioCentavos * n;
    const tarifa = Math.round(sub * datos.serviceFeeBps / 10000);
    const tot = sub + tarifa;

    $('#costo-noches-label').textContent = `${moneda(a.precioCentavos)} x ${n} noche${n === 1 ? '' : 's'}`;
    $('#costo-noches-valor').textContent = moneda(sub);
    $('#costo-tarifa-valor').textContent = moneda(tarifa);
    $('#costo-total-valor').textContent = moneda(tot);
  }

  inputLlegada.addEventListener('change', () => {
    inputSalida.min = sumarDias(inputLlegada.value, 1);
    if (inputSalida.value <= inputLlegada.value) {
      inputSalida.value = sumarDias(inputLlegada.value, 1);
    }
    actualizarCalculoCostos();
  });

  inputSalida.addEventListener('change', actualizarCalculoCostos);

  // Manejador del formulario de reserva

  const form=$('#form-reservar-estancia');
  let key=null,signature='';
  form.addEventListener('submit',async event=>{
    event.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
    try{
      const b={alojamientoId:a.id,entrada:form.elements.llegada.value,salida:form.elements.salida.value,personas:form.elements.personas.value,notas:form.elements.notas.value};
      const next=JSON.stringify(b);if(next!==signature){key=crypto.randomUUID();signature=next;}
      b.claveOperacion=key;
      await Nomada.api('/api/reservas','POST',b);
      $('#modal-detalle').close();ui.vista='viajes';await cargarDatos();mensaje('Solicitud guardada. El anfitrión debe confirmarla antes del pago simulado.');
    }catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
  });

  $('#modal-detalle').showModal();
}

/* ==========================================================================
   MODAL: COMPROBANTE / VOUCHER DE VIAJE
   ========================================================================== */
function abrirVoucher(reservaId) {
  const r = datos.reservas.find(item => item.id === reservaId);
  if (!r) {
    mensaje('Reservación no encontrada.', true);
    return;
  }

  const a = datos.alojamientos.find(item => item.id === r.alojamientoId);
  const cantNoches = noches(r.entrada, r.salida);
  const codigoReserva = (r.id.slice(0, 8)).toUpperCase();

  $('#voucher-titulo').textContent = `Comprobante NOM-${codigoReserva}`;

  $('#voucher-cuerpo').innerHTML = `
    <div class="ticket-voucher">
      <div class="ticket-header">
        <div>
          <span class="etiqueta" style="color: #cce8dd; margin: 0;">NÓMADA HOSPEDAJE</span>
          <h3>${escapar(a?.titulo || 'Alojamiento')}</h3>
        </div>
        <span class="ticket-codigo">NOM-${codigoReserva}</span>
      </div>

      <div class="ticket-cuerpo">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="estado ${escapar(r.estado)}">Estado: ${escapar(r.estado)}</span>
          <span class="texto-secundario" style="font-size: 12px;">Operación con pago simulado</span>
        </div>

        <div class="ticket-seccion-fechas">
          <div class="ticket-fecha-box">
            <small>LLEGADA / CHECK-IN</small>
            <strong>${fechaTexto(r.entrada)}</strong>
            <span class="texto-secundario" style="font-size: 12px;">Horario por acordar con el anfitrión</span>
          </div>

          <div class="ticket-flecha">➔</div>

          <div class="ticket-fecha-box">
            <small>SALIDA / CHECK-OUT</small>
            <strong>${fechaTexto(r.salida)}</strong>
            <span class="texto-secundario" style="font-size: 12px;">Horario por acordar con el anfitrión</span>
          </div>
        </div>

        <div class="ticket-detalles-grid">
          <div class="ticket-item">
            <small>TITULAR DE LA RESERVACIÓN</small>
            <strong>${escapar(r.huesped)}</strong>
          </div>

          <div class="ticket-item">
            <small>HUÉSPEDES REGISTRADOS</small>
            <strong>${r.personas} persona(s)</strong>
          </div>

          <div class="ticket-item">
            <small>DURACIÓN DE LA ESTANCIA</small>
            <strong>${cantNoches} noche${cantNoches === 1 ? '' : 's'}</strong>
          </div>

          <div class="ticket-item">
            <small>UBICACIÓN DEL ESPACIO</small>
            <strong>${escapar(a?.ubicacion || 'Dirección por confirmar')}</strong>
          </div>
        </div>

        ${r.notas ? `
          <div style="padding: 12px; background: var(--fondo); border-radius: 8px;">
            <small style="font-weight: 700; color: var(--secundario);">NOTAS DEL HUÉSPED:</small>
            <p style="font-size: 13px; margin: 4px 0 0;">"${escapar(r.notas)}"</p>
          </div>
        ` : ''}

        <div class="ticket-pie-total">
          <div>
            <strong style="font-size: 16px;">Total pagado (simulado)</strong>
            <small class="texto-secundario" style="display: block;">Importe registrado al solicitar la reserva</small>
          </div>
          <strong style="font-size: 20px; color: var(--verde);">${moneda(r.totalCentavos)}</strong>
        </div>
      </div>
    </div>

    <div class="ticket-acciones">
      <button type="button" class="secundario-btn" onclick="window.print()">
        🖨 Imprimir comprobante
      </button>
      <button type="button" class="primario" id="btn-cerrar-voucher-dialog">
        Entendido
      </button>
    </div>
  `;

  $('#btn-cerrar-voucher-dialog')?.addEventListener('click', () => {
    $('#modal-voucher').close();
  });

  $('#modal-voucher').showModal();
}

/* ==========================================================================
   MODAL: CALIFICAR ESTANCIA (DEJAR RESEÑA)
   ========================================================================== */
function abrirModalResena(reservaId) {
  const r = datos.reservas.find(item => item.id === reservaId);
  if (!r) return;

  const a = datos.alojamientos.find(item => item.id === r.alojamientoId);
  ui.puntuacionSeleccionada = 5;

  $('#resena-alojamiento-id').value = r.alojamientoId;
  $('#resena-reserva-id').value = r.id;
  $('#resena-puntuacion').value = '5';
  $('#resena-huesped').value = r.huesped || perfil.nombre;
  $('#resena-comentario').value = '';

  $('#resena-modal-titulo').textContent = `Calificar "${a?.titulo || 'Alojamiento'}"`;
  $('#resena-alojamiento-subtitulo').textContent = `Comparte cómo fue tu estancia en ${a?.ubicacion || 'el espacio'}.`;

  actualizarSelectorEstrellas(5);
  $('#modal-resena').showModal();
}

function actualizarSelectorEstrellas(valor) {
  ui.puntuacionSeleccionada = valor;
  $('#resena-puntuacion').value = valor;

  const descripciones = {
    1: 'Mala experiencia (1 de 5)',
    2: 'Regular (2 de 5)',
    3: 'Buena (3 de 5)',
    4: 'Muy buena (4 de 5)',
    5: '¡Excelente estancia! (5 de 5)'
  };
  $('#estrellas-texto').textContent = descripciones[valor] || `${valor} de 5`;

  $$('.estrella-btn').forEach(btn => {
    const valBtn = parseInt(btn.dataset.valor, 10);
    btn.classList.toggle('activa', valBtn <= valor);
  });
}

/* ==========================================================================
   LISTENERS Y EVENTOS GLOBALES
   ========================================================================== */

function setupEventListeners() {
  $$('[data-vista]').forEach(button=>button.addEventListener('click',async()=>{
    ui.vista=button.dataset.vista;
    try{await cargarDatos();}catch(e){mensaje(e.message,true);}
  }));
  $('#vista').addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    try{
      button.disabled=true;
      if(button.hasAttribute('data-ir-explorar')){ui.vista='explorar';return await cargarDatos();}
      if(button.dataset.vistaBtn){ui.vista=button.dataset.vistaBtn;return await cargarDatos();}
      if(button.dataset.toggleFav){const id=button.dataset.toggleFav;await Nomada.api(`/api/favoritos/${id}`,favoritos.includes(id)?'DELETE':'PUT');return await cargarDatos();}
      if(button.dataset.verDetalle)return abrirDetalleAlojamiento(button.dataset.verDetalle);
      if(button.dataset.verVoucher){await Nomada.api(`/api/reservas/${button.dataset.verVoucher}/comprobante`);return abrirVoucher(button.dataset.verVoucher);}
      if(button.dataset.cancelarReserva){if(!confirm('¿Cancelar esta solicitud pendiente?'))return;await Nomada.api(`/api/reservas/${button.dataset.cancelarReserva}/estado`,'PATCH',{estado:'cancelada'});return await cargarDatos();}
      if(button.dataset.pagar){await Nomada.api(`/api/reservas/${button.dataset.pagar}/pago`,'POST',{resultado:button.dataset.resultado});await cargarDatos();return mensaje('Pago simulado guardado. No se efectuó un cobro real.');}
      if(button.dataset.abrirResena)return abrirModalResena(button.dataset.abrirResena);
      if(button.dataset.pestana){ui.pestanaViajes=button.dataset.pestana;return render();}
      if(button.dataset.servicio){ui.filtroServicio=button.dataset.servicio;return render();}
      if(['limpiar-busqueda','btn-reset-filtros'].includes(button.id)){ui.filtroDestino='';ui.filtroLlegada='';ui.filtroSalida='';ui.filtroHuespedes=1;ui.filtroServicio='todos';return await cargarDatos();}
      if(button.id==='vaciar-favoritos'){if(!confirm('¿Vaciar tus favoritos?'))return;for(const id of favoritos)await Nomada.api(`/api/favoritos/${id}`,'DELETE');return await cargarDatos();}
      if(button.id==='marcar-todas-leidas'){await Nomada.api('/api/notificaciones','PATCH',{});return await cargarDatos();}
    }catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
  });
  $('#vista').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
    try{
      if(form.id==='form-busqueda-huesped'){
        ui.filtroDestino=form.elements.destino.value.trim();ui.filtroLlegada=form.elements.llegada.value;ui.filtroSalida=form.elements.salida.value;ui.filtroHuespedes=Number(form.elements.huespedes.value);await cargarDatos();
      }else if(form.id==='form-perfil-huesped'){
        await Nomada.api('/api/perfil','PUT',Object.fromEntries(new FormData(form)));await cargarDatos();mensaje('Perfil guardado.');
      }
    }catch(e){mensaje(e.message,true);}finally{if(button)button.disabled=false;}
  });
  $('#cerrar-detalle').onclick=()=>$('#modal-detalle').close();
  $('#cerrar-voucher').onclick=()=>$('#modal-voucher').close();
  $('#cerrar-resena').onclick=()=>$('#modal-resena').close();
  $('#cancelar-resena').onclick=()=>$('#modal-resena').close();
  $$('.estrella-btn').forEach(b=>b.onclick=()=>actualizarSelectorEstrellas(Number(b.dataset.valor)));
  $('#form-resena').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]');button.disabled=true;
    try{await Nomada.api('/api/resenas','POST',{reservaId:form.elements.reservaId.value,puntuacion:Number(form.elements.puntuacion.value),comentario:form.elements.comentario.value});$('#modal-resena').close();await cargarDatos();mensaje('Reseña guardada.');}
    catch(e){mensaje(e.message,true);}finally{button.disabled=false;}
  });
  $('#cargar-demo').onclick=()=>Nomada.logout().catch(e=>mensaje(e.message,true));
}
document.querySelector('main').hidden=true;
document.querySelector('aside').hidden=true;
Nomada.require('huesped').then(async()=>{
  setupEventListeners();await cargarDatos();document.querySelector('main').hidden=false;document.querySelector('aside').hidden=false;
}).catch(e=>mensaje(e.message,true));
