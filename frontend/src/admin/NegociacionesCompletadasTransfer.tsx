import { normalizarCodigoEstado } from './negociacionEstados';
import {
  normalizarOfertaDetalle,
  resumenContratoOferta,
  type OfertaNegociacionDetalle,
} from './negociacionOfertas';

type Props = {
  items: OfertaNegociacionDetalle[];
  loading: boolean;
  selectedId: string | null;
  clubActualJugador: string | null;
  onSelect: (item: OfertaNegociacionDetalle & { id: string; clubName: string }) => void;
};

export default function NegociacionesCompletadasTransfer({
  items,
  loading,
  selectedId,
  clubActualJugador,
  onSelect,
}: Props) {
  if (loading) {
    return (
      <div className="tr-neg-completadas">
        <p className="muted tr-neg-completadas-loading">Cargando negociaciones completadas...</p>
      </div>
    );
  }

  return (
    <div className="tr-neg-completadas">
      <h3 className="tr-neg-completadas-titulo">
        <i className="ri-checkbox-circle-line" aria-hidden />
        Negociaciones completadas
      </h3>
      <p className="muted tr-neg-completadas-ayuda">
        Pulsa una negociación para cargar el formulario:{' '}
        <strong>origen</strong> = club actual del jugador
        {clubActualJugador ? ` (${clubActualJugador})` : ''};{' '}
        <strong>destino</strong> = club ofertante.
      </p>

      {items.length === 0 ? (
        <p className="muted tr-neg-completadas-vacio">
          No hay negociaciones completadas para este jugador.
        </p>
      ) : (
        <ul className="tr-neg-completadas-lista">
          {items.map((n) => {
            const activa = selectedId === n.id;
            const detalle = normalizarOfertaDetalle(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`tr-neg-completadas-item${activa ? ' tr-neg-completadas-item--activa' : ''}`}
                  onClick={() => onSelect(n)}
                >
                  <span className="tr-neg-completadas-club">{n.clubName}</span>
                  <span className="tr-neg-completadas-resumen">
                    {resumenContratoOferta(detalle)}
                  </span>
                  <span className="tr-neg-completadas-fecha">{n.offerDate}</span>
                  {activa && (
                    <span className="tr-neg-completadas-usada">
                      <i className="ri-check-line" aria-hidden />
                      En formulario
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function esNegociacionCompletada(status: string): boolean {
  return normalizarCodigoEstado(status) === 'NegociacionCompletada';
}
