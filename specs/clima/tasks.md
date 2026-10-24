# Tareas: App del clima

> Estado: aprobado (Fase 3). En ejecución (Fase 4). Se implementa una tarea a la vez, con un commit por tarea (`T-n: descripción`) y tests en verde antes de pasar a la siguiente (ver `AGENTS.md`).

Los criterios `CA-xx` están en `spec.md`; el cómo está en `plan.md`.

| ID | Descripción | Criterios que cubre | Responsable | Estado |
|---|---|---|---|---|
| T-1 | **Preparar el proyecto.** `package.json` con Vite, Vitest y jsdom; `index.html` con la estructura vacía; `.gitignore`; configuración de tests que hace fallar cualquier `fetch` real; un test de humo que pasa. Requisito: Node.js instalado (ya está: v24). | Base de AGENTS.md (tests sin red) | Claude | Hecha |
| T-2 | **Textos y errores.** `errores.js` con `CiudadNoEncontrada`, `SinConexion`, `ServicioCaido`, `UbicacionNoDisponible` y sus mensajes exactos en español, centralizados en un objeto de textos. | CA-20, CA-23, CA-24, CA-25, CA-29 (mensajes) | Claude | Hecha |
| T-3 | **Unidades.** `unidades.js`: °C → °F redondeado, formato de temperatura, guardar y leer la unidad (°C por defecto) en `localStorage`, tolerando que no esté disponible. | CA-12, CA-13 (cálculo), CA-14 | Claude | Hecha |
| T-4 | **Reglas del clima.** En `clima.js`: descripción, ícono y fondo por código del cielo; regla de noche; nivel de UV; recomendación de paraguas/abrigo; nombre de los días ("Mañana" y días de la semana). Todo con funciones puras. | CA-06, CA-07, CA-08, CA-09, CA-16, CA-11 (nombres) | Claude | Hecha |
| T-5 | **Modelo del clima.** Fixtures de respuestas simuladas y `clima.js` que convierte la respuesta de la API en el modelo de la app: datos de hoy y los 3 días siguientes; datos faltantes como "—". | CA-05, CA-10, CA-11, CA-33 | Claude | Pendiente |
| T-6 | **Acceso a la API.** `api.js`: `buscarCiudades` (máximo 5), `obtenerClima`, `nombreDeUbicacion` (con "Mi ubicación" si falla); traducción de fallas a los tipos de error, incluido el límite de 8 s. `fetch` inyectable y probado solo con fixtures. | CA-02, CA-03, CA-21 (límite de tiempo), CA-23, CA-24, CA-25, CA-28 (nombre) | Claude | Pendiente |
| T-7 | **Interfaz de búsqueda.** `ui.js`: pantalla inicial (barra, botón de búsqueda, "Usar mi ubicación", "Busca una ciudad"), campo vacío sin acción, lista de coincidencias elegibles con un clic, indicador de carga. | CA-01, CA-02, CA-04, CA-22, CA-30 | Claude | Pendiente |
| T-8 | **Interfaz del clima.** `ui.js`: tarjetas del clima actual (todos los datos), recomendación, pronóstico de 3 días, botón °C/°F que redibuja sin pedir datos, descripciones de texto en íconos y botones, "—" para datos faltantes. | CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-11, CA-12, CA-13, CA-14, CA-20, CA-32, CA-33 | Claude | Pendiente |
| T-9 | **Interfaz de errores.** `ui.js`: mostrar cada mensaje de error, con "Reintentar" cuando corresponde, sin borrar el clima que ya estaba en pantalla. | CA-23, CA-24, CA-25, CA-26, CA-27, CA-29 | Claude | Pendiente |
| T-10 | **Flujo completo.** `main.js`: conectar buscar → elegir → clima, "Usar mi ubicación" (permiso y falla), estado de la app y "Reintentar" que repite la última acción. | CA-01, CA-02, CA-03, CA-26, CA-28, CA-29 | Claude | Pendiente |
| T-11 | **Estilo vidrio y fondos.** `styles.css`: tarjetas de vidrio, 4 fondos dinámicos con `data-fondo`, texto legible; test que calcula el contraste contra cada fondo. | CA-15, CA-16, CA-17 | Claude | Pendiente |
| T-12 | **Responsivo y teclado.** `styles.css` y `ui.js`: una columna desde 360 px sin scroll horizontal; cuadrícula de 2–3 columnas con ancho máximo desde 768 px; foco visible, Enter y flechas en la lista. | CA-18, CA-19, CA-31 | Claude | Pendiente |
| T-13 | **Prueba manual en el navegador.** Abrir con `npm run dev`; revisar con red real el aspecto de vidrio, 360 px y 768 px o más, tiempo menor a 3 s, permiso de ubicación real, uso con mouse y teclado. Anotar lo que falle para corregir primero la spec. | CA-15, CA-18, CA-19, CA-21, CA-28, CA-30, CA-31 | Usuario (Claude acompaña) | Pendiente |
| T-14 | **Subir a GitHub.** Hacer `push` a `origin/main`. Solo cuando el usuario lo pida. | — | Usuario decide, Claude ejecuta | Pendiente |

## Cobertura de la spec

Cada criterio aparece en al menos una tarea:

| Criterio | Tareas | Criterio | Tareas |
|---|---|---|---|
| CA-01 | T-7, T-10 | CA-18 | T-12, T-13 |
| CA-02 | T-6, T-7, T-10 | CA-19 | T-12, T-13 |
| CA-03 | T-6, T-10 | CA-20 | T-2, T-8 |
| CA-04 | T-7 | CA-21 | T-6, T-13 |
| CA-05 | T-5, T-8 | CA-22 | T-7 |
| CA-06 | T-4, T-8 | CA-23 | T-2, T-6, T-9 |
| CA-07 | T-4, T-8 | CA-24 | T-2, T-6, T-9 |
| CA-08 | T-4, T-8 | CA-25 | T-2, T-6, T-9 |
| CA-09 | T-4, T-8 | CA-26 | T-9, T-10 |
| CA-10 | T-5, T-8 | CA-27 | T-9 |
| CA-11 | T-4, T-5, T-8 | CA-28 | T-6, T-10, T-13 |
| CA-12 | T-3, T-8 | CA-29 | T-2, T-9, T-10 |
| CA-13 | T-3, T-8 | CA-30 | T-7, T-13 |
| CA-14 | T-3, T-8 | CA-31 | T-12, T-13 |
| CA-15 | T-11, T-13 | CA-32 | T-8 |
| CA-16 | T-4, T-11 | CA-33 | T-5, T-8 |
| CA-17 | T-11 | | |

## Reglas de ejecución

- Una tarea a la vez; no se empieza otra hasta que la anterior tenga su commit y los tests estén en verde.
- Tras cada commit se muestra el resultado y se espera el "sigue" del usuario.
- Si una tarea revela que un criterio está mal o falta, se corrige primero `spec.md`, luego este archivo y después el código.
- Al terminar una tarea, su estado pasa a "Hecha" en este archivo, dentro del mismo commit.
