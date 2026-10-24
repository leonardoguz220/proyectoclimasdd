import { TEXTOS } from './textos.js';

// Único módulo que toca el DOM. Recibe el documento para poder probarse con jsdom.
export function crearUI(doc = document) {
  const el = {
    formulario: doc.getElementById('form-busqueda'),
    mensajeInicial: doc.getElementById('mensaje-inicial'),
    cargando: doc.getElementById('cargando'),
    lista: doc.getElementById('lista-ciudades'),
  };
  const manejadores = { buscar: null, ubicacion: null };

  // Barra de búsqueda con botón visible (CA-30) y botón "Usar mi ubicación" (CA-01).
  const campo = doc.createElement('input');
  campo.type = 'search';
  campo.id = 'ciudad';
  campo.name = 'ciudad';
  campo.autocomplete = 'off';
  campo.placeholder = TEXTOS.ui.mensajeInicial;
  campo.setAttribute('aria-label', TEXTOS.ui.etiquetaCiudad);

  const botonBuscar = doc.createElement('button');
  botonBuscar.type = 'submit';
  botonBuscar.id = 'btn-buscar';
  botonBuscar.textContent = TEXTOS.ui.buscar;

  const botonUbicacion = doc.createElement('button');
  botonUbicacion.type = 'button';
  botonUbicacion.id = 'btn-ubicacion';
  botonUbicacion.textContent = TEXTOS.ui.usarUbicacion;

  el.formulario.append(campo, botonBuscar, botonUbicacion);

  // CA-04: con el campo vacío no se busca nada y la barra queda lista para escribir.
  el.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const nombre = campo.value.trim();
    if (nombre === '') {
      campo.focus();
      return;
    }
    manejadores.buscar?.(nombre);
  });

  botonUbicacion.addEventListener('click', () => manejadores.ubicacion?.());

  el.mensajeInicial.textContent = TEXTOS.ui.mensajeInicial;

  return {
    alBuscar(fn) {
      manejadores.buscar = fn;
    },
    alUsarUbicacion(fn) {
      manejadores.ubicacion = fn;
    },

    // CA-01: "Busca una ciudad" solo mientras no hay clima en pantalla.
    mostrarMensajeInicial(visible) {
      el.mensajeInicial.hidden = !visible;
    },

    // CA-22: indicador de carga visible mientras se busca o se carga.
    mostrarCargando(visible) {
      el.cargando.textContent = visible ? TEXTOS.ui.cargando : '';
      el.cargando.hidden = !visible;
    },

    // CA-02, CA-30: cada coincidencia es un botón; un clic o toque la elige.
    mostrarCoincidencias(ciudades, alElegir) {
      el.lista.replaceChildren(
        ...ciudades.map((ciudad) => {
          const item = doc.createElement('li');
          const boton = doc.createElement('button');
          boton.type = 'button';
          boton.textContent = ciudad.etiqueta;
          boton.addEventListener('click', () => alElegir(ciudad));
          item.append(boton);
          return item;
        }),
      );
    },

    limpiarCoincidencias() {
      el.lista.replaceChildren();
    },
  };
}
