import { describe, expect, it } from 'vitest';
import {
  cieloPorCodigo,
  esDeNoche,
  fondoPara,
  nivelUV,
  nombreDelDia,
  recomendaciones,
} from '../src/clima.js';

describe('cielo por código', () => {
  it('describe el cielo en español con ícono', () => {
    expect(cieloPorCodigo(0)).toMatchObject({ descripcion: 'Despejado', fondo: 'despejado' });
    expect(cieloPorCodigo(3)).toMatchObject({ descripcion: 'Nublado', fondo: 'nublado' });
    expect(cieloPorCodigo(63)).toMatchObject({ descripcion: 'Lluvia', fondo: 'lluvia' });
    expect(cieloPorCodigo(95)).toMatchObject({ descripcion: 'Tormenta', fondo: 'lluvia' });
    expect(cieloPorCodigo(0).icono).toBeTruthy();
  });

  it('agrupa los códigos en los 4 fondos según el plan', () => {
    const fondos = (codigos) => codigos.map((c) => cieloPorCodigo(c).fondo);
    expect(fondos([0, 1])).toEqual(['despejado', 'despejado']);
    expect(fondos([2, 3, 45, 48])).toEqual(['nublado', 'nublado', 'nublado', 'nublado']);
    expect(new Set(fondos([51, 55, 61, 67, 80, 82, 95, 99, 71, 77, 85, 86]))).toEqual(
      new Set(['lluvia']),
    );
  });

  it('usa un valor seguro con un código desconocido', () => {
    expect(cieloPorCodigo(1234)).toMatchObject({ descripcion: 'Sin datos', fondo: 'nublado' });
    expect(cieloPorCodigo(undefined).fondo).toBe('nublado');
  });
});

describe('noche y fondo (CA-16)', () => {
  const amanecer = '2026-10-24T05:58';
  const atardecer = '2026-10-24T18:34';

  it('es de noche antes del amanecer y desde el atardecer', () => {
    expect(esDeNoche('2026-10-24T03:00', amanecer, atardecer)).toBe(true);
    expect(esDeNoche('2026-10-24T18:34', amanecer, atardecer)).toBe(true);
    expect(esDeNoche('2026-10-24T22:15', amanecer, atardecer)).toBe(true);
  });

  it('es de día entre el amanecer y el atardecer', () => {
    expect(esDeNoche('2026-10-24T05:58', amanecer, atardecer)).toBe(false);
    expect(esDeNoche('2026-10-24T12:00', amanecer, atardecer)).toBe(false);
    expect(esDeNoche('2026-10-24T18:33', amanecer, atardecer)).toBe(false);
  });

  it('sin horas no asume noche', () => {
    expect(esDeNoche(undefined, amanecer, atardecer)).toBe(false);
    expect(esDeNoche('2026-10-24T12:00', null, atardecer)).toBe(false);
  });

  it('"noche" manda sobre el estado del cielo', () => {
    expect(fondoPara(0, true)).toBe('noche');
    expect(fondoPara(63, true)).toBe('noche');
  });

  it('de día, el fondo sale del estado del cielo', () => {
    expect(fondoPara(0, false)).toBe('despejado');
    expect(fondoPara(3, false)).toBe('nublado');
    expect(fondoPara(65, false)).toBe('lluvia');
  });
});

describe('nivel de UV (CA-06)', () => {
  it('respeta los rangos de la spec', () => {
    expect(nivelUV(0)).toBe('Bajo');
    expect(nivelUV(2)).toBe('Bajo');
    expect(nivelUV(3)).toBe('Moderado');
    expect(nivelUV(5)).toBe('Moderado');
    expect(nivelUV(6)).toBe('Alto');
    expect(nivelUV(7)).toBe('Alto');
    expect(nivelUV(8)).toBe('Muy alto');
    expect(nivelUV(10)).toBe('Muy alto');
    expect(nivelUV(11)).toBe('Extremo');
    expect(nivelUV(14)).toBe('Extremo');
  });

  it('redondea el valor al entero más cercano', () => {
    expect(nivelUV(2.4)).toBe('Bajo');
    expect(nivelUV(2.5)).toBe('Moderado');
    expect(nivelUV(7.6)).toBe('Muy alto');
  });

  it('devuelve null si falta el dato', () => {
    expect(nivelUV(null)).toBeNull();
    expect(nivelUV(undefined)).toBeNull();
  });
});

describe('recomendaciones (CA-07, CA-08, CA-09)', () => {
  it('lluvia de 50 % o más → paraguas', () => {
    expect(recomendaciones(50, 20)).toEqual(['Lleva paraguas']);
    expect(recomendaciones(80, 20)).toEqual(['Lleva paraguas']);
  });

  it('lluvia de 49 % → sin paraguas', () => {
    expect(recomendaciones(49, 20)).toEqual(['Sin necesidad de paraguas ni abrigo']);
  });

  it('sensación menor a 15 °C → abrigo', () => {
    expect(recomendaciones(10, 14.9)).toEqual(['Lleva abrigo']);
    expect(recomendaciones(10, -3)).toEqual(['Lleva abrigo']);
  });

  it('sensación de 15 °C exactos → sin abrigo', () => {
    expect(recomendaciones(10, 15)).toEqual(['Sin necesidad de paraguas ni abrigo']);
  });

  it('si se cumplen ambas, muestra las dos', () => {
    expect(recomendaciones(70, 10)).toEqual(['Lleva paraguas', 'Lleva abrigo']);
  });

  it('si no se cumple ninguna, frase neutra', () => {
    expect(recomendaciones(20, 22)).toEqual(['Sin necesidad de paraguas ni abrigo']);
  });

  it('con datos faltantes no inventa recomendaciones', () => {
    expect(recomendaciones(null, 10)).toEqual(['Lleva abrigo']);
    expect(recomendaciones(70, null)).toEqual(['Lleva paraguas']);
    expect(recomendaciones(null, null)).toEqual(['Sin necesidad de paraguas ni abrigo']);
  });
});

describe('nombre de los días (CA-11)', () => {
  it('el primer día del pronóstico es "Mañana"', () => {
    expect(nombreDelDia('2026-10-25', true)).toBe('Mañana');
  });

  it('los demás llevan el día de la semana en español, con mayúscula inicial', () => {
    expect(nombreDelDia('2026-10-26')).toBe('Lunes');
    expect(nombreDelDia('2026-10-27')).toBe('Martes');
    expect(nombreDelDia('2026-10-31')).toBe('Sábado');
  });

  it('no se desfasa un día por la zona horaria', () => {
    expect(nombreDelDia('2026-01-01')).toBe('Jueves');
  });
});
