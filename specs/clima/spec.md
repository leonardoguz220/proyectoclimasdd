# Spec: App del clima

> Estado: aprobada (Fase 1). Esta spec dice QUÉ y POR QUÉ. No menciona tecnología, librerías ni servicios de datos (eso va en `plan.md`).

## 1. Problema

Consultar el clima suele ser incómodo: muchas apps son técnicas, están saturadas de datos o los presentan de forma difícil de interpretar. La persona solo quiere saber, en pocos segundos, cómo está el clima y qué hacer con esa información (salir con paraguas, abrigarse, planear los próximos días).

Se necesita una app del clima **bonita, minimalista y fácil de entender**, de estilo "vidrio" (tarjetas translúcidas) inspirado en la app de Clima del iPhone, que **responda rápido** las preguntas más comunes y funcione tanto en **celular como en computadora**.

## 2. Usuarios

- Cualquier persona que necesite ver el clima de una ciudad, sin conocimientos técnicos.
- El autor del proyecto como usuario principal.

## 3. Historias

- **H-1.** Como usuario, quiero buscar una ciudad por su nombre, para ver el clima del lugar que me interesa.
- **H-2.** Como usuario, quiero ver qué temperatura hace ahora y cómo se siente, para saber cómo está el día.
- **H-3.** Como usuario, quiero saber si va a llover hoy o mañana (probabilidad y cantidad), para planear mi día.
- **H-4.** Como usuario, quiero que la app me diga en palabras simples si necesito abrigo o paraguas, para no tener que interpretar números.
- **H-5.** Como usuario, quiero ver el pronóstico de los próximos 3 días, para planear con anticipación.
- **H-6.** Como usuario, quiero cambiar entre °C y °F, para ver la temperatura en la unidad que entiendo.
- **H-7.** Como usuario, quiero una interfaz bonita y clara que se vea bien en mi celular y en mi computadora, para que consultar el clima sea agradable.
- **H-8.** Como usuario, quiero que los errores se expliquen en lenguaje simple y me digan qué hacer, para no quedarme bloqueado.
- **H-9.** Como usuario, quiero ver el clima del lugar donde estoy sin escribir su nombre, para ahorrar tiempo.
- **H-10.** Como usuario, quiero usar toda la app con el mouse o con el dedo (y, si lo prefiero, con el teclado), y que las personas que usan lector de pantalla también puedan usarla.

## 4. Criterios de aceptación

Formato EARS. Cada criterio indica entre paréntesis la(s) historia(s) que cubre.

### Búsqueda de ciudad

- **CA-01.** CUANDO el usuario abra la app, el sistema DEBE mostrar la barra de búsqueda, el botón "Usar mi ubicación" y el mensaje "Busca una ciudad", sin ningún clima ni ciudad cargados de antes. (H-1, H-9)
- **CA-02.** CUANDO el usuario escriba un nombre de ciudad y confirme la búsqueda, el sistema DEBE mostrar una lista de **hasta 5** coincidencias, cada una con ciudad, región y país. (H-1)
- **CA-03.** CUANDO el usuario elija una coincidencia de la lista, el sistema DEBE mostrar el clima actual y el pronóstico de esa ciudad. (H-1)
- **CA-04.** SI el usuario confirma la búsqueda con el campo vacío, ENTONCES el sistema DEBE no iniciar ninguna búsqueda y mantener la barra de búsqueda lista para escribir. (H-1)
- **CA-28.** CUANDO el usuario pulse "Usar mi ubicación" y conceda el permiso, el sistema DEBE mostrar el clima del lugar donde está, indicando el nombre de la ciudad. (H-9)
- **CA-29.** SI el usuario niega el permiso o no se puede obtener su ubicación, ENTONCES el sistema DEBE mostrar "No pudimos obtener tu ubicación. Puedes buscar una ciudad por nombre." y dejar la barra de búsqueda lista para escribir. (H-9)

### Clima actual

- **CA-05.** CUANDO se muestre el clima de una ciudad, el sistema DEBE mostrar: nombre de la ciudad, temperatura actual, descripción del cielo en palabras (por ejemplo "Nublado"), temperatura máxima y mínima del día, sensación térmica, probabilidad de lluvia de hoy (%), cantidad de lluvia de hoy (mm), humedad (%), velocidad del viento (km/h), índice UV con su nivel en palabras, hora de amanecer y hora de atardecer. (H-2, H-3)
- **CA-06.** CUANDO se muestre el índice UV, el sistema DEBE acompañarlo del nivel en palabras: Bajo (0–2), Moderado (3–5), Alto (6–7), Muy alto (8–10) o Extremo (11 o más). (H-2)

### Recomendación

- **CA-07.** CUANDO la probabilidad de lluvia de hoy sea **50 % o más**, el sistema DEBE mostrar la recomendación "Lleva paraguas". (H-4)
- **CA-08.** CUANDO la sensación térmica actual sea **menor a 15 °C**, el sistema DEBE mostrar la recomendación "Lleva abrigo", sin importar la unidad elegida para mostrar. (H-4)
- **CA-09.** CUANDO no se cumpla ni CA-07 ni CA-08, el sistema DEBE mostrar una frase neutra: "Sin necesidad de paraguas ni abrigo". Si se cumplen ambos, el sistema DEBE mostrar las dos recomendaciones. (H-4)

### Pronóstico

- **CA-10.** CUANDO se muestre el clima de una ciudad, el sistema DEBE mostrar el pronóstico de los **3 días siguientes a hoy**. (H-5)
- **CA-11.** El sistema DEBE mostrar por cada día del pronóstico: nombre del día ("Mañana" para el primero, luego el día de la semana), un ícono del estado del cielo, temperatura máxima, temperatura mínima y probabilidad de lluvia (%). (H-3, H-5)

