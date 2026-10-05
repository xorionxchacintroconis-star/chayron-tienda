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
    a.addEventListener('click', (e) => { e.preventDefault(); estado.generos = ['hombre']; render(); irAResultados(); })
  );
  document.querySelectorAll('.header__nav a[data-categoria="mujer"]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); estado.generos = ['mujer']; render(); irAResultados(); })
  );
  document.querySelectorAll('.header__nav a[data-categoria="todas"]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); irAResultados(); })
  );
  document.querySelectorAll('.header__nav a[data-nuevo]').forEach(a =>
    a.addEventListener('click', (e) => { e.preventDefault(); estado.soloNuevo = true; document.getElementById('filtro-nuevo').checked = true; render(); irAResultados(); })
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

  // Solo se muestran unas pocas páginas: 1 … 4 5 6 … 28
  const p = estado.pagina;
  const nums = new Set([1, totalPaginas, p - 1, p, p + 1]);
  const visibles = [...nums].filter(n => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);

  let html = `<button ${p === 1 ? 'disabled' : ''} data-pagina="${p - 1}">‹</button>`;
  let previo = 0;
  visibles.forEach(n => {
    if (n - previo > 1) html += `<span class="paginacion__puntos">…</span>`;
    html += `<button class="${n === p ? 'activo' : ''}" data-pagina="${n}">${n}</button>`;
    previo = n;
  });
  html += `<button ${p === totalPaginas ? 'disabled' : ''} data-pagina="${p + 1}">›</button>`;
  cont.innerHTML = html;

  cont.querySelectorAll('button[data-pagina]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.pagina = Number(btn.dataset.pagina);
      render();
      window.scrollTo({ top: document.querySelector('.resultados').offsetTop - 100, behavior: 'smooth' });
    });
  });
}


// ---------- Utilidades ----------
function irAResultados() {
  const el = document.querySelector('.resultados');
  if (el) window.scrollTo({ top: el.offsetTop - 130, behavior: 'smooth' });
}

// ---------- Carrusel de nuevos ingresos ----------
function elegirDestacados() {
  const skus = CONFIG_TIENDA.carruselSkus || [];
  const cantidad = CONFIG_TIENDA.carruselCantidad || 4;
  let lista;
  if (skus.length) {
    lista = skus.map(s => PRODUCTOS.find(p => p.sku === s)).filter(Boolean);
  } else {
    // los más recientes (PRODUCTOS ya viene ordenado por fecha, nuevo primero)
    lista = PRODUCTOS.filter(p => p.stock && p.imagen);
  }
  return lista.slice(0, cantidad);
}

function iniciarCarrusel() {
  const seccion = document.getElementById('carrusel');
  const pista = document.getElementById('carrusel-pista');
  const puntos = document.getElementById('carrusel-puntos');
  const destacados = elegirDestacados();

  if (!destacados.length) { seccion.style.display = 'none'; return; }

  pista.innerHTML = destacados.map((p, i) => `
    <a class="carrusel__slide ${i === 0 ? 'activa' : ''}" href="detalle-producto.html?id=${p.id}">
      <div class="carrusel__foto"><img src="${p.imagen}" alt="${p.nombre}" ${i === 0 ? '' : 'loading="lazy"'} /></div>
      <div class="carrusel__texto">
        <span class="carrusel__etiqueta">Nuevo ingreso</span>
        <h2>${p.nombre}</h2>
        <div class="carrusel__precio">${formatoPrecio(p.precio)}</div>
        <span class="carrusel__boton">Ver modelo</span>
      </div>
    </a>
  `).join('');

  puntos.innerHTML = destacados.map((_, i) =>
    `<button type="button" class="${i === 0 ? 'activo' : ''}" data-i="${i}" aria-label="Ir al modelo ${i + 1}"></button>`
  ).join('');
  if (destacados.length < 2) puntos.style.display = 'none';

  const slides = [...pista.querySelectorAll('.carrusel__slide')];
  const dots = [...puntos.querySelectorAll('button')];
  let actual = 0;
  let timer = null;
  const ms = (CONFIG_TIENDA.carruselSegundos || 5) * 1000;

  function mostrar(i) {
    actual = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('activa', k === actual));
    dots.forEach((d, k) => d.classList.toggle('activo', k === actual));
  }
  function arrancar() {
    if (slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    detener();
    timer = setInterval(() => mostrar(actual + 1), ms);
  }
  function detener() { if (timer) clearInterval(timer); timer = null; }

  dots.forEach(d => d.addEventListener('click', () => { mostrar(Number(d.dataset.i)); arrancar(); }));
  seccion.addEventListener('mouseenter', detener);
  seccion.addEventListener('mouseleave', arrancar);

  // deslizar con el dedo
  let x0 = null;
  seccion.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; detener(); }, { passive: true });
  seccion.addEventListener('touchend', e => {
    if (x0 !== null) {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { mostrar(actual + (dx < 0 ? 1 : -1)); }
    }
    x0 = null;
    arrancar();
  });

  document.addEventListener('visibilitychange', () => document.hidden ? detener() : arrancar());
  arrancar();
}

// ---------- Filtros en celular (panel que se abre) ----------
function iniciarPanelFiltros() {
  const panel = document.getElementById('panel-filtros');
  const fondo = document.getElementById('filtros-fondo');
  const abrir = () => { panel.classList.add('abierto'); fondo.classList.add('abierto'); document.body.classList.add('sin-scroll'); };
  const cerrar = () => { panel.classList.remove('abierto'); fondo.classList.remove('abierto'); document.body.classList.remove('sin-scroll'); };
  document.getElementById('btn-abrir-filtros').addEventListener('click', abrir);
  document.getElementById('btn-cerrar-filtros').addEventListener('click', cerrar);
  document.getElementById('btn-aplicar-filtros').addEventListener('click', () => { cerrar(); irAResultados(); });
  fondo.addEventListener('click', cerrar);
}

// ---------- Envíos realizados ----------
function iniciarEnvios() {
  const fotos = CONFIG_TIENDA.enviosFotos || [];
  if (!fotos.length) return;
  const sec = document.getElementById('seccion-envios');
  document.getElementById('envios-tira').innerHTML = fotos.map(f =>
    `<img src="envios/${f}" alt="Envío realizado" loading="lazy" />`
  ).join('');
  sec.hidden = false;
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
    document.getElementById('carrusel').style.display = 'none';
    return;
  }

  inicializarFiltros();
  iniciarPanelFiltros();
  iniciarCarrusel();
  iniciarEnvios();
  render();
});
