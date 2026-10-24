import * as apiReal from './api.js';
import { UbicacionNoDisponible } from './errores.js';
import { guardarUnidad, leerUnidad } from './unidades.js';
import { crearUI } from './ui.js';

const TIEMPO_UBICACION_MS = 10000;

// CA-28, CA-29: pide la ubicación al navegador; cualquier falla es UbicacionNoDisponible.
function obtenerPosicion(geolocalizacion) {
  return new Promise((resolver, rechazar) => {
    if (!geolocalizacion) {
      rechazar(new UbicacionNoDisponible());
      return;
    }
    geolocalizacion.getCurrentPosition(
      (posicion) =>
        resolver({ latitud: posicion.coords.latitude, longitud: posicion.coords.longitude }),
      () => rechazar(new UbicacionNoDisponible()),
      { timeout: TIEMPO_UBICACION_MS },
    );
  });
}

// Conecta la interfaz con la API. Todo lo externo se puede inyectar para los tests.
export function iniciarApp({
  doc = document,
  api = apiReal,
  geolocalizacion = globalThis.navigator?.geolocation,
  almacen = globalThis.localStorage,
} = {}) {
  const ui = crearUI(doc);
  let unidad = leerUnidad(almacen);
  let ultimaAccion = null;
  let secuencia = 0;

  ui.establecerUnidad(unidad);
  ui.mostrarMensajeInicial(true);
  ui.alCambiarUnidad((nueva) => {
    unidad = nueva;
    guardarUnidad(nueva, almacen);
  });

  // Ejecuta una acción con indicador de carga y manejo de errores (CA-22 a CA-27).
  // Si el usuario lanza otra acción antes de que termine, el resultado viejo se descarta.
  async function ejecutar(accion) {
    ultimaAccion = accion;
    const mia = ++secuencia;
    const vigente = () => mia === secuencia;
    ui.limpiarError();
    ui.mostrarCargando(true);
    try {
      await accion(vigente);
    } catch (error) {
      if (!vigente()) return;
      ui.mostrarError(error, reintentar);
      // CA-23, CA-29: sin "Reintentar", la barra queda lista para escribir otra ciudad.
      if (!error?.reintentable) ui.enfocarBusqueda();
    } finally {
      if (vigente()) ui.mostrarCargando(false);
    }
  }

  // CA-26
  function reintentar() {
    if (ultimaAccion) ejecutar(ultimaAccion);
  }

  // CA-03: elegir una coincidencia muestra su clima y pronóstico.
  function elegir(ciudad) {
    return ejecutar(async (vigente) => {
      const nombre = ciudad.pais ? `${ciudad.nombre}, ${ciudad.pais}` : ciudad.nombre;
      const modelo = await api.obtenerClima(ciudad.latitud, ciudad.longitud, nombre);
      if (!vigente()) return;
      ui.limpiarCoincidencias();
      ui.mostrarClima(modelo, unidad);
    });
  }

  // CA-02: buscar por nombre muestra hasta 5 coincidencias.
  function buscar(nombre) {
    ui.limpiarCoincidencias();
    return ejecutar(async (vigente) => {
      const ciudades = await api.buscarCiudades(nombre);
      if (!vigente()) return;
      ui.mostrarCoincidencias(ciudades, elegir);
    });
  }

  // CA-28: clima del lugar donde está el usuario.
  function usarUbicacion() {
    ui.limpiarCoincidencias();
    return ejecutar(async (vigente) => {
      const { latitud, longitud } = await obtenerPosicion(geolocalizacion);
      const [modelo, nombre] = await Promise.all([
        api.obtenerClima(latitud, longitud, ''),
        api.nombreDeUbicacion(latitud, longitud),
      ]);
      if (!vigente()) return;
      modelo.ciudad = nombre;
      ui.mostrarClima(modelo, unidad);
    });
  }

  ui.alBuscar(buscar);
  ui.alUsarUbicacion(usarUbicacion);

  return { ui };
}
