import React from 'react';
import { Globe, DollarSign } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#F7F7F7',
      borderTop: '1px solid var(--border-color)',
      padding: '2.5rem 2rem 1.5rem 2rem',
      marginTop: 'auto',
      fontSize: '0.85rem',
      color: 'var(--dark)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Asistencia</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--dark-gray)' }}>
            <li><a href="#">Centro de ayuda</a></li>
            <li><a href="#">AirCover</a></li>
            <li><a href="#">Antidiscriminación</a></li>
            <li><a href="#">Opciones de cancelación</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Modo Anfitrión</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--dark-gray)' }}>
            <li><a href="#">Pon tu espacio en Airbnb</a></li>
            <li><a href="#">AirCover para anfitriones</a></li>
            <li><a href="#">Recursos para anfitriones</a></li>
            <li><a href="#">Foro comunitario</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Airbnb</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--dark-gray)' }}>
            <li><a href="#">Sala de prensa</a></li>
            <li><a href="#">Funciones nuevas</a></li>
            <li><a href="#">Carreras profesional</a></li>
            <li><a href="#">Inversionistas</a></li>
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: '1440px',
        margin: '1.5rem auto 0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--dark-gray)' }}>
          <span>© 2026 Airbnb System, Inc.</span>
          <span>·</span>
          <a href="#">Privacidad</a>
          <span>·</span>
          <a href="#">Términos</a>
          <span>·</span>
          <a href="#">Mapa del sitio</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Globe size={16} />
            <span>Español (MX)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <DollarSign size={16} />
            <span>USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
