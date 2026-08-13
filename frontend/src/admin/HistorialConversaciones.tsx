import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  TIPOS_CONVERSACION,
  conversacionFormVacio,
  formatearFechaConversacion,
  metaTipoConversacion,
  type ConversacionForm,
  type ConversacionRow,
  type JugadorHistorialRow,
  type TipoConversacionCodigo,
} from './negociacionConversaciones';
import './negociacion-conversaciones.css';

type Props = {
  jugadores: JugadorHistorialRow[];
  loadingJugadores: boolean;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
  clubesSugeridos: string[];
  conversaciones: ConversacionRow[];
  loadingConversaciones: boolean;
  saving: boolean;
  onSubmitConversacion: (form: ConversacionForm) => Promise<void>;
  onDeleteConversacion: (id: string) => Promise<void>;
};

export default function HistorialConversaciones({
  jugadores,
  loadingJugadores,
  selectedPlayerId,
  onSelectPlayer,
  clubesSugeridos,
  conversaciones,
  loadingConversaciones,
  saving,
  onSubmitConversacion,
  onDeleteConversacion,
}: Props) {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [form, setForm] = useState(conversacionFormVacio());
  const [mostrarFormulario, setMostrarFormulario] = useState(true);

  const jugadoresFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) {
      return [...jugadores].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
      );
    }
    const q = filtroTexto.trim().toLowerCase();
    return jugadores
      .filter((j) => {
        const nombre = `${j.firstName} ${j.lastName}`.toLowerCase();
        return nombre.includes(q) || (j.currentClub ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [jugadores, filtroTexto]);

  const jugadorSeleccionado = useMemo(
    () => jugadores.find((j) => j.id === selectedPlayerId) ?? null,
    [jugadores, selectedPlayerId],
  );

  useEffect(() => {
    if (!jugadorSeleccionado) {
      setForm(conversacionFormVacio());
      return;
    }
    const clubDefault = clubesSugeridos[0] ?? jugadorSeleccionado.currentClub ?? '';
    setForm(conversacionFormVacio(clubDefault));
  }, [jugadorSeleccionado?.id, clubesSugeridos.join('|')]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() || !form.clubName.trim()) return;
    await onSubmitConversacion(form);
    const club = form.clubName;
    setForm(conversacionFormVacio(club));
  };

  const patchForm = (partial: Partial<ConversacionForm>) => setForm((f) => ({ ...f, ...partial }));

  return (
    <div className="neg-conv-wrap">
      <div className="neg-conv-layout">
        <aside className="neg-conv-lista-panel">
          <h3 className="neg-conv-panel-titulo">Jugadores</h3>
          <p className="muted neg-conv-panel-ayuda">
            Elige un jugador para ver y registrar conversaciones con los clubes.
          </p>

          <input
            type="search"
            className="neg-conv-buscar"
            placeholder="Buscar por nombre o club actual..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />

          <div className="neg-conv-lista-scroll">
            {loadingJugadores && (
              <p className="muted" style={{ padding: 12 }}>Cargando jugadores...</p>
            )}
            {!loadingJugadores && jugadoresFiltrados.length === 0 && (
              <p className="muted" style={{ padding: 12 }}>No hay jugadores que coincidan.</p>
            )}
            {jugadoresFiltrados.map((j) => {
              const nombre = `${j.firstName} ${j.lastName}`.trim();
              return (
                <button
                  key={j.id}
                  type="button"
                  className={`neg-conv-jug-item${selectedPlayerId === j.id ? ' neg-conv-jug-item--activo' : ''}`}
                  onClick={() => onSelectPlayer(j.id)}
                >
                  <span className="neg-conv-jug-nombre">{nombre}</span>
                  <span className="neg-conv-jug-meta">
                    {j.mainPosition}
                    {j.currentClub ? ` · ${j.currentClub}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="neg-conv-detalle-panel">
          {!jugadorSeleccionado ? (
            <div className="neg-conv-vacio">
              <i className="ri-chat-history-line" aria-hidden />
              <p>Selecciona un jugador para consultar o agregar conversaciones.</p>
            </div>
          ) : (
            <>
              <header className="neg-conv-detalle-cabecera">
                <div>
                  <h3>{jugadorSeleccionado.firstName} {jugadorSeleccionado.lastName}</h3>
                  <p className="muted">
                    {jugadorSeleccionado.mainPosition}
                    {jugadorSeleccionado.currentClub
                      ? ` · Club actual: ${jugadorSeleccionado.currentClub}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary-green"
                  onClick={() => setMostrarFormulario((v) => !v)}
                >
                  <i className={mostrarFormulario ? 'ri-subtract-line' : 'ri-add-line'} aria-hidden />
                  {mostrarFormulario ? 'Ocultar registro' : 'Nueva nota'}
                </button>
              </header>

              {mostrarFormulario && (
                <form className="neg-conv-form" onSubmit={(e) => void enviar(e)}>
                  <h4 className="neg-conv-form-titulo">Registrar conversación o nota</h4>

                  <label className="neg-conv-field neg-conv-field--club">
                    <span>Club de la conversación *</span>
                    <input
                      list="neg-conv-clubes-list"
                      value={form.clubName}
                      onChange={(e) => patchForm({ clubName: e.target.value })}
                      placeholder="Ej. Oriente Petrolero"
                      required
                      disabled={saving}
                    />
                    <datalist id="neg-conv-clubes-list">
                      {clubesSugeridos.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    {clubesSugeridos.length > 0 && (
                      <span className="neg-conv-clubes-hint muted">
                        Sugeridos: {clubesSugeridos.join(', ')}
                      </span>
                    )}
                  </label>

                  <div className="neg-conv-tipos">
                    {TIPOS_CONVERSACION.map((t) => (
                      <label
                        key={t.codigo}
                        className={`neg-conv-tipo${form.conversationType === t.codigo ? ' neg-conv-tipo--activo' : ''}`}
                        title={t.descripcion}
                      >
                        <input
                          type="radio"
                          name="conversationType"
                          value={t.codigo}
                          checked={form.conversationType === t.codigo}
                          onChange={() => patchForm({ conversationType: t.codigo as TipoConversacionCodigo })}
                          disabled={saving}
                        />
                        <i className={t.icono} aria-hidden />
                        <span>{t.etiqueta}</span>
                      </label>
                    ))}
                  </div>

                  <div className="neg-conv-form-grid">
                    <label className="neg-conv-field">
                      <span>Fecha y hora</span>
                      <input
                        type="datetime-local"
                        value={form.occurredAt}
                        onChange={(e) => patchForm({ occurredAt: e.target.value })}
                        required
                        disabled={saving}
                      />
                    </label>
                    <label className="neg-conv-field">
                      <span>Asunto (opcional)</span>
                      <input
                        value={form.subject}
                        onChange={(e) => patchForm({ subject: e.target.value })}
                        placeholder="Ej. Respuesta del director deportivo"
                        disabled={saving}
                      />
                    </label>
                    <label className="neg-conv-field neg-conv-field--wide">
                      <span>Participantes (opcional)</span>
                      <input
                        value={form.participants}
                        onChange={(e) => patchForm({ participants: e.target.value })}
                        placeholder="Ej. Director deportivo, representante"
                        disabled={saving}
                      />
                    </label>
                    <label className="neg-conv-field neg-conv-field--wide">
                      <span>Contenido / resumen *</span>
                      <textarea
                        value={form.content}
                        onChange={(e) => patchForm({ content: e.target.value })}
                        placeholder="Detalla lo conversado..."
                        rows={4}
                        required
                        disabled={saving}
                      />
                    </label>
                  </div>
                  <div className="neg-conv-form-acciones">
                    <button
                      type="submit"
                      className="btn-primary-green"
                      disabled={saving || !form.content.trim() || !form.clubName.trim()}
                    >
                      {saving ? 'Guardando...' : 'Guardar en historial'}
                    </button>
                  </div>
                </form>
              )}

              <section className="neg-conv-timeline">
                <h4 className="neg-conv-timeline-titulo">
                  <i className="ri-time-line" aria-hidden />
                  Historial ({conversaciones.length})
                </h4>
                {loadingConversaciones && <p className="muted">Cargando...</p>}
                {!loadingConversaciones && conversaciones.length === 0 && (
                  <p className="muted neg-conv-timeline-vacio">
                    Sin registros aún. Indica el club y agrega la primera conversación.
                  </p>
                )}
                <ul className="neg-conv-timeline-lista">
                  {conversaciones.map((c) => {
                    const meta = metaTipoConversacion(c.conversationType);
                    return (
                      <li key={c.id} className={`neg-conv-entry neg-conv-entry--${c.conversationType}`}>
                        <div className="neg-conv-entry-icono">
                          <i className={meta.icono} aria-hidden />
                        </div>
                        <div className="neg-conv-entry-cuerpo">
                          <div className="neg-conv-entry-cabecera">
                            <span className="neg-conv-entry-club">
                              <i className="ri-building-2-line" aria-hidden />
                              {c.clubName}
                            </span>
                            <span className="neg-conv-entry-tipo">{c.conversationTypeLabel}</span>
                            <time dateTime={c.occurredAtUtc}>{formatearFechaConversacion(c.occurredAtUtc)}</time>
                          </div>
                          {c.subject && <p className="neg-conv-entry-asunto">{c.subject}</p>}
                          <p className="neg-conv-entry-contenido">{c.content}</p>
                          {c.participants && (
                            <p className="neg-conv-entry-participantes">
                              <i className="ri-user-line" aria-hidden />
                              {c.participants}
                            </p>
                          )}
                          <p className="neg-conv-entry-meta">
                            Registrado por {c.createdBy || 'sistema'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="neg-conv-entry-eliminar"
                          title="Eliminar"
                          disabled={saving}
                          onClick={() => void onDeleteConversacion(c.id)}
                        >
                          <i className="ri-delete-bin-line" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
