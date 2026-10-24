import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('preparación del proyecto', () => {
  it('bloquea cualquier fetch real durante los tests', () => {
    expect(() => fetch('https://example.com')).toThrow('Red bloqueada');
  });

  it('index.html está en español y tiene los puntos de montaje básicos', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('id="form-busqueda"');
    expect(html).toContain('id="clima"');
  });
});
