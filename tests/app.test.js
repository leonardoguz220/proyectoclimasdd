import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { iniciarApp } from '../src/app.js';
import { normalizarClima } from '../src/clima.js';
import { CiudadNoEncontrada, ServicioCaido, SinConexion } from '../src/errores.js';
import nublado from './fixtures/pronostico-nublado.json';

const ciudades = [
  { nombre: 'La Paz', region: 'La Paz', pais: 'Bolivia', etiqueta: 'La Paz, La Paz, Bolivia', latitud: -16.5, longitud: -68.15 },
  { nombre: 'La Paz', region: 'Baja California Sur', pais: 'México', etiqueta: 'La Paz, Baja California Sur, México', latitud: 24.1, longitud: -110.3 },
];

function montarPagina() {
  const html = readFileSync('index.html', 'utf8');
  const pagina = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = pagina.body.innerHTML;
}

const modeloLaPaz = (ciudad = 'La Paz, Bolivia') => normalizarClima(nublado, ciudad);
const escribirYBuscar = (texto) => {
  document.getElementById('ciudad').value = texto;
  document.getElementById('form-busqueda').requestSubmit();
};
const botonesCiudad = () => document.querySelectorAll('#lista-ciudades button');
const aviso = () => document.getElementById('aviso');
const reintentar = () => aviso().querySelector('[data-accion="reintentar"]');
const temperatura = () => document.querySelector('.temperatura')?.textContent;
const cargando = () => document.getElementById('cargando');

let api;
let geolocalizacion;

function arrancar(extra = {}) {
  return iniciarApp({ doc: document, api, geolocalizacion, almacen: localStorage, ...extra });
}

beforeEach(() => {
  montarPagina();
  localStorage.clear();
  api = {
    buscarCiudades: vi.fn(async () => ciudades),
    obtenerClima: vi.fn(async () => modeloLaPaz()),
    nombreDeUbicacion: vi.fn(async () => 'La Paz'),
  };
  geolocalizacion = {
    getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: -16.5, longitude: -68.15 } })),
  };
});

describe('inicio (CA-01, CA-14)', () => {
  it('abre con "Busca una ciudad", sin clima ni llamadas a la API', () => {
    arrancar();
    expect(document.getElementById('mensaje-inicial').hidden).toBe(false);
    expect(document.getElementById('clima').textContent.trim()).toBe('');
    expect(api.buscarCiudades).not.toHaveBeenCalled();
    expect(api.obtenerClima).not.toHaveBeenCalled();
  });

  it('incluye la atribución de los datos en el pie', () => {
    arrancar();
    expect(document.querySelector('.pie').textContent).toContain('Open-Meteo.com');
  });
});

describe('buscar y elegir (CA-02, CA-03)', () => {
  it('busca por nombre, lista las coincidencias y muestra el clima de la elegida', async () => {
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    expect(api.buscarCiudades).toHaveBeenCalledWith('La Paz');

    botonesCiudad()[0].click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));

    expect(api.obtenerClima).toHaveBeenCalledWith(-16.5, -68.15, 'La Paz, Bolivia');
    expect(document.querySelector('.ciudad').textContent).toBe('La Paz, Bolivia');
    expect(botonesCiudad()).toHaveLength(0);
    expect(document.getElementById('mensaje-inicial').hidden).toBe(true);
    expect(cargando().hidden).toBe(true);
  });

  it('muestra el indicador de carga mientras espera (CA-22)', async () => {
    let terminar;
    api.buscarCiudades = vi.fn(() => new Promise((resolver) => (terminar = resolver)));
    arrancar();
    escribirYBuscar('La Paz');
    expect(cargando().hidden).toBe(false);
    terminar(ciudades);
    await vi.waitFor(() => expect(cargando().hidden).toBe(true));
    expect(botonesCiudad()).toHaveLength(2);
  });

  it('usa la unidad guardada al mostrar el clima (CA-14)', async () => {
    localStorage.setItem('clima.unidad', 'F');
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    botonesCiudad()[0].click();
    await vi.waitFor(() => expect(temperatura()).toBe('57°'));
  });

  it('guarda la unidad que elige el usuario (CA-14)', async () => {
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    botonesCiudad()[0].click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));

    document.querySelector('[data-unidad="F"]').click();
    expect(localStorage.getItem('clima.unidad')).toBe('F');
    expect(temperatura()).toBe('57°');
  });

  it('con el campo vacío no llama a la API (CA-04)', () => {
    arrancar();
    escribirYBuscar('');
    expect(api.buscarCiudades).not.toHaveBeenCalled();
  });

  it('descarta una respuesta vieja si el usuario ya lanzó otra búsqueda', async () => {
    const resolvedores = [];
    api.buscarCiudades = vi.fn(() => new Promise((resolver) => resolvedores.push(resolver)));
    arrancar();
    escribirYBuscar('Lima');
    escribirYBuscar('La Paz');
    resolvedores[1](ciudades);
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    resolvedores[0]([ciudades[0]]);
    await new Promise((r) => setTimeout(r, 0));
    expect(botonesCiudad()).toHaveLength(2);
  });
});

