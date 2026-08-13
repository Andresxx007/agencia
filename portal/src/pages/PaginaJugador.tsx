import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJugador, type JugadorPublico } from '../api';

const POSICION_COLOR: Record<string, string> = {
  Portero: '#e67e22', Defensa: '#08277a', 'Defensa central': '#08277a',
  Lateral: '#2980b9', Mediocampista: '#27ae60', Extremo: '#008f4a', Delantero: '#c0392b',
};

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

export default function PaginaJugador() {
  const { id } = useParams<{ id: string }>();
  const [jugador, setJugador] = useState<JugadorPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    fetchJugador(id)
      .then(setJugador)
      .catch(() => setError('Jugador no disponible o no encontrado.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return (
    <div className="perfil-estado"><div className="spinner-grande" /><p>Cargando perfil…</p></div>
  );
  if (error || !jugador) return (
    <div className="perfil-estado perfil-error">
      <span>⚠️</span><p>{error || 'Jugador no disponible.'}</p>
      <Link to="/jugadores" className="btn-secundario">Volver al catálogo</Link>
    </div>
  );

  const color = POSICION_COLOR[jugador.posicion] ?? '#008f4a';

  return (
    <div className="perfil-pagina">
      {/* ── Hero del jugador ── */}
      <div className="perfil-hero" style={{ '--pos-color': color } as React.CSSProperties}>
        <div className="perfil-hero-bg" />
        <div className="perfil-hero-inner">
          <Link to="/jugadores" className="perfil-volver">← Volver al catálogo</Link>
          <div className="perfil-avatar-wrap">
            <div className="perfil-avatar">{iniciales(jugador.nombre, jugador.apellido)}</div>
            <div className="perfil-posicion-badge">{jugador.posicion}</div>
          </div>
          <div className="perfil-hero-datos">
            <h1 className="perfil-nombre">{jugador.nombre} {jugador.apellido}</h1>
            <div className="perfil-tags">
              <span className="perfil-tag">🌎 {jugador.nacionalidad}</span>
              {jugador.clubActual && <span className="perfil-tag">🏟 {jugador.clubActual}</span>}
              <span className="perfil-tag">⏳ {jugador.edad} años</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="perfil-stats-bar">
        <div className="perfil-stats-inner">
          {jugador.alturaCm && (
            <div className="perfil-stat">
              <span className="perfil-stat-val">{jugador.alturaCm}<small>cm</small></span>
              <span className="perfil-stat-etiq">Altura</span>
            </div>
          )}
          {jugador.pesoKg && (
            <div className="perfil-stat">
              <span className="perfil-stat-val">{jugador.pesoKg}<small>kg</small></span>
              <span className="perfil-stat-etiq">Peso</span>
            </div>
          )}
          {jugador.pieDominante && (
            <div className="perfil-stat">
              <span className="perfil-stat-val">{jugador.pieDominante}</span>
              <span className="perfil-stat-etiq">Pie dominante</span>
            </div>
          )}
          <div className="perfil-stat">
            <span className="perfil-stat-val">{jugador.edad}<small>a</small></span>
            <span className="perfil-stat-etiq">Edad</span>
          </div>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="perfil-cuerpo">
        <div className="perfil-card">
          <h3>Información general</h3>
          <div className="perfil-info-grid">
            <div className="perfil-info-item"><span>Nombre completo</span><strong>{jugador.nombre} {jugador.apellido}</strong></div>
            <div className="perfil-info-item"><span>Posición</span><strong>{jugador.posicion}</strong></div>
            <div className="perfil-info-item"><span>Nacionalidad</span><strong>{jugador.nacionalidad}</strong></div>
            <div className="perfil-info-item"><span>Edad</span><strong>{jugador.edad} años</strong></div>
            {jugador.clubActual && <div className="perfil-info-item"><span>Club actual</span><strong>{jugador.clubActual}</strong></div>}
            {jugador.alturaCm && <div className="perfil-info-item"><span>Altura</span><strong>{jugador.alturaCm} cm</strong></div>}
            {jugador.pesoKg && <div className="perfil-info-item"><span>Peso</span><strong>{jugador.pesoKg} kg</strong></div>}
            {jugador.pieDominante && <div className="perfil-info-item"><span>Pie dominante</span><strong>{jugador.pieDominante}</strong></div>}
          </div>
        </div>

        <div className="perfil-card perfil-card-contacto">
          <h3>¿Interesado en este jugador?</h3>
          <p>Si representas a un club o institución deportiva y quieres conocer más sobre este jugador, contáctanos directamente.</p>
          <Link to="/contacto" className="btn-primario" style={{ display: 'inline-block', marginTop: '12px' }}>
            Contactar a la agencia
          </Link>
        </div>
      </div>
    </div>
  );
}
