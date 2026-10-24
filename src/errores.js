import { TEXTOS } from './textos.js';

// Error base de la app. `reintentable` indica si la interfaz debe mostrar "Reintentar".
export class ErrorClima extends Error {
  constructor(tipo, mensaje, reintentable) {
    super(mensaje);
    this.name = tipo;
    this.tipo = tipo;
    this.mensaje = mensaje;
    this.reintentable = reintentable;
  }
}

export class CiudadNoEncontrada extends ErrorClima {
  constructor() {
    super('CiudadNoEncontrada', TEXTOS.errores.ciudadNoEncontrada, false);
  }
}

export class SinConexion extends ErrorClima {
  constructor() {
    super('SinConexion', TEXTOS.errores.sinConexion, true);
  }
}

export class ServicioCaido extends ErrorClima {
  constructor() {
    super('ServicioCaido', TEXTOS.errores.servicioCaido, true);
  }
}

export class UbicacionNoDisponible extends ErrorClima {
  constructor() {
    super('UbicacionNoDisponible', TEXTOS.errores.ubicacionNoDisponible, false);
  }
}
