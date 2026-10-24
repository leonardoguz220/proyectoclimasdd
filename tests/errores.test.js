import { describe, expect, it } from 'vitest';
import {
  CiudadNoEncontrada,
  ErrorClima,
  ServicioCaido,
  SinConexion,
  UbicacionNoDisponible,
} from '../src/errores.js';
import { TEXTOS } from '../src/textos.js';

describe('errores de la app', () => {
  it('CiudadNoEncontrada usa el mensaje de CA-23 y no se reintenta', () => {
    const e = new CiudadNoEncontrada();
    expect(e.mensaje).toBe('No encontramos esa ciudad. Revisa el nombre e inténtalo de nuevo.');
    expect(e.reintentable).toBe(false);
  });

  it('SinConexion usa el mensaje de CA-24 y se puede reintentar', () => {
    const e = new SinConexion();
    expect(e.mensaje).toBe('Sin conexión a internet. Revisa tu red.');
    expect(e.reintentable).toBe(true);
  });

  it('ServicioCaido usa el mensaje de CA-25 y se puede reintentar', () => {
    const e = new ServicioCaido();
    expect(e.mensaje).toBe('El servicio del clima no responde ahora. Inténtalo en unos minutos.');
    expect(e.reintentable).toBe(true);
  });

  it('UbicacionNoDisponible usa el mensaje de CA-29 y no se reintenta', () => {
    const e = new UbicacionNoDisponible();
    expect(e.mensaje).toBe(
      'No pudimos obtener tu ubicación. Puedes buscar una ciudad por nombre.',
    );
    expect(e.reintentable).toBe(false);
  });

  it('todos son ErrorClima y Error, con su tipo como nombre', () => {
    for (const Clase of [CiudadNoEncontrada, SinConexion, ServicioCaido, UbicacionNoDisponible]) {
      const e = new Clase();
      expect(e).toBeInstanceOf(ErrorClima);
      expect(e).toBeInstanceOf(Error);
      expect(e.tipo).toBe(Clase.name);
      expect(e.name).toBe(Clase.name);
    }
  });
});

describe('textos de la interfaz (CA-20)', () => {
  it('tiene los textos fijos de la pantalla inicial en español', () => {
    expect(TEXTOS.ui.mensajeInicial).toBe('Busca una ciudad');
    expect(TEXTOS.ui.usarUbicacion).toBe('Usar mi ubicación');
    expect(TEXTOS.ui.reintentar).toBe('Reintentar');
  });
});
