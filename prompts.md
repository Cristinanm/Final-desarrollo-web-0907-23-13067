# Registro de prompts

**Carné: 0907-23-13067**

Este documento reúne las solicitudes que hice a la IA para desarrollar y documentar mi aplicación. Incluyo algunas solicitudes originales y resúmenes de otras indicaciones. Los resúmenes no son citas textuales.

## 1. Ayuda inicial para crear la aplicación

- Crear una aplicación para reservar salas de una biblioteca.
- Usar Node.js y Sequelize en el backend, con una base de datos a elección.
- Usar React básico en el frontend.
- Implementar un inicio de sesión mediante cookies.
- Mostrar las salas y un formulario con sala, fecha, hora de inicio y hora de fin.
- Evitar reservas con horarios que se crucen para una misma sala.
- Cerrar la sesión después de 30 minutos de inactividad.
- Mostrar el login cuando el frontend reciba una respuesta 401.
- Nombrar la carpeta `Final-desarrollo-web-0907-23-13067`.

## 2. Solicitud de desarrollo en español

Mi solicitud original fue:

> Mi numero de carnet es 0907-23-13067, necesito bque me ayudes a crear esto, los nombres ytodo trabajalo en español, **Las tablas que construiremos serán:**
> - **Usuarios:** nombre, correo y hash de contraseña.
> - **Salas:** nombre y capacidad.
> - **Reservas:** usuario, sala, fecha, hora de inicio y hora de fin. SI CREES PERSISTENTE QUE HAYAN MAS TABLAS LAS PUEDES HACER

Con esta solicitud indiqué que quería los nombres y el contenido en español. También permití agregar otras tablas si eran necesarias.

Durante la implementación se utilizó SQLite y se agregó una tabla para guardar las sesiones. La IA también incorporó validaciones en el backend y pruebas de integración. Estas fueron decisiones de implementación, no prompts adicionales míos.

## 3. Ayuda con la preparación del proyecto

Compartí los resultados de los comandos que ejecuté para crear el proyecto e instalar las dependencias. Después confirmé que la prueba de conexión con SQLite funcionó.


## 4. Separación del frontend y el backend

Mi solicitud original fue:

> Recuerda que ne4cesito que este separado el frontend y en backend en carpetas y no lo veo asi

Pedí que ambas partes estuvieran claramente separadas en `frontend/` y `backend/`. Se reorganizaron sus archivos, dependencias y comandos, y se ajustaron las rutas y la documentación.

## 5. Simplificación de la interfaz

**Resumen de mi solicitud:**

Pedí una interfaz más sencilla, conservar el color verde y eliminar las imágenes y los elementos decorativos. También solicité quitar el registro público y permitir únicamente el inicio de sesión con los dos usuarios que ya había guardado.

Se simplificaron los formularios, las tablas y los estilos. Se eliminó el registro público y se conservaron los datos existentes.

## 6. Comandos técnicos utilizados

Durante la implementación, la IA utilizó comandos para instalar dependencias, ejecutar pruebas y compilar:

```text
npm.cmd install --no-audit --no-fund
npm.cmd test
npm.cmd run build
```
