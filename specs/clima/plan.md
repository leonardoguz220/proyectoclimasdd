# Plan: App del clima

> Estado: aprobado (Fase 2), con BigDataCloud para el nombre de "Usar mi ubicación". Este documento dice CÓMO se construye lo que define `spec.md`. Si algo del plan contradice la spec, manda la spec.

## 1. Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Interfaz | HTML + CSS + JavaScript puro (módulos ES), sin framework | Lo más simple; funciona igual en celular y computadora; cabe en 1-2 horas. |
| Servidor de desarrollo | Vite | Los módulos ES no cargan desde `file://`; Vite lo resuelve con `npm run dev`. |
| Tests | Vitest + jsdom | Corre en Node sin navegador, simula el DOM y permite simular `fetch`. |
| Datos | Open-Meteo (geocodificación + pronóstico), sin clave | Gratuita y sin registro. |
| Persistencia | `localStorage` (solo la unidad elegida) | CA-14. |

Comandos: `npm run dev` (abrir la app), `npm test` (todos los tests, una sola vez).

## 2. Estructura de carpetas

```
proyectoclimasdd/
├─ AGENTS.md
├─ index.html              # estructura de la página
├─ package.json
├─ specs/clima/             # spec.md, plan.md, tasks.md
├─ src/
│  ├─ main.js               # arranque: conecta eventos con la lógica y la interfaz
│  ├─ api.js                # buscarCiudades(), obtenerClima(), nombreDeUbicacion(); único módulo que usa fetch
│  ├─ errores.js            # tipos de error y mensajes en español
│  ├─ clima.js              # convierte la respuesta de la API en el modelo de la app; reglas puras
│  ├─ unidades.js           # °C ↔ °F y guardado de la unidad
│  ├─ ui.js                 # dibuja pantalla, lista, tarjetas, errores y carga
│  └─ styles.css            # estilo vidrio, fondos, responsivo
└─ tests/
   ├─ fixtures/             # respuestas simuladas (JSON)
   ├─ api.test.js
   ├─ clima.test.js
   ├─ unidades.test.js
   └─ ui.test.js
```

Regla de diseño: `clima.js`, `unidades.js` y `errores.js` son funciones puras (sin red ni DOM), por eso se prueban fácil. Solo `api.js` toca la red y solo `ui.js` toca el DOM.

## 3. Uso de Open-Meteo

Todas las llamadas son `GET`, sin clave, y se hacen desde el navegador.

### 3.1 Geocodificación (CA-02, CA-03, CA-23)

```
https://geocoding-api.open-meteo.com/v1/search?name=<texto>&count=5&language=es&format=json
```

- Devuelve `results[]` con `name`, `admin1` (región), `country`, `latitude`, `longitude`.
- Si no hay coincidencias, la respuesta **no trae** la propiedad `results` → se lanza `CiudadNoEncontrada`.
- `count=5` cumple el máximo de CA-02.

### 3.2 Pronóstico y clima actual (CA-05, CA-10, CA-11)

```
https://api.open-meteo.com/v1/forecast
  ?latitude=<lat>&longitude=<lon>&timezone=auto&forecast_days=4
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset
```

- `forecast_days=4`: el índice 0 es hoy (clima actual: máxima, mínima, lluvia, UV, amanecer, atardecer) y los índices 1 a 3 son el pronóstico de CA-10.
- `timezone=auto`: las horas llegan en la zona horaria de la ciudad, lo que permite decidir "es de noche" en esa ciudad (CA-16).
- Viento en km/h y lluvia en mm, que es lo que pide la spec; solo se convierten las temperaturas (CA-13).
- Las temperaturas siempre llegan en °C; °F se calcula en el navegador.

### 3.3 Nombre de la ubicación del usuario (CA-28)

Open-Meteo no tiene geocodificación inversa. Para "Usar mi ubicación":

1. Las coordenadas salen de `navigator.geolocation`.
2. El clima se pide con el mismo endpoint de 3.2.
3. El nombre de la ciudad se obtiene del servicio gratuito de geocodificación inversa de BigDataCloud (`api.bigdatacloud.net/data/reverse-geocode-client?latitude=..&longitude=..&localityLanguage=es`, sin clave), usando el campo `city` o `locality`.
4. Si ese servicio falla, se muestra "Mi ubicación" y el clima se ve igual (el nombre no es crítico).

> Decisión para confirmar: es una segunda API, solo para el nombre. Alternativa: mostrar siempre "Mi ubicación" y cambiar CA-28 en la spec.

