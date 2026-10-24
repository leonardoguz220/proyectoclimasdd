import { TEXTOS } from './textos.js';

// Reglas puras del clima: sin red ni DOM.

const CIELO = {
  despejado: { descripcion: 'Despejado', icono: '☀️', fondo: 'despejado' },
  mayormenteDespejado: { descripcion: 'Mayormente despejado', icono: '🌤️', fondo: 'despejado' },
  parcialmenteNublado: { descripcion: 'Parcialmente nublado', icono: '⛅', fondo: 'nublado' },
  nublado: { descripcion: 'Nublado', icono: '☁️', fondo: 'nublado' },
  niebla: { descripcion: 'Niebla', icono: '🌫️', fondo: 'nublado' },
  llovizna: { descripcion: 'Llovizna', icono: '🌦️', fondo: 'lluvia' },
  lluvia: { descripcion: 'Lluvia', icono: '🌧️', fondo: 'lluvia' },
  chubascos: { descripcion: 'Chubascos', icono: '🌦️', fondo: 'lluvia' },
  nieve: { descripcion: 'Nieve', icono: '🌨️', fondo: 'lluvia' },
  tormenta: { descripcion: 'Tormenta', icono: '⛈️', fondo: 'lluvia' },
  sinDatos: { descripcion: 'Sin datos', icono: '☁️', fondo: 'nublado' },
};

// Códigos WMO del estado del cielo → descripción, ícono y fondo (tabla de plan.md §3.4).
const CODIGOS = {
  0: CIELO.despejado,
  1: CIELO.mayormenteDespejado,
  2: CIELO.parcialmenteNublado,
  3: CIELO.nublado,
  45: CIELO.niebla,
  48: CIELO.niebla,
  51: CIELO.llovizna,
  53: CIELO.llovizna,
  55: CIELO.llovizna,
  56: CIELO.llovizna,
  57: CIELO.llovizna,
  61: CIELO.lluvia,
  63: CIELO.lluvia,
  65: CIELO.lluvia,
  66: CIELO.lluvia,
  67: CIELO.lluvia,
  71: CIELO.nieve,
  73: CIELO.nieve,
  75: CIELO.nieve,
  77: CIELO.nieve,
  80: CIELO.chubascos,
  81: CIELO.chubascos,
  82: CIELO.chubascos,
  85: CIELO.nieve,
  86: CIELO.nieve,
  95: CIELO.tormenta,
  96: CIELO.tormenta,
  99: CIELO.tormenta,
};

export function cieloPorCodigo(codigo) {
  return CODIGOS[codigo] ?? CIELO.sinDatos;
}

// Las horas llegan como texto ISO en la zona horaria de la ciudad ("2026-10-24T18:34"),
// así que se comparan como texto, sin convertir a Date (CA-16).
export function esDeNoche(horaActual, amanecer, atardecer) {
  if (!horaActual || !amanecer || !atardecer) return false;
  return horaActual < amanecer || horaActual >= atardecer;
}

// CA-16: "noche" manda sobre el estado del cielo.
export function fondoPara(codigo, deNoche) {
  return deNoche ? 'noche' : cieloPorCodigo(codigo).fondo;
}

// CA-06
export function nivelUV(indice) {
  if (indice === null || indice === undefined || Number.isNaN(indice)) return null;
  const uv = Math.round(indice);
  if (uv <= 2) return TEXTOS.uv.bajo;
  if (uv <= 5) return TEXTOS.uv.moderado;
  if (uv <= 7) return TEXTOS.uv.alto;
  if (uv <= 10) return TEXTOS.uv.muyAlto;
  return TEXTOS.uv.extremo;
}

export const UMBRAL_LLUVIA = 50;
export const UMBRAL_ABRIGO = 15;

// CA-07, CA-08, CA-09. La sensación térmica se compara siempre en °C, sin importar la unidad mostrada.
export function recomendaciones(probabilidadLluvia, sensacionCelsius) {
  const lista = [];
  if (typeof probabilidadLluvia === 'number' && probabilidadLluvia >= UMBRAL_LLUVIA) {
    lista.push(TEXTOS.recomendaciones.paraguas);
  }
  if (typeof sensacionCelsius === 'number' && sensacionCelsius < UMBRAL_ABRIGO) {
    lista.push(TEXTOS.recomendaciones.abrigo);
  }
  return lista.length > 0 ? lista : [TEXTOS.recomendaciones.ninguna];
}

// CA-11: el primer día del pronóstico es "Mañana"; los demás, el día de la semana.
// La fecha "AAAA-MM-DD" se interpreta sin zona horaria para evitar desfases de un día.
export function nombreDelDia(fecha, esManana = false) {
  if (esManana) return TEXTOS.dias.manana;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const nombre = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(
    new Date(anio, mes - 1, dia),
  );
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}
