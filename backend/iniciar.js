import dotenv from 'dotenv';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { crearAplicacion } from './aplicacion.js';
dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
const directorioDatos = fileURLToPath(new URL('datos/', import.meta.url));
await mkdir(directorioDatos, { recursive: true });
if (process.env.NODE_ENV === 'production' && (!process.env.SECRETO_SESION || process.env.SECRETO_SESION.length < 32)) {
  throw new Error('Configura SECRETO_SESION con al menos 32 caracteres.');
}
const { app } = await crearAplicacion({
  archivo: fileURLToPath(new URL('datos/biblioteca.sqlite', import.meta.url)),
  secreto: process.env.SECRETO_SESION || undefined,
  cookieSegura: process.env.COOKIE_SEGURA === 'true'
});
const puerto = Number(process.env.PUERTO || 3000);
app.listen(puerto, '127.0.0.1', () => console.log('Biblioteca disponible en http://localhost:' + puerto));
