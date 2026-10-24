import { TEXTOS } from './textos.js';
import { formatearTemperatura, SIN_DATO, UNIDAD_POR_DEFECTO } from './unidades.js';

const decimal = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

const faltante = (valor) => valor === null || valor === undefined || Number.isNaN(valor);
const porcentaje = (v) => (faltante(v) ? SIN_DATO : `${Math.round(v)}%`);
const milimetros = (v) => (faltante(v) ? SIN_DATO : `${decimal.format(v)} mm`);
const kmPorHora = (v) => (faltante(v) ? SIN_DATO : `${Math.round(v)} km/h`);
const hora = (v) => v ?? SIN_DATO;
const indiceUV = (uv, nivel) => (faltante(uv) ? SIN_DATO : `${Math.round(uv)} · ${nivel}`);

function crear(doc, etiqueta, { clase, texto, attrs } = {}, ...hijos) {
  const e = doc.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  for (const [nombre, valor] of Object.entries(attrs ?? {})) e.setAttribute(nombre, valor);
  e.append(...hijos);
  return e;
}

// CA-32: los íconos llevan descripción en texto para lectores de pantalla.
const icono = (doc, emoji, descripcion) =>
  crear(doc, 'span', { clase: 'icono', texto: emoji, attrs: { role: 'img', 'aria-label': descripcion } });

function tarjeta(doc, clave, etiqueta, valor) {
  return crear(
    doc,
    'article',
    { clase: 'tarjeta', attrs: { 'data-dato': clave } },
    crear(doc, 'h3', { clase: 'etiqueta', texto: etiqueta }),
    crear(doc, 'p', { clase: 'valor', texto: valor }),
  );
}

