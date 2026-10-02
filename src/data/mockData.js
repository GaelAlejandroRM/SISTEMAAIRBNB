export const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'Sparkles' },
  { id: 'beach', name: 'Frente a la playa', icon: 'Waves' },
  { id: 'cabins', name: 'Cabañas', icon: 'TreePine' },
  { id: 'pools', name: 'Piscinas increíbles', icon: 'Sun' },
  { id: 'mansions', name: 'Mansiones', icon: 'Building2' },
  { id: 'country', name: 'Campiña', icon: 'Mountain' },
  { id: 'treehouses', name: 'Casas del árbol', icon: 'Trees' },
  { id: 'penthouses', name: 'Penthouses', icon: 'Building' }
];

export const MOCK_PROPERTIES = [
  {
    id: 'prop-1',
    title: 'Villa de Lujo con Vista al Mar Caribe',
    location: 'Tulum, Quintana Roo, México',
    category: 'beach',
    rating: 4.96,
    reviewsCount: 128,
    pricePerNight: 280,
    currency: 'USD',
    isSuperhost: true,
    isGuestFavorite: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 4.5,
    host: {
      name: 'Sofía Martínez',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isSuperhost: true,
      joinedYear: '2019'
    },
    description: 'Relájate en esta exclusiva villa ecológica frente a las turquesas aguas del mar Caribe. Cuenta con alberca privada tipo infinity, terraza panorámica, acceso directo a la playa y chef privado bajo petición.',
    amenities: ['Alberca privada', 'Vista al mar', 'Wifi de alta velocidad', 'Aire acondicionado', 'Cocina equipada', 'Estacionamiento gratis', 'Jacuzzi', 'Asador']
  },
  {
    id: 'prop-2',
    title: 'Cabaña Alpina de Cristal en las Montañas',
    location: 'Valle de Bravo, Estado de México',
    category: 'cabins',
    rating: 4.89,
    reviewsCount: 94,
    pricePerNight: 165,
    currency: 'USD',
    isSuperhost: true,
    isGuestFavorite: false,
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    host: {
      name: 'Carlos Mendoza',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      isSuperhost: true,
      joinedYear: '2020'
    },
    description: 'Disfruta de una experiencia única rodeado de pino y naturaleza. Grandes ventanales de piso a techo, chimenea central a leña, tina exterior con hidromasaje y vista espectacular a las estrellas.',
    amenities: ['Chimenea', 'Tina de hidromasaje', 'Vista a la montaña', 'Wifi', 'Asador para fogata', 'Pet Friendly']
  },
  {
    id: 'prop-3',
    title: 'Penthouse Moderno con Helipuerto y Infinity Pool',
    location: 'Medellín, Antioquia, Colombia',
    category: 'penthouses',
    rating: 4.98,
    reviewsCount: 210,
    pricePerNight: 350,
    currency: 'USD',
    isSuperhost: false,
    isGuestFavorite: true,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 3.5,
    host: {
      name: 'Camila Restrepo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isSuperhost: false,
      joinedYear: '2021'
    },
    description: 'Espectacular Penthouse en El Poblado con domótica completa, sistema de sonido envolvente, alberca infinity en el rooftop y vista panorámica de 360 grados sobre el Valle de Aburrá.',
    amenities: ['Rooftop privado', 'Piscina sin fin', 'Ascensor privado', 'Gimnasio', 'Seguridad 24/7', 'Estacionamiento subterráneo']
  },
  {
    id: 'prop-4',
    title: 'Casa del Árbol de Lujo en el Bosque Nuboso',
    location: 'Monteverde, Puntarenas, Costa Rica',
    category: 'treehouses',
    rating: 4.95,
    reviewsCount: 88,
    pricePerNight: 195,
    currency: 'USD',
    isSuperhost: true,
    isGuestFavorite: true,
    images: [
      'https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    host: {
      name: 'Mateo Vargas',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      isSuperhost: true,
      joinedYear: '2018'
    },
    description: 'Suspendida entre las copas de gigantescos robles centenarios. Vive la experiencia inmersiva de escuchar aves exóticas y la brisa del bosque desde la comodidad de una cama king con dosel.',
    amenities: ['Vista a la jungla', 'Desayuno orgánico incluido', 'Ducha al aire libre', 'Wifi', 'Malla flotante de descanso']
  },
  {
    id: 'prop-5',
    title: 'Hacienda Colonial con Viñedo y Piscina',
    location: 'San Miguel de Allende, Guanajuato, México',
    category: 'country',
    rating: 4.92,
    reviewsCount: 156,
    pricePerNight: 410,
    currency: 'USD',
    isSuperhost: true,
    isGuestFavorite: false,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 12,
    bedrooms: 6,
    beds: 8,
    baths: 6,
    host: {
      name: 'Elena De la Vega',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      isSuperhost: true,
      joinedYear: '2017'
    },
    description: 'Majestuosa hacienda del siglo XVIII restaurada con acabados contemporáneos. Jardines botánicos, cava de vinos privada, alberca climatizada y chimeneas tradicionales en cada habitación.',
    amenities: ['Alberca climatizada', 'Cava de vinos', 'Cancha de tenis', 'Personal de servicio', 'Chimenea en hab.', 'Estacionamiento (6 autos)']
  },
  {
    id: 'prop-6',
    title: 'Villa Minimalista sobre las Rocas del Océano',
    location: 'Punta del Este, Maldonado, Uruguay',
    category: 'pools',
    rating: 4.97,
    reviewsCount: 76,
    pricePerNight: 520,
    currency: 'USD',
    isSuperhost: true,
    isGuestFavorite: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 10,
    bedrooms: 5,
    beds: 6,
    baths: 5,
    host: {
      name: 'Guillermo Rossi',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      isSuperhost: true,
      joinedYear: '2019'
    },
    description: 'Arquitectura de vanguardia integrada en el paisaje costero. Disfruta de puestas de sol inigualables sobre el Atlántico con vista directa al horizonte desde la alberca infinity.',
    amenities: ['Piscina infinity', 'Acceso a la playa', 'Sauna húmedo', 'Gimnasio privado', 'Sistema de sonido Sonos', 'Asador uruguayo']
  }
];
