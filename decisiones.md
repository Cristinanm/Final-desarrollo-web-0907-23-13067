# Decisiones
**Carné: 0907-23-13067**

## (a) Qué entendí del problema y qué modelos utilicé

Entendí que debía crear una aplicación web para reservar salas de una biblioteca. Cada reserva debe indicar el usuario, la sala, la fecha y las horas de inicio y fin. Una misma sala no puede tener reservas con horarios que se crucen, aunque sean de distintos usuarios.

La sesión debe cerrarse después de 30 minutos de inactividad. Cuando el servidor responda con un error 401, la aplicación debe mostrar nuevamente el inicio de sesión.

Utilicé Node.js y Express para el backend, Sequelize para trabajar con los modelos y React para la interfaz. Elegí SQLite porque permite guardar los datos en un archivo sin instalar un servidor de base de datos.

Los modelos que utilicé fueron:

- **Usuario:** guarda el identificador, nombre, correo único y hash de la contraseña.
- **Sala:** guarda el identificador, nombre único y capacidad.
- **Reserva:** guarda el identificador, usuario, sala, fecha y horas de inicio y fin.
- **Sesión:** guarda el identificador, los datos de la sesión y su vencimiento para conservarla en la base de datos.

Un usuario puede tener varias reservas y una sala puede aparecer en distintas reservas. El usuario que hace una reserva se obtiene de la sesión iniciada. Además, cada usuario solamente puede consultar sus propias reservas.

Para evitar cruces de horarios, se comprueba si una reserva existente empieza antes de que termine la nueva y termina después de que comience la nueva. Esto permite reservar, por ejemplo, de 9:00 a 10:00 y de 10:00 a 11:00. También se utilizaron una transacción y una validación automática en SQLite para evitar cruces cuando llegan dos solicitudes al mismo tiempo.

## (b) Qué partes delegué a la IA y por qué

Le pedí a la IA que me ayudara a construir la aplicación y que mantuviera los nombres y el contenido en español. La IA generó el código del backend, los modelos, el manejo de sesiones, los formularios y las tablas de React, los estilos, las pruebas y los borradores de la documentación. También realizó la instalación de dependencias y ejecutó las pruebas y la compilación.

Utilicé esta ayuda para avanzar en la construcción y revisar situaciones que podía pasar por alto, como reservas que se cruzan, horarios consecutivos, solicitudes simultáneas y renovación de la sesión.

Reconozco que la IA generó esas partes del código. Mi responsabilidad es revisarlas y comprender cómo funcionan para poder explicarlas. Los puntos principales que debo entender son la validación de horarios en el backend, la diferencia entre una cookie y una sesión, el hash de las contraseñas y la respuesta del frontend ante un error 401.

## (c) Qué hizo mal la IA, cómo se detectó y cómo se corrigió

Uno de los errores de la IA ocurrió al crear el archivo `package.json` con PowerShell. El archivo quedó con una marca invisible al inicio, llamada BOM, que provocó un error al compilar el frontend con Vite.

El problema se detectó al ejecutar `npm.cmd run build`. El mensaje de error indicaba que había un carácter inesperado al leer el archivo JSON. Aunque las pruebas del backend habían pasado, el frontend todavía tenía este problema.

Para corregirlo, se guardó nuevamente el archivo en formato UTF-8 sin BOM, utilizando `System.IO.File.WriteAllText` y `UTF8Encoding(false)`. Después se ejecutó otra vez la compilación para comprobar que el error estuviera solucionado.

Aprendí que un archivo puede verse correcto y aun así contener detalles que impidan su funcionamiento. También comprendí que debo revisar y probar tanto el backend como el frontend.

## Organización del proyecto

Pedí que el proyecto se dividiera en dos carpetas: `backend/` y `frontend/`, cada una con su propio `package.json` y sus comandos. La carpeta principal utiliza npm workspaces para coordinar ambas partes.

El backend busca su archivo `.env` y la base de datos tomando como referencia la ubicación de su archivo de inicio. Así utiliza los mismos datos al ejecutarlo desde la carpeta principal o desde `backend/`.

En `frontend/` quedaron el archivo HTML, la configuración de Vite, el código de React y los archivos generados al compilar.

## Simplificación de la aplicación

Pedí un diseño más sencillo, con formularios, tablas y estilos básicos en color verde. También solicité quitar las ilustraciones, las fuentes externas y el registro público de usuarios.

El inicio de sesión sigue comprobando las contraseñas con bcrypt y permite entrar a los usuarios que ya están guardados. Durante estos cambios se conservó la base de datos existente.

Para las pruebas, los usuarios se crean directamente en una base de datos temporal. También se comprueba que la ruta de registro público responda con un error 404, porque esa opción fue eliminada.