import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';

function Aplicacion() {
  const [usuario, cambiarUsuario] = useState(null);
  const [tokenCsrf, cambiarToken] = useState('');
  const [cargando, cambiarCarga] = useState(true);
  const [ocupado, cambiarOcupado] = useState(false);
  const [registro, cambiarRegistro] = useState(false);
  const [mensaje, cambiarMensaje] = useState(null);
  const [salas, cambiarSalas] = useState([]);
  const [reservas, cambiarReservas] = useState([]);
  const [salaElegida, elegirSala] = useState('');
  const [pestana, cambiarPestana] = useState('reservar');

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
      const datos = await consultar(registro ? '/registro' : '/login', { method: 'POST', body: JSON.stringify(formulario) });
      cambiarToken(datos.tokenCsrf);
      cambiarUsuario(datos.usuario);
      cambiarPestana('reservar');
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
      cambiarMensaje({ tipo: 'exito', texto: 'Tu reserva está confirmada. Puedes verla en Mis reservas.' });
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
  const aviso = mensaje && <div className={'aviso ' + mensaje.tipo} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</div>;
  const fechaLarga = fecha => new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(fecha + 'T12:00:00'));
  if (cargando) return <main className="pantalla-carga" role="status">Preparando tu biblioteca…</main>;
  return <>
    <header className="cabecera">
      <a className="marca" href="/" aria-label="Inicio de Biblioteca"><span className="simbolo" aria-hidden="true">B<span>.</span></span><span>Biblioteca<small>ESPACIOS PARA APRENDER</small></span></a>
      {usuario ? <div className="cuenta"><span>{usuario.nombre}</span><button className="boton-texto" onClick={salir} disabled={ocupado}>Cerrar sesión ↗</button></div> : <span className="etiqueta">RESERVA DE SALAS</span>}
    </header>
    {!usuario ? <main className="acceso">
      <section className="presentacion">
        <div className="sobretitulo"><span className="punto"></span> TU PRÓXIMA IDEA EMPIEZA AQUÍ</div>
        <h1>Un espacio<br/>para <em>concentrarte.</em></h1>
        <p>Encuentra el lugar para estudiar, investigar y compartir ideas. Reserva una sala de la biblioteca en unos pasos.</p>
        <div className="ilustracion" aria-hidden="true"><div className="ventana"><i></i><i></i><i></i><i></i></div><div className="libros"><b></b><b></b><b></b><b></b></div><div className="mesa"></div><div className="silla"></div><div className="planta">✦</div><span className="nota-espacio">Menos distracciones.<br/>Más posibilidades.</span></div>
        <div className="pie-presentacion"><span>01 — ELIGE TU SALA</span><span>02 — RESERVA TU HORARIO</span></div>
      </section>
      <section className="tarjeta-acceso">
        <span className="numero-seccion">BIENVENIDO A TU BIBLIOTECA</span>
        <h2>{registro ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
        <p>{registro ? 'Regístrate para reservar tu espacio de estudio.' : 'Tu próximo espacio de estudio te espera.'}</p>
        {aviso}
        <form onSubmit={autenticar}>
          {registro && <label>Nombre completo<input name="nombre" autoComplete="name" required maxLength={100} placeholder="Tu nombre" /></label>}
          <label>Correo electrónico<input name="correo" type="email" autoComplete="email" required maxLength={254} placeholder="nombre@ejemplo.com" /></label>
          <label>Contraseña<input name="contrasena" type="password" autoComplete={registro ? 'new-password' : 'current-password'} required minLength={registro ? 8 : undefined} maxLength={72} placeholder={registro ? 'Al menos 8 caracteres' : 'Tu contraseña'} /></label>
          <button className="boton principal" disabled={ocupado}>{ocupado ? 'Un momento…' : registro ? 'Crear cuenta' : 'Entrar a la biblioteca'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="alternar">{registro ? '¿Ya tienes cuenta?' : '¿Es tu primera visita?'} <button className="boton-texto" disabled={ocupado} onClick={() => { cambiarRegistro(!registro); cambiarMensaje(null); }}>{registro ? 'Inicia sesión' : 'Crear una cuenta'}</button></p>
        <div className="nota-sesion">Tu sesión se cerrará tras 30 minutos de inactividad.</div>
      </section>
    </main> : <main className="panel">
      <section className="encabezado-panel"><div><div className="sobretitulo">TU BIBLIOTECA, A TU RITMO</div><h1>Haz espacio para <em>tus ideas.</em></h1><p>Elige una sala y encuentra tu momento para aprender.</p></div><div className="resumen"><strong>{salas.length}</strong><span>salas de estudio</span></div></section>
      <nav className="pestanas" aria-label="Reservas"><button className={pestana === 'reservar' ? 'activa' : ''} onClick={() => cambiarPestana('reservar')}>Reservar una sala</button><button className={pestana === 'mis-reservas' ? 'activa' : ''} onClick={() => cambiarPestana('mis-reservas')}>Mis reservas <span>{reservas.length}</span></button></nav>
      {aviso}
      {pestana === 'reservar' ? <div className="contenido-panel">
        <section><div className="titulo-seccion"><h2>Encuentra tu espacio</h2><span>01 / ELIGE UNA SALA</span></div><div className="lista-salas">
          {salas.map((sala, indice) => <button key={sala.id} className={'tarjeta-sala ' + (String(sala.id) === salaElegida ? 'elegida' : '')} onClick={() => elegirSala(String(sala.id))} aria-pressed={String(sala.id) === salaElegida}>
            <span className={'dibujo-sala dibujo-' + indice} aria-hidden="true"><span className="mesita"></span><span className="asiento uno"></span><span className="asiento dos"></span><span className="asiento tres"></span><span className="asiento cuatro"></span><span className="indice">0{indice + 1}</span></span>
            <span className="datos-sala"><strong>{sala.nombre}</strong><span>Hasta {sala.capacidad} personas</span><span className="seleccion">{String(sala.id) === salaElegida ? 'Sala seleccionada ✓' : 'Seleccionar sala ↗'}</span></span>
          </button>)}
        </div><div className="consejo"><span aria-hidden="true">✦</span><p><strong>Un buen espacio hace la diferencia.</strong><br/>Respeta tu horario y deja la sala lista para la siguiente persona.</p></div></section>
        <section className="tarjeta-reserva"><div className="numero-seccion">02 / ELIGE TU HORARIO</div><h2>Tu próxima reserva</h2><p>Completa los datos para confirmar tu espacio.</p><form onSubmit={reservar}>
          <label>Sala<select name="salaId" required value={salaElegida} onChange={e => elegirSala(e.target.value)}><option value="">Selecciona una sala</option>{salas.map(sala => <option key={sala.id} value={sala.id}>{sala.nombre} · {sala.capacidad} personas</option>)}</select></label>
          <label>Fecha<input type="date" name="fecha" required /></label>
          <div className="horas"><label>Hora de inicio<input type="time" name="horaInicio" required /></label><label>Hora de fin<input type="time" name="horaFin" required /></label></div>
          <div className="nota-horario">Las reservas son para una misma fecha. Si el horario está ocupado, te ayudaremos a elegir otro.</div>
          <button className="boton principal" disabled={ocupado}>{ocupado ? 'Confirmando…' : 'Confirmar reserva'} <span aria-hidden="true">→</span></button>
        </form></section>
      </div> : <section className="mis-reservas"><div className="titulo-seccion"><h2>Tus espacios reservados</h2><button className="boton-texto" disabled={ocupado} onClick={() => cargarPanel().catch(error => cambiarMensaje({ tipo: 'error', texto: error.message }))}>Actualizar ↻</button></div>
        {reservas.length === 0 ? <div className="vacio"><span aria-hidden="true">▤</span><h3>Aquí empiezan tus planes</h3><p>Todavía no tienes reservas. Encuentra una sala para tu próxima sesión de estudio.</p><button className="boton principal" onClick={() => cambiarPestana('reservar')}>Reservar una sala →</button></div> : <div className="tabla-contenedor"><table><thead><tr><th>Sala</th><th>Fecha</th><th>Horario</th><th>Estado</th></tr></thead><tbody>{reservas.map(reserva => <tr key={reserva.id}><td><strong>{reserva.sala.nombre}</strong><small>Reserva #{String(reserva.id).padStart(3, '0')}</small></td><td>{fechaLarga(reserva.fecha)}</td><td>{reserva.horaInicio} — {reserva.horaFin}</td><td><span className="estado">Confirmada</span></td></tr>)}</tbody></table></div>}
      </section>}
    </main>}
    <footer><span>Biblioteca · Reserva de salas</span><span>Desarrollo web · Carnet 0907-23-13067</span></footer>
  </>;
}
createRoot(document.getElementById('raiz')).render(<Aplicacion />);
