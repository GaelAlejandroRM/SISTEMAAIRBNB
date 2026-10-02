import React, { useState } from 'react';
import { 
  X, Star, Heart, Share, MapPin, Award, CheckCircle2, 
  Calendar, ShieldCheck, Sparkles, Users 
} from 'lucide-react';

export default function PropertyModal({ 
  property, 
  onClose, 
  onStartBooking, 
  isFavorite, 
  onToggleFavorite 
}) {
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);

  if (!property) return null;

  const subtotal = property.pricePerNight * nights;
  const cleaningFee = Math.round(property.pricePerNight * 0.25);
  const serviceFee = Math.round(subtotal * 0.14);
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} className="animate-fade-in">
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '960px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* HEADER BAR */}
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Detalles del Alojamiento</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => onToggleFavorite(property.id)}
              style={{ padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}
            >
              <Heart size={18} fill={isFavorite ? 'var(--primary)' : 'none'} color={isFavorite ? 'var(--primary)' : 'var(--dark)'} />
            </button>
            <button 
              onClick={onClose}
              style={{ padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-light)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN MODAL BODY */}
        <div style={{ padding: '1.5rem 2rem' }}>

          {/* TITLE & LOCATION */}
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>{property.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--dark-gray)', fontSize: '0.9rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: 'var(--dark)' }}>
              <Star size={16} fill="var(--dark)" color="var(--dark)" />
              <span>{property.rating}</span>
              <span style={{ fontWeight: 400, textDecoration: 'underline' }}>({property.reviewsCount} evaluaciones)</span>
            </div>
            <span>·</span>
            {property.isSuperhost && (
              <>
                <span className="badge badge-superhost">Superanfitrión</span>
                <span>·</span>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={16} />
              <span>{property.location}</span>
            </div>
          </div>

          {/* GALLERY GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.75rem',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '2rem'
          }}>
            {property.images.map((imgUrl, index) => (
              <img 
                key={index} 
                src={imgUrl} 
                alt={`${property.title} ${index + 1}`} 
                style={{
                  width: '100%',
                  height: '240px',
                  objectFit: 'cover'
                }}
              />
            ))}
          </div>

          {/* CONTENT GRID: HOST & AMENITIES VS BOOKING WIDGET */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2.5rem'
          }} className="property-modal-content">
            
            {/* LEFT SIDE: INFORMATION */}
            <div>
              {/* HOST INFO */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Alojamiento entero ofrecido por {property.host.name}
                  </h3>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>
                    {property.guests} huéspedes · {property.bedrooms} dormitorios · {property.beds} camas · {property.baths} baños
                  </p>
                </div>
                <img 
                  src={property.host.avatar} 
                  alt={property.host.name} 
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>

              {/* FEATURES HIGHLIGHTS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Award size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Anfitrión con experiencia</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>{property.host.name} cuenta con excelentes evaluaciones de otros huéspedes.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <ShieldCheck size={24} color="var(--secondary)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cancelación gratuita</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>Cancela hasta 48 horas antes de tu llegada sin costo adicional.</p>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Acerca de este espacio</h3>
                <p style={{ lineHeight: 1.6, color: 'var(--dark)', fontSize: '0.95rem' }}>
                  {property.description}
                </p>
              </div>

              {/* AMENITIES */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Lo que este lugar ofrece</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {property.amenities.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <CheckCircle2 size={18} color="var(--secondary)" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: BOOKING WIDGET */}
            <div>
              <div style={{
                position: 'sticky',
                top: '90px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${property.pricePerNight} {property.currency}</span>
                    <span style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}> / noche</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Star size={14} fill="var(--dark)" />
                    <span>{property.rating}</span>
                  </div>
                </div>

                {/* DATES & GUESTS PICKER */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ padding: '0.6rem 0.8rem', borderRight: '1px solid var(--border-color)', width: '50%' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Noches</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30" 
                        value={nights} 
                        onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ padding: '0.6rem 0.8rem', width: '50%' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Huéspedes</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={property.guests} 
                        value={guests} 
                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onStartBooking({ property, nights, guests, subtotal, cleaningFee, serviceFee, total })}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
                >
                  Reservar Alojamiento
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray)', marginTop: '0.75rem' }}>
                  No se te cobrará nada todavía
                </p>

                {/* COST BREAKDOWN */}
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textDecoration: 'underline' }}>${property.pricePerNight} x {nights} noches</span>
                    <span>${subtotal} {property.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textDecoration: 'underline' }}>Tarifa de limpieza</span>
                    <span>${cleaningFee} {property.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textDecoration: 'underline' }}>Tarifa de servicio Airbnb</span>
                    <span>${serviceFee} {property.currency}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                    <span>Total antes de impuestos</span>
                    <span>${total} {property.currency}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
