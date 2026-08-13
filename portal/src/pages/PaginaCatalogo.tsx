import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchJugadores, type JugadorPublico } from '../api';
import TarjetaJugador from '../components/TarjetaJugador';

const POSICIONES = ['', 'Portero', 'Defensa', 'Defensa central', 'Lateral', 'Mediocampista', 'Extremo', 'Delantero'];

export default function PaginaCatalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jugadores, setJugadores] = useState<JugadorPublico[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);

  const busqueda = searchParams.get('busqueda') ?? '';
  const posicion = searchParams.get('posicion') ?? '';

  const [txtBusqueda, setTxtBusqueda] = useState(busqueda);
  const [txtPosicion, setTxtPosicion] = useState(posicion);

  useEffect(() => {
    setCargando(true);
    setError('');
    fetchJugadores({ busqueda: busqueda || undefined, posicion: posicion || undefined, pagina })
      .then((r) => { setJugadores(r.items); setTotal(r.totalItems); })
      .catch(() => setError('No se pudo conectar con el servidor. Intente más tarde.'))
      .finally(() => setCargando(false));
  }, [busqueda, posicion, pagina]);

  const aplicar = () => {
    setPagina(1);
    setSearchParams({
      ...(txtBusqueda && { busqueda: txtBusqueda }),
      ...(txtPosicion && { posicion: txtPosicion }),
    });
  };

  const limpiar = () => {
    setTxtBusqueda('');
    setTxtPosicion('');
    setPagina(1);
    setSearchParams({});
  };

  return (
    <div className="catalogo-pagina">
      {/* ── Encabezado ── */}
      <div className="catalogo-header">
        <div className="catalogo-header-inner">
          <div className="seccion-eyebrow">Nuestro talento</div>
          <h1 className="catalogo-titulo">Catálogo de <span className="acento">jugadores</span></h1>
          <p className="catalogo-subtitulo">
            Explora todos los jugadores representados por Fortis Glesnor Group, disponibles para transferencias y negociaciones.
          </p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="catalogo-filtros-wrap">
        <div className="catalogo-filtros">
          <input
            type="text"
            value={txtBusqueda}
            onChange={(e) => setTxtBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicar()}
            placeholder="Buscar por nombre, club o nacionalidad…"
            className="catalogo-input"
          />
          <select value={txtPosicion} onChange={(e) => setTxtPosicion(e.target.value)} className="catalogo-select">
            <option value="">Todas las posiciones</option>
            {POSICIONES.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button className="btn-primario" onClick={aplicar}>Buscar</button>
          {(busqueda || posicion) && (
            <button className="btn-secundario" onClick={limpiar}>Limpiar</button>
          )}
        </div>
      </div>

      {/* ── Resultados ── */}
      <div className="catalogo-contenido">
        {cargando && (
          <div className="catalogo-estado">
            <div className="spinner-grande" />
            <p>Cargando jugadores…</p>
          </div>
        )}
        {!cargando && error && (
          <div className="catalogo-estado catalogo-error">
            <span>⚠️</span><p>{error}</p>
          </div>
        )}
        {!cargando && !error && jugadores.length === 0 && (
          <div className="catalogo-estado">
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <p>No se encontraron jugadores con los filtros seleccionados.</p>
            <button className="btn-secundario" onClick={limpiar}>Ver todos</button>
          </div>
        )}
        {!cargando && !error && jugadores.length > 0 && (
          <>
            <p className="catalogo-total">{total} jugador{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}</p>
            <div className="catalogo-grid">
              {jugadores.map((j) => <TarjetaJugador key={j.id} j={j} />)}
            </div>
            <div className="catalogo-paginacion">
              <button disabled={pagina <= 1} className="btn-secundario" onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
              <span>Página {pagina}</span>
              <button disabled={jugadores.length < 12} className="btn-secundario" onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
