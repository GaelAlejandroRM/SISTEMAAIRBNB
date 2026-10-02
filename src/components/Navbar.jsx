import React, { useState } from 'react';
import { Search, Globe, Menu, User, Sparkles, PlusCircle } from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  activeView, 
  setActiveView,
  favoritesCount 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 2rem'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>

        {/* LOGO */}
        <div 
          onClick={() => setActiveView('home')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            color: 'var(--primary)',
            fontWeight: 800,
            fontSize: '1.4rem',
            letterSpacing: '-0.03em'
          }}
        >
          <svg width="34" height="34" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.88 0-5.267-1.782-6.526-4.281l-.474-.997-.474.997c-1.259 2.499-3.646 4.281-6.526 4.281-4.209 0-7.5-3.798-7.5-7.806 0-1.198.31-2.285.971-3.711l.145-.315c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.24 0-2.268.61-3.284 2.404l-.445.856c-1.89 3.704-5.996 12.295-6.93 14.47l-.117.255c-.563 1.214-.724 1.961-.724 2.821 0 2.923 2.37 5.806 5.5 5.806 2.257 0 4.238-1.503 5.253-3.664l.747-1.572.747 1.572c1.015 2.161 2.996 3.664 5.253 3.664 3.13 0 5.5-2.883 5.5-5.806 0-.741-.129-1.428-.624-2.61l-.117-.255c-.934-2.175-5.04-10.766-6.93-14.47l-.445-.856C18.268 3.61 17.24 3 16 3zm0 10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
          <span style={{ display: 'none', minWidth: '100px' }} className="logo-text">airbnb</span>
          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500, marginLeft: '4px' }}>System</span>
        </div>

        {/* SEARCH BAR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.4rem 0.5rem 0.4rem 1.25rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'var(--transition-fast)',
          maxWidth: '420px',
          width: '100%'
        }} className="search-bar">
          <input 
            type="text" 
            placeholder="Buscar por destino o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'var(--dark)'
            }}
          />
          <button style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '50%',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '0.5rem',
            transition: 'var(--transition-fast)'
          }}>
            <Search size={16} />
          </button>
        </div>

        {/* RIGHT CONTROLS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button 
            onClick={() => setActiveView(activeView === 'host' ? 'home' : 'host')}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 6rem,
              color: 'var(--dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeView === 'host' ? '#f5f5f5' : 'transparent',
              transition: 'var(--transition-fast)'
            }}
          >
            <PlusCircle size={16} color="var(--primary)" />
            <span>{activeView === 'host' ? 'Ver Alojamientos' : 'Pon tu espacio en Airbnb'}</span>
          </button>

          <button style={{
            padding: '0.5rem',
            borderRadius: '50%',
            color: 'var(--dark)'
          }}>
            <Globe size={18} />
          </button>

          {/* USER MENU DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition-fast)'
              }}
            >
              <Menu size={18} color="var(--dark)" />
              <div style={{
                backgroundColor: '#717171',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={18} />
              </div>
            </button>

            {isMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: '240px',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 0',
                zIndex: 100
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bienvenido</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--dark-gray)' }}>usuario@ejemplo.com</p>
                </div>

                <button 
                  onClick={() => { setActiveView('home'); setIsMenuOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem' }}
                >
                  Explorar alojamientos
                </button>
                <button 
                  onClick={() => { setActiveView('bookings'); setIsMenuOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Mis Reservas</span>
                  <span className="badge badge-guest-favorite" style={{ fontSize: '0.7rem' }}>NUEVO</span>
                </button>
                <button 
                  onClick={() => { setActiveView('favorites'); setIsMenuOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Favoritos</span>
                  {favoritesCount > 0 && (
                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.4rem 0' }}></div>
                <button 
                  onClick={() => { setActiveView('host'); setIsMenuOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Administrar Propiedades
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
