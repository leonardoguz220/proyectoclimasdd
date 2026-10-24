import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles.css', 'utf8');

// Luminancia y contraste según WCAG 2.x.
function luminancia([r, g, b]) {
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};
const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function coloresDelFondo(estado) {
  const bloque = css.match(new RegExp(`body\\[data-fondo="${estado}"\\]\\s*\\{([^}]*)\\}`));
  expect(bloque, `falta el fondo "${estado}"`).not.toBeNull();
  return [...bloque[1].matchAll(/#[0-9a-f]{6}/gi)].map((m) => hexARgb(m[0]));
}

const texto = hexARgb(css.match(/--texto:\s*(#[0-9a-f]{6})/i)[1]);
const [vr, vg, vb, va] = css
  .match(/--vidrio:\s*rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
  .slice(1)
  .map(Number);

// Color que se ve de una tarjeta de vidrio sobre un fondo dado.
const bajoVidrio = (fondo) => [vr, vg, vb].map((c, i) => c * va + fondo[i] * (1 - va));

describe('fondos dinámicos (CA-16)', () => {
  it.each(['despejado', 'nublado', 'lluvia', 'noche'])('define el fondo "%s"', (estado) => {
    expect(coloresDelFondo(estado).length).toBeGreaterThanOrEqual(2);
  });
});

describe('contraste del texto (CA-17)', () => {
  it.each(['despejado', 'nublado', 'lluvia', 'noche'])(
    'sobre el fondo "%s" el texto tiene al menos 4.5:1, también dentro de las tarjetas',
    (estado) => {
      for (const color of coloresDelFondo(estado)) {
        expect(contraste(texto, color)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(texto, bajoVidrio(color))).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});

describe('efecto vidrio (CA-15)', () => {
  it('las tarjetas son translúcidas y desenfocan lo que hay detrás', () => {
    expect(va).toBeGreaterThan(0);
    expect(va).toBeLessThan(1);
    expect(css).toMatch(/\.tarjeta\s*\{[^}]*backdrop-filter:\s*blur\(/);
    expect(css).toMatch(/\.tarjeta\s*\{[^}]*-webkit-backdrop-filter:\s*blur\(/);
  });
});

describe('contraste del botón de unidad seleccionado (CA-17)', () => {
  it('el texto del botón seleccionado tiene al menos 4.5:1 sobre su propio fondo', () => {
    const regla = css.match(/\.unidad-boton\[aria-pressed="true"\]\s*\{([^}]*)\}/);
    expect(regla, 'falta la regla del botón seleccionado').not.toBeNull();
    const fondo = regla[1].match(/background:\s*(#[0-9a-f]{6})/i);
    const color = regla[1].match(/color:\s*(#[0-9a-f]{6})/i);
    expect(fondo, 'el fondo del botón seleccionado debe ser un color sólido').not.toBeNull();
    expect(color, 'el botón seleccionado debe fijar su color de texto').not.toBeNull();
    expect(contraste(hexARgb(color[1]), hexARgb(fondo[1]))).toBeGreaterThanOrEqual(4.5);
  });
});
