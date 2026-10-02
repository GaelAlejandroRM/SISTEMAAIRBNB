# 🏠 SISTEMAAIRBNB - Sitio Web Estático (HTML5, CSS3 & JavaScript)

Un sitio web moderno, interactivo y totalmente responsive inspirado en **Airbnb**, construido **exclusivamente con HTML5, CSS3 y JavaScript ES6+**, sin dependencias ni herramientas de construcción.

---

## 🌟 Características Principales

- 🎨 **HTML5 & CSS3 Puro**: Tokens de diseño con CSS Custom Properties, Glassmorphism, animaciones y modo claro/oscuro.
- ⚡ **JavaScript Modular Nativo**: Renderizado dinámico de propiedades, carruseles de fotos por tarjeta y cotizador de reservación.
- 💖 **Favoritos Guardados**: Persistencia mediante `localStorage`.
- 📱 **Diseño Responsive**: Adaptado a móviles, tablets y monitores de escritorio.

---

## 📁 Estructura de Archivos

```text
SISTEMAAIRBNB/
├── css/
│   └── style.css        # Sistema de diseño, tokens, modo oscuro y estilos de componentes
├── js/
│   ├── data.js          # Datos mock de alojamientos e íconos SVG de categorías
│   └── app.js           # Lógica nativa (eventos DOM, carrusel, favoritos y modals)
├── public/
│   └── favicon.svg      # Isotipo vectorial de Airbnb
├── index.html           # Página principal HTML5
├── .gitignore           # Archivos ignorados por Git
└── README.md            # Documentación del proyecto
```

---

## 🚀 Cómo Visualizar la Página

No se requiere instalar nada. Puedes visualizar el proyecto de dos formas:

1. **Abrir directamente**: Haz doble clic sobre [`index.html`](file:///c:/Users/alero/OneDrive/Desktop/SISTEMAAIRBNB/index.html) para abrirlo en tu navegador.
2. **Servidor Estático Local (Ej. Live Server en VS Code)**: Abre la carpeta del proyecto en tu editor y haz clic en *Go Live*.

---

## 📤 Subir Cambios a GitHub

```bash
git add .
git commit -m "refactor: remover vite/react y dejar unicamente HTML, CSS y JS estatico"
git push origin main
```
