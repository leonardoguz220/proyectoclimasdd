import { describe, expect, it } from 'vitest';
import { normalizarClima } from '../src/clima.js';
import { ServicioCaido } from '../src/errores.js';
import nublado from './fixtures/pronostico-nublado.json';
import lluvia from './fixtures/pronostico-lluvia.json';
import noche from './fixtures/pronostico-noche.json';
import sinUv from './fixtures/pronostico-sin-uv.json';

describe('modelo del clima (CA-05)', () => {
  const modelo = normalizarClima(nublado, 'La Paz');

  it('trae el nombre de la ciudad y los datos actuales', () => {
    expect(modelo.ciudad).toBe('La Paz');
    expect(modelo.actual).toMatchObject({
      temperatura: 14.1,
      sensacion: 12.0,
      descripcion: 'Nublado',
      humedad: 50,
      viento: 8.3,
    });
    expect(modelo.actual.icono).toBeTruthy();
  });

  it('trae los datos de hoy', () => {
    expect(modelo.hoy).toMatchObject({
      maxima: 18.2,
      minima: 6.1,
      probabilidadLluvia: 55,
      lluviaMm: 4.1,
      uv: 8.2,
      nivelUV: 'Muy alto',
      amanecer: '05:58',
      atardecer: '18:34',
    });
  });

  it('calcula recomendación y fondo', () => {
    expect(modelo.recomendaciones).toEqual(['Lleva paraguas', 'Lleva abrigo']);
    expect(modelo.fondo).toBe('nublado');
  });
});

describe('pronóstico (CA-10, CA-11)', () => {
  const { pronostico } = normalizarClima(nublado, 'La Paz');

  it('trae los 3 días siguientes a hoy, sin incluir hoy', () => {
    expect(pronostico).toHaveLength(3);
    expect(pronostico.map((d) => d.fecha)).toEqual(['2026-10-25', '2026-10-26', '2026-10-27']);
  });

  it('cada día trae nombre, ícono, máxima, mínima y probabilidad de lluvia', () => {
    expect(pronostico[0]).toMatchObject({
      nombre: 'Mañana',
      descripcion: 'Lluvia',
      maxima: 17.1,
      minima: 5.4,
      probabilidadLluvia: 75,
    });
    expect(pronostico[0].icono).toBeTruthy();
    expect(pronostico[1].nombre).toBe('Lunes');
    expect(pronostico[2].nombre).toBe('Martes');
  });
});

describe('fondo según la respuesta (CA-16)', () => {
  it('lluvia de día → fondo lluvia', () => {
    const m = normalizarClima(lluvia, 'La Paz');
    expect(m.fondo).toBe('lluvia');
    expect(m.recomendaciones).toEqual(['Lleva paraguas']);
  });

  it('de noche → fondo noche aunque el cielo esté despejado', () => {
    expect(normalizarClima(noche, 'La Paz').fondo).toBe('noche');
  });
});

describe('datos faltantes (CA-33)', () => {
  it('deja null lo que no llegó y sigue funcionando', () => {
    const m = normalizarClima(sinUv, 'La Paz');
    expect(m.hoy.uv).toBeNull();
    expect(m.hoy.nivelUV).toBeNull();
    expect(m.actual.humedad).toBeNull();
    expect(m.actual.temperatura).toBe(14.1);
    expect(m.pronostico).toHaveLength(3);
  });

  it('si la respuesta no tiene la estructura esperada, lanza ServicioCaido', () => {
    expect(() => normalizarClima({}, 'X')).toThrow(ServicioCaido);
    expect(() => normalizarClima(null, 'X')).toThrow(ServicioCaido);
    expect(() => normalizarClima({ current: {}, daily: { time: [] } }, 'X')).toThrow(
      ServicioCaido,
    );
  });
});
