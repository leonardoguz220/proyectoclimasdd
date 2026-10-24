# AGENTS.md — Constitución de proyectoclimasdd

App del clima desarrollada con Spec-Driven Development (SDD) estricto, en modo **spec-anchored**: la especificación vive en el repo y se corrige cada vez que algo cambia.

## Reglas del proyecto

1. **La spec es la fuente de verdad.** `specs/clima/spec.md` define el QUÉ y el POR QUÉ. Si el código y la spec discrepan, manda la spec.
2. **No se escribe código sin una tarea aprobada.** Todo código nace de una tarea de `specs/clima/tasks.md` que el usuario haya aprobado.
3. **Un commit por tarea**, con el formato `T-n: descripción` (por ejemplo, `T-3: mostrar el clima actual de una ciudad`).
4. **Tests en verde antes de pasar a la siguiente tarea.** Una tarea no está terminada si algún test falla.
5. **Si algo no cumple los criterios, se corrige primero la SPEC** y después el código. Nunca se arregla solo el código dejando la spec desactualizada.
6. **Los tests no dependen de la red.** Usan respuestas simuladas (mocks/fixtures); ninguna prueba llama al servicio real.

## Flujo por fases

Cada fase termina con un resumen de lo creado y se espera el "aprobado" del usuario antes de avanzar. Nunca se avanza por cuenta propia.

| Fase | Entregable |
|------|------------|
| 0 - Constitución | `AGENTS.md` |
| 1 - Spec | `specs/clima/spec.md` (se entrevista al usuario; no se escribe sola) |
| 2 - Plan | `specs/clima/plan.md` (el CÓMO) |
| 3 - Tareas | `specs/clima/tasks.md` |
| 4 - Implementar | Una tarea a la vez, un commit por tarea; tras cada commit se espera "sigue" |
| 5 - Verificar | Tabla criterio / estado contra la spec |

## Separación de documentos

- **Spec**: solo QUÉ y POR QUÉ. No menciona frameworks, librerías ni la API de datos.
- **Plan**: el CÓMO (stack, estructura, uso de Open-Meteo, errores, estrategia de tests).
- **Tareas**: pasos pequeños con ID (`T-n`), descripción, criterio de aceptación que cubren y responsable (usuario o Claude).

## Formato de criterios de aceptación (EARS)

Concretos y verificables, con números cuando se pueda:

- Siempre: "El sistema DEBE <respuesta>"
- CUANDO <evento>, el sistema DEBE <respuesta>
- MIENTRAS <estado>, el sistema DEBE <respuesta>
- DONDE <función opcional>, el sistema DEBE <respuesta>
- SI <algo sale mal>, ENTONCES el sistema DEBE <respuesta>

## Alcance

- **Dentro**: buscar una ciudad por nombre, clima actual, pronóstico de 3 días, cambio entre °C y °F, manejo de errores (ciudad no encontrada, sin conexión, servicio caído).
- **Fuera**: mapas, ciudades favoritas, cuentas de usuario, notificaciones, historial.

## Convenciones

- Documentos y mensajes de commit en español.
- No se hace `push` al remoto hasta que el usuario lo pida explícitamente.
- Repositorio: https://github.com/leonardoguz220/proyectoclimasdd.git
