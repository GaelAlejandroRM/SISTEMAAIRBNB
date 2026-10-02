export const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>` },
  { id: 'beachfront', label: 'Frente a la playa', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>` },
  { id: 'cabins', label: 'Cabañas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.01"/><path d="M14 10v.01"/><path d="M10 14v.01"/><path d="M14 14v.01"/><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/></svg>` },
  { id: 'mansions', label: 'Mansiones', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 20v-9H2v9"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M22 20H2"/></svg>` },
  { id: 'pools', label: 'Albercas increíbles', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19C7.29 7.46 7 5.76 7 4.5 7 3.12 8.12 2 9.5 2S12 3.12 12 4.5"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>` },
  { id: 'tiny', label: 'Minicasas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { id: 'views', label: 'Vistas increíbles', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>` },
  { id: 'luxe', label: 'Lujo', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>` }
];

export const LISTINGS = [
  {
    id: '1',
    title: 'Villa de Lujo Frente al Mar Caribe',
    category: 'beachfront',
    location: 'Cancún, Quintana Roo',
    distance: 'A 15 km de distancia',
    dates: '12 - 17 de Nov',
    price: 3450,
    rating: 4.98,
    reviewsCount: 124,
    isSuperhost: true,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 4.5,
    description: 'Disfruta de amaneceres inolvidables en esta majestuosa villa costera con alberca infinity, acceso privado a la playa y servicio de chef ejecutivo.'
  },
  {
    id: '2',
    title: 'Cabaña Alpina con Jacuzzi en el Bosque',
    category: 'cabins',
    location: 'Valle de Bravo, Estado de México',
    distance: 'A 120 km de distancia',
    dates: '20 - 25 de Oct',
    price: 2100,
    rating: 4.92,
    reviewsCount: 88,
    isSuperhost: true,
    images: [
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    description: 'Refugio romántico rodeado de pinos centenarios. Incluye chimenea de piedra, jacuzzi exterior templado y terraza astronómica.'
  },
  {
    id: '3',
    title: 'Residencia de Diseño Modernista & Alberca',
    category: 'pools',
    location: 'Puerto Vallarta, Jalisco',
    distance: 'A 45 km de distancia',
    dates: '5 - 10 de Dic',
    price: 4200,
    rating: 4.96,
    reviewsCount: 210,
    isSuperhost: false,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 10,
    bedrooms: 5,
    beds: 6,
    baths: 5,
    description: 'Espacio arquitectónico contemporáneo con vista panorámica a la Bahía de Banderas. Cuenta con cine privado y cava de vinos.'
  },
  {
    id: '4',
    title: 'Penthouse Exclusivo en Zona Rosa',
    category: 'luxe',
    location: 'Ciudad de México, CDMX',
    distance: 'A 5 km del centro',
    dates: '15 - 18 de Nov',
    price: 2850,
    rating: 4.89,
    reviewsCount: 156,
    isSuperhost: true,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 3,
    bedrooms: 1,
    beds: 1,
    baths: 1.5,
    description: 'Penthouse de doble altura con terraza privada verde, acabados en mármol y acceso VIP a los mejores restaurantes de la capital.'
  },
  {
    id: '5',
    title: 'Minicasa Sustentable con Vista a los Volcanes',
    category: 'tiny',
    location: 'Tepoztlán, Morelos',
    distance: 'A 75 km de distancia',
    dates: '1 - 4 de Nov',
    price: 1350,
    rating: 4.95,
    reviewsCount: 74,
    isSuperhost: true,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    description: 'Experiencia minimalista y ecológica alimentada por energía solar. Ideal para desconectarse y admirar el Cerro del Tepozteco.'
  },
  {
    id: '6',
    title: 'Mansión Neoclásica con Jardín Botánico',
    category: 'mansions',
    location: 'San Miguel de Allende, Guanajuato',
    distance: 'A 280 km de distancia',
    dates: '10 - 15 de Nov',
    price: 5900,
    rating: 5.0,
    reviewsCount: 42,
    isSuperhost: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
    ],
    guests: 12,
    bedrooms: 6,
    beds: 8,
    baths: 6.5,
    description: 'Casona histórica restaurada por reconocidos arquitectos. Alberga patios de cantera, fuentes antiguas, piscina de agua de manantial y cava.'
  }
];