### 3.4 Datos que se derivan en el navegador

- **Descripción, ícono y fondo** a partir de `weather_code` (códigos WMO):

| Códigos | Descripción | Fondo |
|---|---|---|
| 0, 1 | Despejado | despejado |
| 2, 3, 45, 48 | Parcialmente nublado / Nublado / Niebla | nublado |
| 51–67, 80–82, 95–99 | Llovizna / Lluvia / Chubascos / Tormenta | lluvia |
| 71–77, 85, 86 | Nieve | lluvia (precipitación) |

- **Noche (CA-16):** si la hora actual (`current.time`) es anterior a `sunrise` de hoy o posterior o igual a `sunset` de hoy, el fondo es `noche`, sin importar el código. Las horas son texto ISO en la misma zona horaria, se comparan como texto, sin convertir a `Date`.
- **Nivel UV (CA-06):** Bajo 0–2, Moderado 3–5, Alto 6–7, Muy alto 8–10, Extremo 11+ (redondeando el valor al entero más cercano).
- **Recomendación (CA-07 a CA-09):** `precipitation_probability_max` de hoy ≥ 50 → "Lleva paraguas"; `apparent_temperature` actual (siempre en °C) < 15 → "Lleva abrigo"; si no, "Sin necesidad de paraguas ni abrigo".
- **Nombre de los días (CA-11):** el primer día es "Mañana"; los siguientes, el día de la semana en español (`Intl.DateTimeFormat('es', { weekday: 'long' })`). Las fechas `AAAA-MM-DD` se interpretan sin zona horaria para evitar desfases.
- **°F (CA-13):** `F = C × 9/5 + 32`, redondeado a entero. Se recalcula desde los °C guardados, sin volver a pedir datos.
- **Datos faltantes (CA-33):** cualquier valor `null` o ausente se muestra como "—".

## 4. Estado y flujo de la aplicación

Estado en memoria (un objeto simple en `main.js`):

```
{ clima: modelo | null, ciudad: nombre | null, unidad: 'C' | 'F', ultimaAccion: función | null }
```

Flujos:

1. **Inicio:** pantalla con búsqueda, botón "Usar mi ubicación" y "Busca una ciudad" (CA-01). Solo se lee la unidad guardada (CA-14).
2. **Buscar:** campo vacío → no hace nada (CA-04). Si no, indicador de carga → `buscarCiudades` → lista de hasta 5 (CA-02) → clic en una → `obtenerClima` → render (CA-03).
3. **Ubicación:** `getCurrentPosition` → `obtenerClima` + `nombreDeUbicacion` → render. Si se niega o falla, mensaje de CA-29.
4. **Cambio de unidad:** solo vuelve a dibujar las temperaturas (CA-13) y guarda la unidad.
5. **Reintentar:** repite `ultimaAccion` (CA-26).

## 5. Manejo de errores

`errores.js` define tres tipos y su mensaje exacto de la spec:

| Error | Cuándo se lanza | Mensaje | Botón |
|---|---|---|---|
| `CiudadNoEncontrada` | La geocodificación no trae `results` | CA-23 | No |
| `SinConexion` | `fetch` falla con error de red (`TypeError`) o `navigator.onLine` es `false` | CA-24 | Reintentar |
| `ServicioCaido` | Respuesta HTTP no exitosa (≥ 400), JSON inválido o más de 8 s sin respuesta (`AbortController`) | CA-25 | Reintentar |
| `UbicacionNoDisponible` | El usuario niega el permiso o falla la geolocalización | CA-29 | No |

- `api.js` traduce cualquier falla a uno de estos tipos; `main.js` los captura y llama a `ui.mostrarError(tipo)`.
- El aviso de error se dibuja **encima o junto al** clima actual; nunca se borra el clima previo (CA-27).
- Mientras se espera una respuesta, se muestra el indicador de carga (CA-22).

## 6. Interfaz y estilo

