// ============================================================
// app.js — lógica del catálogo de Chayron (estilo DAGI)
// ============================================================

const POR_PAGINA = 8;

let PRODUCTOS = [];

let estado = {
  busqueda: '',
  generos: [],
  marcas: [],
  tallas: [],
  precioMax: 1000000,
  soloNuevo: false,
  orden: 'relevancia',
  pagina: 1,
};

function formatoPrecio(valor) {
  return 'COP $' + valor.toLocaleString('es-CO');
}

function linkWhatsapp(producto) {
  const base = `https://wa.me/${CONFIG_TIENDA.whatsapp}`;
  if (!producto) return base;
  const texto = encodeURIComponent(`${CONFIG_TIENDA.mensajeWhatsapp} ${producto.nombre} (SKU: ${producto.sku})`);
  return `${base}?text=${texto}`;
}

// ---------- Construcción de filtros dinámicos ----------
function inicializarFiltros() {
  const marcas = [...new Set(PRODUCTOS.map(p => p.marca))].sort();
  const contMarcas = document.getElementById('filtro-marca');
  contMarcas.innerHTML = marcas.map(m =>
    `<label><input type="checkbox" value="${m}" data-tipo="marca" /> ${m}</label>`
  ).join('');

  const tallas = [...new Set(PRODUCTOS.flatMap(p => p.tallas))].sort((a, b) => a - b);
  const contTallas = document.getElementById('filtro-talla');
  contTallas.innerHTML = tallas.map(t =>
    `<button type="button" data-talla="${t}">${t}</button>`
  ).join('');

  const precios = PRODUCTOS.map(p => p.precio);
  const maxPrecio = Math.max(...precios);
  const inputPrecio = document.getElementById('precio-max');
  inputPrecio.max = maxPrecio;
  inputPrecio.value = maxPrecio;
  estado.precioMax = maxPrecio;
  document.getElementById('precio-max-label').textContent = formatoPrecio(maxPrecio);

  // listeners
  document.querySelectorAll('#filtro-genero input').forEach(chk => {
    chk.addEventListener('change', () => {
      estado.generos = [...document.querySelectorAll('#filtro-genero input:checked')].map(c => c.value);
      estado.pagina = 1;
      render();
    });
  });

  contMarcas.querySelectorAll('input').forEach(chk => {
    chk.addEventListener('change', () => {
      estado.marcas = [...contMarcas.querySelectorAll('input:checked')].map(c => c.value);
      estado.pagina = 1;
      render();
    });
  });

  contTallas.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('activo');
      estado.tallas = [...contTallas.querySelectorAll('button.activo')].map(b => b.dataset.talla);
      estado.pagina = 1;
      render();
    });
  });

  inputPrecio.addEventListener('input', () => {
    estado.precioMax = Number(inputPrecio.value);
    document.getElementById('precio-max-label').textContent = formatoPrecio(estado.precioMax);
    estado.pagina = 1;
    render();
  });

  document.getElementById('filtro-nuevo').addEventListener('change', (e) => {
    estado.soloNuevo = e.target.checked;
    estado.pagina = 1;
    render();
  });

  document.getElementById('btn-limpiar').addEventListener('click', () => {
    estado = { busqueda: '', generos: [], marcas: [], tallas: [], precioMax: maxPrecio, soloNuevo: false, orden: 'relevancia', pagina: 1 };
    document.querySelectorAll('.filtros input[type="checkbox"]').forEach(c => c.checked = false);
    document.querySelectorAll('.filtro-tallas button').forEach(b => b.classList.remove('activo'));
    inputPrecio.value = maxPrecio;
    document.getElementById('precio-max-label').textContent = formatoPrecio(maxPrecio);
    document.getElementById('buscador').value = '';
    document.getElementById('orden-select').value = 'relevancia';
    render();
  });

  document.getElementById('orden-select').addEventListener('change', (e) => {
    estado.orden = e.target.value;
    render();
  });

  document.getElementById('buscador').addEventListener('input', (e) => {
    estado.busqueda = e.target.value.trim().toLowerCase();
    estado.pagina = 1;
    render();
  });

  // Nav superior: filtros rápidos
  document.querySelectorAll('.header__nav a[data-categoria="hombre"]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); estado.generos = ['hombre']; render(); window.scrollTo({top:0, behavior:'smooth'}); })
  );
  document.querySelectorAll('.header__nav a[data-categoria="mujer"]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); estado.generos = ['mujer']; render(); window.scrollTo({top:0, behavior:'smooth'}); })
  );
  document.querySelectorAll('.header__nav a[data-nuevo]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); estado.soloNuevo = true; document.getElementById('filtro-nuevo').checked = true; render(); window.scrollTo({top:0, behavior:'smooth'}); })
  );

  // Botones de WhatsApp fijos
  document.getElementById('btn-whatsapp-header').href = linkWhatsapp();
  document.getElementById('btn-whatsapp-footer').href = linkWhatsapp();

  // Redes sociales
  document.getElementById('link-instagram').href = CONFIG_TIENDA.instagram;
  document.getElementById('link-facebook').href = CONFIG_TIENDA.facebook;
}

