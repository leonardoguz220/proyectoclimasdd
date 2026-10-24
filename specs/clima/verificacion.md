# Verificación (Fase 5)

Revisión de cada criterio de `spec.md` contra el código, los tests y la prueba manual.

**Evidencias usadas**

- **Tests:** `npm test`, 143 tests en verde, todos sin red.
- **Navegador:** prueba de Claude con la API real (búsqueda de "La Paz", clima, cambio a °F, ancho de 360 px).
- **Prueba manual (T-13):** el usuario reportó que todo pasó.

## Tabla criterio / estado

| Criterio | Estado | Evidencia |
|---|---|---|
| CA-01 Pantalla inicial | Cumple | `ui.test.js`, `app.test.js`; navegador |
| CA-02 Lista de hasta 5 coincidencias | Cumple | `api.test.js`, `ui.test.js`; navegador |
| CA-03 Elegir muestra clima y pronóstico | Cumple | `app.test.js`; navegador |
| CA-04 Campo vacío no busca | Cumple | `ui.test.js`, `app.test.js` |
| CA-05 Datos del clima actual | Cumple | `modelo.test.js`, `ui-clima.test.js`; navegador |
| CA-06 Nivel de UV | Cumple | `clima.test.js`; navegador ("11 · Extremo") |
| CA-07 Paraguas con lluvia ≥ 50 % | Cumple | `clima.test.js`, `ui-clima.test.js` |
| CA-08 Abrigo con sensación < 15 °C | Cumple | `clima.test.js`, `ui-clima.test.js` |
| CA-09 Frase neutra y las dos a la vez | Cumple | `clima.test.js` |
| CA-10 Pronóstico de los 3 días siguientes | Cumple | `modelo.test.js`; navegador |
| CA-11 Datos de cada día del pronóstico | Cumple | `modelo.test.js`, `ui-clima.test.js`; navegador |
| CA-12 °C la primera vez | Cumple | `unidades.test.js`, `ui-clima.test.js` |
| CA-13 Cambio de unidad al instante, sin nueva consulta | Cumple | `ui-clima.test.js` (no llama a la red); navegador |
| CA-14 Recordar la unidad | Cumple | `unidades.test.js`, `app.test.js`; navegador |
| CA-15 Tarjetas de vidrio | Cumple | `estilos.test.js`; navegador; prueba manual |
| CA-16 Fondo dinámico de 4 estados y noche | Cumple | `clima.test.js`, `modelo.test.js`, `estilos.test.js`; prueba manual |
| CA-17 Contraste ≥ 4.5:1 | **Corregido** | Ver hallazgo 1 |
| CA-18 Celular: una columna, 360 px sin scroll horizontal | Cumple | Navegador (ancho de la página = 360); prueba manual |
| CA-19 Computadora: cuadrícula con ancho máximo | Cumple | `teclado.test.js`; navegador; prueba manual |
| CA-20 Todo en español | Cumple | `errores.test.js`, `ui-clima.test.js`; revisión de textos |
| CA-21 Clima en menos de 3 s | Cumple | Prueba manual (el usuario lo midió con red real) |
| CA-22 Indicador de carga | Cumple | `ui.test.js`, `app.test.js` |
| CA-23 Ciudad no encontrada | Cumple | `api.test.js`, `ui-errores.test.js`, `app.test.js` |
| CA-24 Sin conexión con Reintentar | Cumple | `api.test.js`, `ui-errores.test.js`, `app.test.js`; prueba manual |
| CA-25 Servicio caído con Reintentar | Cumple | `api.test.js` (HTTP 500, JSON inválido, 8 s), `app.test.js` |
| CA-26 Reintentar repite la última acción | Cumple | `app.test.js` (búsqueda, carga del clima y ubicación) |
| CA-27 El error no borra el clima | Cumple | `ui-errores.test.js`, `app.test.js` |
| CA-28 Usar mi ubicación | Cumple | `app.test.js`, `api.test.js` (nombre simulado); prueba manual con permiso real |
| CA-29 Ubicación denegada | Cumple | `app.test.js`; prueba manual |
| CA-30 Uso con mouse o toque | Cumple | `ui.test.js`; navegador; prueba manual |
| CA-31 Teclado | Cumple | `teclado.test.js`; prueba manual |
| CA-32 Descripciones en texto | Cumple | `ui-clima.test.js` |
| CA-33 Dato faltante como "—" | Cumple | `unidades.test.js`, `modelo.test.js`, `ui-clima.test.js` |

**Resultado:** 33 de 33 criterios cumplen. Uno (CA-17) cumplía solo en parte y se corrigió en esta fase.

## Hallazgos

### 1. CA-17: contraste del botón de unidad seleccionado

- **Qué pasaba:** el botón seleccionado (°C o °F) usaba un blanco translúcido de fondo con texto blanco. Calculando el color real que se ve, el contraste era de unos 3.7:1 sobre los fondos despejado y nublado, menos de los 4.5:1 que pide la spec.
- **Por qué no lo vio la prueba:** el test de contraste solo medía el texto sobre los fondos y las tarjetas, no los botones de estado seleccionado.
- **Qué se hizo:** la spec no cambia, porque CA-17 ya lo exigía bien. Se agregó primero un test que lo detecta (falló), se cambió el botón a fondo blanco sólido con texto oscuro (`#0f172a`, contraste de unos 17:1) y ahora el test pasa. Quedó registrado como T-15.

## Limitaciones y riesgos que no son criterios

- Los errores de red se probaron con respuestas simuladas; el usuario reportó que también funcionó apagando el internet.
- El nombre de la ciudad en "Usar mi ubicación" depende de un segundo servicio gratuito (BigDataCloud). Si falla, la app muestra "Mi ubicación" y el clima se ve igual.
- Los datos dependen de un servicio externo gratuito: si cambia o tiene límites de uso, la app mostraría el error de CA-25.
