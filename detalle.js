// ============================================================
// detalle.js — lógica de la página de detalle de producto
// ============================================================

function formatoPrecio(valor) {
  return 'COP $' + valor.toLocaleString('es-CO');
}

function linkWhatsapp(producto, talla, color) {
  const base = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  let texto = `${CONFIG_TIENDA.mensajeWhatsapp} ${producto.nombre} (SKU: ${producto.sku})`;
  if (talla) texto += ` - Talla ${talla}`;
  if (color) texto += ` - Color ${color}`;
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
  const tallas = producto.tallas;
  const colores = producto.colores;

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

      ${colores.length ? `
        <div class="detalle__tallas-label" id="etiqueta-colores">Selecciona tu color</div>
        <div class="detalle__tallas" id="colores-contenedor">
          ${colores.map((c, i) => `<button type="button" class="color" data-color="${c}" data-i="${i}">${c}</button>`).join('')}
        </div>` : ''}

      ${tallas.length ? `
        <div class="detalle__tallas-label" id="etiqueta-tallas">Selecciona tu talla</div>
        <div class="detalle__tallas" id="tallas-contenedor">
          ${tallas.map(t => `<button type="button" data-talla="${t}">${t}</button>`).join('')}
        </div>` : ''}

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

  // Selección de color (cambia la foto) y de talla
  let tallaSeleccionada = null;
  let colorSeleccionado = null;
  const actualizarEnlace = () => {
    const btn = document.getElementById('btn-comprar');
    if (btn) btn.href = linkWhatsapp(producto, tallaSeleccionada, colorSeleccionado);
  };
  const botonesTalla = cont.querySelectorAll('#tallas-contenedor button');
  botonesTalla.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesTalla.forEach(b => b.classList.remove('seleccionada'));
      btn.classList.add('seleccionada');
      tallaSeleccionada = btn.dataset.talla;
      actualizarEnlace();
    });
  });
  const botonesColor = cont.querySelectorAll('#colores-contenedor button');
  botonesColor.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesColor.forEach(b => b.classList.remove('seleccionada'));
      btn.classList.add('seleccionada');
      colorSeleccionado = btn.dataset.color;
      // cada color tiene su foto (mismo orden)
      if (mostrarImagen && Number(btn.dataset.i) < imagenes.length) mostrarImagen(Number(btn.dataset.i));
      actualizarEnlace();
    });
  });

  // Si falta elegir talla o color, el primer toque lo lleva a elegir (el segundo toque sigue al WhatsApp)
  let avisado = false;
  const btnComprarEl = document.getElementById('btn-comprar');
  if (btnComprarEl && (tallas.length || colores.length)) {
    btnComprarEl.addEventListener('click', (e) => {
      const falta = [];
      if (colores.length && !colorSeleccionado) falta.push('color');
      if (tallas.length && !tallaSeleccionada) falta.push('talla');
      if (falta.length && !avisado) {
        e.preventDefault();
        avisado = true;
        const et = document.getElementById(falta[0] === 'color' ? 'etiqueta-colores' : 'etiqueta-tallas');
        et.textContent = `👇 Elige tu ${falta.join(' y ')} y vuelve a tocar el botón`;
        et.classList.add('detalle__aviso');
        et.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  document.getElementById('btn-whatsapp-header').href = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  document.getElementById('btn-whatsapp-footer').href = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  document.getElementById('link-instagram').href = CONFIG_TIENDA.instagram;
  document.getElementById('link-facebook').href = CONFIG_TIENDA.facebook;
}

document.addEventListener('DOMContentLoaded', renderDetalle);
