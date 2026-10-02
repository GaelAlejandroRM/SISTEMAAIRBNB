import React, { useState } from 'react';
import { PlusCircle, Image, MapPin, DollarSign, Check, Building2 } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

export default function HostDashboard({ onAddProperty, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    category: 'beach',
    pricePerNight: 150,
    description: '',
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80'
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return;

    const newProp = {
      id: 'prop-' + Date.now(),
      title: formData.title,
      location: formData.location,
      category: formData.category,
      rating: 5.0,
      reviewsCount: 1,
      pricePerNight: Number(formData.pricePerNight),
      currency: 'USD',
      isSuperhost: true,
      isGuestFavorite: true,
      images: [formData.imageUrl],
      guests: Number(formData.guests),
      bedrooms: Number(formData.bedrooms),
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      host: {
        name: 'Tú (Anfitrión)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isSuperhost: true,
        joinedYear: '2026'
      },
      description: formData.description || 'Increíble alojamiento recién publicado.',
      amenities: ['Wifi', 'Aire acondicionado', 'Cocina equipada', 'Estacionamiento']
    };

    onAddProperty(newProp);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '3rem auto',
        padding: '3rem 2rem',
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }} className="animate-fade-in">
        <div style={{
          backgroundColor: '#E6F4EA',
          color: '#137333',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <Check size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>¡Propiedad Publicada Exitosamente!</h2>
        <p style={{ color: 'var(--dark-gray)', marginBottom: '1.5rem' }}>
          Tu alojamiento ya se encuentra disponible para recibir reservas en la plataforma.
        </p>
        <button onClick={onCancel} className="btn-primary">
          Volver a la Galería
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '2rem auto',
      backgroundColor: 'white',
      borderRadius: 'var(--radius-lg)',
      padding: '2.5rem',
      boxShadow: 'var(--shadow-md)'
    }} className="animate-fade-in">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Publica tu Espacio en Airbnb</h2>
          <p style={{ color: 'var(--dark-gray)', fontSize: '0.9rem' }}>Completa los datos de tu alojamiento para comenzar a recibir huéspedes.</p>
        </div>
        <button onClick={onCancel} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div>
          <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Título del Alojamiento</label>
          <input 
            type="text" 
            placeholder="Ej: Villa de lujo con alberca vista al mar"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Ubicación</label>
            <input 
              type="text" 
              placeholder="Ej: Cancún, México"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Categoría</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Precio/Noche ($)</label>
            <input 
              type="number" 
              value={formData.pricePerNight}
              onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Huéspedes</label>
            <input 
              type="number" 
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Habitaciones</label>
            <input 
              type="number" 
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Baños</label>
            <input 
              type="number" 
              value={formData.baths}
              onChange={(e) => setFormData({ ...formData, baths: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>URL de Foto de Portada</label>
          <input 
            type="url" 
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Descripción</label>
          <textarea 
            rows="4"
            placeholder="Describe las características especiales de tu propiedad..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}>
          Publicar Alojamiento Ahora
        </button>

      </form>
    </div>
  );
}
