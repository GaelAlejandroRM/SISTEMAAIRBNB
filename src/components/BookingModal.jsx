import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';

export default function BookingModal({ bookingData, onClose, onConfirmBooking }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  if (!bookingData) return null;
  const { property, nights, guests, subtotal, cleaningFee, serviceFee, total } = bookingData;

  const handleConfirm = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      onConfirmBooking({
        id: 'res-' + Math.floor(100000 + Math.random() * 900000),
        property,
        nights,
        guests,
        total,
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      });
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }} className="animate-fade-in">
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '560px',
        width: '100%',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-light)'
          }}
        >
          <X size={18} />
        </button>

        {isConfirmed ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }} className="animate-fade-in">
            <div style={{
              backgroundColor: '#E6F4EA',
              color: '#137333',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <CheckCircle size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>¡Reserva Confirmada!</h2>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Hemos enviado los detalles de tu estancia en <strong>{property.title}</strong> a tu correo electrónico.
            </p>
            <div className="badge badge-superhost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Código de confirmación: #{Math.floor(100000 + Math.random() * 900000)}
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>Confirmar y pagar</h2>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-light)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <img 
                src={property.images[0]} 
                alt={property.title} 
                style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{property.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--dark-gray)' }}>{property.location}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {nights} noches · {guests} huéspedes
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Método de pago</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: paymentMethod === 'card' ? '2px solid var(--dark)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CreditCard size={16} />
                  <span>Tarjeta</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('paypal')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: paymentMethod === 'paypal' ? '2px solid var(--dark)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Sparkles size={16} />
                  <span>PayPal</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                <span>Subtotal</span>
                <span>${subtotal} {property.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                <span>Limpieza y Servicio</span>
                <span>${cleaningFee + serviceFee} {property.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', marginTop: '0.75rem' }}>
                <span>Total a pagar</span>
                <span style={{ color: 'var(--primary)' }}>${total} {property.currency}</span>
              </div>
            </div>

            <button 
              onClick={handleConfirm}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              Completar Reserva (${total} USD)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
