# 🏡 SISTEMA AIRBNB - Frontend Vite + React

Proyecto inicial de aplicación web para reserva de alojamientos y experiencias, construido con **Vite**, **React** y **CSS Moderno**.

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [Git](https://git-scm.com/)

### 2. Instalación de dependencias
Abre una terminal en esta carpeta y ejecuta:

```bash
npm install
```

### 3. Ejecutar servidor de desarrollo local
```bash
npm run dev
```
Accede a la aplicación en tu navegador en: `http://localhost:3000`

---

## 🔗 Conectar a un Repositorio Git (GitHub / GitLab / Bitbucket)

El repositorio local Git ya ha sido inicializado en este proyecto. Para enlazarlo con tu repositorio remoto:

### Paso 1: Crear un nuevo repositorio en GitHub
Crea un repositorio vacío en GitHub (sin añadir README, .gitignore ni licencia, ya que este proyecto ya los incluye).

### Paso 2: Vincular y subir tus cambios
Ejecuta los siguientes comandos en tu terminal dentro de esta carpeta:

```bash
# 1. Agregar todos los archivos al área de preparación
git add .

# 2. Hacer el primer commit
git commit -m "feat: Estructura inicial del proyecto Sistema Airbnb con React + Vite"

# 3. Renombrar la rama principal a main (recomendado)
git branch -M main

# 4. Vincular con tu repositorio de GitHub (reemplaza LA_URL_DE_TU_REPOSITY)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 5. Subir tus cambios al repositorio remoto
git push -u origin main
```

---

## 📁 Estructura del Proyecto

```
SISTEMAAIRBNB/
├── .gitignore               # Archivos ignorados por Git
├── index.html               # Punto de entrada HTML principal
├── package.json             # Dependencias y scripts del proyecto
├── README.md                # Documentación del proyecto
├── vite.config.js           # Configuración de Vite
└── src/
    ├── main.jsx             # Punto de entrada de React
    ├── App.jsx              # Componente principal con lógica de estado
    ├── index.css            # Sistema de diseño global CSS (variables, utilidades, componentes)
    ├── components/          # Componentes reutilizables
    │   ├── Navbar.jsx       # Barra de navegación principal
    │   ├── CategoryFilter.jsx # Filtros por categorías de alojamiento
    │   ├── PropertyCard.jsx # Tarjeta individual de propiedad
    │   ├── PropertyGrid.jsx # Rejilla de listados
    │   ├── PropertyModal.jsx# Vista detallada de propiedad
    │   ├── BookingModal.jsx # Modal de confirmación de reserva
    │   ├── HostDashboard.jsx# Panel para publicar/gestionar alojamientos
    │   └── Footer.jsx       # Pie de página interactivo
    └── data/
        └── mockData.js      # Datos simulados de alojamientos y categorías
```

---

## 🎨 Características Incluidas

- **Filtro interactivo por categorías**: Cabañas, Frente a la playa, Piscinas increíbles, Casas de campo, Casas del árbol, Penthouses.
- **Buscador global**: Búsqueda por ubicación o nombre.
- **Detalle de alojamiento**: Galería de fotos, desglose de precios, servicios incluidos, información del anfitrión y mapa conceptual.
- **Simulador de Reserva**: Cálculo automático de noches, tarifas de limpieza y servicio.
- **Modo Anfitrión**: Vista interactiva para publicar un nuevo alojamiento.
- **Diseño Responsive & Glassmorphism**: Interfaz optimizada para móviles, tablets y computadoras de escritorio.

---

## 📦 Comandos Disponibles

- `npm run dev` - Inicia el servidor de desarrollo local.
- `npm run build` - Genera el paquete optimizado para producción en `/dist`.
- `npm run preview` - Sirve localmente el paquete de producción generado.
