import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarCiudades, nombreDeUbicacion, obtenerClima } from '../src/api.js';
import { CiudadNoEncontrada, ServicioCaido, SinConexion } from '../src/errores.js';
import varias from './fixtures/geocodificacion-varias.json';
import vacia from './fixtures/geocodificacion-vacia.json';
import nublado from './fixtures/pronostico-nublado.json';

const respuesta = (cuerpo, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => cuerpo,
});
const fetchCon = (cuerpo, estado) => vi.fn(async () => respuesta(cuerpo, estado));
const fetchCaido = () =>
  vi.fn(async () => {
    throw new TypeError('Failed to fetch');
  });
const parametros = (fn) => new URL(fn.mock.calls[0][0]).searchParams;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('buscarCiudades (CA-02)', () => {
  it('pide hasta 5 resultados en español', async () => {
    const fetch = fetchCon(varias);
    await buscarCiudades('Santiago', { fetch });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.host).toBe('geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('Santiago');
    expect(url.searchParams.get('count')).toBe('5');
    expect(url.searchParams.get('language')).toBe('es');
  });

  it('devuelve ciudad, región y país de cada coincidencia', async () => {
    const lista = await buscarCiudades('Santiago', { fetch: fetchCon(varias) });
    expect(lista).toHaveLength(5);
    expect(lista[0]).toMatchObject({
      nombre: 'Santiago',
      region: 'Región Metropolitana',
      pais: 'Chile',
      etiqueta: 'Santiago, Región Metropolitana, Chile',
      latitud: -33.45694,
      longitud: -70.64827,
    });
  });

  it('nunca devuelve más de 5 aunque el servicio mande más', async () => {
    const siete = { results: [...varias.results, ...varias.results.slice(0, 2)] };
    const lista = await buscarCiudades('Santiago', { fetch: fetchCon(siete) });
    expect(lista).toHaveLength(5);
  });
});

describe('errores de búsqueda', () => {
  it('sin resultados → CiudadNoEncontrada (CA-23)', async () => {
    await expect(buscarCiudades('zzzz', { fetch: fetchCon(vacia) })).rejects.toBeInstanceOf(
      CiudadNoEncontrada,
    );
    await expect(
      buscarCiudades('zzzz', { fetch: fetchCon({ results: [] }) }),
    ).rejects.toBeInstanceOf(CiudadNoEncontrada);
  });

  it('red caída → SinConexion (CA-24)', async () => {
    await expect(buscarCiudades('Lima', { fetch: fetchCaido() })).rejects.toBeInstanceOf(
      SinConexion,
    );
  });

  it('navegador sin internet → SinConexion sin llamar a la red (CA-24)', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetch = fetchCon(varias);
    await expect(buscarCiudades('Lima', { fetch })).rejects.toBeInstanceOf(SinConexion);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('HTTP 500 → ServicioCaido (CA-25)', async () => {
    const fetch = fetchCon({}, { ok: false, status: 500 });
    await expect(buscarCiudades('Lima', { fetch })).rejects.toBeInstanceOf(ServicioCaido);
  });

  it('HTTP 429 → ServicioCaido (CA-25)', async () => {
    const fetch = fetchCon({}, { ok: false, status: 429 });
    await expect(buscarCiudades('Lima', { fetch })).rejects.toBeInstanceOf(ServicioCaido);
  });

  it('JSON inválido → ServicioCaido (CA-25)', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('JSON inválido');
      },
    }));
    await expect(buscarCiudades('Lima', { fetch })).rejects.toBeInstanceOf(ServicioCaido);
  });

  it('más de 8 s sin respuesta → ServicioCaido (CA-25)', async () => {
    vi.useFakeTimers();
    const colgado = (_url, { signal }) =>
      new Promise((_, rechazar) => {
        signal.addEventListener('abort', () =>
          rechazar(new DOMException('abortado', 'AbortError')),
        );
      });
    const comprobacion = expect(buscarCiudades('Lima', { fetch: colgado })).rejects.toBeInstanceOf(
      ServicioCaido,
    );
    await vi.advanceTimersByTimeAsync(8000);
    await comprobacion;
  });
});

describe('obtenerClima (CA-03, CA-10)', () => {
  it('pide hoy + 3 días con zona horaria automática y los campos de la spec', async () => {
    const fetch = fetchCon(nublado);
    await obtenerClima(-16.5, -68.15, 'La Paz', { fetch });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.host).toBe('api.open-meteo.com');
    const p = parametros(fetch);
    expect(p.get('latitude')).toBe('-16.5');
    expect(p.get('longitude')).toBe('-68.15');
    expect(p.get('timezone')).toBe('auto');
    expect(p.get('forecast_days')).toBe('4');
    expect(p.get('current').split(',')).toEqual(
      expect.arrayContaining(['temperature_2m', 'apparent_temperature', 'wind_speed_10m']),
    );
    expect(p.get('daily').split(',')).toEqual(
      expect.arrayContaining(['uv_index_max', 'sunrise', 'sunset', 'precipitation_sum']),
    );
  });

  it('devuelve el modelo del clima con el nombre de la ciudad', async () => {
    const modelo = await obtenerClima(-16.5, -68.15, 'La Paz', { fetch: fetchCon(nublado) });
    expect(modelo.ciudad).toBe('La Paz');
    expect(modelo.actual.temperatura).toBe(14.1);
    expect(modelo.pronostico).toHaveLength(3);
  });

  it('una respuesta sin estructura válida → ServicioCaido', async () => {
    await expect(
      obtenerClima(0, 0, 'X', { fetch: fetchCon({ error: true }) }),
    ).rejects.toBeInstanceOf(ServicioCaido);
  });

  it('propaga los errores de red', async () => {
    await expect(obtenerClima(0, 0, 'X', { fetch: fetchCaido() })).rejects.toBeInstanceOf(
      SinConexion,
    );
  });
});

describe('nombreDeUbicacion (CA-28)', () => {
  it('usa la ciudad que devuelve el servicio', async () => {
    const fetch = fetchCon({ city: 'La Paz', locality: 'Centro' });
    expect(await nombreDeUbicacion(-16.5, -68.15, { fetch })).toBe('La Paz');
    expect(parametros(fetch).get('latitude')).toBe('-16.5');
  });

  it('si no hay ciudad usa la localidad', async () => {
    const fetch = fetchCon({ city: '', locality: 'Sopocachi' });
    expect(await nombreDeUbicacion(-16.5, -68.15, { fetch })).toBe('Sopocachi');
  });

  it('si el servicio falla, usa "Mi ubicación"', async () => {
    expect(await nombreDeUbicacion(-16.5, -68.15, { fetch: fetchCaido() })).toBe('Mi ubicación');
    const caido = fetchCon({}, { ok: false, status: 500 });
    expect(await nombreDeUbicacion(0, 0, { fetch: caido })).toBe('Mi ubicación');
  });
});
