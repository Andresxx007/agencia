import { Link } from 'react-router-dom';
import type { JugadorPublico } from '../api';

const POSICION_ABREV: Record<string, string> = {
  Portero: 'POR', Defensa: 'DEF', 'Defensa central': 'DFC', Lateral: 'LAT',
  Mediocampista: 'MED', Extremo: 'EXT', Delantero: 'DEL',
};

const POSICION_COLOR: Record<string, string> = {
  Portero: '#e67e22', Defensa: '#08277a', 'Defensa central': '#08277a',
  Lateral: '#2980b9', Mediocampista: '#27ae60', Extremo: '#008f4a',
  Delantero: '#c0392b',
};

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

export default function TarjetaJugador({ j }: { j: JugadorPublico }) {
  const abrev = POSICION_ABREV[j.posicion] ?? j.posicion.slice(0, 3).toUpperCase();
  const color = POSICION_COLOR[j.posicion] ?? '#008f4a';

  return (
    <Link to={`/jugadores/${j.id}`} className="tarjeta-jugador" style={{ '--pos-color': color } as React.CSSProperties}>
      <div className="tarjeta-jugador-avatar">
        <span className="tarjeta-jugador-iniciales">{iniciales(j.nombre, j.apellido)}</span>
        <span className="tarjeta-jugador-posicion-badge">{abrev}</span>
      </div>
      <div className="tarjeta-jugador-info">
        <div className="tarjeta-jugador-nombre">{j.nombre} {j.apellido}</div>
        <div className="tarjeta-jugador-posicion">{j.posicion}</div>
        <div className="tarjeta-jugador-meta">
          <span>🌎 {j.nacionalidad}</span>
          {j.edad > 0 && <span>⏳ {j.edad} años</span>}
          {j.clubActual && <span>🏟 {j.clubActual}</span>}
        </div>
      </div>
      <div className="tarjeta-jugador-stats">
        {j.alturaCm && <div className="tarjeta-jugador-stat"><strong>{j.alturaCm}</strong><span>cm</span></div>}
        {j.pesoKg && <div className="tarjeta-jugador-stat"><strong>{j.pesoKg}</strong><span>kg</span></div>}
        {j.pieDominante && <div className="tarjeta-jugador-stat"><strong>{j.pieDominante[0]}</strong><span>pie</span></div>}
      </div>
      <div className="tarjeta-jugador-cta">Ver perfil →</div>
    </Link>
  );
}
