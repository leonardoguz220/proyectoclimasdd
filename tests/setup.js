import { beforeEach, vi } from 'vitest';

// Regla de AGENTS.md: los tests no dependen de la red.
// Cualquier fetch real falla; los tests deben inyectar una respuesta simulada.
beforeEach(() => {
  vi.stubGlobal('fetch', () => {
    throw new Error('Red bloqueada en tests: usa una respuesta simulada.');
  });
});
