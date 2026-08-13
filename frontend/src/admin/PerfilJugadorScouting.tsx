import { useMemo, useState } from 'react';
import PitchDiagram, { mapPositionCoords } from './PitchDiagram';
import './perfil-scouting.css';

type Jugador = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  mainPosition: string;
  currentClub?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredFoot?: string | null;
  agencyStatus: string;
  contractStatus: string;
  notes?: string;
  photoUrl?: string | null;
  idCardNumber?: string | null;
  city?: string | null;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  jerseyNumber?: number | null;
};

type StatRow = { matchDate: string; opponent: string; goals: number; assists: number; rating: number; minutesPlayed: number };
type ContractRow = { id: string; startDate: string; endDate: string; status: string; version: number };
type TransferRow = {
  id: string; transferDate: string; originClub: string; destinationClub: string;
  transferType: string; amount?: number; currency: string;
};
type ClubHistoryRow = { clubName: string; category: string; year: number };
type NegotiationRow = { clubName: string; offeredAmount: number; currency: string; status: string; offerDate: string };

type TabId = 'resumen' | 'rendimiento' | 'posiciones' | 'trayectoria';

function edadDesdeNacimiento(birthDate: string): number {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return 0;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) age--;
  return Math.max(0, age);
}

function pieCorto(pie?: string | null): string {
  const f = (pie ?? '').toLowerCase();
  if (f.includes('izquier')) return 'Izquierdo';
  if (f.includes('derech')) return 'Derecho';
  if (f.includes('amb')) return 'Ambidiestro';
  return pie ?? '—';
}

function DonutChart({ pct, label }: { pct: number; label: string }) {
  const p = Math.min(100, Math.max(0, pct));
  const r = 24;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <div className="ps-donut">
      <svg viewBox="0 0 60 60" width={60} height={60}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="#e7e5ed" strokeWidth="6" />
        <circle
          cx="30" cy="30" r={r} fill="none" stroke="#08277a" strokeWidth="6"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
        <text x="30" y="30" textAnchor="middle" dominantBaseline="middle" fill="#08277a" fontSize="10" fontWeight="bold">
          {p.toFixed(0)}%
        </text>
      </svg>
      <div className="ps-donut-label">{label}</div>
    </div>
  );
}

export type PerfilJugadorScoutingProps = {
  jugador: Jugador;
  fotoUrl: string | null;
  stats: StatRow[];
  contracts: ContractRow[];
  transfers: TransferRow[];
  clubHistory: ClubHistoryRow[];
  achievements: { year: number; achievementType: string; tournamentName: string; country: string }[];
  negotiations: NegotiationRow[];
  docsCount: number;
  etiquetaCategoria: (c: string) => string;
  etiquetaTipoLogro: (t: string) => string;
  etiquetaTipoTransferencia: (t: string) => string;
  textoMontoTransferencia: (t: TransferRow) => string;
  onCurriculum: () => void;
  onInforme: () => void;
  onContratoPdf: (id: string) => void;
};

