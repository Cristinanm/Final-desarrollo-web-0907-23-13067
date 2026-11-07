import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { crearAplicacion, INACTIVIDAD } from '../aplicacion.js';

test('Flujo de autenticación, reglas de reserva y expiración real por inactividad', async () => {
  let ahora = Date.now();
  const carpeta = await mkdtemp(path.join(tmpdir(), 'biblioteca-'));
  const sistema = await crearAplicacion({ archivo: path.join(carpeta, 'prueba.sqlite'), reloj: () => ahora });
  const agente = request.agent(sistema.app);
  try {
    await request(sistema.app).get('/api/salas').expect(401);
    const registro = await agente.post('/api/registro').send({ nombre: 'Ana López', correo: 'ana@ejemplo.com', contrasena: 'Biblioteca123!' }).expect(201);
    assert.equal(registro.body.usuario.nombre, 'Ana López');
    assert.equal(registro.body.usuario.hashContrasena, undefined);
    const usuario = await sistema.Usuario.findOne();
    assert.notEqual(usuario.hashContrasena, 'Biblioteca123!');
    assert.match(registro.headers['set-cookie'][0], /HttpOnly/);
    assert.match(registro.headers['set-cookie'][0], /SameSite=Strict/);
    const token = registro.body.tokenCsrf;
    const salas = await agente.get('/api/salas').expect(200);
    const reserva = { salaId: salas.body[0].id, fecha: '2027-02-18', horaInicio: '09:00', horaFin: '10:00' };
    await agente.post('/api/reservas').send(reserva).expect(403);
    const reservar = datos => agente.post('/api/reservas').set('X-Token-CSRF', token).send(datos);
    await reservar(reserva).expect(201);
    for (const [horaInicio, horaFin] of [['09:00', '10:00'], ['08:00', '11:00'], ['09:30', '10:30'], ['08:30', '09:30'], ['09:15', '09:45']]) {
      await reservar({ ...reserva, horaInicio, horaFin }).expect(409);
    }
    await reservar({ ...reserva, horaInicio: '10:00', horaFin: '11:00' }).expect(201);
    await reservar({ ...reserva, salaId: salas.body[1].id }).expect(201);
    await reservar({ ...reserva, fecha: '2027-02-19' }).expect(201);
    await reservar({ ...reserva, fecha: '2027-02-30' }).expect(400);
    await reservar({ ...reserva, horaFin: '08:00' }).expect(400);
    await reservar({ ...reserva, salaId: 99999 }).expect(404);
    // Segundo usuario: los conflictos se comprueban para todos, los listados son privados.
    const otro = request.agent(sistema.app);
    const sesionOtro = await otro.post('/api/registro').send({ nombre: 'Luis', correo: 'luis@ejemplo.com', contrasena: 'Biblioteca123!' }).expect(201);
    await otro.post('/api/reservas').set('X-Token-CSRF', sesionOtro.body.tokenCsrf).send(reserva).expect(409);
    assert.deepEqual((await otro.get('/api/reservas').expect(200)).body, []);
    // Dos solicitudes simultáneas: solamente una puede ganar.
    const concurrente = { ...reserva, fecha: '2027-03-01' };
    const resultados = await Promise.all([
      reservar(concurrente),
      otro.post('/api/reservas').set('X-Token-CSRF', sesionOtro.body.tokenCsrf).send(concurrente)
    ]);
    assert.deepEqual(resultados.map(r => r.status).sort(), [201, 409]);
    // La actividad a los 29 minutos renueva los 30 minutos.
    ahora += 29 * 60 * 1000;
    await agente.get('/api/salas').expect(200);
    ahora += 29 * 60 * 1000;
    await agente.get('/api/salas').expect(200);
    ahora += INACTIVIDAD;
    await agente.get('/api/salas').expect(401);
    await agente.post('/api/login').send({ correo: 'ana@ejemplo.com', contrasena: 'incorrecta' }).expect(401);
    const login = await agente.post('/api/login').send({ correo: 'ana@ejemplo.com', contrasena: 'Biblioteca123!' }).expect(200);
    await agente.post('/api/logout').set('X-Token-CSRF', login.body.tokenCsrf).expect(200);
    await agente.get('/api/reservas').expect(401);
  } finally {
    await sistema.bd.close();
    await rm(carpeta, { recursive: true, force: true });
  }
});
