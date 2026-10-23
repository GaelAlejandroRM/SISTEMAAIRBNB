import { CATEGORIES, LISTINGS } from './data.js';

// App State
let state = {
  selectedCategory: 'all',
  theme: localStorage.getItem('airbnb_theme') || 'light',
  favorites: JSON.parse(localStorage.getItem('airbnb_favorites') || '[]'),
  selectedListing: null,
  imageIndices: {} // propertyId -> index
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderCategories();
  renderListings();
  setupEventListeners();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('airbnb_theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;
  if (state.theme === 'dark') {
    themeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    themeBtn.setAttribute('title', 'Cambiar a modo claro');
  } else {
    themeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    themeBtn.setAttribute('title', 'Cambiar a modo oscuro');
  }
}

// Render Category Filter Bar
function renderCategories() {
  const container = document.getElementById('categories-scroll');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button className="category-item" class="category-item ${state.selectedCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
      ${cat.icon}
      <span class="category-label">${cat.label}</span>
    </button>
  `).join('');

  // Add click events to category buttons
  container.querySelectorAll('.category-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catId = btn.getAttribute('data-category');
      state.selectedCategory = catId;
      renderCategories();
      renderListings();
    });
  });
}

// Render Listings Grid
function renderListings() {
  const grid = document.getElementById('property-grid');
  const counter = document.getElementById('listings-count');
  if (!grid) return;

  const filtered = state.selectedCategory === 'all'
    ? LISTINGS
    : LISTINGS.filter(l => l.category === state.selectedCategory);

  if (counter) {
    counter.textContent = `${filtered.length} opciones disponibles`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>No se encontraron alojamientos en esta categoría</h3>
        <p>Intenta seleccionar otra categoría o restablecer los filtros de búsqueda.</p>
        <button class="reset-btn" id="reset-filter-btn">Ver todos los alojamientos</button>
      </div>
    `;
    document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
      state.selectedCategory = 'all';
      renderCategories();
      renderListings();
    });
    return;
  }

  grid.innerHTML = filtered.map(listing => {
    const isLiked = state.favorites.includes(listing.id);
    const imgIndex = state.imageIndices[listing.id] || 0;
    const currentImg = listing.images[imgIndex];

    return `
      <article class="listing-card animate-fade-in" data-id="${listing.id}">
        <div class="image-carousel-container">
          <img src="${currentImg}" alt="${listing.title}" class="listing-image" id="img-${listing.id}" loading="lazy" />
          
          <button class="favorite-btn ${isLiked ? 'liked' : ''}" data-fav-id="${listing.id}" title="Favorito">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? '#FF385C' : 'rgba(0,0,0,0.5)'}" stroke="${isLiked ? '#FF385C' : '#FFFFFF'}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>

          ${listing.isSuperhost ? `<span class="superhost-tag">Superanfitrión</span>` : ''}

          ${listing.images.length > 1 ? `
            <button class="carousel-arrow prev" data-prev="${listing.id}">‹</button>
            <button class="carousel-arrow next" data-next="${listing.id}">›</button>
            <div class="carousel-dots">
              ${listing.images.map((_, idx) => `<span class="dot ${idx === imgIndex ? 'active' : ''}"></span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="listing-info">
          <div class="listing-header">
            <h3 class="listing-location">${listing.location}</h3>
            <div class="listing-rating">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>${listing.rating.toFixed(2)}</span>
            </div>
          </div>
          <p class="listing-subtitle">${listing.distance}</p>
          <p class="listing-dates">${listing.dates}</p>
          <div class="listing-price-container">
            <span class="price-amount">$${listing.price.toLocaleString('es-MX')} MXN</span>
            <span class="price-period"> noche</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card event listeners
  attachCardEvents();
}

function attachCardEvents() {
  // Favorites Toggle
  document.querySelectorAll('[data-fav-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-fav-id');
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(f => f !== id);
      } else {
        state.favorites.push(id);
      }
      localStorage.setItem('airbnb_favorites', JSON.stringify(state.favorites));
      renderListings();
    });
  });

  // Carousel Navigation Prev
  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-prev');
      const item = LISTINGS.find(l => l.id === id);
      if (!item) return;
      const current = state.imageIndices[id] || 0;
      state.imageIndices[id] = (current - 1 + item.images.length) % item.images.length;
      renderListings();
    });
  });

  // Carousel Navigation Next
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-next');
      const item = LISTINGS.find(l => l.id === id);
      if (!item) return;
      const current = state.imageIndices[id] || 0;
      state.imageIndices[id] = (current + 1) % item.images.length;
      renderListings();
    });
  });

  // Open Detail Modal
  document.querySelectorAll('.listing-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const item = LISTINGS.find(l => l.id === id);
      if (item) openListingModal(item);
    });
  });
}

// Open Detail Modal
function openListingModal(listing) {
  state.selectedListing = listing;
  const modal = document.getElementById('listing-modal');
  const content = document.getElementById('modal-listing-content');
  if (!modal || !content) return;

  const totalNights = 5;
  const subtotal = listing.price * totalNights;
  const serviceFee = 1250;
  const total = subtotal + serviceFee;

  content.innerHTML = `
    <div class="modal-header">
      <h2>${listing.title}</h2>
      <div class="modal-sub-header">
        <span>⭐ <strong>${listing.rating.toFixed(2)}</strong> (${listing.reviewsCount} evaluaciones)</span>
        <span>•</span>
        <span>📍 ${listing.location}</span>
        ${listing.isSuperhost ? `<span>• 🏆 Superanfitrión</span>` : ''}
      </div>
    </div>

    <div class="gallery-grid">
      <img src="${listing.images[0]}" alt="${listing.title}" class="gallery-img" />
      ${listing.images[1] ? `<img src="${listing.images[1]}" alt="${listing.title}" class="gallery-img" />` : ''}
    </div>

    <div class="modal-body-grid">
      <div class="details-col">
        <h3>Alojamiento entero en ${listing.location}</h3>
        <p class="specs" style="color: var(--text-secondary); margin-bottom: 1rem;">
          ${listing.guests} huéspedes • ${listing.bedrooms} recámaras • ${listing.beds} camas • ${listing.baths} baños
        </p>

        <hr class="modal-divider" />

        <div style="display: flex; gap: 1rem; align-items: flex-start; margin: 1rem 0;">
          <span style="font-size: 1.5rem;">🛡️</span>
          <div>
            <h4 style="font-size: 0.95rem;">Airbnb Cover Protegido</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Cada reservación incluye protección gratuita contra cancelaciones del anfitrión e inconvenientes.</p>
          </div>
        </div>

        <hr class="modal-divider" />

        <div className="description-section">
          <h4 style="margin-bottom: 0.5rem;">Acerca de este espacio</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">${listing.description}</p>
        </div>
      </div>

      <div class="booking-card">
        <div class="booking-price-header">
          <div>
            <span class="booking-price">$${listing.price.toLocaleString('es-MX')} MXN</span>
            <span style="color: var(--text-secondary); font-size: 0.875rem;"> / noche</span>
          </div>
          <div>⭐ ${listing.rating.toFixed(2)}</div>
        </div>

        <div class="booking-inputs">
          <div class="date-input-group">
            <div class="date-box">
              <label>LLEGADA</label>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">12/11/2026</span>
            </div>
            <div class="date-box">
              <label>SALIDA</label>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">17/11/2026</span>
            </div>
          </div>
          <div class="guests-box">
            <label>HUÉSPEDES</label>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">1 huésped</span>
          </div>
        </div>

        <button class="reserve-btn" onclick="alert('¡Reservación enviada con éxito!')">
          Reservar espacio
        </button>

        <p style="text-align: center; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Todavía no se te cobrará nada
        </p>

        <div class="cost-row">
          <span>$${listing.price.toLocaleString('es-MX')} x ${totalNights} noches</span>
          <span>$${subtotal.toLocaleString('es-MX')} MXN</span>
        </div>
        <div class="cost-row">
          <span>Tarifa por servicio</span>
          <span>$${serviceFee.toLocaleString('es-MX')} MXN</span>
        </div>
        <hr class="modal-divider" />
        <div class="cost-row total">
          <span>Total sin impuestos</span>
          <span>$${total.toLocaleString('es-MX')} MXN</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// Global Event Listeners
function setupEventListeners() {
  // Theme Toggle Button
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Profile Pill Dropdown Toggle
  const profileBtn = document.getElementById('profile-pill-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    profileDropdown?.classList.add('hidden');
  });

  // Modal Close Buttons
  document.getElementById('close-listing-modal')?.addEventListener('click', () => {
    document.getElementById('listing-modal')?.classList.add('hidden');
  });

  document.getElementById('listing-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'listing-modal') {
      document.getElementById('listing-modal')?.classList.add('hidden');
    }
  });

  // Quick Search Modal Trigger
  document.getElementById('search-pill-trigger')?.addEventListener('click', () => {
    document.getElementById('search-modal')?.classList.remove('hidden');
  });

  document.getElementById('close-search-modal')?.addEventListener('click', () => {
    document.getElementById('search-modal')?.classList.add('hidden');
  });

  document.getElementById('search-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'search-modal') {
      document.getElementById('search-modal')?.classList.add('hidden');
    }
  });

  document.getElementById('search-submit-btn')?.addEventListener('click', () => {
    document.getElementById('search-modal')?.classList.add('hidden');
  });
}
