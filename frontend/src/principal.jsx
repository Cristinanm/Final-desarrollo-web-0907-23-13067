import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';

function Aplicacion() {
  const [usuario, cambiarUsuario] = useState(null);
  const [tokenCsrf, cambiarToken] = useState('');
  const [cargando, cambiarCarga] = useState(true);
  const [ocupado, cambiarOcupado] = useState(false);
  const [mensaje, cambiarMensaje] = useState(null);
  const [salas, cambiarSalas] = useState([]);
  const [reservas, cambiarReservas] = useState([]);
  const [salaElegida, elegirSala] = useState('');

  async function consultar(ruta, opciones = {}) {
    const respuesta = await fetch('/api' + ruta, {
      ...opciones, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Token-CSRF': tokenCsrf, ...opciones.headers }
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        cambiarUsuario(null);
        cambiarToken('');
        cambiarSalas([]);
        cambiarReservas([]);
        window.history.replaceState(null, '', '/login');
      }
      throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
    }
    return datos;
  }
  async function cargarPanel() {
    const [listaSalas, listaReservas] = await Promise.all([consultar('/salas'), consultar('/reservas')]);
    cambiarSalas(listaSalas);
    cambiarReservas(listaReservas);
  }
  useEffect(() => {
    consultar('/sesion').then(datos => {
      cambiarUsuario(datos.usuario);
      cambiarToken(datos.tokenCsrf);
      window.history.replaceState(null, '', '/');
    }).catch(error => {
      if (error.message !== 'Debes iniciar sesión.') cambiarMensaje({ tipo: 'error', texto: error.message });
    }).finally(() => cambiarCarga(false));
  }, []);
  useEffect(() => {
    if (usuario) cargarPanel().catch(error => cambiarMensaje({ tipo: 'error', texto: error.message }));
  }, [usuario]);
  async function autenticar(evento) {
    evento.preventDefault();
    cambiarOcupado(true);
    cambiarMensaje(null);
    const formulario = Object.fromEntries(new FormData(evento.currentTarget));
    try {
      const datos = await consultar('/login', { method: 'POST', body: JSON.stringify(formulario) });
      cambiarToken(datos.tokenCsrf);
      cambiarUsuario(datos.usuario);
      window.history.replaceState(null, '', '/');
    } catch (error) { cambiarMensaje({ tipo: 'error', texto: error.message }); }
    finally { cambiarOcupado(false); }
  }
  async function reservar(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));
    datos.salaId = Number(datos.salaId);
    cambiarOcupado(true);
    cambiarMensaje(null);
    try {
      await consultar('/reservas', { method: 'POST', body: JSON.stringify(datos) });
      formulario.reset();
      elegirSala('');
      cambiarMensaje({ tipo: 'exito', texto: 'Reserva guardada.' });
      await cargarPanel();
    } catch (error) { cambiarMensaje({ tipo: 'error', texto: error.message }); }
    finally { cambiarOcupado(false); }
  }
  async function salir() {
    cambiarOcupado(true);
    try {
      await consultar('/logout', { method: 'POST' });
      cambiarUsuario(null); cambiarToken(''); cambiarReservas([]); cambiarSalas([]);
      cambiarMensaje(null);
      window.history.replaceState(null, '', '/login');
    } catch (error) { cambiarMensaje({ tipo: 'error', texto: error.message }); }
    finally { cambiarOcupado(false); }
  }
  const aviso = mensaje && <p className={'aviso ' + mensaje.tipo} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</p>;
  if (cargando) return <main><p role="status">Cargando...</p></main>;

  return <>
    <header>
      <h1>Reserva de salas de biblioteca</h1>
      {usuario && <div className="cuenta">
        <span>Usuario: {usuario.nombre}</span>
        <button type="button" onClick={salir} disabled={ocupado}>Cerrar sesión</button>
      </div>}
    </header>
    <main>
      {!usuario ? <section className="login">
        <h2>Iniciar sesión</h2>
        {aviso}
        <form onSubmit={autenticar}>
          <label>Correo electrónico
            <input name="correo" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label>Contraseña
            <input name="contrasena" type="password" autoComplete="current-password" required maxLength={72} />
          </label>
          <button disabled={ocupado}>{ocupado ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
        <p className="nota">La sesión expira después de 30 minutos de inactividad.</p>
      </section> : <>
        {aviso}
        <section>
          <h2>Salas</h2>
          <div className="tabla">
            <table>
              <thead><tr><th>Nombre</th><th>Capacidad</th></tr></thead>
              <tbody>{salas.map(sala => <tr key={sala.id}>
                <td>{sala.nombre}</td><td>{sala.capacidad} personas</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
        <section>
          <h2>Nueva reserva</h2>
          <form className="formulario-reserva" onSubmit={reservar}>
            <label>Sala
              <select name="salaId" required value={salaElegida} onChange={evento => elegirSala(evento.target.value)}>
                <option value="">Selecciona una sala</option>
                {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.nombre}</option>)}
              </select>
            </label>
            <label>Fecha<input type="date" name="fecha" required /></label>
            <label>Hora de inicio<input type="time" name="horaInicio" required /></label>
            <label>Hora de fin<input type="time" name="horaFin" required /></label>
            <button disabled={ocupado}>{ocupado ? 'Guardando...' : 'Guardar reserva'}</button>
          </form>
        </section>
        <section>
          <div className="titulo-reservas">
            <h2>Mis reservas</h2>
            <button type="button" disabled={ocupado} onClick={() => cargarPanel().catch(error => cambiarMensaje({ tipo: 'error', texto: error.message }))}>Actualizar</button>
          </div>
          {reservas.length === 0 ? <p>No tienes reservas guardadas.</p> :
            <div className="tabla"><table>
              <thead><tr><th>Sala</th><th>Fecha</th><th>Inicio</th><th>Fin</th></tr></thead>
              <tbody>{reservas.map(reserva => <tr key={reserva.id}>
                <td>{reserva.sala.nombre}</td><td>{reserva.fecha}</td><td>{reserva.horaInicio}</td><td>{reserva.horaFin}</td>
              </tr>)}</tbody>
            </table></div>}
        </section>
      </>}
    </main>
    <footer>Carnet: 0907-23-13067</footer>
  </>;
}
createRoot(document.getElementById('raiz')).render(<Aplicacion />);
