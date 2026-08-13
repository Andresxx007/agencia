import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ESTADOS_NEGOCIACION,
  etiquetaEstadoNegociacion,
  metaEstadoNegociacion,
  normalizarCodigoEstado,
  type EstadoNegociacionCodigo,
} from './negociacionEstados';
import CondicionesOfertaDetalle from './CondicionesOfertaDetalle';
import FormularioOfertaNegociacion from './FormularioOfertaNegociacion';
import HistorialVersionesOferta, { type VersionOfertaRow } from './HistorialVersionesOferta';
import {
  normalizarOfertaDetalle,
  ofertaDesdeNegociacion,
  resumenContratoOferta,
  type OfertaNegociacionForm,
} from './negociacionOfertas';
import './negociacion-estado.css';

export type NegociacionEstadoRow = {
  id: string;
  playerId: string;
  clubName: string;
  offeredAmount: number;
  monthlyAmount: number;
  installmentsPerYear: number;
  contractYears: number;
  currency: string;
  status: string;
  responsibleName: string;
  offerDate: string;
  hasHousingBonus: boolean;
  housingBonusNotes?: string | null;
  hasObjectiveBonus: boolean;
  objectiveBonusNotes?: string | null;
  hasGoalBonus: boolean;
  goalBonusNotes?: string | null;
  hasSigningBonus: boolean;
  signingBonusNotes?: string | null;
  playerFullName?: string | null;
  conditions?: string | null;
  currentVersionNumber?: number;
};

