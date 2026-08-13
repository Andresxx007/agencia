import { Link } from 'react-router-dom';
import { urlFotoJugador } from './fotoPublica';

export interface JugadorPublico {
  id: string;
  nombre: string;
  apellido: string;
  nacionalidad: string;
  posicion: string;
  clubActual?: string;
  alturaCm?: number;
  pesoKg?: number;
  pieDominante?: string;
  edad: number;
  fotoUrl?: string | null;
  numeroCamiseta?: number | null;
  ciudad?: string | null;
}

const POSICION_COLOR: Record<string, string> = {
  Portero: '#e67e22',
  Defensa: '#1a56db',
  'Defensa central': '#1a56db',
  Lateral: '#2980b9',
  Mediocampista: '#059669',
  Extremo: '#008f4a',
  Delantero: '#dc2626',
};

const POSICION_ABREV: Record<string, string> = {
  Portero: 'POR', Defensa: 'DEF', 'Defensa central': 'DFC',
  Lateral: 'LAT', Mediocampista: 'MED', Extremo: 'EXT', Delantero: 'DEL',
};

/** Genera un rating visual a partir de datos físicos y edad (no es dato real). */
function calcRating(j: JugadorPublico): number {
  let base = 75;
  if (j.alturaCm && j.alturaCm > 185) base += 3;
  if (j.pesoKg && j.pesoKg > 70 && j.pesoKg < 85) base += 2;
  if (j.edad >= 22 && j.edad <= 28) base += 5;
  if (j.edad < 22) base += 2;
  return Math.min(99, base);
}

function iniciales(n: string, a: string) {
  return `${n[0] ?? ''}${a[0] ?? ''}`.toUpperCase();
}

export default function TarjetaJugadorPortal({ j }: { j: JugadorPublico }) {
  const color = POSICION_COLOR[j.posicion] ?? '#008f4a';
  const abrev = POSICION_ABREV[j.posicion] ?? j.posicion.slice(0, 3).toUpperCase();
  const rating = calcRating(j);
  const fotoSrc = urlFotoJugador(j.fotoUrl);

  return (
    <Link
      to={`/jugadores/${j.id}`}
      className="fcard"
      style={{ '--pcolor': color } as React.CSSProperties}
    >
      {/* Encabezado degradado con rating + posición */}
      <div className={`fcard-header${fotoSrc ? ' fcard-header--con-foto' : ''}`}>
        <div className="fcard-rating">{rating}</div>
        <div className="fcard-pos-badge">{abrev}</div>
        {j.numeroCamiseta != null && j.numeroCamiseta > 0 && (
          <div className="fcard-jersey-num">{j.numeroCamiseta}</div>
        )}
        {fotoSrc ? (
          <div className="fcard-photo-wrap">
            <img src={fotoSrc} alt="" className="fcard-photo-img" />
          </div>
        ) : (
          <div className="fcard-avatar">
            {iniciales(j.nombre, j.apellido)}
          </div>
        )}
      </div>

      {/* Datos del jugador */}
      <div className="fcard-body">
        <div className="fcard-nombre">{j.nombre} {j.apellido}</div>
        <div className="fcard-club">{j.clubActual ?? 'Sin club'}</div>
        <div className="fcard-meta">
          <span>🌎 {j.nacionalidad}</span>
          <span>⏳ {j.edad} años</span>
        </div>

        {/* Stats físicas */}
        <div className="fcard-stats">
          {j.alturaCm && (
            <div className="fcard-stat">
              <span className="fcard-stat-val">{j.alturaCm}</span>
              <span className="fcard-stat-label">altura cm</span>
            </div>
          )}
          {j.pesoKg && (
            <div className="fcard-stat">
              <span className="fcard-stat-val">{j.pesoKg}</span>
              <span className="fcard-stat-label">peso kg</span>
            </div>
          )}
          {j.pieDominante && (
            <div className="fcard-stat">
              <span className="fcard-stat-val">{j.pieDominante[0]}</span>
              <span className="fcard-stat-label">pie</span>
            </div>
          )}
        </div>
      </div>

      <div className="fcard-footer">Ver perfil completo →</div>
    </Link>
  );
}
