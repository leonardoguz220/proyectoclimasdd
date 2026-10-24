import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizarClima } from '../src/clima.js';
import {
  CiudadNoEncontrada,
  ServicioCaido,
  SinConexion,
  UbicacionNoDisponible,
} from '../src/errores.js';
import { crearUI } from '../src/ui.js';
import nublado from './fixtures/pronostico-nublado.json';

function montarPagina() {
  const html = readFileSync('index.html', 'utf8');
  const pagina = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = pagina.body.innerHTML;
}

const aviso = () => document.getElementById('aviso');
const botonReintentar = () => aviso().querySelector('[data-accion="reintentar"]');

describe('mensajes de error', () => {
  let ui;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
  });

  it('ciudad no encontrada: mensaje de CA-23, sin "Reintentar"', () => {
    ui.mostrarError(new CiudadNoEncontrada(), vi.fn());
    expect(aviso().textContent).toContain(
      'No encontramos esa ciudad. Revisa el nombre e inténtalo de nuevo.',
    );
    expect(botonReintentar()).toBeNull();
  });

  it('sin conexión: mensaje de CA-24 con "Reintentar"', () => {
    ui.mostrarError(new SinConexion(), vi.fn());
    expect(aviso().textContent).toContain('Sin conexión a internet. Revisa tu red.');
    expect(botonReintentar().textContent).toBe('Reintentar');
  });

  it('servicio caído: mensaje de CA-25 con "Reintentar"', () => {
    ui.mostrarError(new ServicioCaido(), vi.fn());
    expect(aviso().textContent).toContain(
      'El servicio del clima no responde ahora. Inténtalo en unos minutos.',
    );
    expect(botonReintentar()).not.toBeNull();
  });

  it('ubicación no disponible: mensaje de CA-29, sin "Reintentar"', () => {
    ui.mostrarError(new UbicacionNoDisponible(), vi.fn());
    expect(aviso().textContent).toContain(
      'No pudimos obtener tu ubicación. Puedes buscar una ciudad por nombre.',
    );
    expect(botonReintentar()).toBeNull();
  });

  it('un error desconocido se trata como servicio caído', () => {
    ui.mostrarError(new Error('algo raro'), vi.fn());
    expect(aviso().textContent).toContain('El servicio del clima no responde ahora.');
  });

  it('el aviso es un alert para lectores de pantalla', () => {
    expect(aviso().getAttribute('role')).toBe('alert');
  });
});

describe('"Reintentar" (CA-26)', () => {
  it('al pulsarlo llama a la acción que falló, una sola vez por clic', () => {
    montarPagina();
    const ui = crearUI(document);
    const alReintentar = vi.fn();
    ui.mostrarError(new SinConexion(), alReintentar);
    botonReintentar().click();
    expect(alReintentar).toHaveBeenCalledTimes(1);
  });

  it('no aparece si no hay acción que repetir', () => {
    montarPagina();
    const ui = crearUI(document);
    ui.mostrarError(new SinConexion());
    expect(botonReintentar()).toBeNull();
  });
});

describe('el clima visible no se borra (CA-27)', () => {
  it('un error deja el clima intacto y muestra el aviso', () => {
    montarPagina();
    const ui = crearUI(document);
    ui.mostrarClima(normalizarClima(nublado, 'La Paz'));
    const antes = document.getElementById('clima').innerHTML;

    ui.mostrarError(new ServicioCaido(), vi.fn());

    expect(document.getElementById('clima').innerHTML).toBe(antes);
    expect(document.querySelector('.temperatura').textContent).toBe('14°');
    expect(aviso().textContent).toContain('El servicio del clima no responde ahora.');
  });

  it('un error nuevo reemplaza al anterior', () => {
    montarPagina();
    const ui = crearUI(document);
    ui.mostrarError(new SinConexion(), vi.fn());
    ui.mostrarError(new CiudadNoEncontrada(), vi.fn());
    expect(aviso().querySelectorAll('p')).toHaveLength(1);
    expect(aviso().textContent).toContain('No encontramos esa ciudad.');
    expect(botonReintentar()).toBeNull();
  });

  it('limpiarError quita el aviso', () => {
    montarPagina();
    const ui = crearUI(document);
    ui.mostrarError(new SinConexion(), vi.fn());
    ui.limpiarError();
    expect(aviso().textContent).toBe('');
  });
});
