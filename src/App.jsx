import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import CategoryFilter from './components/CategoryFilter';
import PropertyGrid from './components/PropertyGrid';
import PropertyModal from './components/PropertyModal';
import BookingModal from './components/BookingModal';
import HostDashboard from './components/HostDashboard';
import Footer from './components/Footer';
import { MOCK_PROPERTIES } from './data/mockData';
import { Sparkles, Calendar, Heart } from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [favorites, setFavorites] = useState(['prop-1', 'prop-4']);
  const [userBookings, setUserBookings] = useState([]);
  const [activeView, setActiveView] = useState('home'); // 'home' | 'host' | 'bookings' | 'favorites'

  // Toggle favorite property
  const handleToggleFavorite = (propertyId) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Add new hosted property
  const handleAddProperty = (newProperty) => {
    setProperties((prev) => [newProperty, ...prev]);
  };

  // Confirm booking callback
  const handleConfirmBooking = (newBooking) => {
    setUserBookings((prev) => [newBooking, ...prev]);
    setTimeout(() => {
      setBookingData(null);
      setSelectedProperty(null);
      setActiveView('bookings');
    }, 2000);
  };

  // Filtered properties computation
  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      // Filter view: favorites
      if (activeView === 'favorites' && !favorites.includes(item.id)) {
        return false;
      }
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      // Search filter
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [properties, selectedCategory, searchQuery, activeView, favorites]);

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
        favoritesCount={favorites.length}
      />

      {/* MAIN CONTAINER */}
      <main className="main-content">
        {/* HOST DASHBOARD VIEW */}
        {activeView === 'host' ? (
          <HostDashboard
            onAddProperty={handleAddProperty}
            onCancel={() => setActiveView('home')}
          />
        ) : activeView === 'bookings' ? (
          /* USER BOOKINGS VIEW */
          <div style={{ padding: '1rem 0' }} className="animate-fade-in">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar color="var(--primary)" />
              <span>Mis Reservas Activas ({userBookings.length})</span>
            </h2>

            {userBookings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                backgroundColor: 'var(--bg-light)',
                borderRadius: 'var(--radius-md)'
              }}>
                <p style={{ color: 'var(--dark-gray)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Aún no tienes reservaciones confirmadas.
                </p>
                <button onClick={() => setActiveView('home')} className="btn-primary">
                  Explorar Alojamientos Disponibles
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {userBookings.map((res) => (
                  <div key={res.id} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    backgroundColor: 'white'
                  }}>
                    <img src={res.property.images[0]} alt={res.property.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '1.25rem' }}>
                      <span className="badge badge-guest-favorite" style={{ marginBottom: '0.5rem' }}>Confirmada · {res.date}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>{res.property.title}</h3>
                      <p style={{ color: 'var(--dark-gray)', fontSize: '0.85rem' }}>{res.property.location}</p>
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <span>{res.nights} noches ({res.guests} huéspedes)</span>
                        <span style={{ color: 'var(--primary)' }}>${res.total} USD</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* HOME / FAVORITES VIEW */
          <>
            {activeView === 'favorites' && (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart fill="var(--primary)" color="var(--primary)" />
                <span>Mis Alojamientos Favoritos ({filteredProperties.length})</span>
              </h2>
            )}

            {/* CATEGORIES BAR */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* PROPERTY CARDS GRID */}
            <PropertyGrid
              properties={filteredProperties}
              onSelectProperty={setSelectedProperty}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </main>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onStartBooking={(data) => setBookingData(data)}
          isFavorite={favorites.includes(selectedProperty.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* BOOKING CHECKOUT MODAL */}
      {bookingData && (
        <BookingModal
          bookingData={bookingData}
          onClose={() => setBookingData(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
