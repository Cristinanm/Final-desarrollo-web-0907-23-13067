# Registro de prompts
Carnet: **0907-23-13067**

## Solicitud del usuario
Se conserva el texto de la solicitud, con sus errores originales:

> Mi numero de carnet es 0907-23-13067, necesito bque me ayudes a crear esto, los nombres ytodo trabajalo en español, **Las tablas que construiremos serán:**
> - **Usuarios:** nombre, correo y hash de contraseña.
> - **Salas:** nombre y capacidad.
> - **Reservas:** usuario, sala, fecha, hora de inicio y hora de fin. SI CREES PERSISTENTE QUE HAYAN MAS TABLAS LAS PUEDES HACER

La solicitud incluyó una fotografía de la consigna. Los requisitos usados de esa imagen fueron: aplicación web de reservas de salas de biblioteca; Node.js y Sequelize con base de datos a elección; React básico; sesión en cookies; login; listado de salas y formulario de reserva; prohibición de horarios solapados; expiración por 30 minutos de inactividad y redirección al login ante 401; al menos dos commits separados tras backend y frontend; archivos decisiones.md y prompts.md.

## Instrucciones aplicadas durante la implementación
No hubo prompts adicionales del estudiante ni delegación a otros agentes. La IA tomó decisiones de implementación dentro de la solicitud inicial: SQLite, tabla persistente de sesiones, registro de usuarios para poder probar el login, validación del backend y pruebas de integración.

La IA utilizó comandos técnicos para instalar dependencias, compilar y ejecutar pruebas. Estos comandos no se presentan como prompts adicionales del estudiante:

~~~text
npm.cmd install --no-audit --no-fund
npm.cmd test
npm.cmd run build
~~~

El error de compilación y su corrección real se explican en decisiones.md. Si el estudiante realiza nuevas consultas a IA, debe agregarlas aquí con su texto y el uso que dio a las respuestas.

## Solicitud posterior de organización
> Recuerda que ne4cesito que este separado el frontend y en backend en carpetas y no lo veo asi

Se reorganizó la aplicación en frontend/ y backend/, se separaron sus dependencias y comandos y se ajustaron las rutas y documentación.
