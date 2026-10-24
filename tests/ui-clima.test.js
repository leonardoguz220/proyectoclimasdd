import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizarClima } from '../src/clima.js';
import { crearUI } from '../src/ui.js';
import lluvia from './fixtures/pronostico-lluvia.json';
import nublado from './fixtures/pronostico-nublado.json';
import sinUv from './fixtures/pronostico-sin-uv.json';

function montarPagina() {
  const html = readFileSync('index.html', 'utf8');
  const pagina = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = pagina.body.innerHTML;
}

const texto = (selector) => document.querySelector(selector)?.textContent.trim();
const dato = (clave) => texto(`[data-dato="${clave}"] .valor`);
const botonUnidad = (u) => document.querySelector(`[data-unidad="${u}"]`);

describe('clima actual (CA-05, CA-06)', () => {
  beforeEach(() => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(nublado, 'La Paz'));
  });

  it('muestra ciudad, temperatura, descripción, máxima y mínima', () => {
    expect(texto('.ciudad')).toBe('La Paz');
    expect(texto('.temperatura')).toBe('14°');
    expect(texto('.descripcion')).toBe('☁️ Nublado');
    expect(texto('.maxmin')).toBe('Máx. 18° · Mín. 6°');
  });

  it('muestra sensación, lluvia, humedad, viento, UV, amanecer y atardecer', () => {
    expect(dato('sensacion')).toBe('12°');
    expect(dato('probabilidad-lluvia')).toBe('55%');
    expect(dato('lluvia')).toBe('4,1 mm');
    expect(dato('humedad')).toBe('50%');
    expect(dato('viento')).toBe('8 km/h');
    expect(dato('uv')).toBe('8 · Muy alto');
    expect(dato('amanecer')).toBe('05:58');
    expect(dato('atardecer')).toBe('18:34');
  });

  it('oculta el mensaje inicial y fija el fondo', () => {
    expect(document.getElementById('mensaje-inicial').hidden).toBe(true);
    expect(document.body.dataset.fondo).toBe('nublado');
  });
});

describe('recomendación (CA-07 a CA-09)', () => {
  it('muestra paraguas y abrigo cuando se cumplen ambos', () => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(nublado, 'La Paz'));
    const frases = [...document.querySelectorAll('[data-dato="recomendacion"] .valor')];
    expect(frases.map((p) => p.textContent)).toEqual(['Lleva paraguas', 'Lleva abrigo']);
  });

  it('muestra solo paraguas cuando hace calor y llueve', () => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(lluvia, 'La Paz'));
    const frases = [...document.querySelectorAll('[data-dato="recomendacion"] .valor')];
    expect(frases.map((p) => p.textContent)).toEqual(['Lleva paraguas']);
    expect(document.body.dataset.fondo).toBe('lluvia');
  });
});

describe('pronóstico de 3 días (CA-10, CA-11)', () => {
  beforeEach(() => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(nublado, 'La Paz'));
  });

  it('muestra 3 días con nombre, ícono, máxima, mínima y lluvia', () => {
    const dias = [...document.querySelectorAll('[data-dato="pronostico"] .dia')];
    expect(dias).toHaveLength(3);
    expect(dias[0].querySelector('.dia-nombre').textContent).toBe('Mañana');
    expect(dias[1].querySelector('.dia-nombre').textContent).toBe('Lunes');
    expect(dias[2].querySelector('.dia-nombre').textContent).toBe('Martes');
    expect(dias[0].querySelector('.icono').textContent).toBeTruthy();
    expect(dias[0].querySelector('.dia-max').textContent).toBe('17°');
    expect(dias[0].querySelector('.dia-min').textContent).toBe('5°');
    expect(dias[0].querySelector('.dia-lluvia').textContent).toBe('75%');
  });
});

