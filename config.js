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
  // Sube las fotos a una carpeta "envios" en el repositorio y escribe aquí sus nombres.
  // Mientras esta lista esté vacía, la sección NO se muestra.
  // Ej: ['envio-1.jpg', 'envio-2.jpg', 'envio-3.jpg']
  enviosFotos: [],
};
