import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { crearAplicacion } from './aplicacion.js';
await mkdir('datos', { recursive: true });
if (process.env.NODE_ENV === 'production' && (!process.env.SECRETO_SESION || process.env.SECRETO_SESION.length < 32)) {
  throw new Error('Configura SECRETO_SESION con al menos 32 caracteres.');
}
const { app } = await crearAplicacion({
  archivo: 'datos/biblioteca.sqlite',
  secreto: process.env.SECRETO_SESION || undefined,
  cookieSegura: process.env.COOKIE_SEGURA === 'true'
});
const puerto = Number(process.env.PUERTO || 3000);
app.listen(puerto, '127.0.0.1', () => console.log('Biblioteca disponible en http://localhost:' + puerto));