// Único módulo que toca el DOM. Recibe el documento para poder probarse con jsdom.
export function crearUI(doc = document) {
  const el = {
    formulario: doc.getElementById('form-busqueda'),
    mensajeInicial: doc.getElementById('mensaje-inicial'),
    cargando: doc.getElementById('cargando'),
    lista: doc.getElementById('lista-ciudades'),
    clima: doc.getElementById('clima'),
    aviso: doc.getElementById('aviso'),
    pie: doc.querySelector('.pie'),
  };
  const manejadores = { buscar: null, ubicacion: null, unidad: null };
  const estado = { modelo: null, unidad: UNIDAD_POR_DEFECTO };

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

  // CA-31: con el teclado, ↓ desde la barra entra a la lista; ↑/↓ recorren las coincidencias
  // y Enter elige la que está seleccionada (cada coincidencia es un botón).
  campo.addEventListener('keydown', (evento) => {
    if (evento.key !== 'ArrowDown') return;
    const primera = el.lista.querySelector('button');
    if (primera) {
      evento.preventDefault();
      primera.focus();
    }
  });
  el.lista.addEventListener('keydown', (evento) => {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
    const botones = [...el.lista.querySelectorAll('button')];
    const actual = botones.indexOf(doc.activeElement);
    if (actual === -1) return;
    evento.preventDefault();
    const siguiente = actual + (evento.key === 'ArrowDown' ? 1 : -1);
    if (siguiente < 0) campo.focus();
    else botones[Math.min(siguiente, botones.length - 1)].focus();
  });

  el.mensajeInicial.textContent = TEXTOS.ui.mensajeInicial;

  // Atribución que exige la licencia de los datos.
  if (el.pie) {
    const enlace = crear(doc, 'a', {
      texto: 'Open-Meteo.com',
      attrs: { href: 'https://open-meteo.com/', target: '_blank', rel: 'noopener' },
    });
    el.pie.replaceChildren(`${TEXTOS.ui.atribucion} `, enlace);
  }

  // CA-12, CA-13: dos botones °C / °F; al elegir uno solo se redibuja con el modelo guardado.
  function selectorUnidad() {
    const botones = ['C', 'F'].map((unidad) =>
      crear(doc, 'button', {
        clase: 'unidad-boton',
        texto: `°${unidad}`,
        attrs: {
          type: 'button',
          'data-unidad': unidad,
          'aria-label': TEXTOS.clima.mostrarEn(unidad),
          'aria-pressed': String(estado.unidad === unidad),
        },
      }),
    );
    botones.forEach((boton) =>
      boton.addEventListener('click', () => {
        const unidad = boton.dataset.unidad;
        if (unidad === estado.unidad) return;
        estado.unidad = unidad;
        dibujarClima();
        manejadores.unidad?.(unidad);
      }),
    );
    return crear(
      doc,
      'div',
      { clase: 'unidad', attrs: { role: 'group', 'aria-label': TEXTOS.clima.unidadGrupo } },
      ...botones,
    );
  }

  // CA-05, CA-06 a CA-11, CA-33: todo el clima, a partir del modelo y la unidad.
  function dibujarClima() {
    const { modelo, unidad } = estado;
    const temp = (c) => formatearTemperatura(c, unidad);
    const { actual, hoy } = modelo;

    const cabecera = crear(
      doc,
      'header',
      { clase: 'cabecera' },
      crear(doc, 'h2', { clase: 'ciudad', texto: modelo.ciudad }),
      crear(doc, 'p', { clase: 'temperatura', texto: temp(actual.temperatura) }),
      crear(
        doc,
        'p',
        { clase: 'descripcion' },
        icono(doc, actual.icono, actual.descripcion),
        crear(doc, 'span', { texto: ` ${actual.descripcion}` }),
      ),
      crear(doc, 'p', {
        clase: 'maxmin',
        texto: `${TEXTOS.clima.maxima} ${temp(hoy.maxima)} · ${TEXTOS.clima.minima} ${temp(hoy.minima)}`,
      }),
      selectorUnidad(),
    );

    const recomendacion = crear(
      doc,
      'article',
      { clase: 'tarjeta recomendacion', attrs: { 'data-dato': 'recomendacion' } },
      crear(doc, 'h3', { clase: 'etiqueta', texto: TEXTOS.clima.recomendacion }),
      ...modelo.recomendaciones.map((texto) => crear(doc, 'p', { clase: 'valor', texto })),
    );

    const tarjetas = crear(
      doc,
      'div',
      { clase: 'tarjetas' },
      recomendacion,
      tarjeta(doc, 'sensacion', TEXTOS.clima.sensacion, temp(actual.sensacion)),
      tarjeta(doc, 'probabilidad-lluvia', TEXTOS.clima.probabilidadLluvia, porcentaje(hoy.probabilidadLluvia)),
      tarjeta(doc, 'lluvia', TEXTOS.clima.lluvia, milimetros(hoy.lluviaMm)),
      tarjeta(doc, 'humedad', TEXTOS.clima.humedad, porcentaje(actual.humedad)),
      tarjeta(doc, 'viento', TEXTOS.clima.viento, kmPorHora(actual.viento)),
      tarjeta(doc, 'uv', TEXTOS.clima.uv, indiceUV(hoy.uv, hoy.nivelUV)),
      tarjeta(doc, 'amanecer', TEXTOS.clima.amanecer, hora(hoy.amanecer)),
      tarjeta(doc, 'atardecer', TEXTOS.clima.atardecer, hora(hoy.atardecer)),
    );

    const pronostico = crear(
      doc,
      'section',
      { clase: 'tarjeta pronostico', attrs: { 'data-dato': 'pronostico' } },
      crear(doc, 'h3', { clase: 'etiqueta', texto: TEXTOS.clima.pronostico }),
      crear(
        doc,
        'ul',
        {},
        ...modelo.pronostico.map((dia) =>
          crear(
            doc,
            'li',
            { clase: 'dia' },
            crear(doc, 'span', { clase: 'dia-nombre', texto: dia.nombre }),
            icono(doc, dia.icono, dia.descripcion),
            crear(doc, 'span', { clase: 'dia-max', texto: temp(dia.maxima) }),
            crear(doc, 'span', { clase: 'dia-min', texto: temp(dia.minima) }),
            crear(doc, 'span', { clase: 'dia-lluvia', texto: porcentaje(dia.probabilidadLluvia) }),
          ),
        ),
      ),
    );

    el.clima.replaceChildren(cabecera, tarjetas, pronostico);
    doc.body.dataset.fondo = modelo.fondo;
  }

  return {
    alBuscar(fn) {
      manejadores.buscar = fn;
    },
    alUsarUbicacion(fn) {
      manejadores.ubicacion = fn;
    },
    alCambiarUnidad(fn) {
      manejadores.unidad = fn;
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

    enfocarBusqueda() {
      campo.focus();
    },

    limpiarCoincidencias() {
      el.lista.replaceChildren();
    },

    // CA-23 a CA-27, CA-29: el aviso va aparte del clima, que nunca se borra por un error.
    // "Reintentar" solo aparece si el error lo permite (sin conexión, servicio caído).
    mostrarError(error, alReintentar) {
      const mensaje = error?.mensaje ?? TEXTOS.errores.servicioCaido;
      const hijos = [crear(doc, 'p', { clase: 'aviso-texto', texto: mensaje })];
      if (error?.reintentable && alReintentar) {
        const boton = crear(doc, 'button', {
          clase: 'aviso-reintentar',
          texto: TEXTOS.ui.reintentar,
          attrs: { type: 'button', 'data-accion': 'reintentar' },
        });
        boton.addEventListener('click', () => alReintentar());
        hijos.push(boton);
      }
      el.aviso.replaceChildren(...hijos);
    },

    limpiarError() {
      el.aviso.replaceChildren();
    },

    mostrarClima(modelo, unidad = estado.unidad) {
      estado.modelo = modelo;
      estado.unidad = unidad;
      el.mensajeInicial.hidden = true;
      dibujarClima();
    },

    // CA-13: cambiar la unidad desde fuera (por ejemplo, la guardada al abrir la app).
    establecerUnidad(unidad) {
      estado.unidad = unidad;
      if (estado.modelo) dibujarClima();
    },
  };
}
