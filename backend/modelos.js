import { Sequelize, DataTypes } from 'sequelize';
import session from 'express-session';

export function crearModelos(archivo) {
  const bd = new Sequelize({ dialect: 'sqlite', storage: archivo, logging: false, retry: { max: 5 } });
  const opciones = { timestamps: false };
  const Usuario = bd.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    correo: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    hashContrasena: { type: DataTypes.STRING, allowNull: false, field: 'hash_contrasena' }
  }, { ...opciones, tableName: 'usuarios' });
  const Sala = bd.define('Sala', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    capacidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } }
  }, { ...opciones, tableName: 'salas' });
  const Reserva = bd.define('Reserva', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    horaInicio: { type: DataTypes.STRING(5), allowNull: false, field: 'hora_inicio' },
    horaFin: { type: DataTypes.STRING(5), allowNull: false, field: 'hora_fin' }
  }, { ...opciones, tableName: 'reservas', indexes: [{ fields: ['sala_id', 'fecha'] }] });
  Usuario.hasMany(Reserva, { foreignKey: { name: 'usuarioId', field: 'usuario_id', allowNull: false }, onDelete: 'RESTRICT' });
  Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  Sala.hasMany(Reserva, { foreignKey: { name: 'salaId', field: 'sala_id', allowNull: false }, onDelete: 'RESTRICT' });
  Reserva.belongsTo(Sala, { foreignKey: 'salaId', as: 'sala' });
  const Sesion = bd.define('Sesion', {
    id: { type: DataTypes.STRING, primaryKey: true },
    datos: { type: DataTypes.TEXT, allowNull: false },
    vence: { type: DataTypes.BIGINT, allowNull: false }
  }, { ...opciones, tableName: 'sesiones' });
  return { bd, Usuario, Sala, Reserva, Sesion };
}

// Sesiones persistentes: la cookie contiene solamente un identificador firmado.
export class AlmacenSesiones extends session.Store {
  constructor(modelo, reloj) { super(); this.modelo = modelo; this.reloj = reloj; }
  get(id, callback) {
    this.modelo.findByPk(id).then(async fila => {
      if (!fila) return callback(null, null);
      if (Number(fila.vence) <= this.reloj()) {
        await fila.destroy();
        return callback(null, null);
      }
      callback(null, JSON.parse(fila.datos));
    }).catch(callback);
  }
  set(id, datos, callback = () => {}) {
    this.modelo.upsert({ id, datos: JSON.stringify(datos), vence: datos.ultimaActividad + 30 * 60 * 1000 })
      .then(() => callback()).catch(callback);
  }
  destroy(id, callback = () => {}) {
    this.modelo.destroy({ where: { id } }).then(() => callback()).catch(callback);
  }
}
