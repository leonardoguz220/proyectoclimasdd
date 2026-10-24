const CLAVE = 'clima.unidad';
export const UNIDAD_POR_DEFECTO = 'C';
export const SIN_DATO = '—';

// Las temperaturas siempre llegan en °C; °F se calcula aquí (CA-13).
export function aFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

// Devuelve la temperatura lista para mostrar, por ejemplo "14°", o "—" si falta el dato (CA-33).
export function formatearTemperatura(celsius, unidad) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return SIN_DATO;
  const valor = unidad === 'F' ? aFahrenheit(celsius) : Math.round(celsius);
  return `${valor}°`;
}

// El almacenamiento puede no estar disponible (modo privado, bloqueado): nunca debe romper la app.
export function leerUnidad(almacen = globalThis.localStorage) {
  try {
    const guardada = almacen.getItem(CLAVE);
    return guardada === 'F' || guardada === 'C' ? guardada : UNIDAD_POR_DEFECTO;
  } catch {
    return UNIDAD_POR_DEFECTO;
  }
}

export function guardarUnidad(unidad, almacen = globalThis.localStorage) {
  try {
    almacen.setItem(CLAVE, unidad);
  } catch {
    // Sin almacenamiento: la unidad solo dura la sesión.
  }
}