describe('cambio de unidad (CA-12, CA-13, CA-14)', () => {
  let ui;
  let alCambiar;
  beforeEach(() => {
    montarPagina();
    ui = crearUI(document);
    alCambiar = vi.fn();
    ui.alCambiarUnidad(alCambiar);
    ui.mostrarClima(normalizarClima(nublado, 'La Paz'));
  });

  it('empieza en °C', () => {
    expect(botonUnidad('C').getAttribute('aria-pressed')).toBe('true');
    expect(botonUnidad('F').getAttribute('aria-pressed')).toBe('false');
  });

  it('al elegir °F cambian todas las temperaturas, sin pedir datos', () => {
    const fetchEspia = vi.fn();
    vi.stubGlobal('fetch', fetchEspia);

    botonUnidad('F').click();

    expect(texto('.temperatura')).toBe('57°'); // 14.1 °C
    expect(dato('sensacion')).toBe('54°'); // 12.0 °C
    expect(texto('.maxmin')).toBe('Máx. 65° · Mín. 43°'); // 18.2 y 6.1 °C
    const dia = document.querySelector('[data-dato="pronostico"] .dia');
    expect(dia.querySelector('.dia-max').textContent).toBe('63°'); // 17.1 °C
    expect(dia.querySelector('.dia-min').textContent).toBe('42°'); // 5.4 °C
    expect(fetchEspia).not.toHaveBeenCalled();
    expect(botonUnidad('F').getAttribute('aria-pressed')).toBe('true');
  });

  it('el viento y la lluvia no cambian', () => {
    botonUnidad('F').click();
    expect(dato('viento')).toBe('8 km/h');
    expect(dato('lluvia')).toBe('4,1 mm');
  });

  it('avisa la unidad elegida para poder guardarla, y volver a °C funciona', () => {
    botonUnidad('F').click();
    expect(alCambiar).toHaveBeenLastCalledWith('F');
    botonUnidad('C').click();
    expect(alCambiar).toHaveBeenLastCalledWith('C');
    expect(texto('.temperatura')).toBe('14°');
  });

  it('pulsar la unidad que ya está elegida no hace nada', () => {
    botonUnidad('C').click();
    expect(alCambiar).not.toHaveBeenCalled();
  });

  it('usa la unidad guardada al mostrar el clima', () => {
    ui.mostrarClima(normalizarClima(nublado, 'La Paz'), 'F');
    expect(texto('.temperatura')).toBe('57°');
    expect(botonUnidad('F').getAttribute('aria-pressed')).toBe('true');
  });

  it('establecerUnidad redibuja el clima que ya está en pantalla', () => {
    ui.establecerUnidad('F');
    expect(texto('.temperatura')).toBe('57°');
  });
});

describe('datos faltantes (CA-33)', () => {
  it('muestra "—" en la tarjeta sin dato y sigue mostrando el resto', () => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(sinUv, 'La Paz'));
    expect(dato('uv')).toBe('—');
    expect(dato('humedad')).toBe('—');
    expect(dato('viento')).toBe('8 km/h');
    expect(texto('.temperatura')).toBe('14°');
    expect(document.querySelectorAll('[data-dato="pronostico"] .dia')).toHaveLength(3);
  });

  it('una temperatura faltante se muestra como "—"', () => {
    montarPagina();
    const modelo = normalizarClima(nublado, 'La Paz');
    modelo.actual.sensacion = null;
    crearUI(document).mostrarClima(modelo);
    expect(dato('sensacion')).toBe('—');
  });
});

describe('descripciones en texto (CA-32)', () => {
  beforeEach(() => {
    montarPagina();
    crearUI(document).mostrarClima(normalizarClima(nublado, 'La Paz'));
  });

  it('todo ícono tiene role="img" y una descripción', () => {
    const iconos = document.querySelectorAll('.icono');
    expect(iconos.length).toBeGreaterThanOrEqual(4);
    iconos.forEach((i) => {
      expect(i.getAttribute('role')).toBe('img');
      expect(i.getAttribute('aria-label')).toBeTruthy();
    });
    expect(texto('.descripcion .icono') && document.querySelector('.descripcion .icono').getAttribute('aria-label')).toBe(
      'Nublado',
    );
  });

  it('los botones de unidad dicen a qué unidad cambian', () => {
    expect(botonUnidad('C').getAttribute('aria-label')).toBe('Mostrar en °C');
    expect(botonUnidad('F').getAttribute('aria-label')).toBe('Mostrar en °F');
  });
});