### Unidades

- **CA-12.** El sistema DEBE mostrar las temperaturas en °C la primera vez que se usa. (H-6)
- **CA-13.** CUANDO el usuario cambie entre °C y °F, el sistema DEBE actualizar **todas** las temperaturas en pantalla (actual, sensación térmica, máxima, mínima y las del pronóstico) en **menos de 1 segundo** y sin volver a pedir datos. El viento (km/h) y la lluvia (mm) NO cambian. (H-6)
- **CA-14.** El sistema DEBE recordar la unidad elegida y usarla al volver a abrir la app. (H-6)

### Interfaz

- **CA-15.** El sistema DEBE mostrar la información en tarjetas de estilo vidrio (translúcidas) sobre un fondo. (H-7)
- **CA-16.** El sistema DEBE usar un fondo dinámico con 4 estados: despejado, nublado, lluvia y noche. CUANDO sea de noche en la ciudad mostrada (entre la hora de atardecer y la de amanecer), el fondo DEBE ser "noche"; si no, DEBE corresponder al estado del cielo actual. (H-7)
- **CA-17.** El sistema DEBE mantener el texto legible sobre cada uno de los 4 fondos, con una relación de contraste de al menos **4.5:1**. (H-7)
- **CA-18.** MIENTRAS el ancho de pantalla sea **menor a 768 px**, el sistema DEBE mostrar una sola columna de tarjetas, con la barra de búsqueda y los botones completamente visibles desde **360 px** de ancho y sin scroll horizontal. (H-7)
- **CA-19.** MIENTRAS el ancho de pantalla sea **768 px o más**, el sistema DEBE acomodar las tarjetas de datos en una cuadrícula de 2 o 3 columnas, con un ancho máximo del contenido para que no se estiren en pantallas grandes. (H-7)
- **CA-20.** El sistema DEBE mostrar todos sus textos (etiquetas, días de la semana, recomendaciones y mensajes de error) en español. (H-7)

### Uso y accesibilidad

- **CA-30.** El sistema DEBE poder usarse completo con mouse o con toque en pantalla: escribir y buscar (con un botón de búsqueda visible), elegir una coincidencia con un solo clic o toque, cambiar la unidad, pulsar "Usar mi ubicación" y pulsar "Reintentar". (H-10)
- **CA-31.** DONDE el usuario use el teclado, el sistema DEBE permitir confirmar la búsqueda con Enter, elegir una coincidencia con las flechas y Enter, y recorrer los botones con Tab, mostrando de forma visible cuál está seleccionado. (H-10)
- **CA-32.** El sistema DEBE dar una descripción en texto (para lectores de pantalla) a todo ícono o botón que no tenga texto visible; por ejemplo, el ícono de nublado y el botón de cambiar a °F. (H-10)

### Rendimiento

- **CA-21.** CUANDO el usuario elija una ciudad, el sistema DEBE mostrar su clima en **menos de 3 segundos** con una conexión normal. (H-1, H-2)
- **CA-22.** MIENTRAS el sistema esté buscando o cargando datos, el sistema DEBE mostrar un indicador de carga visible. (H-1, H-8)

### Errores

- **CA-33.** SI el servicio entrega un clima con algún dato faltante (por ejemplo, sin índice UV), ENTONCES el sistema DEBE mostrar "—" en la tarjeta de ese dato y seguir mostrando el resto sin errores. (H-8)
- **CA-23.** SI la búsqueda no encuentra ninguna ciudad, ENTONCES el sistema DEBE mostrar "No encontramos esa ciudad. Revisa el nombre e inténtalo de nuevo." y dejar la barra de búsqueda lista para escribir otra. (H-8)
- **CA-24.** SI no hay conexión a internet, ENTONCES el sistema DEBE mostrar "Sin conexión a internet. Revisa tu red." junto a un botón "Reintentar". (H-8)
- **CA-25.** SI el servicio del clima no responde, ENTONCES el sistema DEBE mostrar "El servicio del clima no responde ahora. Inténtalo en unos minutos." junto a un botón "Reintentar". (H-8)
- **CA-26.** CUANDO el usuario pulse "Reintentar", el sistema DEBE repetir la última acción que falló (búsqueda o carga del clima). (H-8)
- **CA-27.** SI ocurre un error mientras ya hay un clima en pantalla, ENTONCES el sistema DEBE mantener ese clima visible y mostrar el aviso de error sin borrarlo. (H-8)

## 5. Fuera de alcance

- Mapas (incluido el mapa de precipitación).
- Ciudades favoritas.
- Cuentas de usuario.
- Notificaciones.
- Historial de búsquedas.
- Recordar la última ciudad consultada (al abrir, siempre se empieza en blanco; solo se recuerda la unidad).
- Pronóstico por hora.
- Datos técnicos: presión, visibilidad, fase de la luna, brújula de viento, punto de rocío.
- Cambiar el viento o la lluvia a otras unidades (mph, pulgadas).
- Otros idiomas distintos al español.

## 6. Preguntas abiertas

Ninguna abierta.

Resueltas:

- **PA-1.** ¿"Próximos 3 días" incluye hoy? No: son los 3 días siguientes a hoy → CA-10.
- **PA-3.** ¿Dato incompleto? Se muestra "—" en esa tarjeta → CA-33.
- **PA-2.** ¿Botón "Usar mi ubicación"? Sí → CA-01, CA-28, CA-29.
- **PA-4.** Teclado y lectores de pantalla → mouse/toque como forma principal (CA-30), teclado como extra (CA-31) y descripciones en texto (CA-32).