// ---------- Filtrado + orden ----------
function obtenerProductosFiltrados() {
  let lista = PRODUCTOS.filter(p => {
    if (estado.busqueda && !(`${p.nombre} ${p.marca}`.toLowerCase().includes(estado.busqueda))) return false;
    if (estado.generos.length && !estado.generos.includes(p.genero)) return false;
    if (estado.marcas.length && !estado.marcas.includes(p.marca)) return false;
    if (estado.tallas.length && !estado.tallas.some(t => p.tallas.includes(t))) return false;
    if (p.precio > estado.precioMax) return false;
    if (estado.soloNuevo && !p.nuevo) return false;
    return true;
  });

  if (estado.orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
  if (estado.orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
  if (estado.orden === 'nuevo') lista.sort((a, b) => (b.nuevo === true) - (a.nuevo === true));

  return lista;
}

// ---------- Render ----------
function render() {
  const lista = obtenerProductosFiltrados();
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;

  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const paginaActual = lista.slice(inicio, inicio + POR_PAGINA);

  document.getElementById('conteo-resultados').textContent =
    `${total} producto${total !== 1 ? 's' : ''}`;

  const grid = document.getElementById('grid-productos');
  if (paginaActual.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888; padding:40px 0;">No encontramos productos con esos filtros.</p>`;
  } else {
    grid.innerHTML = paginaActual.map(tarjetaProducto).join('');
  }

  renderPaginacion(totalPaginas);
}

function tarjetaProducto(p) {
  return `
    <a class="tarjeta-producto" href="detalle-producto.html?id=${p.id}">
      <div class="tarjeta-producto__imagen">
        ${p.nuevo ? '<span class="badge-nuevo">Nuevo</span>' : ''}
        ${!p.stock ? '<div class="badge-sin-stock">Agotado</div>' : ''}
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
      </div>
      <div class="tarjeta-producto__info">
        <div class="tarjeta-producto__marca">${p.marca}</div>
        <div class="tarjeta-producto__nombre">${p.nombre}</div>
        <div class="tarjeta-producto__precio">${formatoPrecio(p.precio)}</div>
        <div class="tarjeta-producto__tallas">Tallas: ${p.tallas.join(', ')}</div>
      </div>
    </a>
  `;
}

function renderPaginacion(totalPaginas) {
  const cont = document.getElementById('paginacion');
  if (totalPaginas <= 1) { cont.innerHTML = ''; return; }

  let html = `<button ${estado.pagina === 1 ? 'disabled' : ''} data-pagina="${estado.pagina - 1}">‹</button>`;
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<button class="${i === estado.pagina ? 'activo' : ''}" data-pagina="${i}">${i}</button>`;
  }
  html += `<button ${estado.pagina === totalPaginas ? 'disabled' : ''} data-pagina="${estado.pagina + 1}">›</button>`;
  cont.innerHTML = html;

  cont.querySelectorAll('button[data-pagina]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.pagina = Number(btn.dataset.pagina);
      render();
      window.scrollTo({ top: document.querySelector('.resultados').offsetTop - 100, behavior: 'smooth' });
    });
  });
}

// ---------- Inicio ----------
document.addEventListener('DOMContentLoaded', async () => {
  document.title = `${CONFIG_TIENDA.nombre} | Tienda de Zapatillas`;

  const grid = document.getElementById('grid-productos');
  grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px 0; color:#888;">Cargando productos...</p>`;

  try {
    PRODUCTOS = await obtenerProductosSupabase();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px 0; color:#c0392b;">No se pudieron cargar los productos. Intenta recargar la página.</p>`;
    return;
  }

  inicializarFiltros();
  render();
});