- **Vidrio (CA-15):** tarjetas con `background: rgba(255,255,255,0.18)`, `backdrop-filter: blur(20px)`, borde de 1 px translúcido y sombra suave. Incluye el prefijo `-webkit-` para Safari.
- **Fondo dinámico (CA-16):** el atributo `data-fondo` en `<body>` (`despejado | nublado | lluvia | noche`) cambia un degradado CSS, con transición suave. Sin imágenes, solo CSS.
- **Contraste (CA-17):** texto blanco con sombra leve; los degradados se mantienen suficientemente oscuros. Un test calcula la relación de contraste entre el texto y el color más claro de cada degradado y exige ≥ 4.5.
- **Responsivo (CA-18, CA-19):** CSS Grid. Móvil primero (una columna, sin `overflow-x`, probado desde 360 px); desde `@media (min-width: 768px)` las tarjetas pasan a 2–3 columnas con `max-width` de unos 960 px centrado.
- **Íconos (CA-32):** emojis del sistema dentro de `<span role="img" aria-label="Nublado">`; botones con `aria-label` ("Cambiar a °F"). Sin archivos de imagen.
- **Usabilidad (CA-30, CA-31):** la búsqueda es un `<form>` con botón visible; la lista de coincidencias son `<button>` (un clic o toque elige). Flechas ↑/↓ mueven el foco entre coincidencias y `:focus-visible` marca el elemento activo.
- **Idioma (CA-20):** todos los textos en español, centralizados en un único objeto de textos.
- **Atribución:** pie de página con "Datos del clima: Open-Meteo.com", que su licencia exige.

## 7. Estrategia de tests (sin red)

Principio de AGENTS.md: ningún test llama a internet.

- **Respuestas simuladas:** `tests/fixtures/` guarda JSON con la forma real de las respuestas: `geocodificacion-varias.json`, `geocodificacion-vacia.json`, `pronostico-nublado.json`, `pronostico-lluvia.json`, `pronostico-noche.json`, `pronostico-sin-uv.json`.
- **`fetch` simulado:** `api.js` recibe `fetch` como parámetro (por defecto el global) y los tests le pasan una función simulada (`vi.fn()`) que devuelve las fixtures o falla a propósito. Además, un `setup` global hace que cualquier `fetch` real lance un error, para detectar fugas a la red.
- **Pruebas por capa:**
  - `clima.test.js` (puras): descripciones y fondos por código, regla de noche, niveles UV, recomendaciones, nombres de días, datos faltantes.
  - `unidades.test.js`: °C→°F, redondeo, guardado y lectura (con `localStorage` simulado por jsdom).
  - `api.test.js`: URL correcta, máximo 5 resultados, sin resultados → `CiudadNoEncontrada`, red caída → `SinConexion`, HTTP 500 / JSON inválido / timeout → `ServicioCaido`.
  - `ui.test.js` (jsdom): pantalla inicial, lista de coincidencias, tarjetas con todos los datos, cambio de unidad sin nueva petición, mensajes de error con y sin "Reintentar", clima previo intacto tras un error, indicador de carga, `aria-label` en íconos.
- **Lo que NO se prueba automáticamente** (se revisa a mano en el navegador en la Fase 5): el aspecto "vidrio" real (CA-15), la ausencia de scroll horizontal a 360 px (CA-18), la cuadrícula a 768 px o más (CA-19), el tiempo de respuesta real de menos de 3 s (CA-21) y el permiso de ubicación real del navegador (CA-28).

### Cobertura criterio → verificación

| Criterios | Cómo se verifica |
|---|---|
| CA-01 a CA-04 | `ui.test.js`, `api.test.js` |
| CA-05, CA-06 | `clima.test.js`, `ui.test.js` |
| CA-07 a CA-09 | `clima.test.js` |
| CA-10, CA-11 | `clima.test.js`, `ui.test.js` |
| CA-12 a CA-14 | `unidades.test.js`, `ui.test.js` |
| CA-15, CA-18, CA-19, CA-21 | Revisión manual |
| CA-16 | `clima.test.js` |
| CA-17 | Test de contraste + revisión manual |
| CA-20 | `ui.test.js` |
| CA-22 a CA-27, CA-33 | `api.test.js`, `ui.test.js` |
| CA-28 | Revisión manual + `api.test.js` (nombre inverso simulado) |
| CA-29 | `ui.test.js` (geolocalización simulada) |
| CA-30 a CA-32 | `ui.test.js` + revisión manual |

## 8. Riesgos

- **Servicio externo:** si Open-Meteo cambia o cae en la demo, se ve el error de CA-25. Los tests siguen en verde porque no dependen de la red.
- **Geolocalización:** el navegador solo la permite en `localhost` o `https`. Con `npm run dev` funciona; no se prueba abriendo el archivo directamente.
- **Tiempo:** si falta tiempo, lo primero que se recorta es la animación de transición del fondo (no está en la spec). Recortar cualquier criterio, como CA-31 (teclado), exige primero cambiar la spec.
