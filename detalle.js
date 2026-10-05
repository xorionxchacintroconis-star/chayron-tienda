// ============================================================
// detalle.js — lógica de la página de detalle de producto
// ============================================================

function formatoPrecio(valor) {
  return 'COP $' + valor.toLocaleString('es-CO');
}

function linkWhatsapp(producto, talla) {
  const base = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  let texto = `${CONFIG_TIENDA.mensajeWhatsapp} ${producto.nombre} (SKU: ${producto.sku})`;
  if (talla) texto += ` - Talla ${talla}`;
  return `${base}?text=${encodeURIComponent(texto)}`;
}

function obtenerIdDeUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('id'));
}

async function renderDetalle() {
  const id = obtenerIdDeUrl();
  const cont = document.getElementById('detalle-contenido');
  cont.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:60px 0;">Cargando...</p>`;

  let productos;
  try {
    productos = await obtenerProductosSupabase();
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:60px 0; color:#c0392b;">No se pudo cargar el producto. Intenta recargar la página.</p>`;
    return;
  }

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    cont.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:60px 0;">Producto no encontrado. <a href="index.html">Volver al catálogo</a></p>`;
    return;
  }

  document.title = `${producto.nombre} | Chayron`;

  const imagenes = producto.imagenes && producto.imagenes.length ? producto.imagenes : [producto.imagen];

  cont.innerHTML = `
    <div class="detalle__galeria">
      <a class="detalle__volver" href="index.html">← Volver al catálogo</a>
      <div class="detalle__imagen-principal-cont">
        ${imagenes.length > 1 ? `<button type="button" class="detalle__flecha detalle__flecha--izq" id="flecha-izq" aria-label="Foto anterior">‹</button>` : ''}
        <img src="${imagenes[0]}" alt="${producto.nombre}" id="imagen-principal" />
        ${imagenes.length > 1 ? `<button type="button" class="detalle__flecha detalle__flecha--der" id="flecha-der" aria-label="Foto siguiente">›</button>` : ''}
      </div>
      ${imagenes.length > 1 ? `
        <div class="detalle__miniaturas" id="miniaturas">
          ${imagenes.map((url, i) => `<img src="${url}" data-index="${i}" class="${i === 0 ? 'activa' : ''}" alt="${producto.nombre} foto ${i + 1}" />`).join('')}
        </div>
      ` : ''}
      ${producto.video_url ? `<video controls src="${producto.video_url}"></video>` : ''}
    </div>
    <div class="detalle__info">
      <div class="detalle__marca">${producto.marca}</div>
      <h1 class="detalle__nombre">${producto.nombre}</h1>
      <div class="detalle__precio">${formatoPrecio(producto.precio)}</div>

      <div class="detalle__tallas-label">Selecciona tu talla</div>
      <div class="detalle__tallas" id="tallas-contenedor">
        ${producto.tallas.map(t => `<button type="button" data-talla="${t}">${t}</button>`).join('')}
      </div>

      ${producto.stock
        ? `<a class="btn-comprar" id="btn-comprar" href="${linkWhatsapp(producto)}" target="_blank">💬 Comprar por WhatsApp</a>`
        : `<div class="badge-sin-stock" style="position:static; padding:14px; border-radius:10px;">Producto agotado</div>`
      }
    </div>
  `;

  if (imagenes.length > 1) {
    let indiceActual = 0;
    const imgPrincipal = document.getElementById('imagen-principal');
    const miniaturas = cont.querySelectorAll('#miniaturas img');

    function mostrarImagen(i) {
      indiceActual = (i + imagenes.length) % imagenes.length;
      imgPrincipal.src = imagenes[indiceActual];
      miniaturas.forEach((img, idx) => img.classList.toggle('activa', idx === indiceActual));
    }

    miniaturas.forEach(img => {
      img.addEventListener('click', () => mostrarImagen(Number(img.dataset.index)));
    });
    const flechaIzq = document.getElementById('flecha-izq');
    const flechaDer = document.getElementById('flecha-der');
    if (flechaIzq) flechaIzq.addEventListener('click', () => mostrarImagen(indiceActual - 1));
    if (flechaDer) flechaDer.addEventListener('click', () => mostrarImagen(indiceActual + 1));
  }

  let tallaSeleccionada = null;
  const botonesTalla = cont.querySelectorAll('#tallas-contenedor button');
  botonesTalla.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesTalla.forEach(b => b.classList.remove('seleccionada'));
      btn.classList.add('seleccionada');
      tallaSeleccionada = btn.dataset.talla;
      const btnComprar = document.getElementById('btn-comprar');
      if (btnComprar) btnComprar.href = linkWhatsapp(producto, tallaSeleccionada);
    });
  });

  document.getElementById('btn-whatsapp-header').href = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  document.getElementById('btn-whatsapp-footer').href = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  document.getElementById('link-instagram').href = CONFIG_TIENDA.instagram;
  document.getElementById('link-facebook').href = CONFIG_TIENDA.facebook;
}

document.addEventListener('DOMContentLoaded', renderDetalle);
