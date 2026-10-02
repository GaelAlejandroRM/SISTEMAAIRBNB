import React from 'react';
import PropertyCard from './PropertyCard';
import { Home, Frown } from 'lucide-react';

export default function PropertyGrid({ 
  properties, 
  onSelectProperty, 
  favorites, 
  onToggleFavorite 
}) {
  if (properties.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        backgroundColor: '#F9F9F9',
        borderRadius: 'var(--radius-md)',
        marginTop: '2rem'
      }}>
        <div style={{
          backgroundColor: '#EBEBEB',
          padding: '1.25rem',
          borderRadius: '50%',
          color: 'var(--dark-gray)'
        }}>
          <Frown size={40} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No se encontraron alojamientos</h3>
        <p style={{ color: 'var(--dark-gray)', maxWidth: '400px' }}>
          Intenta cambiar tus términos de búsqueda o selecciona otra categoría de la lista arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="property-grid animate-fade-in">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onSelectProperty={onSelectProperty}
          isFavorite={favorites.includes(property.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
