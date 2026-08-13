import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { JugadorPublico } from './TarjetaJugadorPortal';
import { urlFotoJugador } from './fotoPublica';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

const POSICION_COLOR: Record<string, string> = {
  Portero: '#e67e22', Defensa: '#08277a', 'Defensa central': '#08277a',
  Lateral: '#2980b9', Mediocampista: '#27ae60', Extremo: '#008f4a', Delantero: '#c0392b',
};

function iniciales(n: string, a: string) { return `${n[0] ?? ''}${a[0] ?? ''}`.toUpperCase(); }

export default function PaginaJugador() {
  const { id } = useParams<{ id: string }>();
  const [jugador, setJugador] = useState<JugadorPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    api.get<JugadorPublico>(`/publico/jugadores/${id}`)
      .then(r => setJugador(r.data))
      .catch(() => setError('Jugador no disponible o no encontrado.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="fcentrado" style={{ minHeight: '60vh' }}><div className="fpinner" /><p style={{ color: '#64748b', marginTop: 16 }}>Cargando perfil…</p></div>;
  if (error || !jugador) return (
    <div className="fcentrado ferror" style={{ minHeight: '60vh', gap: 14 }}>
      <span style={{ fontSize: '3rem' }}>⚠️</span><p>{error}</p>
      <Link to="/jugadores" className="p-btn-secundario">Volver al catálogo</Link>
    </div>
  );

  const color = POSICION_COLOR[jugador.posicion] ?? '#008f4a';
  const fotoSrc = urlFotoJugador(jugador.fotoUrl);
  const nombreCompleto = `${jugador.nombre} ${jugador.apellido}`;

  const statsRapidos = [
    jugador.alturaCm ? { val: String(jugador.alturaCm), unit: 'cm', label: 'Altura' } : null,
    jugador.pesoKg ? { val: String(jugador.pesoKg), unit: 'kg', label: 'Peso' } : null,
    jugador.pieDominante ? { val: jugador.pieDominante, unit: '', label: 'Pie dom.' } : null,
    { val: String(jugador.edad), unit: 'años', label: 'Edad' },
  ].filter((x): x is { val: string; unit: string; label: string } => x !== null);

  return (
    <div className="pperfil-page">
      <section className="pperfil-hero" style={{ '--pos-color': color } as React.CSSProperties}>
        {fotoSrc && <div className="pperfil-hero-photo-bg" style={{ backgroundImage: `url(${fotoSrc})` }} aria-hidden />}
        <div className="pperfil-hero-blur" aria-hidden />
        <div className="pperfil-hero-inner">
          <Link to="/jugadores" className="pperfil-volver"><i className="ri-arrow-left-line" /> Volver al catálogo</Link>

          <div className="pperfil-hero-grid">
            <div className="pperfil-media">
              <div className={`pperfil-foto-frame${fotoSrc ? '' : ' pperfil-foto-frame--sin-foto'}`}>
                {fotoSrc ? (
                  <img
                    src={fotoSrc}
                    alt={nombreCompleto}
                    className="pperfil-foto-img"
                  />
                ) : (
                  <div className="pperfil-foto-placeholder">{iniciales(jugador.nombre, jugador.apellido)}</div>
                )}
              </div>
              <span className="pperfil-pos-chip">{jugador.posicion}</span>
            </div>

            <div className="pperfil-info">
              <p className="pperfil-eyebrow">Perfil del jugador</p>
              <h1 className="pperfil-nombre">
                {nombreCompleto}
                {jugador.numeroCamiseta != null && jugador.numeroCamiseta > 0 && (
                  <span className="pperfil-jersey-hero">#{jugador.numeroCamiseta}</span>
                )}
              </h1>
              <div className="pperfil-tags">
                <span className="pperfil-tag"><i className="ri-global-line" /> {jugador.nacionalidad}</span>
                {jugador.ciudad && <span className="pperfil-tag"><i className="ri-map-pin-line" /> {jugador.ciudad}</span>}
                {jugador.clubActual && <span className="pperfil-tag"><i className="ri-building-2-line" /> {jugador.clubActual}</span>}
                <span className="pperfil-tag"><i className="ri-calendar-line" /> {jugador.edad} años</span>
              </div>
              <div className="pperfil-stats-hero">
                {statsRapidos.map((s) => (
                  <div key={s.label} className="pperfil-stat-pill">
                    <span className="pperfil-stat-pill-val">
                      {s.val}{s.unit && <small>{s.unit}</small>}
                    </span>
                    <span className="pperfil-stat-pill-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pperfil-cuerpo">
        <div className="pperfil-card">
          <h3>Información general</h3>
          <div className="pperfil-grid">
            {[
              ['Nombre completo', nombreCompleto],
              ['Posición', jugador.posicion],
              ['Nacionalidad', jugador.nacionalidad],
              jugador.numeroCamiseta != null && jugador.numeroCamiseta > 0 ? ['Número', `#${jugador.numeroCamiseta}`] : null,
              jugador.ciudad ? ['Ciudad', jugador.ciudad] : null,
              jugador.clubActual ? ['Club actual', jugador.clubActual] : null,
              jugador.alturaCm ? ['Altura', `${jugador.alturaCm} cm`] : null,
              jugador.pesoKg ? ['Peso', `${jugador.pesoKg} kg`] : null,
              jugador.pieDominante ? ['Pie dominante', jugador.pieDominante] : null,
            ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
              <div key={k} className="pperfil-dato">
                <span>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="pperfil-card pperfil-card-cta">
          <h3>¿Interesado en este jugador?</h3>
          <p>Si representas a un club o institución deportiva y quieres conocer más sobre este jugador, contáctanos directamente.</p>
          <Link to="/contacto" className="p-btn-primario" style={{ display: 'inline-flex', marginTop: 14 }}>Contactar a la agencia</Link>
        </div>
      </div>
    </div>
  );
}