describe('errores y "Reintentar" (CA-23 a CA-27)', () => {
  it('ciudad no encontrada: mensaje, sin Reintentar y barra lista (CA-23)', async () => {
    api.buscarCiudades = vi.fn(async () => {
      throw new CiudadNoEncontrada();
    });
    arrancar();
    escribirYBuscar('zzzz');
    await vi.waitFor(() => expect(aviso().textContent).toContain('No encontramos esa ciudad.'));
    expect(reintentar()).toBeNull();
    expect(document.activeElement).toBe(document.getElementById('ciudad'));
    expect(cargando().hidden).toBe(true);
  });

  it('sin conexión al buscar: "Reintentar" repite la búsqueda (CA-24, CA-26)', async () => {
    api.buscarCiudades = vi
      .fn()
      .mockRejectedValueOnce(new SinConexion())
      .mockResolvedValueOnce(ciudades);
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(reintentar()).not.toBeNull());
    expect(aviso().textContent).toContain('Sin conexión a internet.');

    reintentar().click();
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    expect(api.buscarCiudades).toHaveBeenCalledTimes(2);
    expect(api.buscarCiudades).toHaveBeenLastCalledWith('La Paz');
    expect(aviso().textContent).toBe('');
  });

  it('servicio caído al cargar el clima: "Reintentar" repite esa carga (CA-25, CA-26)', async () => {
    api.obtenerClima = vi
      .fn()
      .mockRejectedValueOnce(new ServicioCaido())
      .mockResolvedValueOnce(modeloLaPaz());
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    botonesCiudad()[0].click();
    await vi.waitFor(() => expect(reintentar()).not.toBeNull());
    expect(aviso().textContent).toContain('El servicio del clima no responde ahora.');

    reintentar().click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));
    expect(api.obtenerClima).toHaveBeenCalledTimes(2);
  });

  it('un error con clima en pantalla no lo borra (CA-27)', async () => {
    arrancar();
    escribirYBuscar('La Paz');
    await vi.waitFor(() => expect(botonesCiudad()).toHaveLength(2));
    botonesCiudad()[0].click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));

    api.buscarCiudades = vi.fn(async () => {
      throw new SinConexion();
    });
    escribirYBuscar('Lima');
    await vi.waitFor(() => expect(reintentar()).not.toBeNull());
    expect(temperatura()).toBe('14°');
  });
});

describe('usar mi ubicación (CA-28, CA-29)', () => {
  it('muestra el clima del lugar con el nombre de la ciudad', async () => {
    api.nombreDeUbicacion = vi.fn(async () => 'Sopocachi');
    arrancar();
    document.getElementById('btn-ubicacion').click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));
    expect(api.obtenerClima).toHaveBeenCalledWith(-16.5, -68.15, '');
    expect(api.nombreDeUbicacion).toHaveBeenCalledWith(-16.5, -68.15);
    expect(document.querySelector('.ciudad').textContent).toBe('Sopocachi');
    expect(document.getElementById('mensaje-inicial').hidden).toBe(true);
  });

  it('si se niega el permiso: mensaje de CA-29 y barra lista', async () => {
    geolocalizacion.getCurrentPosition = vi.fn((_ok, error) => error({ code: 1 }));
    arrancar();
    document.getElementById('btn-ubicacion').click();
    await vi.waitFor(() =>
      expect(aviso().textContent).toContain('No pudimos obtener tu ubicación.'),
    );
    expect(aviso().textContent).toContain('Puedes buscar una ciudad por nombre.');
    expect(reintentar()).toBeNull();
    expect(document.activeElement).toBe(document.getElementById('ciudad'));
    expect(api.obtenerClima).not.toHaveBeenCalled();
  });

  it('si el navegador no tiene geolocalización: mismo mensaje', async () => {
    arrancar({ geolocalizacion: undefined });
    document.getElementById('btn-ubicacion').click();
    await vi.waitFor(() =>
      expect(aviso().textContent).toContain('No pudimos obtener tu ubicación.'),
    );
  });

  it('si falla el clima de la ubicación: error con Reintentar que repite todo (CA-26)', async () => {
    api.obtenerClima = vi
      .fn()
      .mockRejectedValueOnce(new SinConexion())
      .mockResolvedValueOnce(modeloLaPaz());
    arrancar();
    document.getElementById('btn-ubicacion').click();
    await vi.waitFor(() => expect(reintentar()).not.toBeNull());
    reintentar().click();
    await vi.waitFor(() => expect(temperatura()).toBe('14°'));
  });
});
