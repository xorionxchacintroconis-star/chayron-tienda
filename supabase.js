// ============================================================
// supabase.js — conexión a la base de datos de Chayron
// ============================================================

const SUPABASE_URL = 'https://bjyfxigyyqcxjfgrmzsk.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_RP-l_iRYc-U2OOT6fkRfBg_g1t-c1qJ';

function dividirTallas(texto) {
  return (texto || '')
    .split('/')
    .map(t => t.trim())
    .filter(Boolean);
}

function mapearProducto(fila) {
  const tallasDama = dividirTallas(fila.tallas_dama);
  const tallasCaballero = dividirTallas(fila.tallas_caballero);
  const tallasSinGenero = dividirTallas(fila.tallas_sin_genero);

  let genero = 'unisex';
  if (tallasDama.length && tallasCaballero.length) genero = 'unisex';
  else if (tallasDama.length) genero = 'mujer';
  else if (tallasCaballero.length) genero = 'hombre';

  const tallas = [...new Set([...tallasDama, ...tallasCaballero, ...tallasSinGenero])]
    .sort((a, b) => Number(a) - Number(b));

  // Se marca como "Nuevo" si se creó en los últimos 14 días
  const creadoEn = fila.creado_en ? new Date(fila.creado_en) : null;
  const esNuevo = creadoEn
    ? (Date.now() - creadoEn.getTime()) < 1000 * 60 * 60 * 24 * 14
    : false;

  const imagenes = (fila.imagenes_url || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  return {
    id: fila.id,
    sku: fila.sku,
    nombre: fila.modelo,
    marca: fila.marca,
    categoria: (fila.categoria || 'zapatillas').toLowerCase(),
    genero,
    precio: Number(fila.precio_soles) || 0,
    tallas,
    nuevo: esNuevo,
    stock: !!fila.stock,
    imagen: fila.imagen_url,
    imagenes: imagenes.length ? imagenes : (fila.imagen_url ? [fila.imagen_url] : []),
    video_url: fila.video_url,
  };
}

async function obtenerProductosSupabase() {
  const resp = await fetch(`${SUPABASE_URL}/productos?select=*&order=creado_en.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Error al cargar productos (status ${resp.status})`);
  }

  const filas = await resp.json();
  return filas.map(mapearProducto);
}