export default function PerfilJugadorScouting({
  jugador,
  fotoUrl,
  stats,
  contracts,
  transfers,
  clubHistory,
  achievements,
  negotiations,
  docsCount,
  etiquetaCategoria,
  etiquetaTipoLogro,
  etiquetaTipoTransferencia,
  textoMontoTransferencia,
  onCurriculum,
  onInforme,
  onContratoPdf,
}: PerfilJugadorScoutingProps) {
  const [tab, setTab] = useState<TabId>('resumen');
  const pos = mapPositionCoords(jugador.mainPosition);
  const age = edadDesdeNacimiento(jugador.birthDate);

  const totalGoals = stats.reduce((s, x) => s + x.goals, 0);
  const totalAssists = stats.reduce((s, x) => s + x.assists, 0);
  const totalMin = stats.reduce((s, x) => s + x.minutesPlayed, 0);
  const avgRating = stats.length ? stats.reduce((s, x) => s + x.rating, 0) / stats.length : 0;
  const pj = stats.length;
  const gPerMatch = pj ? totalGoals / pj : 0;
  const aPerMatch = pj ? totalAssists / pj : 0;
  const minPerMatch = pj ? totalMin / pj : 0;

  const activeContract = contracts.find((c) => c.status === 'Vigente') ?? contracts[0];
  const lastTransfer = useMemo(
    () => [...transfers].sort((a, b) => b.transferDate.localeCompare(a.transferDate))[0],
    [transfers],
  );

  const timeline = useMemo(
    () => [...clubHistory].sort((a, b) => a.year - b.year),
    [clubHistory],
  );

  const statsByYear = useMemo(() => {
    const map = new Map<number, StatRow[]>();
    stats.forEach((s) => {
      const y = new Date(s.matchDate).getFullYear();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(s);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]).slice(0, 3);
  }, [stats]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'rendimiento', label: 'Rendimiento' },
    { id: 'posiciones', label: 'Posiciones' },
    { id: 'trayectoria', label: 'Trayectoria' },
  ];

  const kpis: [string, string | number][] = [
    ['Contratos', contracts.length],
    ['Documentos', docsCount],
    ['Partidos', pj],
    ['Transferencias', transfers.length],
    ['Goles', totalGoals],
    ['Asistencias', totalAssists],
    ['Rating', avgRating ? avgRating.toFixed(1) : '—'],
  ];

  const contractLabel =
    jugador.contractStatus === 'Vigente' ? 'Bajo contrato' : jugador.contractStatus;

  return (
    <div className="perfil-scouting">
      {/* Hero */}
      <header className="ps-hero">
        <div className="ps-hero-accent" aria-hidden />
        <div className="ps-hero-body">
          <div className="ps-identity-block">
            <div className="ps-avatar">
              {fotoUrl ? <img src={fotoUrl} alt="" /> : <>{jugador.firstName[0]}{jugador.lastName[0]}</>}
            </div>
            <div>
              <h2 className="ps-name">{jugador.firstName} {jugador.lastName}</h2>
              <div className="ps-meta">
                <span className="ps-pos-badge">{pos.abbr}</span>
                <span>{pos.label}</span>
                <span>{age} años</span>
                <span>{jugador.nationality}</span>
              </div>
              <p className="ps-sub">
                Profesional · {jugador.agencyStatus}
              </p>
              <div className="ps-actions">
                <button type="button" className="btn-scout-primary" onClick={onCurriculum}>
                  <i className="ri-file-pdf-line" aria-hidden /> Currículum PDF
                </button>
                <button type="button" className="btn-scout-ghost" onClick={onInforme}>
                  Informe completo
                </button>
              </div>
            </div>
          </div>

          <aside className="ps-club-panel">
            <h4>Club actual</h4>
            <p className="ps-club-name">{jugador.currentClub ?? 'Sin club asignado'}</p>
            <p className="ps-club-status">{contractLabel}</p>
            {activeContract && (
              <p className="ps-sub" style={{ marginTop: 8 }}>Vigente hasta {activeContract.endDate}</p>
            )}
            <p className="ps-sub" style={{ marginTop: 6 }}>Fortis Glesnor Group</p>
          </aside>
        </div>
      </header>

      {/* KPIs */}
      <div className="ps-stats-strip" role="list">
        {kpis.map(([lbl, val]) => (
          <div key={lbl} className="ps-stat-pill" role="listitem">
            <div className="ps-stat-pill-val">{val}</div>
            <div className="ps-stat-pill-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="ps-layout">
        <div className="ps-main-col">
          <div className="ps-tabs-wrap">
            <nav className="ps-tabs" aria-label="Secciones del perfil">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ps-tab${tab === t.id ? ' ps-tab--active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="ps-tab-panel">
            {tab === 'resumen' && (
              <>
                <div className="ps-grid-2" style={{ marginBottom: 14 }}>
                  <div className="ps-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Rendimiento por temporada</span>
                    </h3>
                    <PerformanceTable
                      statsByYear={statsByYear}
                      pj={pj}
                      totalMin={totalMin}
                      totalGoals={totalGoals}
                      totalAssists={totalAssists}
                    />
                  </div>
                  <div className="ps-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Indicadores</span>
                    </h3>
                    <div className="ps-donuts">
                      <DonutChart pct={(minPerMatch / 90) * 100} label="Minutos / partido" />
                      <DonutChart pct={(gPerMatch / 1.2) * 100} label="Goles / partido" />
                      <DonutChart pct={(aPerMatch / 0.8) * 100} label="Asist. / partido" />
                      <DonutChart pct={(avgRating / 10) * 100} label="Rating medio" />
                    </div>
                  </div>
                </div>

                <div className="ps-grid-3">
                  <div className="ps-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Zona en cancha</span>
                    </h3>
                    <div className="ps-pitch-wrap">
                      <PitchDiagram mainPosition={jugador.mainPosition} />
                      <p className="ps-pitch-label">{pos.label}</p>
                    </div>
                  </div>
                  <div className="ps-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Trayectoria</span>
                    </h3>
                    <Timeline clubs={timeline} etiquetaCategoria={etiquetaCategoria} />
                  </div>
                  <div className="ps-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Últimos partidos</span>
                    </h3>
                    {stats.length === 0 ? (
                      <p className="ps-empty">Sin partidos registrados.</p>
                    ) : (
                      <div className="ps-table-wrap">
                        <table className="ps-table">
                          <thead>
                            <tr><th>Fecha</th><th>Rival</th><th>G</th><th>A</th></tr>
                          </thead>
                          <tbody>
                            {[...stats]
                              .sort((a, b) => b.matchDate.localeCompare(a.matchDate))
                              .slice(0, 5)
                              .map((s, i) => (
                                <tr key={`${s.matchDate}-${i}`}>
                                  <td>{s.matchDate}</td>
                                  <td>{s.opponent}</td>
                                  <td>{s.goals}</td>
                                  <td>{s.assists}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {lastTransfer && (
                  <div className="ps-card" style={{ marginTop: 14, boxShadow: 'none', border: 'none', padding: 0 }}>
                    <h3 className="ps-card-title">
                      <span className="ps-card-title-text">Última transferencia</span>
                    </h3>
                    <div className="ps-table-wrap">
                      <table className="ps-table">
                        <thead>
                          <tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Tipo</th><th>Monto</th></tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{lastTransfer.transferDate}</td>
                            <td>{lastTransfer.originClub}</td>
                            <td>{lastTransfer.destinationClub}</td>
                            <td>{etiquetaTipoTransferencia(lastTransfer.transferType)}</td>
                            <td>{textoMontoTransferencia(lastTransfer)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {jugador.notes && <p className="ps-notes" style={{ marginTop: 14 }}>{jugador.notes}</p>}
              </>
            )}

            {tab === 'rendimiento' && (
              <>
                <h3 className="ps-card-title">
                  <span className="ps-card-title-text">Historial de partidos</span>
                </h3>
                {stats.length === 0 ? (
                  <p className="ps-empty">Sin partidos registrados.</p>
                ) : (
                  <div className="ps-table-wrap">
                    <table className="ps-table">
                      <thead>
                        <tr><th>Fecha</th><th>Rival</th><th>Min</th><th>G</th><th>A</th><th>Rating</th></tr>
                      </thead>
                      <tbody>
                        {[...stats].sort((a, b) => b.matchDate.localeCompare(a.matchDate)).map((s, i) => (
                          <tr key={`${s.matchDate}-${i}`}>
                            <td>{s.matchDate}</td>
                            <td>{s.opponent}</td>
                            <td>{s.minutesPlayed}</td>
                            <td>{s.goals}</td>
                            <td>{s.assists}</td>
                            <td>{s.rating.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {contracts.length > 0 && (
                  <>
                    <h3 className="ps-card-title" style={{ marginTop: 20 }}>
                      <span className="ps-card-title-text">Contratos</span>
                    </h3>
                    <div className="ps-table-wrap">
                      <table className="ps-table">
                        <thead><tr><th>Inicio</th><th>Fin</th><th>Estado</th><th>PDF</th></tr></thead>
                        <tbody>
                          {contracts.map((c) => (
                            <tr key={c.id}>
                              <td>{c.startDate}</td><td>{c.endDate}</td><td>{c.status}</td>
                              <td><button type="button" className="btn-scout-ghost" onClick={() => onContratoPdf(c.id)}>Descargar</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'posiciones' && (
              <div className="ps-grid-2">
                <div>
                  <h3 className="ps-card-title">
                    <span className="ps-card-title-text">Mapa de posición</span>
                  </h3>
                  <div className="ps-pitch-wrap">
                    <PitchDiagram mainPosition={jugador.mainPosition} />
                    <p className="ps-pitch-label">{pos.label} · {pos.abbr}</p>
                  </div>
                </div>
                <div>
                  <h3 className="ps-card-title">
                    <span className="ps-card-title-text">Perfil físico y técnico</span>
                  </h3>
                  <DataRow label="Posición principal" value={pos.label} />
                  <DataRow label="Pie dominante" value={pieCorto(jugador.preferredFoot)} />
                  <DataRow label="Altura" value={jugador.heightCm ? `${jugador.heightCm} cm` : '—'} />
                  <DataRow label="Peso" value={jugador.weightKg ? `${jugador.weightKg} kg` : '—'} />
                </div>
              </div>
            )}

            {tab === 'trayectoria' && (
              <>
                <h3 className="ps-card-title">
                  <span className="ps-card-title-text">Historial de clubes</span>
                </h3>
                <Timeline clubs={timeline} etiquetaCategoria={etiquetaCategoria} />
                {timeline.length > 0 && (
                  <div className="ps-table-wrap" style={{ marginTop: 14 }}>
                    <table className="ps-table">
                      <thead><tr><th>Año</th><th>Club</th><th>Categoría</th></tr></thead>
                      <tbody>
                        {[...timeline].reverse().map((h, i) => (
                          <tr key={`${h.year}-${i}`}>
                            <td>{h.year}</td>
                            <td>{h.clubName}</td>
                            <td>{etiquetaCategoria(h.category)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {transfers.length > 0 && (
                  <>
                    <h3 className="ps-card-title" style={{ marginTop: 20 }}>
                      <span className="ps-card-title-text">Transferencias</span>
                    </h3>
                    <div className="ps-table-wrap">
                      <table className="ps-table">
                        <thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Tipo</th><th>Monto</th></tr></thead>
                        <tbody>
                          {transfers.map((t) => (
                            <tr key={t.id}>
                              <td>{t.transferDate}</td>
                              <td>{t.originClub}</td>
                              <td>{t.destinationClub}</td>
                              <td>{etiquetaTipoTransferencia(t.transferType)}</td>
                              <td>{textoMontoTransferencia(t)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {achievements.length > 0 && (
                  <>
                    <h3 className="ps-card-title" style={{ marginTop: 20 }}>
                      <span className="ps-card-title-text">Logros deportivos</span>
                    </h3>
                    <ul className="ps-logros-list">
                      {achievements.map((a, i) => (
                        <li key={i}>
                          <strong>{a.year}</strong>
                          {' · '}{etiquetaTipoLogro(a.achievementType)} — {a.tournamentName} ({a.country})
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {negotiations.length > 0 && (
                  <>
                    <h3 className="ps-card-title" style={{ marginTop: 20 }}>
                      <span className="ps-card-title-text">Negociaciones</span>
                    </h3>
                    <div className="ps-table-wrap">
                      <table className="ps-table">
                        <thead><tr><th>Club</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
                        <tbody>
                          {negotiations.map((n, i) => (
                            <tr key={i}>
                              <td>{n.clubName}</td>
                              <td>{n.offeredAmount.toLocaleString()} {n.currency}</td>
                              <td>{n.status}</td>
                              <td>{n.offerDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <aside className="ps-aside-col">
          <div className="ps-card">
            <h3 className="ps-card-title">
              <span className="ps-card-title-text">Ficha técnica</span>
            </h3>
            <div className="ps-quick-grid">
              <div className="ps-quick-cell">
                <PitchDiagram mainPosition={jugador.mainPosition} compact />
                <div className="ps-quick-label">Posición</div>
              </div>
              <div className="ps-quick-cell">
                <div className="ps-quick-value" style={{ marginTop: 6 }}>{pieCorto(jugador.preferredFoot).slice(0, 3)}</div>
                <div className="ps-quick-label">Pie</div>
              </div>
              <div className="ps-quick-cell">
                <div className="ps-quick-value" style={{ marginTop: 6 }}>
                  {jugador.heightCm ? `${jugador.heightCm} cm` : '—'}
                </div>
                <div className="ps-quick-label">Altura</div>
              </div>
            </div>
          </div>

          <div className="ps-card">
            <h3 className="ps-card-title">
              <span className="ps-card-title-text">Datos del jugador</span>
            </h3>
            <DataRow label="Peso" value={jugador.weightKg ? `${jugador.weightKg} kg` : '—'} />
            <DataRow label="Nacimiento" value={jugador.birthDate} />
            <DataRow label="Ciudad" value={jugador.city ?? '—'} />
            <DataRow label="Nacionalidad" value={jugador.nationality} />
            <DataRow label="Carnet" value={jugador.idCardNumber ?? '—'} />
            <DataRow label="Correo" value={jugador.email ?? '—'} />
            <DataRow label="Celular" value={jugador.phoneNumber ?? '—'} />
            {jugador.jerseyNumber != null && <DataRow label="Nº camiseta" value={String(jugador.jerseyNumber)} />}
            {jugador.address && <DataRow label="Domicilio" value={jugador.address} />}
          </div>

          <div className="ps-card">
            <h3 className="ps-card-title">
              <span className="ps-card-title-text">Agencia</span>
            </h3>
            <DataRow label="Estado" value={jugador.agencyStatus} />
            <DataRow label="Contrato" value={jugador.contractStatus} />
            <DataRow label="Representación" value="Fortis Glesnor Group" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ps-data-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PerformanceTable({
  statsByYear,
  pj,
  totalMin,
  totalGoals,
  totalAssists,
}: {
  statsByYear: [number, StatRow[]][];
  pj: number;
  totalMin: number;
  totalGoals: number;
  totalAssists: number;
}) {
  if (pj === 0) return <p className="ps-empty">Sin partidos registrados.</p>;
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr><th>Temp.</th><th>Registro</th><th>PJ</th><th>Min</th><th>G</th><th>As</th></tr>
        </thead>
        <tbody>
          {statsByYear.map(([year, rows]) => (
            <tr key={year}>
              <td>&apos;{String(year).slice(-2)}</td>
              <td>Partidos CRM</td>
              <td>{rows.length}</td>
              <td>{rows.reduce((s, x) => s + x.minutesPlayed, 0)}</td>
              <td>{rows.reduce((s, x) => s + x.goals, 0)}</td>
              <td>{rows.reduce((s, x) => s + x.assists, 0)}</td>
            </tr>
          ))}
          <tr className="ps-total">
            <td colSpan={2}>Total</td>
            <td>{pj}</td>
            <td>{totalMin}</td>
            <td>{totalGoals}</td>
            <td>{totalAssists}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Timeline({
  clubs,
  etiquetaCategoria,
}: {
  clubs: ClubHistoryRow[];
  etiquetaCategoria: (c: string) => string;
}) {
  if (clubs.length === 0) return <p className="ps-empty">Sin historial de clubes.</p>;
  return (
    <div className="ps-timeline">
      {clubs.map((h, i) => (
        <div key={`${h.year}-${i}`} className="ps-timeline-item">
          <div className="ps-timeline-dot" />
          <div className="ps-timeline-year">{h.year}</div>
          <div className="ps-timeline-club" title={h.clubName}>{h.clubName}</div>
          <div className="ps-timeline-club">{etiquetaCategoria(h.category)}</div>
        </div>
      ))}
    </div>
  );
}