type Props = {
  items: NegociacionEstadoRow[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChangeStatus: (id: string, status: EstadoNegociacionCodigo) => Promise<void>;
  statusUpdating: boolean;
  versions: VersionOfertaRow[];
  versionsLoading: boolean;
  versionRegistering: boolean;
  onRegisterVersion: (
    id: string,
    proposedBy: 'Club' | 'Agencia',
    notes: string,
    form: OfertaNegociacionForm,
  ) => Promise<void>;
  onDeleteNegotiation: (id: string) => Promise<void>;
  deletingNegotiation: boolean;
};

export default function EstadoNegociacion({
  items,
  loading,
  selectedId,
  onSelect,
  onChangeStatus,
  statusUpdating,
  versions,
  versionsLoading,
  versionRegistering,
  onRegisterVersion,
  onDeleteNegotiation,
  deletingNegotiation,
}: Props) {
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [contraofertaForm, setContraofertaForm] = useState<OfertaNegociacionForm | null>(null);
  const [proposedBy, setProposedBy] = useState<'Club' | 'Agencia'>('Club');
  const [notasVersion, setNotasVersion] = useState('');

  const filtradas = useMemo(() => {
    if (!filtroEstado) return items;
    return items.filter((n) => normalizarCodigoEstado(n.status) === filtroEstado);
  }, [items, filtroEstado]);

  const seleccionada = useMemo(
    () => items.find((n) => n.id === selectedId) ?? null,
    [items, selectedId],
  );

  const estadoSeleccionado = seleccionada
    ? normalizarCodigoEstado(seleccionada.status)
    : null;

  const enContraoferta = estadoSeleccionado === 'NegociandoContraOferta';
  const negociacionCompletada = estadoSeleccionado === 'NegociacionCompletada';

  useEffect(() => {
    if (!seleccionada) {
      setContraofertaForm(null);
      return;
    }
    setContraofertaForm(ofertaDesdeNegociacion(seleccionada));
    setNotasVersion('');
    setProposedBy('Club');
  }, [seleccionada?.id]);

  const conteos = useMemo(() => {
    const map: Record<string, number> = {};
    ESTADOS_NEGOCIACION.forEach((e) => { map[e.codigo] = 0; });
    items.forEach((n) => {
      const key = normalizarCodigoEstado(n.status);
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [items]);

  const pasoActual = seleccionada ? metaEstadoNegociacion(seleccionada.status).orden : 0;

  const enviarContraoferta = async (e: FormEvent) => {
    e.preventDefault();
    if (!seleccionada || !contraofertaForm) return;
    await onRegisterVersion(seleccionada.id, proposedBy, notasVersion.trim(), contraofertaForm);
    setNotasVersion('');
  };

  return (
    <div className="neg-estado-wrap">
      <div className="neg-estado-filtros">
        <button
          type="button"
          className={`neg-estado-filtro${filtroEstado === '' ? ' neg-estado-filtro--activo' : ''}`}
          onClick={() => setFiltroEstado('')}
        >
          Todas ({items.length})
        </button>
        {ESTADOS_NEGOCIACION.map((e) => (
          <button
            key={e.codigo}
            type="button"
            className={`neg-estado-filtro${filtroEstado === e.codigo ? ' neg-estado-filtro--activo' : ''}`}
            onClick={() => setFiltroEstado(e.codigo)}
          >
            {e.etiqueta} ({conteos[e.codigo] ?? 0})
          </button>
        ))}
      </div>

      <div className="neg-estado-layout">
        <div className="neg-estado-lista">
          <div className="neg-estado-lista-header">Negociaciones ({filtradas.length})</div>
          <div className="neg-estado-lista-scroll">
            {loading && filtradas.length === 0 && (
              <p className="muted" style={{ padding: 14 }}>Cargando...</p>
            )}
            {!loading && filtradas.length === 0 && (
              <p className="muted" style={{ padding: 14 }}>No hay negociaciones en este filtro.</p>
            )}
            {filtradas.map((n) => {
              const meta = metaEstadoNegociacion(n.status);
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`neg-estado-item${selectedId === n.id ? ' neg-estado-item--activo' : ''}`}
                  onClick={() => onSelect(n.id)}
                >
                  <div className="neg-estado-item-top">
                    <div>
                      <div className="neg-estado-item-club">{n.clubName}</div>
                      <div className="neg-estado-item-jugador">{n.playerFullName ?? 'Jugador'}</div>
                    </div>
                    <span className={`neg-estado-badge neg-estado-badge--${meta.codigo}`}>
                      <i className={meta.icono} aria-hidden />
                      {meta.etiqueta}
                    </span>
                  </div>
                  <div className="neg-estado-item-jugador">
                    {resumenContratoOferta(normalizarOfertaDetalle(n))} · {n.offerDate}
                    {(n.currentVersionNumber ?? 1) > 1 && (
                      <span className="neg-estado-item-version"> · v{n.currentVersionNumber}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="neg-estado-detalle">
          {!seleccionada ? (
            <div className="neg-estado-detalle-vacio">
              <i className="ri-handshake-line" aria-hidden />
              <p>Selecciona una negociación de la lista para ver el detalle y cambiar su estado.</p>
            </div>
          ) : (
            <>
              <h3 className="neg-estado-detalle-titulo">{seleccionada.clubName}</h3>
              <p className="neg-estado-detalle-sub">
                {seleccionada.playerFullName ?? 'Jugador'} · Estado actual:{' '}
                <strong>{etiquetaEstadoNegociacion(seleccionada.status)}</strong>
                {(seleccionada.currentVersionNumber ?? 1) > 0 && (
                  <> · Versión <strong>v{seleccionada.currentVersionNumber ?? 1}</strong></>
                )}
              </p>

              <div className="neg-estado-datos neg-estado-datos--compacto">
                <div className="neg-estado-dato">
                  <label>Fecha de oferta vigente</label>
                  <span>{seleccionada.offerDate}</span>
                </div>
                <div className="neg-estado-dato">
                  <label>Responsable</label>
                  <span>{seleccionada.responsibleName}</span>
                </div>
              </div>

              {versions.length === 0 && !versionsLoading && (
                <section className="neg-estado-seccion neg-estado-seccion--compacta">
                  <CondicionesOfertaDetalle oferta={normalizarOfertaDetalle(seleccionada)} />
                </section>
              )}

              <HistorialVersionesOferta
                versions={versions}
                loading={versionsLoading}
                currentVersionNumber={seleccionada.currentVersionNumber ?? 1}
                deleting={deletingNegotiation}
                onDeleteNegotiation={() => void onDeleteNegotiation(seleccionada.id)}
              />

              {enContraoferta && !negociacionCompletada && contraofertaForm && (
                <section className="neg-contraoferta-panel">
                  <h4 className="neg-contraoferta-titulo">
                    <i className="ri-exchange-line" aria-hidden />
                    Registrar versión
                  </h4>

                  <div className="neg-contraoferta-fila-superior">
                  <div className="neg-contraoferta-autor">
                    <span className="neg-contraoferta-autor-label">De:</span>
                    <label className={`neg-contraoferta-opcion${proposedBy === 'Club' ? ' neg-contraoferta-opcion--activa' : ''}`}>
                      <input
                        type="radio"
                        name="proposedBy"
                        value="Club"
                        checked={proposedBy === 'Club'}
                        onChange={() => setProposedBy('Club')}
                        disabled={versionRegistering}
                      />
                      <i className="ri-building-2-line" aria-hidden />
                      Club
                    </label>
                    <label className={`neg-contraoferta-opcion${proposedBy === 'Agencia' ? ' neg-contraoferta-opcion--activa' : ''}`}>
                      <input
                        type="radio"
                        name="proposedBy"
                        value="Agencia"
                        checked={proposedBy === 'Agencia'}
                        onChange={() => setProposedBy('Agencia')}
                        disabled={versionRegistering}
                      />
                      <i className="ri-briefcase-4-line" aria-hidden />
                      Agencia
                    </label>
                  </div>

                  <label className="neg-contraoferta-notas">
                    <span>Notas (opc.)</span>
                    <input
                      type="text"
                      value={notasVersion}
                      onChange={(e) => setNotasVersion(e.target.value)}
                      placeholder="Ej. Aceptan subir sueldo..."
                      disabled={versionRegistering}
                    />
                  </label>
                  </div>

                  <FormularioOfertaNegociacion
                    form={contraofertaForm}
                    onChange={setContraofertaForm}
                    onSubmit={(e) => void enviarContraoferta(e)}
                    submitLabel={versionRegistering ? 'Guardando...' : 'Guardar versión'}
                    loading={versionRegistering}
                    disabled={versionRegistering}
                    compacto
                  />
                </section>
              )}

              {!enContraoferta && !negociacionCompletada && (
                <p className="neg-contraoferta-hint muted">
                  Para registrar contraofertas, mueve la negociación a la etapa{' '}
                  <strong>Negociando contra oferta</strong>.
                </p>
              )}

              <h4 className="neg-estado-pipeline-titulo">Flujo de negociación</h4>
              <div className="neg-estado-pipeline">
                {ESTADOS_NEGOCIACION.map((paso) => {
                  const estadoNorm = normalizarCodigoEstado(seleccionada.status);
                  const esActual = estadoNorm === paso.codigo;
                  const esCompletado = paso.orden < pasoActual && pasoActual > 0;
                  return (
                    <button
                      key={paso.codigo}
                      type="button"
                      className={`neg-estado-paso${esActual ? ' neg-estado-paso--actual' : ''}${esCompletado ? ' neg-estado-paso--completado' : ''}`}
                      disabled={statusUpdating || esActual}
                      title={paso.descripcion}
                      onClick={() => void onChangeStatus(seleccionada.id, paso.codigo)}
                    >
                      <i className={paso.icono} aria-hidden />
                      <div className="neg-estado-paso-nombre">{paso.etiqueta}</div>
                    </button>
                  );
                })}
              </div>
              <p className="neg-estado-paso-hint">
                Haz clic en una etapa para mover la negociación a ese estado.
                {statusUpdating && ' Actualizando...'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
