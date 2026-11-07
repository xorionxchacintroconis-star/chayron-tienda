// ============================================================
// detalle.js — lógica de la página de detalle de producto
// ============================================================

function formatoPrecio(valor) {
  return 'COP $' + valor.toLocaleString('es-CO');
}

function linkWhatsapp(producto, opcion) {
  const base = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  let texto = `${CONFIG_TIENDA.mensajeWhatsapp} ${producto.nombre} (SKU: ${producto.sku})`;
  if (opcion) texto += producto.categoria === 'zapatillas' ? ` - Talla ${opcion}` : ` - Color ${opcion}`;
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
  const esCalzado = producto.categoria === 'zapatillas';
  const opciones = esCalzado ? producto.tallas : producto.colores;
  const etiquetaOpcion = esCalzado ? 'Selecciona tu talla' : 'Selecciona tu color';

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

      ${opciones.length ? `
        <div class="detalle__tallas-label" id="etiqueta-opcion">${etiquetaOpcion}</div>
        <div class="detalle__tallas" id="tallas-contenedor">
          ${opciones.map((t, i) => `<button type="button" class="${esCalzado ? '' : 'color'}" data-talla="${t}" data-i="${i}">${t}</button>`).join('')}
        </div>` : '<div id="tallas-contenedor"></div>'}

      <div class="detalle__compra">
        <div class="detalle__compra-precio">${formatoPrecio(producto.precio)}</div>
        ${producto.stock
          ? `<a class="btn-comprar" id="btn-comprar" href="${linkWhatsapp(producto)}" target="_blank">💬 Comprar por WhatsApp</a>`
          : `<div class="badge-sin-stock" style="position:static; padding:14px; border-radius:10px; flex:1; text-align:center;">Producto agotado</div>`
        }
      </div>
    </div>
  `;

  let mostrarImagen = null;
  if (imagenes.length > 1) {
    let indiceActual = 0;
    const imgPrincipal = document.getElementById('imagen-principal');
    const miniaturas = cont.querySelectorAll('#miniaturas img');

    mostrarImagen = function (i) {
      indiceActual = (i + imagenes.length) % imagenes.length;
      imgPrincipal.src = imagenes[indiceActual];
      miniaturas.forEach((img, idx) => img.classList.toggle('activa', idx === indiceActual));
    };

    miniaturas.forEach(img => {
      img.addEventListener('click', () => mostrarImagen(Number(img.dataset.index)));
    });
    const flechaIzq = document.getElementById('flecha-izq');
    const flechaDer = document.getElementById('flecha-der');
    if (flechaIzq) flechaIzq.addEventListener('click', () => mostrarImagen(indiceActual - 1));
    if (flechaDer) flechaDer.addEventListener('click', () => mostrarImagen(indiceActual + 1));
  }

  document.body.classList.add('pagina-detalle');

  // Si no eligió talla/color, el primer toque lo lleva a elegir (el segundo toque sigue igual al WhatsApp)
  let avisado = false;
  const btnComprarEl = document.getElementById('btn-comprar');
  if (btnComprarEl && opciones.length) {
    btnComprarEl.addEventListener('click', (e) => {
      if (!cont.querySelector('#tallas-contenedor button.seleccionada') && !avisado) {
        e.preventDefault();
        avisado = true;
        const et = document.getElementById('etiqueta-opcion');
        et.textContent = esCalzado ? '👇 Elige tu talla y vuelve a tocar el botón' : '👇 Elige tu color y vuelve a tocar el botón';
        et.classList.add('detalle__aviso');
        et.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  let tallaSeleccionada = null;
  const botonesTalla = cont.querySelectorAll('#tallas-contenedor button');
  botonesTalla.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesTalla.forEach(b => b.classList.remove('seleccionada'));
      btn.classList.add('seleccionada');
      tallaSeleccionada = btn.dataset.talla;
      // En relojes, cada color tiene su foto (mismo orden)
      if (!esCalzado && mostrarImagen && Number(btn.dataset.i) < imagenes.length) mostrarImagen(Number(btn.dataset.i));
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
