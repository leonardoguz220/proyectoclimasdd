import { normalizarClima } from './clima.js';
import { CiudadNoEncontrada, ServicioCaido, SinConexion } from './errores.js';
import { TEXTOS } from './textos.js';

// Único módulo que usa la red. `fetch` se puede inyectar para los tests (opciones.fetch).

const URL_GEOCODIFICACION = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_PRONOSTICO = 'https://api.open-meteo.com/v1/forecast';
const URL_UBICACION_INVERSA = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export const MAX_COINCIDENCIAS = 5;
export const TIEMPO_LIMITE_MS = 8000;

const CAMPOS_ACTUALES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'wind_speed_10m',
];
const CAMPOS_DIARIOS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'uv_index_max',
  'sunrise',
  'sunset',
];

// Traduce cualquier falla a un error de la app (CA-24, CA-25).
async function pedirJSON(url, opciones = {}) {
  const hacerFetch = opciones.fetch ?? globalThis.fetch;
  const tiempoLimite = opciones.tiempoLimite ?? TIEMPO_LIMITE_MS;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new SinConexion();
  }

  const control = new AbortController();
  let agotado = false;
  const temporizador = setTimeout(() => {
    agotado = true;
    control.abort();
  }, tiempoLimite);

  try {
    let respuesta;
    try {
      respuesta = await hacerFetch(url, { signal: control.signal });
    } catch {
      throw agotado ? new ServicioCaido() : new SinConexion();
    }
    if (!respuesta.ok) throw new ServicioCaido();
    try {
      return await respuesta.json();
    } catch {
      throw new ServicioCaido();
    }
  } finally {
    clearTimeout(temporizador);
  }
}

// CA-02, CA-23: hasta 5 coincidencias; sin resultados → CiudadNoEncontrada.
export async function buscarCiudades(nombre, opciones) {
  const parametros = new URLSearchParams({
    name: nombre,
    count: String(MAX_COINCIDENCIAS),
    language: 'es',
    format: 'json',
  });
  const datos = await pedirJSON(`${URL_GEOCODIFICACION}?${parametros}`, opciones);

  if (!Array.isArray(datos?.results) || datos.results.length === 0) {
    throw new CiudadNoEncontrada();
  }
  return datos.results.slice(0, MAX_COINCIDENCIAS).map((r) => ({
    nombre: r.name,
    region: r.admin1 ?? null,
    pais: r.country ?? null,
    etiqueta: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    latitud: r.latitude,
    longitud: r.longitude,
  }));
}

// CA-03, CA-05, CA-10: hoy + 3 días siguientes en una sola petición.
export async function obtenerClima(latitud, longitud, ciudad, opciones) {
  const parametros = new URLSearchParams({
    latitude: String(latitud),
    longitude: String(longitud),
    timezone: 'auto',
    forecast_days: '4',
    current: CAMPOS_ACTUALES.join(','),
    daily: CAMPOS_DIARIOS.join(','),
  });
  const datos = await pedirJSON(`${URL_PRONOSTICO}?${parametros}`, opciones);
  return normalizarClima(datos, ciudad);
}

// CA-28: el nombre no es crítico; si falla, se usa "Mi ubicación".
export async function nombreDeUbicacion(latitud, longitud, opciones) {
  try {
    const parametros = new URLSearchParams({
      latitude: String(latitud),
      longitude: String(longitud),
      localityLanguage: 'es',
    });
    const datos = await pedirJSON(`${URL_UBICACION_INVERSA}?${parametros}`, opciones);
    return datos?.city || datos?.locality || TEXTOS.ui.miUbicacion;
  } catch {
    return TEXTOS.ui.miUbicacion;
  }
}
