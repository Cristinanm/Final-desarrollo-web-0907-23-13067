# Reserva de salas de biblioteca
**Carnet: 0907-23-13067**  
Proyecto: Final-desarrollo-web-0907-23-13067

Aplicación en español con Node.js, Express, Sequelize, SQLite, React y sesiones mediante cookies. No utiliza JWT ni almacena credenciales en localStorage.

## Carpetas separadas

~~~text
Final-desarrollo-web-0907-23-13067/
|-- backend/
|   |-- package.json          # Dependencias y comandos del servidor
|   |-- .env.example
|   |-- iniciar.js
|   |-- aplicacion.js
|   |-- modelos.js
|   |-- pruebas/
|   +-- datos/                # SQLite; excluido de Git
|-- frontend/
|   |-- package.json          # Dependencias y comandos de React
|   |-- index.html
|   |-- vite.config.js
|   |-- src/
|   |   |-- principal.jsx
|   |   +-- estilos.css
|   +-- dist/                 # Compilación; excluida de Git
|-- package.json              # Comandos conjuntos y workspaces
|-- package-lock.json
|-- README.md
|-- decisiones.md
+-- prompts.md
~~~

Backend y frontend tienen sus propios package.json. npm workspaces permite instalar todas las dependencias una vez desde la raíz; npm puede compartirlas físicamente en node_modules sin mezclar el código de las dos aplicaciones.

Para ejecutar cada parte por separado, después de npm.cmd install en la raíz:

**Terminal 1 — backend**
~~~powershell
cd backend
npm.cmd run dev
~~~

**Terminal 2 — frontend**
~~~powershell
cd frontend
npm.cmd run dev
~~~

Abre la URL de Vite. El frontend llama a /api mediante el proxy del servidor de desarrollo. Para ejecutar la versión compilada, los comandos build y start de la raíz siguen funcionando: Node sirve frontend/dist y la API.

## Requisitos
- Node.js 22 o posterior y npm.
- Git para conservar los commits de la entrega.
- No se necesita instalar un servidor de base de datos.

## Ejecutar
Desde la carpeta del proyecto:

~~~powershell
npm.cmd install
Copy-Item backend/.env.example backend/.env
npm.cmd run build
npm.cmd start
~~~

Abre **http://localhost:3000**. Edita backend/.env para elegir tu propio SECRETO_SESION. En otros sistemas puedes usar npm en lugar de npm.cmd; en Windows el sufijo evita el bloqueo de npm.ps1 por la política de PowerShell.

Inicia sesión con el correo y la contraseña de un usuario que ya exista en la base de datos. No hay registro público ni cuentas de demostración. Los usuarios existentes se conservan. Se crean tres salas automáticamente, sin duplicarlas al reiniciar.

Para desarrollar con recarga automática:

~~~powershell
npm.cmd run dev
~~~

