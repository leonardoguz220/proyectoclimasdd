import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearUI } from '../src/ui.js';

const ciudades = [
  { nombre: 'Santiago', etiqueta: 'Santiago, Región Metropolitana, Chile', latitud: -33.4, longitud: -70.6 },
  { nombre: 'Santiago', etiqueta: 'Santiago, Santiago, República Dominicana', latitud: 19.4, longitud: -70.7 },
  { nombre: 'Santiago de Compostela', etiqueta: 'Santiago de Compostela, Galicia, España', latitud: 42.8, longitud: -8.5 },
];

// Se carga el index.html real para que la prueba no se desfase de la página.
function montarPagina() {
  const html = readFileSync('index.html', 'utf8');
  const pagina = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = pagina.body.innerHTML;
}

const escribirYBuscar = (texto) => {
  document.getElementById('ciudad').value = texto;
  document.getElementById('form-busqueda').requestSubmit();
};

describe('pantalla inicial (CA-01)', () => {
  let ui;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
    ui.mostrarMensajeInicial(true);
  });

  it('muestra barra de búsqueda, botón de búsqueda, "Usar mi ubicación" y "Busca una ciudad"', () => {
    expect(document.getElementById('ciudad')).not.toBeNull();
    expect(document.getElementById('btn-buscar').textContent).toBe('Buscar');
    expect(document.getElementById('btn-ubicacion').textContent).toBe('Usar mi ubicación');
    const mensaje = document.getElementById('mensaje-inicial');
    expect(mensaje.textContent).toBe('Busca una ciudad');
    expect(mensaje.hidden).toBe(false);
  });

  it('no muestra clima, coincidencias ni carga', () => {
    expect(document.getElementById('clima').textContent.trim()).toBe('');
    expect(document.getElementById('lista-ciudades').children).toHaveLength(0);
    expect(document.getElementById('cargando').hidden).toBe(true);
  });

  it('oculta el mensaje inicial cuando ya hay clima', () => {
    ui.mostrarMensajeInicial(false);
    expect(document.getElementById('mensaje-inicial').hidden).toBe(true);
  });
});

describe('búsqueda (CA-02, CA-04, CA-30)', () => {
  let ui;
  let alBuscar;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
    alBuscar = vi.fn();
    ui.alBuscar(alBuscar);
  });

  it('con el campo vacío no busca y deja la barra lista para escribir', () => {
    escribirYBuscar('');
    expect(alBuscar).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.getElementById('ciudad'));
  });

  it('con solo espacios tampoco busca', () => {
    escribirYBuscar('   ');
    expect(alBuscar).not.toHaveBeenCalled();
  });

  it('al confirmar con texto busca ese nombre, sin espacios sobrantes', () => {
    escribirYBuscar('  Santiago ');
    expect(alBuscar).toHaveBeenCalledTimes(1);
    expect(alBuscar).toHaveBeenCalledWith('Santiago');
  });

  it('el botón visible "Buscar" también busca', () => {
    document.getElementById('ciudad').value = 'Lima';
    document.getElementById('btn-buscar').click();
    expect(alBuscar).toHaveBeenCalledWith('Lima');
  });

  it('"Usar mi ubicación" avisa con un solo clic', () => {
    const alUbicar = vi.fn();
    ui.alUsarUbicacion(alUbicar);
    document.getElementById('btn-ubicacion').click();
    expect(alUbicar).toHaveBeenCalledTimes(1);
  });
});

describe('lista de coincidencias (CA-02, CA-30)', () => {
  let ui;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
  });

  it('muestra una opción por coincidencia con ciudad, región y país', () => {
    ui.mostrarCoincidencias(ciudades, () => {});
    const botones = document.querySelectorAll('#lista-ciudades button');
    expect([...botones].map((b) => b.textContent)).toEqual(ciudades.map((c) => c.etiqueta));
  });

  it('un solo clic elige la ciudad', () => {
    const alElegir = vi.fn();
    ui.mostrarCoincidencias(ciudades, alElegir);
    document.querySelectorAll('#lista-ciudades button')[1].click();
    expect(alElegir).toHaveBeenCalledTimes(1);
    expect(alElegir).toHaveBeenCalledWith(ciudades[1]);
  });

  it('reemplaza la lista anterior y se puede limpiar', () => {
    ui.mostrarCoincidencias(ciudades, () => {});
    ui.mostrarCoincidencias(ciudades.slice(0, 1), () => {});
    expect(document.querySelectorAll('#lista-ciudades button')).toHaveLength(1);
    ui.limpiarCoincidencias();
    expect(document.querySelectorAll('#lista-ciudades button')).toHaveLength(0);
  });
});

describe('indicador de carga (CA-22)', () => {
  it('se ve mientras carga y se oculta al terminar', () => {
    montarPagina();
    const ui = crearUI(document);
    const indicador = document.getElementById('cargando');

    ui.mostrarCargando(true);
    expect(indicador.hidden).toBe(false);
    expect(indicador.textContent).toBe('Cargando…');

    ui.mostrarCargando(false);
    expect(indicador.hidden).toBe(true);
  });
});
