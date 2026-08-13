import CondicionesOfertaDetalle from './CondicionesOfertaDetalle';
import {
  normalizarOfertaDetalle,
  resumenContratoOferta,
  type OfertaNegociacionDetalle,
} from './negociacionOfertas';

export type VersionOfertaRow = {
  id: string;
  negotiationId: string;
  versionNumber: number;
  proposedBy: string;
  proposedByLabel: string;
  notes?: string | null;
  clubName: string;
  monthlyAmount: number;
  installmentsPerYear: number;
  contractYears: number;
  currency: string;
  offerDate: string;
  hasHousingBonus: boolean;
  housingBonusNotes?: string | null;
  hasObjectiveBonus: boolean;
  objectiveBonusNotes?: string | null;
  hasGoalBonus: boolean;
  goalBonusNotes?: string | null;
  hasSigningBonus: boolean;
  signingBonusNotes?: string | null;
  conditionsSummary: string;
  registeredAtUtc: string;
  registeredBy: string;
};

const versionComoOferta = (v: VersionOfertaRow): OfertaNegociacionDetalle => ({
  id: v.id,
  playerId: '',
  clubName: v.clubName,
  offeredAmount: v.monthlyAmount,
  monthlyAmount: v.monthlyAmount,
  installmentsPerYear: v.installmentsPerYear,
  contractYears: v.contractYears,
  currency: v.currency,
  status: '',
  responsibleName: '',
  offerDate: v.offerDate,
  hasHousingBonus: v.hasHousingBonus,
  housingBonusNotes: v.housingBonusNotes,
  hasObjectiveBonus: v.hasObjectiveBonus,
  objectiveBonusNotes: v.objectiveBonusNotes,
  hasGoalBonus: v.hasGoalBonus,
  goalBonusNotes: v.goalBonusNotes,
  hasSigningBonus: v.hasSigningBonus,
  signingBonusNotes: v.signingBonusNotes,
});

const iconoAutor = (proposedBy: string) => {
  const k = proposedBy.toLowerCase();
  if (k === 'club') return 'ri-building-2-line';
  if (k === 'agencia') return 'ri-briefcase-4-line';
  return 'ri-file-list-3-line';
};

type Props = {
  versions: VersionOfertaRow[];
  loading: boolean;
  currentVersionNumber?: number;
  onDeleteNegotiation?: () => void;
  deleting?: boolean;
};

export default function HistorialVersionesOferta({
  versions,
  loading,
  currentVersionNumber,
  onDeleteNegotiation,
  deleting = false,
}: Props) {
  if (loading) {
    return <p className="muted neg-versiones-loading">Cargando versiones...</p>;
  }

  if (versions.length === 0) {
    return null;
  }

  const ordenadas = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <section className="neg-versiones">
      <h4 className="neg-versiones-titulo">
        <i className="ri-history-line" aria-hidden />
        Versiones ({versions.length})
      </h4>
      <ul className="neg-versiones-lista">
        {ordenadas.map((v) => {
          const esActual = currentVersionNumber != null && v.versionNumber === currentVersionNumber;
          const oferta = normalizarOfertaDetalle(versionComoOferta(v));
          return (
            <li
              key={v.id}
              className={`neg-version-item${esActual ? ' neg-version-item--actual' : ''}`}
            >
              <div className="neg-version-fila-principal">
                <span className="neg-version-badge">v{v.versionNumber}</span>
                <span className="neg-version-autor">
                  <i className={iconoAutor(v.proposedBy)} aria-hidden />
                  {v.proposedByLabel}
                </span>
                {esActual && <span className="neg-version-actual">Vigente</span>}
                {esActual && onDeleteNegotiation && (
                  <button
                    type="button"
                    className="neg-version-eliminar btn-danger"
                    onClick={() => onDeleteNegotiation()}
                    disabled={deleting}
                    title="Eliminar negociación y oferta (proceso caído)"
                  >
                    <i className="ri-delete-bin-line" aria-hidden />
                    {deleting ? 'Eliminando...' : 'Eliminar negociación'}
                  </button>
                )}
                <span className="neg-version-meta">{v.offerDate}</span>
              </div>
              <p className="neg-version-resumen">{resumenContratoOferta(oferta)}</p>
              {v.notes && (
                <p className="neg-version-notas">
                  <span>Notas:</span> {v.notes}
                </p>
              )}
              <details className="neg-version-detalles">
                <summary>Detalle</summary>
                <CondicionesOfertaDetalle oferta={oferta} compacto ocultarTitulo />
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
