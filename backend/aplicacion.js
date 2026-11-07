import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { Op, Transaction } from 'sequelize';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearModelos, AlmacenSesiones } from './modelos.js';

export const INACTIVIDAD = 30 * 60 * 1000;
const directorioFrontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend');
const manejar = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export async function crearAplicacion({ archivo = ':memory:', secreto = randomBytes(48).toString('hex'), reloj = Date.now, cookieSegura = false } = {}) {
  const modelos = crearModelos(archivo);
  const { bd, Usuario, Sala, Reserva, Sesion } = modelos;
  await bd.sync();
  // La BD también protege la regla, incluso frente a solicitudes concurrentes
  // o inserciones que no pasen por el controlador.
  for (const evento of ['INSERT', 'UPDATE']) {
    await bd.query(`CREATE TRIGGER IF NOT EXISTS reservas_sin_solapamiento_${evento.toLowerCase()}
      BEFORE ${evento} ON reservas
      BEGIN
        SELECT RAISE(ABORT, 'HORARIO_SOLAPADO') WHERE EXISTS (
          SELECT 1 FROM reservas r WHERE r.sala_id = NEW.sala_id AND r.fecha = NEW.fecha
          AND r.id != COALESCE(NEW.id, -1)
          AND r.hora_inicio < NEW.hora_fin AND r.hora_fin > NEW.hora_inicio
        );
      END`);
  }
  for (const [nombre, capacidad] of [['Sala de lectura', 6], ['Sala de investigación', 10], ['Sala de estudio grupal', 8]]) {
    await Sala.findOrCreate({ where: { nombre }, defaults: { capacidad } });
  }
  const app = express();
  app.disable('x-powered-by');
  if (cookieSegura) app.set('trust proxy', 1);
  app.use(express.json({ limit: '10kb' }));
  app.use(session({
    name: 'biblioteca.sid', secret: secreto, resave: false, saveUninitialized: false,
    rolling: true, store: new AlmacenSesiones(Sesion, reloj),
    cookie: { httpOnly: true, sameSite: 'strict', secure: cookieSegura, maxAge: INACTIVIDAD }
  }));
  // El frontend no envía latidos automáticos: solamente una acción renueva la sesión.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!req.session.usuarioId) return next();
    if (reloj() - req.session.ultimaActividad >= INACTIVIDAD) {
      return req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie('biblioteca.sid', { path: '/' });
        res.status(401).json({ mensaje: 'Tu sesión expiró por inactividad. Inicia sesión nuevamente.' });
      });
    }
    req.session.ultimaActividad = reloj();
    next();
  });
  // Token ligado a la sesión para proteger las operaciones autenticadas.
  const autenticar = (req, res, next) => req.session.usuarioId ? next() : res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  const proteger = (req, res, next) => req.get('X-Token-CSRF') === req.session.tokenCsrf
    ? next() : res.status(403).json({ mensaje: 'Token de seguridad inválido. Recarga la página.' });
  const vistaUsuario = u => ({ id: u.id, nombre: u.nombre, correo: u.correo });
  const iniciarSesion = async (req, usuario) => {
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.usuarioId = usuario.id;
    req.session.ultimaActividad = reloj();
    req.session.tokenCsrf = randomBytes(32).toString('hex');
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    return { usuario: vistaUsuario(usuario), tokenCsrf: req.session.tokenCsrf };
  };
  app.post('/api/login', manejar(async (req, res) => {
    const { correo, contrasena } = req.body;
    if (typeof correo !== 'string' || typeof contrasena !== 'string' || Buffer.byteLength(contrasena) > 72) {
      return res.status(400).json({ mensaje: 'Ingresa correo y contraseña válidos.' });
    }
    const usuario = await Usuario.findOne({ where: { correo: correo.trim().toLowerCase() } });
    if (!usuario || !await bcrypt.compare(contrasena, usuario.hashContrasena)) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }
    res.json(await iniciarSesion(req, usuario));
  }));
  app.get('/api/sesion', autenticar, manejar(async (req, res) => {
    const usuario = await Usuario.findByPk(req.session.usuarioId);
    if (!usuario) return res.status(401).json({ mensaje: 'Usuario no disponible.' });
    res.json({ usuario: vistaUsuario(usuario), tokenCsrf: req.session.tokenCsrf });
  }));
  app.post('/api/logout', autenticar, proteger, (req, res, next) => {
    req.session.destroy(error => {
      if (error) return next(error);
      res.clearCookie('biblioteca.sid', { path: '/' });
      res.json({ mensaje: 'Sesión cerrada.' });
    });
  });
  app.get('/api/salas', autenticar, manejar(async (req, res) => res.json(await Sala.findAll({ order: [['id', 'ASC']] }))));
  app.get('/api/reservas', autenticar, manejar(async (req, res) => {
    res.json(await Reserva.findAll({ where: { usuarioId: req.session.usuarioId }, include: [{ model: Sala, as: 'sala' }], order: [['fecha', 'ASC'], ['horaInicio', 'ASC']] }));
  }));
  app.post('/api/reservas', autenticar, proteger, manejar(async (req, res) => {
    const { salaId, fecha, horaInicio, horaFin } = req.body;
    const fechaValida = typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      && !Number.isNaN(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha && fecha >= '2000-01-01';
    const horaValida = hora => typeof hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
    if (!Number.isInteger(salaId) || salaId < 1 || !fechaValida || !horaValida(horaInicio) || !horaValida(horaFin) || horaInicio >= horaFin) {
      return res.status(400).json({ mensaje: 'Selecciona una sala, una fecha válida y una hora de fin posterior al inicio.' });
    }
    if (!await Sala.findByPk(salaId)) return res.status(404).json({ mensaje: 'La sala no existe.' });
    // BEGIN IMMEDIATE serializa comprobación e inserción en SQLite.
    const reserva = await bd.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const conflicto = await Reserva.findOne({ where: {
        salaId, fecha, horaInicio: { [Op.lt]: horaFin }, horaFin: { [Op.gt]: horaInicio }
      }, transaction });
      if (conflicto) { const error = new Error('HORARIO_SOLAPADO'); throw error; }
      return Reserva.create({ usuarioId: req.session.usuarioId, salaId, fecha, horaInicio, horaFin }, { transaction });
    });
    res.status(201).json(reserva);
  }));
  app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
  if (existsSync(path.join(directorioFrontend, 'dist/index.html'))) {
    app.use(express.static(path.join(directorioFrontend, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(directorioFrontend, 'dist/index.html')));
  }
  app.use((error, req, res, next) => {
    if (error.message.includes('HORARIO_SOLAPADO') || error.original?.message?.includes('HORARIO_SOLAPADO')) {
      return res.status(409).json({ mensaje: 'La sala ya está reservada en ese horario. Elige otro horario o sala.' });
    }
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ mensaje: 'Ese correo ya está registrado.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo JSON no es válido.' });
    if (error.original?.code === 'SQLITE_BUSY') return res.status(503).json({ mensaje: 'La base de datos está ocupada. Intenta nuevamente.' });
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo completar la operación.' });
  });
  return { app, ...modelos };
}
