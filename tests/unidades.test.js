import { beforeEach, describe, expect, it } from 'vitest';
import {
  aFahrenheit,
  formatearTemperatura,
  guardarUnidad,
  leerUnidad,
} from '../src/unidades.js';

describe('conversión °C → °F (CA-13)', () => {
  it('convierte valores conocidos', () => {
    expect(aFahrenheit(0)).toBe(32);
    expect(aFahrenheit(100)).toBe(212);
    expect(aFahrenheit(-40)).toBe(-40);
  });

  it('redondea al entero más cercano', () => {
    expect(aFahrenheit(20.5)).toBe(69); // 68.9 °F
    expect(aFahrenheit(14)).toBe(57); // 57.2 °F
  });
});

describe('formatearTemperatura', () => {
  it('muestra °C redondeado con el signo de grado', () => {
    expect(formatearTemperatura(14.4, 'C')).toBe('14°');
    expect(formatearTemperatura(14.6, 'C')).toBe('15°');
  });

  it('muestra °F cuando la unidad es F', () => {
    expect(formatearTemperatura(14, 'F')).toBe('57°');
  });

  it('muestra "—" si falta el dato (CA-33)', () => {
    expect(formatearTemperatura(null, 'C')).toBe('—');
    expect(formatearTemperatura(undefined, 'F')).toBe('—');
    expect(formatearTemperatura(NaN, 'C')).toBe('—');
  });

  it('acepta 0 °C como dato válido', () => {
    expect(formatearTemperatura(0, 'C')).toBe('0°');
  });
});

describe('unidad guardada (CA-12, CA-14)', () => {
  beforeEach(() => localStorage.clear());

  it('usa °C la primera vez', () => {
    expect(leerUnidad()).toBe('C');
  });

  it('recuerda la unidad elegida', () => {
    guardarUnidad('F');
    expect(leerUnidad()).toBe('F');
    guardarUnidad('C');
    expect(leerUnidad()).toBe('C');
  });

  it('ignora un valor guardado inválido', () => {
    localStorage.setItem('clima.unidad', 'K');
    expect(leerUnidad()).toBe('C');
  });

  it('no rompe si el almacenamiento no está disponible', () => {
    const roto = {
      getItem() {
        throw new Error('bloqueado');
      },
      setItem() {
        throw new Error('bloqueado');
      },
    };
    expect(leerUnidad(roto)).toBe('C');
    expect(() => guardarUnidad('F', roto)).not.toThrow();
  });
});
