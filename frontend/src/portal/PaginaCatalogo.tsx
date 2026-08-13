import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import TarjetaJugadorPortal, { type JugadorPublico } from './TarjetaJugadorPortal';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

const POSICIONES = ['Todos', 'Portero', 'Defensa', 'Defensa central', 'Lateral', 'Mediocampista', 'Extremo', 'Delantero'];

export default function PaginaCatalogo() {
  const [params] = useSearchParams();
  const posInit = params.get('posicion') ?? 'Todos';

  const [jugadores, setJugadores] = useState<JugadorPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState(params.get('busqueda') ?? '');
  const [posicion, setPosicion] = useState(posInit);
  const [pagina, setPagina] = useState(1);
  const [totalPag, setTotalPag] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    setCargando(true);
    setError('');
    const p: Record<string, string | number> = { pagina, tamanio: PAGE_SIZE };
    if (busqueda) p.busqueda = busqueda;
    if (posicion !== 'Todos') p.posicion = posicion;
    api.get('/publico/jugadores', { params: p })
      .then(r => {
        setJugadores(r.data.items ?? []);
        setTotalPag(Math.ceil((r.data.totalItems ?? r.data.total ?? 0) / PAGE_SIZE));
      })
      .catch(() => setError('No se pudieron cargar los jugadores.'))
      .finally(() => setCargando(false));
  }, [busqueda, posicion, pagina]);

  const filtrar = (pos: string) => { setPosicion(pos); setPagina(1); };

  return (
    <div>
      <div className="ppage-header">
        <div className="ppage-header-inner">
          <div className="p-eyebrow">Nuestros Jugadores</div>
          <h1>Talento de <span className="p-acento">Clase Mundial</span></h1>
          <p>Representamos a algunos de los futbolistas más prometedores y exitosos del panorama internacional</p>
        </div>
      </div>

      <div className="fcatalogo-contenido">
        {/* Filtros */}
        <div className="fcatalogo-filtros">
          <div className="fcatalogo-busqueda">
            <i className="ri-search-line" />
            <input
              type="text" placeholder="Buscar jugador, club, país…"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            />
          </div>
          <div className="ffiltros fcatalogo-posiciones">
            {POSICIONES.map(p => (
              <button key={p} className={`ffiltro-btn${posicion === p ? ' ffiltro-btn--activo' : ''}`} onClick={() => filtrar(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {cargando ? (
          <div className="fcentrado" style={{ minHeight: 300 }}><div className="fpinner" /></div>
        ) : error ? (
          <div className="fcentrado ferror">{error}</div>
        ) : jugadores.length === 0 ? (
          <div className="fcentrado" style={{ padding: 60 }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No se encontraron jugadores con ese criterio.</p>
          </div>
        ) : (
          <div className="fjugadores-grid">
            {jugadores.map(j => <TarjetaJugadorPortal key={j.id} j={j} />)}
          </div>
        )}

        {/* Paginación */}
        {totalPag > 1 && (
          <div className="fpaginacion">
            <button className="fpag-btn" onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>
              <i className="ri-arrow-left-s-line" /> Anterior
            </button>
            <span className="fpag-info">Página {pagina} de {totalPag}</span>
            <button className="fpag-btn" onClick={() => setPagina(p => p + 1)} disabled={pagina >= totalPag}>
              Siguiente <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
