import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearUI } from '../src/ui.js';

const ciudades = [
  { nombre: 'A', etiqueta: 'A, país', latitud: 1, longitud: 1 },
  { nombre: 'B', etiqueta: 'B, país', latitud: 2, longitud: 2 },
  { nombre: 'C', etiqueta: 'C, país', latitud: 3, longitud: 3 },
];

function montarPagina() {
  const html = readFileSync('index.html', 'utf8');
  const pagina = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = pagina.body.innerHTML;
}

const tecla = (elemento, key) =>
  elemento.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const botones = () => [...document.querySelectorAll('#lista-ciudades button')];
const campo = () => document.getElementById('ciudad');

describe('teclado (CA-31)', () => {
  let ui;
  let alElegir;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
    alElegir = vi.fn();
    ui.mostrarCoincidencias(ciudades, alElegir);
    campo().focus();
  });

  it('la barra de búsqueda está dentro de un formulario con botón de envío (Enter busca)', () => {
    expect(campo().form).toBe(document.getElementById('form-busqueda'));
    expect(document.getElementById('btn-buscar').type).toBe('submit');
  });

  it('↓ desde la barra pasa a la primera coincidencia', () => {
    tecla(campo(), 'ArrowDown');
    expect(document.activeElement).toBe(botones()[0]);
  });

  it('↓ y ↑ recorren las coincidencias', () => {
    botones()[0].focus();
    tecla(botones()[0], 'ArrowDown');
    expect(document.activeElement).toBe(botones()[1]);
    tecla(botones()[1], 'ArrowDown');
    expect(document.activeElement).toBe(botones()[2]);
    tecla(botones()[2], 'ArrowUp');
    expect(document.activeElement).toBe(botones()[1]);
  });

  it('↓ en la última coincidencia se queda en ella', () => {
    botones()[2].focus();
    tecla(botones()[2], 'ArrowDown');
    expect(document.activeElement).toBe(botones()[2]);
  });

  it('↑ en la primera vuelve a la barra de búsqueda', () => {
    botones()[0].focus();
    tecla(botones()[0], 'ArrowUp');
    expect(document.activeElement).toBe(campo());
  });

  it('Enter sobre la coincidencia seleccionada la elige (un botón se activa con Enter)', () => {
    botones()[1].focus();
    botones()[1].click(); // el navegador convierte Enter en clic sobre un botón
    expect(alElegir).toHaveBeenCalledWith(ciudades[1]);
  });

  it('↓ sin coincidencias no hace nada', () => {
    ui.limpiarCoincidencias();
    tecla(campo(), 'ArrowDown');
    expect(document.activeElement).toBe(campo());
  });
});

describe('estilos de teclado y pantalla (CA-18, CA-19, CA-31)', () => {
  const css = readFileSync('src/styles.css', 'utf8');

  it('el elemento seleccionado con el teclado se ve (foco visible)', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/);
  });

  it('desde 768 px las tarjetas pasan a 2 columnas y desde 1024 px a 3', () => {
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*?\.tarjetas\s*\{[^}]*repeat\(2,/);
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*?\.tarjetas\s*\{[^}]*repeat\(3,/);
  });

  it('el contenido tiene un ancho máximo', () => {
    expect(css).toMatch(/\.app\s*\{[^}]*max-width:\s*960px/);
  });

  it('en celular no hay columnas fijas que desborden: el pronóstico usa columnas flexibles', () => {
    expect(css).toMatch(/\.dia\s*\{[^}]*minmax\(0,\s*1fr\)/);
  });

  it('la página declara el viewport para celulares', () => {
    expect(readFileSync('index.html', 'utf8')).toContain('width=device-width');
  });
});
