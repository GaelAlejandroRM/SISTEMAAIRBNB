import React, { useState } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertyCard({ 
  property, 
  onSelectProperty, 
  isFavorite, 
  onToggleFavorite 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div 
      onClick={() => onSelectProperty(property)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        cursor: 'pointer',
        position: 'relative'
      }}
      className="property-card"
    >
      {/* IMAGE CAROUSEL CONTAINER */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '20/19',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}>
        <img 
          src={property.images[currentImageIndex]} 
          alt={property.title} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
        />

        {/* FAVORITE BUTTON */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          <Heart 
            size={24} 
            fill={isFavorite ? 'var(--primary)' : 'rgba(0,0,0,0.4)'} 
            color={isFavorite ? 'var(--primary)' : '#FFFFFF'} 
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
        </button>

        {/* GUEST FAVORITE / SUPERHOST BADGE */}
        {property.isGuestFavorite && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10
          }}>
            <span className="badge badge-guest-favorite">Favorito entre huéspedes</span>
          </div>
        )}

        {/* CAROUSEL CONTROLS */}
        {property.images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 0.2s'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 0.2s'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* CARD CONTENT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--dark)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {property.location}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <Star size={14} fill="var(--dark)" color="var(--dark)" />
            <span>{property.rating}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>
          {property.title}
        </p>

        <p style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>
          {property.guests} huéspedes · {property.bedrooms} hab.
        </p>

        <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--dark)' }}>${property.pricePerNight} {property.currency}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}> / noche</span>
        </div>
      </div>
    </div>
  );
}
