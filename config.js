// ============================================================
// config.js — datos generales de la tienda Chayron
// ============================================================

const CONFIG_TIENDA = {
  nombre: 'Chayron',
  whatsapp: '573218364885',
  mensajeWhatsapp: 'Hola, quiero más información de',
  instagram: 'https://www.instagram.com/chayron.col',
  facebook: 'https://www.facebook.com/chayron.co',

  // --- Carrusel del inicio ---
  // Dejalo vacío [] para que muestre solo los últimos modelos subidos.
  // O pon los SKU que quieras destacar, en orden. Ej: ['CHY-222', 'CHY-150', 'CHY-099']
  carruselSkus: [],
  carruselCantidad: 4,        // cuántos modelos pasan (3 o 4 recomendado)
  carruselSegundos: 5,        // cada cuántos segundos cambia

  // --- Sección "Envíos realizados" ---
  // Mientras ambas listas estén vacías, la sección NO se muestra.
  // Las fotos y videos se suben al repositorio junto a index.html.
  enviosFotos: ['envio-1.jpg','envio-2.jpg','envio-3.jpg','envio-4.jpg','envio-5.jpg','envio-6.jpg','envio-7.jpg'],
  // Videos: solo el nombre sin extensión. Se usan nombre.mp4 (video) y nombre.jpg (portada)
  enviosVideos: ['video-1','video-2','video-3'],
};