Abre la dirección que imprime Vite (normalmente http://127.0.0.1:5173). Vite redirige /api al backend del puerto 3000. Para cambiar este puerto en desarrollo también debes ajustar el proxy en frontend/vite.config.js.

## Comprobar
~~~powershell
npm.cmd test
npm.cmd run build
~~~

Las pruebas de integración usan una base temporal y comprueban:
- Rutas protegidas, login de usuarios existentes, registro público deshabilitado, logout y cookie HttpOnly/SameSite.
- Token CSRF y respuestas 400, 401, 403, 404 y 409.
- Solapamientos iguales, parciales, contenidos y envolventes.
- Reservas consecutivas, otras salas y otras fechas.
- Conflictos entre usuarios y privacidad del listado personal.
- Dos solicitudes simultáneas: una se acepta y otra recibe 409.
- Renovación por actividad y expiración exacta a los 30 minutos usando un reloj controlado.

La compilación comprueba el frontend. La navegación visual y la redirección en un navegador requieren además la revisión manual descrita abajo.

## Modelo de datos
| Tabla | Campos principales | Relaciones |
| --- | --- | --- |
| usuarios | id, nombre, correo único, hash_contrasena | Un usuario tiene muchas reservas |
| salas | id, nombre único, capacidad positiva | Una sala tiene muchas reservas |
| reservas | id, usuario_id, sala_id, fecha, hora_inicio, hora_fin | Pertenece a un usuario y a una sala |
| sesiones | id, datos, vence | Sesión del servidor; sin relación de negocio adicional |

Los modelos y sus propiedades se escriben en español. La base usa nombres de tablas en minúscula y columnas con guion bajo. Sequelize crea la estructura al arrancar. backend/datos/biblioteca.sqlite persiste usuarios, salas, reservas y sesiones; está excluido de Git.

La capacidad indica cuántas personas caben en la sala. No es una cantidad de reservas simultáneas: cada sala se reserva completa.

## Regla de negocio
Una reserva se superpone cuando, para la misma sala y fecha:

~~~text
inicio_existente < fin_nuevo Y fin_existente > inicio_nuevo
~~~

Los límites son abiertos para permitir que una reserva empiece al terminar otra. Se validan fechas reales y horas HH:mm, y el fin debe ser posterior al inicio. Las reservas no cruzan medianoche. La consigna no exige restricciones de fecha pasada ni horarios de apertura; no se inventaron.

El backend consulta dentro de una transacción SQLite BEGIN IMMEDIATE. Un trigger refuerza la regla ante inserciones o actualizaciones que omitan el controlador. El índice por sala y fecha ayuda a encontrar conflictos.

## Sesión y seguridad
- bcrypt almacena un hash con salt, nunca la contraseña original.
- La cookie contiene un identificador firmado; los datos de sesión están en SQLite.
- La sesión se regenera al autenticar y se destruye al cerrar sesión.
- Cada petición autenticada renueva la última actividad. No hay consultas periódicas que mantengan artificialmente activa la sesión.
- Al cumplirse 30 minutos sin actividad, el servidor rechaza la siguiente petición con 401.
- El cliente centraliza las peticiones: ante un 401 elimina el estado autenticado y muestra /login.
- Cookies HttpOnly, SameSite=Strict y token CSRF en operaciones autenticadas.
- Para HTTPS configura COOKIE_SEGURA=true. El servidor local escucha en 127.0.0.1; no se configura alojamiento público en esta entrega.
- Configura un secreto estable para conservar sesiones válidas entre reinicios. Sin .env, se usa un secreto aleatorio que cambia con cada arranque.
- Es un proyecto académico; antes de exponerlo públicamente se debe preparar el entorno de despliegue, HTTPS y controles de abuso.

## Rutas
| Método | Ruta | Función |
| --- | --- | --- |
| POST | /api/login | Iniciar sesión |
| GET | /api/sesion | Recuperar usuario y token CSRF |
| POST | /api/logout | Cerrar sesión; requiere token |
| GET | /api/salas | Listar salas; requiere sesión |
| GET | /api/reservas | Listar reservas del usuario actual |
| POST | /api/reservas | Crear reserva; requiere sesión y token |

Login recibe correo, contrasena. Reserva recibe salaId (entero), fecha (AAAA-MM-DD), horaInicio y horaFin (HH:mm). El usuario se toma de la sesión; el cliente no puede reservar a nombre de otra persona.

## Recorrido manual para la defensa
1. Iniciar sesión con un usuario existente; seleccionar sala, fecha y horario; guardar.
2. Revisar la tabla **Mis reservas** y comprobar sala, fecha y horas.
3. Repetir la misma reserva: debe aparecer el mensaje de horario ocupado.
4. Reservar justo al terminar la primera: debe aceptarse.
5. Cerrar sesión e intentar entrar de nuevo con contraseña incorrecta.
6. Iniciar sesión correctamente y recargar: debe conservarse.
7. Dejar de interactuar durante 30 minutos y realizar una acción: debe mostrar el login. La prueba automatizada comprueba el mismo plazo sin esperar media hora.
8. Usar otro usuario para comprobar que no ve reservas ajenas y tampoco puede ocupar un horario ya reservado.

