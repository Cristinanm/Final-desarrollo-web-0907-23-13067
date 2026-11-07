# Decisiones
Carnet: **0907-23-13067**

Este documento describe las decisiones y el trabajo de IA realmente realizado en esta sesión. El estudiante debe revisarlo y poder explicar el resultado antes de entregarlo.

## (a) Qué se entendió del problema y qué tablas/modelos se planearon
Se necesita una aplicación web para reservar salas completas de una biblioteca. Cada reserva pertenece a un usuario y una sala, en una fecha y un intervalo de horas. Dos usuarios no pueden reservar la misma sala en horarios que se superpongan. La sesión debe expirar después de 30 minutos de inactividad; el frontend debe mostrar el login al recibir 401.

Se eligieron Node.js y Express para el backend, Sequelize como ORM, SQLite como base de datos y React básico para la interfaz. SQLite permite ejecutar el proyecto sin configurar un servidor externo de base de datos.

Modelos:
- **Usuario:** id, nombre, correo único y hash de contraseña.
- **Sala:** id, nombre único y capacidad positiva.
- **Reserva:** id, usuario, sala, fecha, hora de inicio y hora de fin.
- **Sesion:** identificador, datos de sesión y vencimiento. Esta tabla adicional permite persistir sesiones sin usar el almacén temporal en memoria.

Usuario y Sala tienen una relación de uno a muchos con Reserva. El usuario de una reserva proviene de la sesión, nunca de un campo editable del formulario. La consulta del listado devuelve solamente las reservas del usuario actual.

La regla usa comparaciones estrictas para admitir horarios consecutivos. La transacción y el trigger SQLite evitan que dos solicitudes concurrentes creen reservas incompatibles.

## (b) Qué partes se delegaron a la IA y por qué
Se pidió a la IA construir la aplicación y mantener los nombres y contenido en español. La IA generó el backend, los modelos Sequelize, la persistencia de sesiones, los formularios y listados React, estilos, pruebas automatizadas y borradores de documentación. También instaló las dependencias y ejecutó pruebas y compilación.

Se usó IA para acelerar la construcción y comprobar casos que suelen omitirse: intervalos contenidos o envolventes, horarios adyacentes, concurrencia y renovación de sesión. Esta asistencia no sustituye la revisión del estudiante. No se atribuye al estudiante la escritura manual de código que generó la IA ni se inventan conversaciones adicionales.

La explicación del estudiante debe abarcar especialmente la condición de solapamiento, por qué pertenece al backend, la diferencia entre cookie y sesión, el hash de contraseña y el manejo del 401 en React.

## (c) Una cosa que la IA hizo mal, cómo se corrigió y cómo se detectó
**Fallo real:** al generar package.json con Set-Content -Encoding utf8 en Windows PowerShell, la IA produjo un archivo con marca BOM. Aunque npm pudo instalar dependencias, la primera compilación de Vite falló al buscar la configuración de PostCSS, con el error Unexpected token al leer el JSON.

**Detección:** se ejecutó npm.cmd run build; su salida señaló el carácter inicial de package.json. La prueba del backend había pasado, por lo que se comprobó que esa prueba no bastaba para validar el frontend.

**Corrección:** se reescribió package.json como UTF-8 sin BOM utilizando System.IO.File.WriteAllText y UTF8Encoding(false). Después se volvió a ejecutar la compilación para verificar la corrección.

**Aprendizaje:** un archivo generado puede parecer válido a simple vista y fallar al procesarse con otra herramienta. Hay que ejecutar las verificaciones de cada parte y documentar el error observado, sin inventar una supuesta corrección para cumplir la rúbrica.

## Ajuste de organización solicitado
Se separó explícitamente el proyecto en backend/ y frontend/, cada uno con su propio package.json y comandos. La raíz coordina ambos mediante npm workspaces. El backend resuelve su .env y la base de datos con rutas relativas a su archivo de inicio; por eso conserva los mismos datos al ejecutarse desde la raíz o desde backend/. El frontend contiene su HTML, configuración Vite, código React y compilación.

## Simplificación solicitada
Se sustituyó el diseño decorativo por formularios y tablas con estilos básicos en verde. Se eliminaron las ilustraciones y fuentes externas, el formulario de registro y la ruta pública de creación de usuarios. El login sigue verificando las contraseñas con bcrypt contra los usuarios ya guardados. No se cambió ni se recreó la base de datos existente. Las pruebas preparan los usuarios directamente en su base temporal y comprueban que el registro público responde 404.
