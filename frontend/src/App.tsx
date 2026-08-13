/**
 * =============================================================================
 * Aplicación web Fortis Sports (React + Vite)
 * =============================================================================
 * Propósito general:
 *   Punto único de la interfaz: jugadores, contratos, negociaciones, reportes,
 *   administración y «Parámetros de configuración» (catálogos / listas maestras).
 *
 * Convención de nombres (importante):
 *   - Los **tipos** que representan respuestas JSON del backend usan propiedades en
 *     inglés (`firstName`, `accessToken`, etc.) porque deben coincidir **exactamente**
 *     con la API; si se renombran sin mapeo, la aplicación dejaría de recibir datos.
 *   - Los textos visibles para el usuario están en **español** en JSX y constantes.
 *   - Módulo **Jugadores**: estado y funciones en español (`jugadores`, `cargarJugadores`,
 *     `FilaJugador`, `idJugadorSeleccionado`, …). Otros módulos pueden ir alineándose igual.
 *
 * Comentarios en el archivo:
 *   No se documenta línea a línea (miles de líneas); hay secciones delimitadas con
 *   comentarios `// ── Sección ──` y lógica compleja puede ampliarse donde haga falta.
 *
 * Dependencias destacadas:
 *   - `axios` cliente HTTP hacia `VITE_API_URL` o `/api`.
 *   - `recharts` gráficos en reportes e inteligencia.
 * =============================================================================
 */

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavbarPortal from './portal/NavbarPortal';
import FooterPortal from './portal/FooterPortal';
import PaginaInicio from './portal/PaginaInicio';
import PaginaCatalogo from './portal/PaginaCatalogo';
import PaginaJugador from './portal/PaginaJugador';
import PaginaServicios from './portal/PaginaServicios';
import PaginaContacto from './portal/PaginaContacto';
import { urlFotoJugador } from './portal/fotoPublica';
import PerfilJugadorScouting from './admin/PerfilJugadorScouting';
import EstadoNegociacion from './admin/EstadoNegociacion';
import type { VersionOfertaRow } from './admin/HistorialVersionesOferta';
import type { OfertaNegociacionForm } from './admin/negociacionOfertas';
import NegociacionesCompletadasTransfer, {
  esNegociacionCompletada,
} from './admin/NegociacionesCompletadasTransfer';
import HistorialConversaciones from './admin/HistorialConversaciones';
import { PAISES_FIFA } from './data/paisesFifa';
import {
  payloadConversacionApi,
  type ConversacionForm,
  type ConversacionRow,
  type JugadorHistorialRow,
} from './admin/negociacionConversaciones';
import FormularioOfertaNegociacion from './admin/FormularioOfertaNegociacion';
import {
  etiquetaBonosOferta,
  ofertaDesdeNegociacion,
  ofertaNegociacionVacia,
  payloadOfertaApi,
  resumenContratoOferta,
} from './admin/negociacionOfertas';
import type { EstadoNegociacionCodigo } from './admin/negociacionEstados';
import { etiquetaEstadoNegociacion } from './admin/negociacionEstados';
import './admin/negociacion-ofertas.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// ─── Tipos (forma de datos que devuelve o espera la API; nombres = contrato JSON) ─

type FilaJugador = {
  id: string; firstName: string; lastName: string; nationality: string; mainPosition: string;
  currentClub?: string; heightCm?: number | null; weightKg?: number | null; preferredFoot?: string | null;
  photoUrl?: string | null; idCardNumber?: string | null; city?: string | null; email?: string | null;
  phoneNumber?: string | null; jerseyNumber?: number | null;
};
type JugadorCompleto = {
  id: string; firstName: string; lastName: string; birthDate: string;
  nationality: string; mainPosition: string; currentClub?: string;
  heightCm?: number | null; weightKg?: number | null; preferredFoot?: string | null;
  agencyStatus: string; contractStatus: string; isVisible: boolean; notes?: string;
  photoUrl?: string | null;
  idCardNumber?: string | null; city?: string | null; address?: string | null; email?: string | null;
  phoneNumber?: string | null; jerseyNumber?: number | null;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number };
type NegotiationRow = {
  id: string; playerId: string; clubName: string; offeredAmount: number; monthlyAmount: number;
  installmentsPerYear: number; contractYears: number; currency: string;
  status: string; responsibleName: string; offerDate: string;
  hasHousingBonus: boolean; housingBonusNotes?: string | null;
  hasObjectiveBonus: boolean; objectiveBonusNotes?: string | null;
  hasGoalBonus: boolean; goalBonusNotes?: string | null;
  hasSigningBonus: boolean; signingBonusNotes?: string | null;
  playerFullName?: string | null; conditions?: string | null;
  currentVersionNumber?: number;
};
type TransferRow = {
  id: string; playerId: string; originClub: string; destinationClub: string; transferDate: string;
  amount?: number; currency: string; transferType: string; status: string; managedBy: string;
  clubContractDocumentId?: string | null;
};
type ClubHistoryRow = { id: string; playerId: string; clubName: string; category: string; year: number; notes?: string | null };
const CATEGORIA_CLUB_OPCIONES = [
  { value: 'PrimeraDivision', label: 'Primera división' },
  { value: 'SegundaDivision', label: 'Segunda división' },
  { value: 'Reserva', label: 'Reserva' },
  { value: 'Sub20', label: 'Sub-20' },
  { value: 'Sub19', label: 'Sub-19' },
  { value: 'Sub17', label: 'Sub-17' },
  { value: 'Sub16', label: 'Sub-16' },
  { value: 'Sub15', label: 'Sub-15' },
  { value: 'Sub14', label: 'Sub-14' },
  { value: 'Sub13', label: 'Sub-13' },
  { value: 'Formativa', label: 'Formativa / inferiores' },
] as const;
const etiquetaCategoriaClub = (cat: string) =>
  CATEGORIA_CLUB_OPCIONES.find((o) => o.value === cat)?.label ?? cat;
type AchievementRow = {
  id: string; playerId: string; achievementType: string; tournamentName: string; country: string; year: number;
  notes?: string | null;
};
const TIPO_LOGRO_OPCIONES = [
  { value: 'TituloTorneo', label: 'Título / campeón de torneo' },
  { value: 'ParticipacionInternacional', label: 'Participación en torneo internacional' },
] as const;
const etiquetaTipoLogro = (tipo: string) =>
  TIPO_LOGRO_OPCIONES.find((o) => o.value === tipo)?.label ?? tipo;
const ANIO_ACTUAL = new Date().getFullYear();
type ContractRow = { id: string; playerId: string; issuedAt: string; startDate: string; endDate: string; status: string; version: number };
type DocumentRow = { id: string; playerId: string; documentType: string; description: string; originalFileName: string; status: string; expirationDate?: string };
type DashboardReport = { totalPlayers: number; activeNegotiations: number; activeTransfers: number; contractsExpiringSoon: number; unreadNotifications: number };
type NegReportRow = { enAnalisis: number; enNegociacion: number; pendienteFirma: number; completadas: number; canceladas: number };
type TrReportRow = { enAnalisis: number; enNegociacion: number; pendienteFirma: number; completadas: number; canceladas: number };
type ContractsReport = { vigentes: number; vencidos: number; proximosAVencer: number };
type RankingPlayer = { playerId: string; fullName: string; mainPosition: string; currentClub?: string; score: number };
type CompatibilityResult = { playerId: string; fullName: string; compatibilityScore: number; explanation: string };
type NotificationRow = { id: string; title: string; message: string; priority: string; isRead: boolean; createdAtUtc: string };
type AuditRow = { id: string; entityName: string; action: string; entityId?: string; changesSummary: string; createdBy?: string; actionAtUtc: string };
type UserRow = { id: string; email: string; fullName: string; isActive: boolean; roles: string[] };
type StatRow = { id: string; matchDate: string; opponent: string; goals: number; assists: number; rating: number; minutesPlayed: number };
type BulkResult = { created: number; skipped: number; errors: string[] };
type CatalogRow = { id: string; code: string; name: string; description: string; isActive: boolean };
type CatalogItemRow = {
  id: string;
  catalogId: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  country?: string | null;
  city?: string | null;
  league?: string | null;
  parentItemId?: string | null;
};
type SportsCountryRow = { id: string; name: string; nationality?: string | null; fifaCode?: string | null; iso2Code?: string | null; isActive: boolean };
type SportsCityRow = { id: string; countryId: string; countryName: string; name: string; regionDepartment?: string | null; isActive: boolean };
type SportsCategoryRow = { id: string; name: string; level?: number | null; description?: string | null; isActive: boolean };
type SportsCompetitionRow = {
  id: string;
  countryId: string;
  countryName: string;
  competitiveCategoryId: string;
  competitiveCategoryName: string;
  name: string;
  season: string;
  divisionLevel?: number | null;
  isProfessional: boolean;
  dataSourceId?: string | null;
  dataSourceName?: string | null;
  isActive: boolean;
};
type SportsCompetitionClubRow = {
  clubCompetitionSeasonId: string;
  clubId: string;
  clubName: string;
  cityName?: string | null;
  season: string;
  status: string;
  validationStatus: string;
  isActive: boolean;
};
type SportsDataSourceRow = { id: string; name: string; type: string; url?: string | null; reliability: string; isActive: boolean };
type ParamQuickDraft = { name: string; order: string; country: string; city: string; league: string; parentItemId: string; categoryItemId: string; nationality: string };
type Toast = { id: number; type: 'ok' | 'err'; text: string };

// ─── API ──────────────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });
const CHART_COLORS = ['#008f4a', '#08277a', '#27ae60', '#e67e22', '#c0392b', '#0f4c81'];

type TipoTransferencia = 'Definitiva' | 'Prestamo' | 'Vendido';
const TIPO_TRANSFERENCIA_OPCIONES: { value: TipoTransferencia; label: string }[] = [
  { value: 'Definitiva', label: 'Definitiva' },
  { value: 'Prestamo', label: 'Préstamo' },
  { value: 'Vendido', label: 'Vendido' },
];
const tipoTransferenciaRequiereMonto = (tipo: string) => tipo === 'Prestamo' || tipo === 'Vendido';
const etiquetaTipoTransferencia = (tipo: string) =>
  TIPO_TRANSFERENCIA_OPCIONES.find((o) => o.value === tipo)?.label ?? tipo;
const textoMontoTransferencia = (t: { transferType: string; amount?: number; currency: string }) => {
  if (!tipoTransferenciaRequiereMonto(t.transferType)) return '—';
  if (t.amount == null) return 'Sin monto';
  return `${t.amount.toLocaleString('es')} ${t.currency}`;
};
const montoTransferenciaPayload = (
  tipo: string,
  sinMonto: boolean,
  montoStr: string,
): number | undefined => {
  if (!tipoTransferenciaRequiereMonto(tipo)) return undefined;
  if (sinMonto) return undefined;
  const n = Number(montoStr);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
};

const MAX_FOTO_JUGADOR_BYTES = 6 * 1024 * 1024;
const TIPOS_FOTO_JUGADOR = new Set(['image/jpeg', 'image/png', 'image/webp']);

function mensajeErrorApi(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && !(data instanceof Blob)) {
      if ('message' in data && typeof (data as { message: string }).message === 'string') {
        return (data as { message: string }).message;
      }
      if ('error' in data && typeof (data as { error: string }).error === 'string') {
        return (data as { error: string }).error;
      }
    }
    if (error.response?.status === 404) return 'El archivo no se encontró en el servidor.';
    if (error.response?.status === 413) return 'El archivo es demasiado grande (máx. 6 MB).';
    if (error.response?.status === 403) return 'No tienes permiso para subir fotos.';
  }
  return fallback;
}

async function mensajeErrorApiBlob(error: unknown, fallback: string): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const texto = await error.response.data.text();
      if (texto) {
        try {
          const json = JSON.parse(texto) as { message?: string; error?: string };
          if (json.message) return json.message;
          if (json.error) return json.error;
        } catch {
          if (texto.length < 200) return texto;
        }
      }
    } catch { /* ignore */ }
  }
  return mensajeErrorApi(error, fallback);
}

function validarArchivoFotoJugador(file: File): string | null {
  const tipo = file.type.toLowerCase();
  const nombreOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!TIPOS_FOTO_JUGADOR.has(tipo) && !nombreOk) {
    return 'Formato no permitido. Usa JPG, PNG o WEBP.';
  }
  if (file.size > MAX_FOTO_JUGADOR_BYTES) return 'La foto no puede superar 6 MB.';
  return null;
}

/** Multipart: no fijar Content-Type; axios añade el boundary automáticamente. */
async function subirFotoJugadorApi(playerId: string, archivo: File, bearerToken: string) {
  const fd = new FormData();
  fd.append('file', archivo, archivo.name);
  await api.post(`/jugadores/${playerId}/foto`, fd, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
}

function parseNumeroCamiseta(valor: string): number | null {
  const t = valor.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

function datosPersonalesJugadorPayload(
  carnet: string, ciudad: string, domicilio: string, correo: string, telefono: string, numero: string,
) {
  const jerseyNumber = parseNumeroCamiseta(numero);
  return {
    idCardNumber: carnet.trim() || null,
    city: ciudad.trim() || null,
    address: domicilio.trim() || null,
    email: correo.trim() || null,
    phoneNumber: telefono.trim() || null,
    jerseyNumber,
  };
}

type CompatibilityBreakdown = {
  position: number;
  age: number;
  contract: number;
  activity: number;
};

const PERFILES_ROL_SCOUTING: { label: string; position: string; min: number; max: number }[] = [
  { label: 'Delantero U23', position: 'Delantero', min: 18, max: 23 },
  { label: 'Volante 20–28', position: 'Volante', min: 20, max: 28 },
  { label: 'Defensa central', position: 'Defensa central', min: 22, max: 32 },
  { label: 'Lateral joven', position: 'Lateral', min: 18, max: 24 },
];

function scoutingRecommendationText(r: RankingPlayer, index: number): string {
  const score = Number(r.score);
  if (index === 0) return 'Líder del ranking: priorizar dossier y contacto con clubes interesados.';
  if (score >= 80) return 'Señales recientes fuertes: incluir en shortlist comercial activa.';
  if (score >= 70) return 'Buen radar de agencia: actualizar vídeo y estadísticas antes de ofertar.';
  return 'Seguimiento de desarrollo: revisar últimos partidos antes de mover al mercado.';
}

function parseCompatibilityExplanation(explanation: string): CompatibilityBreakdown {
  const extract = (patterns: RegExp[]): number => {
    for (const p of patterns) {
      const m = explanation.match(p);
      if (m && m[1] != null) return Number(m[1]);
    }
    return 0;
  };

  return {
    position: extract([/Ajuste posicional\s*(\d+(?:\.\d+)?)/i, /Posici[oó]n\s*=\s*(\d+(?:\.\d+)?)/i]),
    age: extract([/Edad\s*(\d+(?:\.\d+)?)/i, /Edad\s*=\s*(\d+(?:\.\d+)?)/i]),
    contract: extract([/Contrato\s*(\d+(?:\.\d+)?)/i, /Contrato\s*=\s*(\d+(?:\.\d+)?)/i]),
    activity: extract([/Actividad(?:\s+reciente)?\s*(\d+(?:\.\d+)?)/i, /Actividad\s*=\s*(\d+(?:\.\d+)?)/i]),
  };
}

function validarDatosContratoRepresentacion(j: JugadorCompleto): string | null {
  if (!j.idCardNumber?.trim()) return 'Registre el número de carnet del jugador.';
  if (!j.birthDate) return 'Registre la fecha de nacimiento del jugador.';
  if (!j.city?.trim()) return 'Registre la ciudad del jugador.';
  if (!j.address?.trim()) return 'Registre el domicilio del jugador.';
  if (!j.email?.trim()) return 'Registre el correo del jugador.';
  return null;
}

/** Diccionario país → gentilicio en español (masculino singular). */
const GENTILICIO: Record<string, string> = {
  // América del Sur
  'Colombia': 'Colombiano', 'Bolivia': 'Boliviano', 'Argentina': 'Argentino',
  'Chile': 'Chileno', 'Perú': 'Peruano', 'Ecuador': 'Ecuatoriano',
  'Uruguay': 'Uruguayo', 'Paraguay': 'Paraguayo', 'Venezuela': 'Venezolano',
  'Brasil': 'Brasileño', 'Guyana': 'Guyanés', 'Surinam': 'Surinamés',
  // América Central y Caribe
  'México': 'Mexicano', 'Costa Rica': 'Costarricense', 'Honduras': 'Hondureño',
  'Guatemala': 'Guatemalteco', 'El Salvador': 'Salvadoreño', 'Panamá': 'Panameño',
  'Nicaragua': 'Nicaragüense', 'Cuba': 'Cubano', 'Jamaica': 'Jamaicano',
  'República Dominicana': 'Dominicano', 'Haití': 'Haitiano', 'Puerto Rico': 'Puertorriqueño',
  // América del Norte
  'Estados Unidos': 'Estadounidense', 'Canadá': 'Canadiense',
  // Europa
  'España': 'Español', 'Francia': 'Francés', 'Alemania': 'Alemán', 'Italia': 'Italiano',
  'Portugal': 'Portugués', 'Inglaterra': 'Inglés', 'Reino Unido': 'Británico',
  'Holanda': 'Holandés', 'Países Bajos': 'Neerlandés', 'Bélgica': 'Belga',
  'Suiza': 'Suizo', 'Austria': 'Austriaco', 'Suecia': 'Sueco', 'Noruega': 'Noruego',
  'Dinamarca': 'Danés', 'Finlandia': 'Finlandés', 'Polonia': 'Polaco',
  'Croacia': 'Croata', 'Serbia': 'Serbio', 'Rumanía': 'Rumano', 'Hungría': 'Húngaro',
  'Grecia': 'Griego', 'República Checa': 'Checo', 'Eslovaquia': 'Eslovaco',
  'Ucrania': 'Ucraniano', 'Rusia': 'Ruso', 'Turquía': 'Turco',
  // África
  'Marruecos': 'Marroquí', 'Senegal': 'Senegalés', 'Nigeria': 'Nigeriano',
  'Ghana': 'Ghanés', 'Costa de Marfil': 'Marfileño', 'Camerún': 'Camerunés',
  'Egipto': 'Egipcio', 'Argelia': 'Argelino', 'Túnez': 'Tunecino',
  'Mali': 'Maliense', 'Guinea': 'Guineano', 'Congo': 'Congoleño',
  'Sudáfrica': 'Sudafricano', 'Etiopía': 'Etíope', 'Kenia': 'Keniata',
  // Asia y Oceanía
  'Japón': 'Japonés', 'Corea del Sur': 'Surcoreano', 'China': 'Chino',
  'Australia': 'Australiano', 'Nueva Zelanda': 'Neozelandés',
  'Arabia Saudita': 'Saudí', 'Irán': 'Iraní', 'Iraq': 'Iraquí',
};

const BOLIVIA_2026_CATEGORIAS = [
  { name: 'Primera División', level: 1 },
  { name: 'Segunda División / Ascenso Nacional', level: 2 },
  { name: 'División Regional / Departamental', level: 3 },
  { name: 'Liga Juvenil', level: 4 },
  { name: 'Liga Femenina', level: 4 },
  { name: 'Liga Amateur', level: 5 },
] as const;

const BOLIVIA_2026_COMPETICIONES = [
  { name: 'Liga de la División Profesional', category: 'Primera División', divisionLevel: 1, isProfessional: true },
  { name: 'Copa Simón Bolívar', category: 'Segunda División / Ascenso Nacional', divisionLevel: 2, isProfessional: true },
  { name: 'ACF Primera A', category: 'División Regional / Departamental', divisionLevel: 3, isProfessional: false },
  { name: 'Liga Femenina FBF', category: 'Liga Femenina', divisionLevel: 1, isProfessional: true },
] as const;

const BOLIVIA_2026_CLUBES_PRIMERA = [
  { name: 'Always Ready', city: 'El Alto' },
  { name: 'The Strongest', city: 'La Paz' },
  { name: 'Bolívar', city: 'La Paz' },
  { name: 'Aurora', city: 'Cochabamba' },
  { name: 'Oriente Petrolero', city: 'Santa Cruz de la Sierra' },
  { name: 'Blooming', city: 'Santa Cruz de la Sierra' },
  { name: 'Independiente', city: 'Sucre' },
  { name: 'Nacional Potosí', city: 'Potosí' },
  { name: 'San Antonio', city: 'Entre Ríos' },
  { name: 'A.B.B.', city: 'La Paz' },
  { name: 'Real Potosí', city: 'Potosí' },
  { name: 'FC Universitario', city: 'Vinto' },
] as const;

type PresetClubBase = { name: string; city: string };
type PresetSudamericaCountry = {
  country: string;
  nationality: string;
  firstDivisionCompetition: string;
  clubs: readonly PresetClubBase[];
};

const SUDAMERICA_BASE: PresetSudamericaCountry[] = [
  {
    country: 'Argentina',
    nationality: 'Argentino',
    firstDivisionCompetition: 'Liga Profesional Argentina',
    clubs: [
      { name: 'River Plate', city: 'Buenos Aires' },
      { name: 'Boca Juniors', city: 'Buenos Aires' },
      { name: 'Racing Club', city: 'Avellaneda' },
      { name: 'Independiente', city: 'Avellaneda' },
      { name: 'San Lorenzo', city: 'Buenos Aires' },
      { name: 'Vélez Sarsfield', city: 'Buenos Aires' },
    ],
  },
  {
    country: 'Bolivia',
    nationality: 'Boliviano',
    firstDivisionCompetition: 'Liga de la División Profesional',
    clubs: BOLIVIA_2026_CLUBES_PRIMERA,
  },
  {
    country: 'Brasil',
    nationality: 'Brasileño',
    firstDivisionCompetition: 'Campeonato Brasileiro Série A',
    clubs: [
      { name: 'Flamengo', city: 'Río de Janeiro' },
      { name: 'Palmeiras', city: 'São Paulo' },
      { name: 'Corinthians', city: 'São Paulo' },
      { name: 'São Paulo', city: 'São Paulo' },
      { name: 'Santos', city: 'Santos' },
      { name: 'Fluminense', city: 'Río de Janeiro' },
    ],
  },
  {
    country: 'Chile',
    nationality: 'Chileno',
    firstDivisionCompetition: 'Campeonato Nacional de Primera División',
    clubs: [
      { name: 'Colo-Colo', city: 'Santiago' },
      { name: 'Universidad de Chile', city: 'Santiago' },
      { name: 'Universidad Católica', city: 'Santiago' },
      { name: 'Unión Española', city: 'Santiago' },
    ],
  },
  {
    country: 'Colombia',
    nationality: 'Colombiano',
    firstDivisionCompetition: 'Liga BetPlay Dimayor',
    clubs: [
      { name: 'Atlético Nacional', city: 'Medellín' },
      { name: 'Millonarios', city: 'Bogotá' },
      { name: 'América de Cali', city: 'Cali' },
      { name: 'Deportivo Cali', city: 'Cali' },
      { name: 'Independiente Santa Fe', city: 'Bogotá' },
      { name: 'Junior', city: 'Barranquilla' },
    ],
  },
  {
    country: 'Ecuador',
    nationality: 'Ecuatoriano',
    firstDivisionCompetition: 'LigaPro Serie A',
    clubs: [
      { name: 'Barcelona SC', city: 'Guayaquil' },
      { name: 'Emelec', city: 'Guayaquil' },
      { name: 'Liga de Quito', city: 'Quito' },
      { name: 'Independiente del Valle', city: 'Sangolquí' },
    ],
  },
  {
    country: 'Paraguay',
    nationality: 'Paraguayo',
    firstDivisionCompetition: 'Primera División de Paraguay',
    clubs: [
      { name: 'Olimpia', city: 'Asunción' },
      { name: 'Cerro Porteño', city: 'Asunción' },
      { name: 'Libertad', city: 'Asunción' },
      { name: 'Guaraní', city: 'Asunción' },
    ],
  },
  {
    country: 'Perú',
    nationality: 'Peruano',
    firstDivisionCompetition: 'Liga 1',
    clubs: [
      { name: 'Universitario', city: 'Lima' },
      { name: 'Alianza Lima', city: 'Lima' },
      { name: 'Sporting Cristal', city: 'Lima' },
      { name: 'Melgar', city: 'Arequipa' },
    ],
  },
  {
    country: 'Uruguay',
    nationality: 'Uruguayo',
    firstDivisionCompetition: 'Primera División de Uruguay',
    clubs: [
      { name: 'Peñarol', city: 'Montevideo' },
      { name: 'Nacional', city: 'Montevideo' },
      { name: 'Defensor Sporting', city: 'Montevideo' },
      { name: 'Danubio', city: 'Montevideo' },
    ],
  },
  {
    country: 'Venezuela',
    nationality: 'Venezolano',
    firstDivisionCompetition: 'Primera División de Venezuela',
    clubs: [
      { name: 'Caracas FC', city: 'Caracas' },
      { name: 'Deportivo Táchira', city: 'San Cristóbal' },
      { name: 'Deportivo La Guaira', city: 'La Guaira' },
      { name: 'Monagas', city: 'Maturín' },
    ],
  },
] as const;

/** Listas maestras que consume el front (códigos fijos en API `by-code`). */
const CONFIG_STANDARD_LISTS = [
  {
    code: 'PAISES',
    title: 'Países',
    hint: 'Base de todo: crea los países primero. Se usan en ciudades, clubes y nacionalidades.',
    examples: 'Colombia, Bolivia, Argentina, España, Brasil, Uruguay…',
    icon: 'ri-map-2-line',
  },
  {
    code: 'CIUDADES',
    title: 'Ciudades',
    hint: 'Ciudades vinculadas a un país. Selecciona el país antes de agregar la ciudad.',
    examples: 'Bogotá, La Paz, Santa Cruz, Buenos Aires, Madrid…',
    icon: 'ri-building-4-line',
    requiresCodes: ['PAISES'] as string[],
  },
  {
    code: 'NACIONALIDADES',
    title: 'Nacionalidades',
    hint: 'Vincula cada nacionalidad a su país de origen para mantener coherencia.',
    examples: 'Colombiano, Boliviano, Argentino, Español…',
    icon: 'ri-earth-line',
    requiresCodes: ['PAISES'] as string[],
  },
  {
    code: 'POSICIONES',
    title: 'Posiciones',
    hint: 'Posición principal del jugador en el formulario y filtros.',
    examples: 'Delantero, Extremo, Mediocampista, Defensa central, Lateral, Portero…',
    icon: 'ri-football-line',
  },
  {
    code: 'CATEGORIAS_LIGA',
    title: 'Categorías liga',
    hint: 'Nivel competitivo del club. Se asigna al registrar un club.',
    examples: '1ra División, 2da División, Liga Juvenil, Liga Femenina…',
    icon: 'ri-trophy-line',
  },
  {
    code: 'CLUBES',
    title: 'Clubes',
    hint: 'Club actual del jugador. Requiere países, ciudades y categorías configuradas.',
    examples: 'Millonarios, The Strongest, Bolívar, Barcelona SC…',
    icon: 'ri-building-2-line',
    requiresCodes: ['PAISES', 'CIUDADES', 'CATEGORIAS_LIGA'] as string[],
  },
] as const;

function slugCatalogItemCode(name: string, existingCodes?: string[]): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase()
    .slice(0, 28);
  const slug = base || `IT`;
  if (!existingCodes || !existingCodes.includes(slug)) return slug;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${slug}_${i}`;
    if (!existingCodes.includes(candidate)) return candidate;
  }
  return `${slug}_${Date.now().toString().slice(-6)}`;
}

const TABS = [
  'Jugadores', 'Perfil', 'Contratos', 'Historial de clubes',
  'Negociaciones', 'Transferencias', 'Reportes',
  'Inteligencia', 'Estadísticas', 'Notificaciones',
  'Auditoría', 'Parámetros de configuración', 'Administración'
] as const;
type Tab = typeof TABS[number];
type SubVistaNegociaciones = 'ofertas' | 'estado' | 'historial';
type SubVistaInteligencia = 'ranking' | 'recomendaciones' | 'compatibilidad' | 'parametros';
type SubVistaSeguridad = 'sesion' | 'usuarios' | 'permisos' | 'roles' | 'bitacoras';
type ParamSubTab = 'PAISES' | 'CIUDADES' | 'NACIONALIDADES' | 'POSICIONES' | 'CATEGORIAS_LIGA' | 'CLUBES' | 'AVANZADO' | 'DATOS_ANALISIS';

type SessionUser = { email: string; fullName: string; roles: string[]; expiresAtUtc?: string };

const TITULOS_SUBVISTA_SEGURIDAD: Record<SubVistaSeguridad, string> = {
  sesion: 'Autenticación y sesión',
  usuarios: 'Gestionar usuarios',
  permisos: 'Administrar permisos',
  roles: 'Gestionar roles',
  bitacoras: 'Gestionar bitácoras',
};

const ROLES_SISTEMA = ['Administrador', 'Supervisor', 'Representante', 'Consulta'] as const;

const DESCRIPCION_ROLES: Record<(typeof ROLES_SISTEMA)[number], string> = {
  Administrador: 'Control total del portal: usuarios, parámetros, operaciones y consultas.',
  Supervisor: 'Supervisa operaciones comerciales y consulta reportes; no administra usuarios ni parámetros globales.',
  Representante: 'Gestiona jugadores, negociaciones y transferencias del día a día.',
  Consulta: 'Solo lectura: puede ver datos y reportes sin modificar operaciones.',
};

const MATRIZ_PERMISOS: { capacidad: string; politica: string; roles: string[] }[] = [
  { capacidad: 'Consultar jugadores, reportes y notificaciones', politica: 'CanRead', roles: ['Administrador', 'Supervisor', 'Representante', 'Consulta'] },
  { capacidad: 'Crear y editar negociaciones, transferencias y estadísticas', politica: 'CanManageOperations', roles: ['Administrador', 'Supervisor', 'Representante'] },
  { capacidad: 'Administrar usuarios, roles y bitácoras de auditoría', politica: 'CanConfigure', roles: ['Administrador'] },
  { capacidad: 'Configurar listas maestras (países, clubes, posiciones…)', politica: 'CanConfigure', roles: ['Administrador'] },
];

function parseJwtSession(token: string): SessionUser | null {
  if (!token || token.split('.').length < 2) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    const email = String(
      payload.email
      ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      ?? '',
    );
    const fullName = String(
      payload['http://schemas.xmlsoap.org/ws/2005/06/identity/claims/name']
      ?? payload.unique_name
      ?? payload.name
      ?? '',
    );
    const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload.role;
    const roles = roleClaim == null ? [] : Array.isArray(roleClaim) ? roleClaim.map(String) : [String(roleClaim)];
    const exp = typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
    return { email, fullName, roles, expiresAtUtc: exp?.toISOString() };
  } catch {
    return null;
  }
}
const TAB_META: Record<Tab, { icon: string; group: string }> = {
  Jugadores: { icon: 'ri-team-line', group: 'Operaciones' },
  Perfil: { icon: 'ri-id-card-line', group: 'Operaciones' },
  Contratos: { icon: 'ri-file-text-line', group: 'Operaciones' },
  'Historial de clubes': { icon: 'ri-history-line', group: 'Operaciones' },
  Negociaciones: { icon: 'ri-handshake-line', group: 'Operaciones' },
  Transferencias: { icon: 'ri-exchange-funds-line', group: 'Operaciones' },
  Reportes: { icon: 'ri-bar-chart-box-line', group: 'Analitica' },
  Inteligencia: { icon: 'ri-brain-line', group: 'Analitica' },
  Estadísticas: { icon: 'ri-line-chart-line', group: 'Analitica' },
  Notificaciones: { icon: 'ri-notification-3-line', group: 'Sistema' },
  Auditoría: { icon: 'ri-shield-check-line', group: 'Sistema' },
  'Parámetros de configuración': { icon: 'ri-settings-3-line', group: 'Sistema' },
  Administración: { icon: 'ri-admin-line', group: 'Sistema' },
};

/** Una opción del menú lateral: texto visible (según mapa de módulos) y pestaña interna que abre. */
type OpcionMenuLateral = {
  etiqueta: string;
  pestana: Tab;
  subVista?: SubVistaNegociaciones;
  subVistaInteligencia?: SubVistaInteligencia;
  subVistaSeguridad?: SubVistaSeguridad;
  paramSubTabDestino?: ParamSubTab;
};

/** Bloque del sidebar: título del módulo sustantivo + opciones anidadas. */
type ModuloMenuLateral = {
  id: string;
  titulo: string;
  iconoModulo: string;
  opciones: OpcionMenuLateral[];
};

/**
 * Menú izquierdo agrupado por límites sustantivos (portal Fortis).
 * Cada etiqueta coincide con el alcance funcional del diagrama; varias opciones pueden apuntar a la misma pestaña.
 */
const MODULOS_MENU: ModuloMenuLateral[] = [
  {
    id: 'gestion-integral-jugador',
    titulo: 'Módulo de gestión integral del jugador',
    iconoModulo: 'ri-user-settings-line',
    opciones: [
      { etiqueta: 'Administrar contratos', pestana: 'Contratos' },
      { etiqueta: 'Administrar transferencias', pestana: 'Transferencias' },
      { etiqueta: 'Administrar historial de clubes', pestana: 'Historial de clubes' },
      { etiqueta: 'Administrar jugadores', pestana: 'Jugadores' },
      { etiqueta: 'Perfil y ficha del jugador', pestana: 'Perfil' },
    ],
  },
  {
    id: 'negociaciones',
    titulo: 'Módulo de negociaciones',
    iconoModulo: 'ri-handshake-line',
    opciones: [
      { etiqueta: 'Administrar ofertas', pestana: 'Negociaciones', subVista: 'ofertas' },
      { etiqueta: 'Estado de negociación', pestana: 'Negociaciones', subVista: 'estado' },
      { etiqueta: 'Historial de conversaciones', pestana: 'Negociaciones', subVista: 'historial' },
    ],
  },
  {
    id: 'recomendacion-inteligente',
    titulo: 'Módulo de recomendación inteligente',
    iconoModulo: 'ri-brain-line',
    opciones: [
      { etiqueta: 'Analizar datos de jugadores', pestana: 'Estadísticas' },
      { etiqueta: 'Generar ranking de jugadores', pestana: 'Inteligencia', subVistaInteligencia: 'ranking' },
      { etiqueta: 'Generar recomendaciones', pestana: 'Inteligencia', subVistaInteligencia: 'recomendaciones' },
      { etiqueta: 'Buscar candidatos para un rol', pestana: 'Inteligencia', subVistaInteligencia: 'compatibilidad' },
    ],
  },
  {
    id: 'notificaciones-avisos',
    titulo: 'Módulo de notificaciones y avisos',
    iconoModulo: 'ri-notification-3-line',
    opciones: [
      { etiqueta: 'Gestiona recordatorios de contratos vencidos', pestana: 'Notificaciones' },
      { etiqueta: 'Notificaciones del estado de negociación', pestana: 'Notificaciones' },
    ],
  },
  {
    id: 'reportes',
    titulo: 'Módulo de reportes',
    iconoModulo: 'ri-bar-chart-box-line',
    opciones: [
      { etiqueta: 'Genera reportes de jugadores', pestana: 'Reportes' },
      { etiqueta: 'Genera reportes estadísticos', pestana: 'Reportes' },
      { etiqueta: 'Genera reportes de los contratos', pestana: 'Reportes' },
      { etiqueta: 'Genera reportes personalizados de las transferencias', pestana: 'Reportes' },
      { etiqueta: 'Genera reportes de jugadores personalizados', pestana: 'Reportes' },
    ],
  },
  {
    id: 'configuracion-parametros',
    titulo: 'Módulo de configuración y parámetros',
    iconoModulo: 'ri-settings-3-line',
    opciones: [
      { etiqueta: 'Administrar parámetros', pestana: 'Parámetros de configuración' },
      { etiqueta: 'Gestionar catálogos', pestana: 'Parámetros de configuración' },
      { etiqueta: 'Cargar datos para análisis de jugadores', pestana: 'Parámetros de configuración', paramSubTabDestino: 'DATOS_ANALISIS' },
      { etiqueta: 'Pesos del modelo de scouting', pestana: 'Inteligencia', subVistaInteligencia: 'parametros' },
    ],
  },
  {
    id: 'usuario-seguridad-auditoria',
    titulo: 'Módulo de usuario, seguridad y auditoría',
    iconoModulo: 'ri-shield-user-line',
    opciones: [
      { etiqueta: 'Autenticación y sesión', pestana: 'Administración', subVistaSeguridad: 'sesion' },
      { etiqueta: 'Gestionar usuarios', pestana: 'Administración', subVistaSeguridad: 'usuarios' },
      { etiqueta: 'Administrar permisos', pestana: 'Administración', subVistaSeguridad: 'permisos' },
      { etiqueta: 'Gestionar roles', pestana: 'Administración', subVistaSeguridad: 'roles' },
      { etiqueta: 'Gestionar bitácoras', pestana: 'Administración', subVistaSeguridad: 'bitacoras' },
    ],
  },
];

function tituloModuloDePestana(pestana: Tab | null): string {
  if (pestana === null) {
    return 'Ningún módulo seleccionado — use el menú lateral';
  }
  const encontrado = MODULOS_MENU.find((m) => m.opciones.some((o) => o.pestana === pestana));
  return encontrado?.titulo ?? TAB_META[pestana].group;
}

function estadoInicialModulosCerrados(): Record<string, boolean> {
  const vacio: Record<string, boolean> = {};
  MODULOS_MENU.forEach((m) => {
    vacio[m.id] = false;
  });
  return vacio;
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

let _toastId = 0;

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => sessionStorage.getItem('fortis.token') ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('fortis.theme') === 'dark');
  const [isSidebarCompact, setIsSidebarCompact] = useState(() => localStorage.getItem('fortis.sidebar.compact') === '1');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  /** Acordeón del menú lateral: qué módulos están desplegados (solo uno abierto a la vez). */
  const [modulosAbiertos, setModulosAbiertos] = useState<Record<string, boolean>>(estadoInicialModulosCerrados);

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    if (token) sessionStorage.setItem('fortis.token', token);
    else sessionStorage.removeItem('fortis.token');
    if (token) {
      const sesion = parseJwtSession(token);
      setSessionUser(sesion);
      if (sesion?.email) setEmail(sesion.email);
    } else {
      setSessionUser(null);
    }
  }, [token]);
  const lastToastRef = useRef<{ text: string; type: 'ok' | 'err'; at: number } | null>(null);

  // ── Toasts ────────────────────────────────────────────────────────────────
  const toast = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.text === text && lastToastRef.current.type === type && now - lastToastRef.current.at < 1500) {
      return;
    }
    lastToastRef.current = { text, type, at: now };
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const ok = useCallback((t: string) => toast(t, 'ok'), [toast]);
  const err = useCallback((t: string) => toast(t, 'err'), [toast]);

  const fechaMinNacimientoJugador = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d.toISOString().slice(0, 10);
  }, []);

  /** Abre solo el módulo indicado; si ya estaba abierto, lo cierra (acordeón). */
  const alternarModulo = useCallback((idModulo: string) => {
    setModulosAbiertos((prev) => {
      if (prev[idModulo]) {
        return { ...prev, [idModulo]: false };
      }
      const siguiente: Record<string, boolean> = {};
      MODULOS_MENU.forEach((m) => {
        siguiente[m.id] = m.id === idModulo;
      });
      return siguiente;
    });
  }, []);

  const abrirSoloModulo = useCallback((idModulo: string) => {
    setModulosAbiertos(() => {
      const siguiente: Record<string, boolean> = {};
      MODULOS_MENU.forEach((m) => {
        siguiente[m.id] = m.id === idModulo;
      });
      return siguiente;
    });
  }, []);

  const blobDownload = (data: Blob | ArrayBuffer, filename: string, mime = 'application/octet-stream') => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  const totalPages = (total: number, size: number) => Math.max(1, Math.ceil(total / size));
  const confirmAction = (message: string) => window.confirm(message);

  useEffect(() => {
    localStorage.setItem('fortis.theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    localStorage.setItem('fortis.sidebar.compact', isSidebarCompact ? '1' : '0');
  }, [isSidebarCompact]);

  // ── Polling de notificaciones ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const res = await api.get<number>('/notificaciones/sin-leer', authHeaders);
        setUnreadCount(res.data ?? 0);
      } catch { /* sin red, ignorar */ }
    };
    void poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [token, authHeaders]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const dash = await api.get<DashboardReport>('/reportes/panel', authHeaders);
        setDashboard(dash.data);
      } catch {
        // Sin bloquear la UI si falla dashboard inicial
      }
    })();
  }, [token, authHeaders]);

  // ── Jugadores ─────────────────────────────────────────────────────────────
  const [jugadores, setJugadores] = useState<FilaJugador[]>([]);
  const [busquedaJugadores, setBusquedaJugadores] = useState('');
  const [estadoAgenciaFiltro, setEstadoAgenciaFiltro] = useState('');
  const [filtroPosicion, setFiltroPosicion] = useState('');
  const [edadMinimaFiltro, setEdadMinimaFiltro] = useState('');
  const [edadMaximaFiltro, setEdadMaximaFiltro] = useState('');
  const [pieFiltro, setPieFiltro] = useState('');
  const [nacionalidadFiltroJugadores, setNacionalidadFiltroJugadores] = useState('');
  const [paginaJugadores, setPaginaJugadores] = useState(1);
  const [totalJugadores, setTotalJugadores] = useState(0);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState<JugadorCompleto | null>(null);
  const [nombreJugador, setNombreJugador] = useState('');
  const [apellidoJugador, setApellidoJugador] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [nacionalidadJugador, setNacionalidadJugador] = useState('');
  const [posicionPrincipal, setPosicionPrincipal] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [pieHabil, setPieHabil] = useState('');
  const [clubActual, setClubActual] = useState('');
  const [carnetJugador, setCarnetJugador] = useState('');
  const [ciudadJugador, setCiudadJugador] = useState('');
  const [domicilioJugador, setDomicilioJugador] = useState('');
  const [correoJugador, setCorreoJugador] = useState('');
  const [telefonoJugador, setTelefonoJugador] = useState('');
  const [numeroJugador, setNumeroJugador] = useState('');
  const [fotoRegistroArchivo, setFotoRegistroArchivo] = useState<File | null>(null);
  const [previewFotoRegistro, setPreviewFotoRegistro] = useState<string | null>(null);
  const [fotoEdicionArchivo, setFotoEdicionArchivo] = useState<File | null>(null);
  const [opcionesPosicion, setOpcionesPosicion] = useState<CatalogItemRow[]>([]);
  const [opcionesNacionalidad, setOpcionesNacionalidad] = useState<CatalogItemRow[]>([]);
  const [opcionesClubes, setOpcionesClubes] = useState<CatalogItemRow[]>([]);
  const [opcionesPaises, setOpcionesPaises] = useState<CatalogItemRow[]>([]);
  const [opcionesCiudades, setOpcionesCiudades] = useState<CatalogItemRow[]>([]);
  const previewUrlFotoEdicion = useMemo(
    () => (fotoEdicionArchivo ? URL.createObjectURL(fotoEdicionArchivo) : null),
    [fotoEdicionArchivo],
  );
  useEffect(() => () => {
    if (previewUrlFotoEdicion) URL.revokeObjectURL(previewUrlFotoEdicion);
  }, [previewUrlFotoEdicion]);
  const [idJugadorSeleccionado, setIdJugadorSeleccionado] = useState('');
  const csvImportRef = useRef<HTMLInputElement>(null);
  const inputFotoRegistroRef = useRef<HTMLInputElement>(null);
  const inputFotoEdicionRef = useRef<HTMLInputElement>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const TAMANIO_PAGINA_JUGADORES = 10;

  // ── Perfil ────────────────────────────────────────────────────────────────
  const [jugadorPerfil, setJugadorPerfil] = useState<JugadorCompleto | null>(null);
  const [profileContracts, setProfileContracts] = useState<ContractRow[]>([]);
  const [profileDocs, setProfileDocs] = useState<DocumentRow[]>([]);
  const [profileStats, setProfileStats] = useState<StatRow[]>([]);
  const [profileNegs, setProfileNegs] = useState<NegotiationRow[]>([]);
  const [profileTransfers, setProfileTransfers] = useState<TransferRow[]>([]);
  const [profileClubHistory, setProfileClubHistory] = useState<ClubHistoryRow[]>([]);
  const [profileAchievements, setProfileAchievements] = useState<AchievementRow[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Contratos ─────────────────────────────────────────────────────────────
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [contractDuration, setContractDuration] = useState('2');
  const [vistaPreviaContrato, setVistaPreviaContrato] = useState<{
    url: string; titulo: string; blob: Blob; filename: string; mimeType: string;
  } | null>(null);

  const contratoRepresentacionFirmadoRef = useRef<HTMLInputElement>(null);
  const transferContratoClubRegistroRef = useRef<HTMLInputElement>(null);
  const editContratoClubRef = useRef<HTMLInputElement>(null);
  const [trContratoClubNombre, setTrContratoClubNombre] = useState('');
  const [trContratoClubFile, setTrContratoClubFile] = useState<File | null>(null);
  const [editContratoClubNombre, setEditContratoClubNombre] = useState('');
  const [editContratoClubFile, setEditContratoClubFile] = useState<File | null>(null);

  // ── Historial de clubes y logros ──────────────────────────────────────────
  const [clubHistoryRows, setClubHistoryRows] = useState<ClubHistoryRow[]>([]);
  const [hcClubName, setHcClubName] = useState('');
  const [hcCategory, setHcCategory] = useState<string>('PrimeraDivision');
  const [hcYear, setHcYear] = useState(String(ANIO_ACTUAL));
  const [hcNotes, setHcNotes] = useState('');
  const [editingClubHistory, setEditingClubHistory] = useState<ClubHistoryRow | null>(null);
  const [achievementRows, setAchievementRows] = useState<AchievementRow[]>([]);
  const [logroTipo, setLogroTipo] = useState<string>('TituloTorneo');
  const [logroTorneo, setLogroTorneo] = useState('');
  const [logroPais, setLogroPais] = useState('');
  const [logroYear, setLogroYear] = useState(String(ANIO_ACTUAL));
  const [logroNotes, setLogroNotes] = useState('');
  const [editingAchievement, setEditingAchievement] = useState<AchievementRow | null>(null);

  // ── Negociaciones ─────────────────────────────────────────────────────────
  const [negotiations, setNegotiations] = useState<NegotiationRow[]>([]);
  const [subVistaNegociaciones, setSubVistaNegociaciones] = useState<SubVistaNegociaciones>('ofertas');
  const [subVistaInteligencia, setSubVistaInteligencia] = useState<SubVistaInteligencia>('ranking');
  const [subVistaSeguridad, setSubVistaSeguridad] = useState<SubVistaSeguridad>('sesion');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() =>
    parseJwtSession(sessionStorage.getItem('fortis.token') ?? ''),
  );
  const [menuOpcionClave, setMenuOpcionClave] = useState<string | null>(null);
  const [allNegotiations, setAllNegotiations] = useState<NegotiationRow[]>([]);
  const [negEstadoLoading, setNegEstadoLoading] = useState(false);
  const [selectedNegEstadoId, setSelectedNegEstadoId] = useState<string | null>(null);
  const [negStatusUpdating, setNegStatusUpdating] = useState(false);
  const [negOfferVersions, setNegOfferVersions] = useState<VersionOfertaRow[]>([]);
  const [negVersionsLoading, setNegVersionsLoading] = useState(false);
  const [negVersionRegistering, setNegVersionRegistering] = useState(false);
  const [negDeleting, setNegDeleting] = useState(false);
  const [ofertaForm, setOfertaForm] = useState(ofertaNegociacionVacia);
  const [editingNeg, setEditingNeg] = useState<NegotiationRow | null>(null);
  const [editingNegForm, setEditingNegForm] = useState<ReturnType<typeof ofertaNegociacionVacia> | null>(null);

  const [transferNegCompletadas, setTransferNegCompletadas] = useState<NegotiationRow[]>([]);
  const [transferNegLoading, setTransferNegLoading] = useState(false);
  const [transferNegSeleccionadaId, setTransferNegSeleccionadaId] = useState<string | null>(null);
  const [transferClubActualJugador, setTransferClubActualJugador] = useState<string | null>(null);

  const [histConvPlayerId, setHistConvPlayerId] = useState<string | null>(null);
  const [histConvJugadores, setHistConvJugadores] = useState<JugadorHistorialRow[]>([]);
  const [histConvJugadoresLoading, setHistConvJugadoresLoading] = useState(false);
  const [histConversations, setHistConversations] = useState<ConversacionRow[]>([]);
  const [histConvLoading, setHistConvLoading] = useState(false);
  const [histConvSaving, setHistConvSaving] = useState(false);

  // ── Transferencias ────────────────────────────────────────────────────────
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [trClubFiltro, setTrClubFiltro] = useState('');
  const [trTipoFiltro, setTrTipoFiltro] = useState('');
  const [trPage, setTrPage] = useState(1);
  const [trTotal, setTrTotal] = useState(0);
  const [originClub, setOriginClub] = useState('');
  const [destinationClub, setDestinationClub] = useState('');
  const [trTransferDate, setTrTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [trType, setTrType] = useState<TipoTransferencia>('Definitiva');
  const [trSinMonto, setTrSinMonto] = useState(false);
  const [trAmount, setTrAmount] = useState('');
  const [trCurrency, setTrCurrency] = useState('USD');
  const [editingTransfer, setEditingTransfer] = useState<TransferRow | null>(null);
  const [editSinMonto, setEditSinMonto] = useState(false);

  // ── Reportes ──────────────────────────────────────────────────────────────
  const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
  const [negReport, setNegReport] = useState<NegReportRow | null>(null);
  const [trReport, setTrReport] = useState<TrReportRow | null>(null);
  const [contractsReport, setContractsReport] = useState<ContractsReport | null>(null);

  // ── Inteligencia ──────────────────────────────────────────────────────────
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [compatibility, setCompatibility] = useState<CompatibilityResult[]>([]);
  const [targetPosition, setTargetPosition] = useState('Delantero');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('30');
  const [wPosition, setWPosition] = useState(45);
  const [wAge, setWAge] = useState(25);
  const [wContract, setWContract] = useState(15);
  const [wActivity, setWActivity] = useState(15);

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const [statsHistory, setStatsHistory] = useState<StatRow[]>([]);
  const [statsComparePlayerId, setStatsComparePlayerId] = useState('');
  const [statsCompareHistory, setStatsCompareHistory] = useState<StatRow[]>([]);
  const [statsWindow, setStatsWindow] = useState<'5' | '10' | '20' | 'all'>('10');
  const [statOpponent, setStatOpponent] = useState('');
  const [statGoals, setStatGoals] = useState('0');
  const [statAssists, setStatAssists] = useState('0');
  const [statRating, setStatRating] = useState('7.5');
  const [statMinutes, setStatMinutes] = useState('90');
  const [statPlayerIdCargaManual, setStatPlayerIdCargaManual] = useState('');
  const [statMatchDate, setStatMatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statYellowCards, setStatYellowCards] = useState('0');
  const [statRedCards, setStatRedCards] = useState('0');
  const [statPhysicalStatus, setStatPhysicalStatus] = useState('Óptimo');
  const [statNotes, setStatNotes] = useState('');
  const [statsManualHistory, setStatsManualHistory] = useState<StatRow[]>([]);

  // ── Notificaciones ────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  // ── Auditoría ─────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditEntity, setAuditEntity] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditUser, setAuditUser] = useState('');
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');

  // ── Parámetros de configuración (catálogos / listas maestras) ──────────────
  const [catalogs, setCatalogs] = useState<CatalogRow[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItemRow[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemOrder, setItemOrder] = useState('1');
  const [itemCountry, setItemCountry] = useState('');
  const [itemCity, setItemCity] = useState('');
  const [itemLeague, setItemLeague] = useState('');
  const [paramItemsByCode, setParamItemsByCode] = useState<Record<string, CatalogItemRow[]>>({});
  const [paramSubTab, setParamSubTab] = useState<ParamSubTab>('PAISES');
  const [paramDraft, setParamDraft] = useState<Record<string, ParamQuickDraft>>(() =>
    Object.fromEntries(
      CONFIG_STANDARD_LISTS.map((d) => [d.code, { name: '', order: '10', country: '', city: '', league: '', parentItemId: '', categoryItemId: '' }])
    ) as Record<string, ParamQuickDraft>
  );
  // Ciudades filtradas según el país seleccionado en el formulario de clubes
  const [clubCityOptions, setClubCityOptions] = useState<CatalogItemRow[]>([]);
  // Estructura deportiva relacional (fase 2)
  const [sportsCountries, setSportsCountries] = useState<SportsCountryRow[]>([]);
  const [sportsCities, setSportsCities] = useState<SportsCityRow[]>([]);
  const [sportsCategories, setSportsCategories] = useState<SportsCategoryRow[]>([]);
  const [sportsCompetitions, setSportsCompetitions] = useState<SportsCompetitionRow[]>([]);
  const [sportsCompetitionClubs, setSportsCompetitionClubs] = useState<SportsCompetitionClubRow[]>([]);
  const [sportsDataSources, setSportsDataSources] = useState<SportsDataSourceRow[]>([]);
  const [sportsCountryId, setSportsCountryId] = useState('');
  const [sportsSeason, setSportsSeason] = useState(String(new Date().getFullYear()));
  const [sportsCategoryId, setSportsCategoryId] = useState('');
  const [sportsCompetitionId, setSportsCompetitionId] = useState('');
  const [sportsCityId, setSportsCityId] = useState('');
  const [sportsClubName, setSportsClubName] = useState('');
  const [sportsClubShortName, setSportsClubShortName] = useState('');
  const [sportsDataSourceId, setSportsDataSourceId] = useState('');
  const [sportsValidationStatus, setSportsValidationStatus] = useState<'pendiente' | 'validado' | 'observado' | 'duplicado' | 'descartado'>('pendiente');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Representante');

  const cargarCatalogosFormularioJugador = useCallback(async () => {
    const loadItems = async (code: string) => {
      try {
        const res = await api.get<CatalogItemRow[]>(`/catalogos/por-codigo/${code}/elementos`, authHeaders);
        return res.data ?? [];
      } catch {
        return [];
      }
    };
    try {
      const [positions, nationalities, clubs, cities, paises] = await Promise.all([
        loadItems('POSICIONES'),
        loadItems('NACIONALIDADES'),
        loadItems('CLUBES'),
        loadItems('CIUDADES'),
        loadItems('PAISES'),
      ]);
      setOpcionesPosicion(positions);
      setOpcionesNacionalidad(nationalities);
      setOpcionesClubes(clubs);
      setOpcionesCiudades(cities);
      setOpcionesPaises(paises);
    } catch {
      setOpcionesPosicion([]);
      setOpcionesNacionalidad([]);
      setOpcionesClubes([]);
      setOpcionesCiudades([]);
      setOpcionesPaises([]);
      err('No se pudieron cargar los catálogos del jugador.');
    }
  }, [authHeaders, err]);

  const refreshStandardListItems = useCallback(async () => {
    const entries = await Promise.all(
      CONFIG_STANDARD_LISTS.map(async (def) => {
        try {
          const res = await api.get<CatalogItemRow[]>(`/catalogos/por-codigo/${def.code}/elementos`, authHeaders);
          return [def.code, res.data ?? []] as const;
        } catch {
          return [def.code, [] as CatalogItemRow[]] as const;
        }
      })
    );
    setParamItemsByCode(Object.fromEntries(entries) as Record<string, CatalogItemRow[]>);
  }, [authHeaders]);

  const emptyParamQuick = useCallback((): ParamQuickDraft => {
    return { name: '', order: '10', country: '', city: '', league: '', parentItemId: '', categoryItemId: '', nationality: '' };
  }, []);

  const mergeParamDraft = useCallback(
    (code: (typeof CONFIG_STANDARD_LISTS)[number]['code'], patch: Partial<ParamQuickDraft>) => {
      setParamDraft((p) => {
        const prev = p[code] ?? emptyParamQuick();
        return { ...p, [code]: { ...prev, ...patch } };
      });
    },
    [emptyParamQuick]
  );

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/autenticacion/inicio-sesion', { email, password });
      setToken(res.data.accessToken);
      setEmail(res.data.email);
      const sesion = parseJwtSession(res.data.accessToken);
      setSessionUser(sesion ?? {
        email: res.data.email,
        fullName: res.data.fullName,
        roles: [],
        expiresAtUtc: res.data.expiresAtUtc,
      });
      setActiveTab(null);
      setModulosAbiertos(estadoInicialModulosCerrados());
      ok('Sesión iniciada.');
      navigate('/admin');
    } catch { err('No se pudo iniciar sesión. Verifica tus credenciales.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await api.get<Paged<FilaJugador>>('/jugadores?page=1&pageSize=10', authHeaders);
        setJugadores(res.data.items ?? []);
        setTotalJugadores(res.data.totalItems ?? 0);
        setPaginaJugadores(1);
      } catch {
        // no bloquear login si falla carga inicial
      }
    })();
  }, [token, authHeaders]);

  useEffect(() => {
    if (!token || activeTab !== 'Jugadores') return;
    void cargarCatalogosFormularioJugador();
  }, [token, activeTab, authHeaders, cargarCatalogosFormularioJugador]);

  useEffect(() => {
    if (!token || activeTab !== 'Negociaciones' || subVistaNegociaciones !== 'ofertas') return;
    if (!idJugadorSeleccionado) {
      setNegotiations([]);
      return;
    }
    void loadNegotiations();
  }, [token, activeTab, idJugadorSeleccionado, subVistaNegociaciones]);

  useEffect(() => {
    if (!token || activeTab !== 'Negociaciones' || subVistaNegociaciones !== 'estado') return;
    void loadAllNegotiations();
  }, [token, activeTab, subVistaNegociaciones]);

  useEffect(() => {
    if (!token || activeTab !== 'Inteligencia') return;
    if (subVistaInteligencia === 'ranking' || subVistaInteligencia === 'recomendaciones') {
      void loadRanking(true);
    }
  }, [token, activeTab, subVistaInteligencia]);

  useEffect(() => {
    if (!token || activeTab !== 'Administración') return;
    if (subVistaSeguridad === 'usuarios' || subVistaSeguridad === 'roles') void loadUsers(true);
    if (subVistaSeguridad === 'bitacoras') void loadAudit(1, true);
  }, [token, activeTab, subVistaSeguridad]);

  useEffect(() => {
    if (activeTab === 'Auditoría') {
      setSubVistaSeguridad('bitacoras');
      setActiveTab('Administración');
    }
  }, [activeTab]);

  const loadJugadoresHistorialConv = async () => {
    setHistConvJugadoresLoading(true);
    try {
      const res = await api.get<Paged<FilaJugador>>('/jugadores?page=1&pageSize=200', authHeaders);
      setHistConvJugadores(
        (res.data.items ?? []).map((j) => ({
          id: j.id,
          firstName: j.firstName,
          lastName: j.lastName,
          mainPosition: j.mainPosition,
          currentClub: j.currentClub ?? null,
        })),
      );
    } catch {
      setHistConvJugadores([]);
    } finally {
      setHistConvJugadoresLoading(false);
    }
  };

  useEffect(() => {
    if (!token || activeTab !== 'Negociaciones' || subVistaNegociaciones !== 'historial') return;
    void loadJugadoresHistorialConv();
    void loadAllNegotiations();
  }, [token, activeTab, subVistaNegociaciones]);

  const clubesSugeridosHistorial = useMemo(() => {
    if (!histConvPlayerId) return [];
    const clubs = new Set<string>();
    allNegotiations
      .filter((n) => n.playerId === histConvPlayerId)
      .forEach((n) => {
        if (n.clubName.trim()) clubs.add(n.clubName.trim());
      });
    const jugador = histConvJugadores.find((j) => j.id === histConvPlayerId);
    if (jugador?.currentClub?.trim()) clubs.add(jugador.currentClub.trim());
    return [...clubs].sort((a, b) => a.localeCompare(b));
  }, [histConvPlayerId, allNegotiations, histConvJugadores]);

  const loadHistorialConversaciones = async (playerId: string) => {
    setHistConvLoading(true);
    try {
      const res = await api.get<ConversacionRow[]>(
        `/negociaciones/jugador/${playerId}/conversaciones`,
        authHeaders,
      );
      setHistConversations(res.data ?? []);
    } catch {
      setHistConversations([]);
      err('No se pudieron cargar las conversaciones.');
    } finally {
      setHistConvLoading(false);
    }
  };

  useEffect(() => {
    if (!histConvPlayerId) {
      setHistConversations([]);
      return;
    }
    void loadHistorialConversaciones(histConvPlayerId);
  }, [histConvPlayerId, token]);

  const registrarConversacionNegociacion = async (form: ConversacionForm) => {
    if (!histConvPlayerId) {
      err('Selecciona un jugador.');
      return;
    }
    if (!form.clubName.trim()) {
      err('Indica el club de la conversación.');
      return;
    }
    setHistConvSaving(true);
    try {
      await api.post(
        `/negociaciones/jugador/${histConvPlayerId}/conversaciones`,
        payloadConversacionApi(form),
        authHeaders,
      );
      await loadHistorialConversaciones(histConvPlayerId);
      ok('Conversación registrada en el historial.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo guardar la conversación.'));
    } finally {
      setHistConvSaving(false);
    }
  };

  const eliminarConversacionNegociacion = async (conversationId: string) => {
    if (!confirmAction('¿Eliminar este registro del historial de conversaciones?')) return;
    setHistConvSaving(true);
    try {
      await api.delete(`/negociaciones/conversaciones/${conversationId}`, authHeaders);
      if (histConvPlayerId) await loadHistorialConversaciones(histConvPlayerId);
      ok('Registro eliminado.');
    } catch {
      err('No se pudo eliminar el registro.');
    } finally {
      setHistConvSaving(false);
    }
  };

  useEffect(() => {
    if (!token || !selectedNegEstadoId) {
      setNegOfferVersions([]);
      return;
    }
    void loadNegotiationVersions(selectedNegEstadoId);
  }, [token, selectedNegEstadoId]);

  useEffect(() => {
    if (!token || activeTab !== 'Parámetros de configuración') return;
    void (async () => {
      try {
        const res = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        setCatalogs(res.data ?? []);
        await refreshStandardListItems();
      } catch {
        /* sin toast: puede fallar si aún no hay permisos */
      }
    })();
  }, [token, activeTab, authHeaders, refreshStandardListItems]);

  const loadTransferNegociacionesCompletadas = async () => {
    if (!idJugadorSeleccionado) {
      setTransferNegCompletadas([]);
      setTransferClubActualJugador(null);
      setTransferNegSeleccionadaId(null);
      return;
    }
    setTransferNegLoading(true);
    setTransferNegSeleccionadaId(null);
    try {
      const [negRes, jugadorRes] = await Promise.all([
        api.get<NegotiationRow[]>(`/negociaciones/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<JugadorCompleto>(`/jugadores/${idJugadorSeleccionado}`, authHeaders),
      ]);
      const completadas = (negRes.data ?? [])
        .map(normalizarNegociacion)
        .filter((n) => esNegociacionCompletada(n.status))
        .sort((a, b) => b.offerDate.localeCompare(a.offerDate));
      setTransferNegCompletadas(completadas);
      setTransferClubActualJugador(jugadorRes.data?.currentClub?.trim() || null);
    } catch {
      setTransferNegCompletadas([]);
      setTransferClubActualJugador(null);
    } finally {
      setTransferNegLoading(false);
    }
  };

  const aplicarNegociacionATransferencia = (n: Pick<NegotiationRow, 'id' | 'clubName'>) => {
    const origen = transferClubActualJugador?.trim()
      || jugadores.find((p) => p.id === idJugadorSeleccionado)?.currentClub?.trim()
      || '';
    setOriginClub(origen);
    setDestinationClub(n.clubName.trim());
    setTransferNegSeleccionadaId(n.id);
    if (!origen) {
      err('El jugador no tiene club actual registrado. Indica el club origen manualmente.');
    } else {
      ok(`Formulario: ${origen} → ${n.clubName}`);
    }
  };

  useEffect(() => {
    if (!token || activeTab !== 'Transferencias' || !idJugadorSeleccionado) {
      if (activeTab === 'Transferencias' && !idJugadorSeleccionado) {
        setTransferNegCompletadas([]);
        setTransferClubActualJugador(null);
        setTransferNegSeleccionadaId(null);
      }
      return;
    }
    setTrClubFiltro('');
    setTrTipoFiltro('');
    void loadTransfersList(1, { club: '', tipo: '' });
    void loadTransferNegociacionesCompletadas();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar historial al cambiar jugador en esta pestaña
  }, [idJugadorSeleccionado, activeTab, token]);

  useEffect(() => {
    if (!token || activeTab !== 'Historial de clubes' || !idJugadorSeleccionado) return;
    void (async () => {
      try {
        await Promise.all([loadClubHistory(), loadAchievements()]);
      } catch (ex) {
        err(mensajeErrorApi(ex, 'No se pudo cargar el historial del jugador. Reinicia la API si acabas de actualizar el sistema.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar jugador
  }, [idJugadorSeleccionado, activeTab, token]);

  // ─── Jugadores ─────────────────────────────────────────────────────────────

  const cargarJugadores = async (page = paginaJugadores, opts?: { toast?: boolean }) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (busquedaJugadores.trim()) p.set('search', busquedaJugadores.trim());
      if (estadoAgenciaFiltro.trim()) p.set('status', estadoAgenciaFiltro.trim());
      if (filtroPosicion.trim()) p.set('position', filtroPosicion.trim());
      if (nacionalidadFiltroJugadores.trim()) p.set('nationality', nacionalidadFiltroJugadores.trim());
      if (edadMinimaFiltro.trim()) p.set('minAge', edadMinimaFiltro.trim());
      if (edadMaximaFiltro.trim()) p.set('maxAge', edadMaximaFiltro.trim());
      if (pieFiltro.trim()) p.set('preferredFoot', pieFiltro.trim());
      p.set('page', String(page)); p.set('pageSize', String(TAMANIO_PAGINA_JUGADORES));
      const res = await api.get<Paged<FilaJugador>>(`/jugadores?${p}`, authHeaders);
      setJugadores(res.data.items ?? []);
      setTotalJugadores(res.data.totalItems ?? 0);
      setPaginaJugadores(page);
      if (opts?.toast) ok(`${res.data.totalItems ?? 0} jugadores encontrados.`);
    } catch { err('No se pudieron cargar jugadores.'); }
    finally { setLoading(false); }
  };

  const abrirEdicionJugador = async (id: string) => {
    try {
      setFotoEdicionArchivo(null);
      if (inputFotoEdicionRef.current) inputFotoEdicionRef.current.value = '';
      const res = await api.get<JugadorCompleto>(`/jugadores/${id}`, authHeaders);
      setJugadorEnEdicion(res.data);
    } catch { err('No se pudo cargar el jugador.'); }
  };

  const guardarEdicionJugador = async (e: FormEvent) => {
    e.preventDefault();
    if (!jugadorEnEdicion) return;
    const pid = jugadorEnEdicion.id;
    try {
      await api.put(`/jugadores/${pid}`, {
        firstName: jugadorEnEdicion.firstName, lastName: jugadorEnEdicion.lastName,
        birthDate: jugadorEnEdicion.birthDate, nationality: jugadorEnEdicion.nationality,
        mainPosition: jugadorEnEdicion.mainPosition, currentClub: jugadorEnEdicion.currentClub || null,
        heightCm: jugadorEnEdicion.heightCm ?? null, weightKg: jugadorEnEdicion.weightKg ?? null,
        preferredFoot: jugadorEnEdicion.preferredFoot || null,
        idCardNumber: jugadorEnEdicion.idCardNumber || null,
        city: jugadorEnEdicion.city || null,
        address: jugadorEnEdicion.address || null,
        email: jugadorEnEdicion.email || null,
        phoneNumber: jugadorEnEdicion.phoneNumber || null,
        jerseyNumber: jugadorEnEdicion.jerseyNumber ?? null,
        agencyStatus: jugadorEnEdicion.agencyStatus, contractStatus: jugadorEnEdicion.contractStatus,
        isVisible: jugadorEnEdicion.isVisible, notes: jugadorEnEdicion.notes || null
      }, authHeaders);
      if (fotoEdicionArchivo) {
        await subirFotoJugadorApi(pid, fotoEdicionArchivo, token);
      }
      setFotoEdicionArchivo(null);
      if (inputFotoEdicionRef.current) inputFotoEdicionRef.current.value = '';
      setJugadorEnEdicion(null);
      await cargarJugadores(paginaJugadores);
      ok('Jugador actualizado correctamente.');
    } catch (e) { err(mensajeErrorApi(e, 'No se pudo actualizar el jugador.')); }
  };

  const eliminarJugador = async (id: string) => {
    if (!confirmAction('¿Eliminar este jugador? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/jugadores/${id}`, authHeaders);
      if (idJugadorSeleccionado === id) setIdJugadorSeleccionado('');
      setJugadorEnEdicion(null);
      await cargarJugadores(paginaJugadores);
      ok('Jugador eliminado.');
    } catch { err('No se pudo eliminar el jugador.'); }
  };

  const limpiarFotoRegistro = useCallback(() => {
    setFotoRegistroArchivo(null);
    setPreviewFotoRegistro((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputFotoRegistroRef.current) inputFotoRegistroRef.current.value = '';
  }, []);

  const onFotoRegistroSeleccionada = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const msg = validarArchivoFotoJugador(f);
    if (msg) {
      err(msg);
      e.target.value = '';
      return;
    }
    setFotoRegistroArchivo(f);
    setPreviewFotoRegistro((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, [err]);

  const onFotoEdicionSeleccionada = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const msg = validarArchivoFotoJugador(f);
    if (msg) {
      err(msg);
      e.target.value = '';
      return;
    }
    setFotoEdicionArchivo(f);
  }, [err]);

  const crearJugador = async (e: FormEvent) => {
    e.preventDefault();
    const nombre = nombreJugador.trim();
    const apellido = apellidoJugador.trim();
    if (!nombre || !apellido) {
      err('Nombre y apellido son obligatorios.');
      return;
    }
    if (!fechaNacimiento || !nacionalidadJugador || !posicionPrincipal) {
      err('Completa fecha de nacimiento, nacionalidad y posición.');
      return;
    }
    if (numeroJugador.trim() && parseNumeroCamiseta(numeroJugador) === null) {
      err('El número de jugador debe ser un entero entre 0 y 99.');
      return;
    }
    if (correoJugador.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoJugador.trim())) {
      err('El correo electrónico no es válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<JugadorCompleto>('/jugadores', {
        firstName: nombre,
        lastName: apellido,
        birthDate: fechaNacimiento,
        nationality: nacionalidadJugador,
        mainPosition: posicionPrincipal,
        currentClub: clubActual.trim() || null,
        heightCm: alturaCm.trim() ? Number(alturaCm) : null,
        weightKg: pesoKg.trim() ? Number(pesoKg) : null,
        preferredFoot: pieHabil.trim() || null,
        notes: null,
        ...datosPersonalesJugadorPayload(carnetJugador, ciudadJugador, domicilioJugador, correoJugador, telefonoJugador, numeroJugador),
      }, authHeaders);
      const newId = res.data?.id;
      if (!newId) {
        err('El jugador se creó pero no se recibió el identificador; recarga el listado.');
        await cargarJugadores(1);
        return;
      }
      if (fotoRegistroArchivo) {
        try {
          await subirFotoJugadorApi(newId, fotoRegistroArchivo, token);
        } catch (fotoErr) {
          err(mensajeErrorApi(fotoErr, 'Jugador creado, pero no se pudo subir la foto. Edítalo y vuelve a subirla.'));
          await cargarJugadores(1);
          return;
        }
      }
      setNombreJugador('');
      setApellidoJugador('');
      setFechaNacimiento('');
      setNacionalidadJugador('');
      setPosicionPrincipal('');
      setAlturaCm('');
      setPesoKg('');
      setPieHabil('');
      setClubActual('');
      setCarnetJugador('');
      setCiudadJugador('');
      setDomicilioJugador('');
      setCorreoJugador('');
      setTelefonoJugador('');
      setNumeroJugador('');
      limpiarFotoRegistro();
      await cargarJugadores(1);
      ok(fotoRegistroArchivo ? 'Jugador registrado con foto.' : 'Jugador registrado.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo registrar el jugador. Revisa los datos (altura 120–230 cm, peso 40–150 kg).'));
    } finally {
      setLoading(false);
    }
  };

  const bulkImport = async (e: FormEvent) => {
    e.preventDefault();
    const file = csvImportRef.current?.files?.[0];
    if (!file) { err('Selecciona un archivo CSV.'); return; }
    setLoading(true);
    try {
      const form = new FormData(); form.append('file', file, file.name);
      const res = await api.post<BulkResult>('/jugadores/importar', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBulkResult(res.data);
      if (csvImportRef.current) csvImportRef.current.value = '';
      await cargarJugadores(1);
      ok(`Importación: ${res.data.created} creados, ${res.data.skipped} omitidos.`);
    } catch { err('No se pudo importar el CSV.'); }
    finally { setLoading(false); }
  };

  // ─── Perfil completo ───────────────────────────────────────────────────────

  const loadProfile = async () => {
    if (!idJugadorSeleccionado) { err('Selecciona un jugador en la pestaña Jugadores.'); return; }
    setProfileLoading(true);
    try {
      const [pRes, cRes, dRes, sRes, nRes, tRes, hRes, aRes] = await Promise.all([
        api.get<JugadorCompleto>(`/jugadores/${idJugadorSeleccionado}`, authHeaders),
        api.get<ContractRow[]>(`/contratos/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<DocumentRow[]>(`/documentos/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<StatRow[]>(`/estadisticas-jugador/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<NegotiationRow[]>(`/negociaciones/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<Paged<TransferRow>>(`/transferencias?pageSize=50`, authHeaders),
        api.get<ClubHistoryRow[]>(`/historial-clubes/jugador/${idJugadorSeleccionado}`, authHeaders),
        api.get<AchievementRow[]>(`/logros-deportivos/jugador/${idJugadorSeleccionado}`, authHeaders),
      ]);
      setJugadorPerfil(pRes.data);
      setProfileContracts(cRes.data ?? []);
      setProfileDocs(dRes.data ?? []);
      setProfileStats(sRes.data ?? []);
      setProfileNegs(nRes.data ?? []);
      setProfileTransfers((tRes.data?.items ?? []).filter((t) => t.playerId === idJugadorSeleccionado));
      setProfileClubHistory(hRes.data ?? []);
      setProfileAchievements(aRes.data ?? []);
      ok(`Perfil de ${pRes.data.firstName} ${pRes.data.lastName} cargado.`);
    } catch { err('No se pudo cargar el perfil completo.'); }
    finally { setProfileLoading(false); }
  };

  const downloadFullReport = async () => {
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    try {
      const res = await api.get(`/jugadores/${idJugadorSeleccionado}/informe-completo`, { ...authHeaders, responseType: 'blob' });
      blobDownload(res.data, `informe_${idJugadorSeleccionado}.pdf`);
      ok('Informe PDF descargado.');
    } catch { err('No se pudo generar el informe completo.'); }
  };

  // ─── Contratos ─────────────────────────────────────────────────────────────

  const loadContracts = async () => {
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    try {
      const res = await api.get<ContractRow[]>(`/contratos/jugador/${idJugadorSeleccionado}`, authHeaders);
      setContracts(res.data ?? []);
      ok('Contratos cargados.');
    } catch { err('No se pudieron cargar contratos.'); }
  };

  const obtenerJugadorSeleccionado = async (): Promise<JugadorCompleto | null> => {
    if (!idJugadorSeleccionado) {
      err('Selecciona un jugador.');
      return null;
    }
    try {
      const res = await api.get<JugadorCompleto>(`/jugadores/${idJugadorSeleccionado}`, authHeaders);
      return res.data;
    } catch {
      err('No se pudieron cargar los datos del jugador.');
      return null;
    }
  };

  const cerrarVistaPreviaContrato = useCallback(() => {
    setVistaPreviaContrato((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!vistaPreviaContrato) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarVistaPreviaContrato();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [vistaPreviaContrato, cerrarVistaPreviaContrato]);

  const vistaPreviaRepresentacion = async () => {
    const j = await obtenerJugadorSeleccionado();
    if (!j) return;
    const falta = validarDatosContratoRepresentacion(j);
    if (falta) { err(falta); return; }
    setLoading(true);
    try {
      const años = Number(contractDuration) || 2;
      const res = await api.get(`/contratos/jugador/${j.id}/representacion?durationYears=${años}`, {
        ...authHeaders,
        responseType: 'blob',
      });
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'application/pdf' });
      const filename = `Contrato_Representacion_${j.lastName}_${j.firstName}.pdf`;
      const url = URL.createObjectURL(blob);
      setVistaPreviaContrato((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return {
          url,
          titulo: `Vista previa — ${j.firstName} ${j.lastName}`,
          blob,
          filename,
          mimeType: 'application/pdf',
        };
      });
      ok('Vista previa del contrato.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo generar la vista previa.'));
    } finally {
      setLoading(false);
    }
  };

  const generateContract = async (e?: FormEvent) => {
    e?.preventDefault();
    const j = await obtenerJugadorSeleccionado();
    if (!j) return;
    const falta = validarDatosContratoRepresentacion(j);
    if (falta) { err(falta); return; }
    setLoading(true);
    try {
      const nombreArchivo = `Contrato_Representacion_${j.lastName}_${j.firstName}.pdf`;
      const postRes = await api.post('/contratos/generar?descargar=true', {
        playerId: j.id,
        durationYears: Number(contractDuration) || 2,
      }, { ...authHeaders, responseType: 'blob' });
      blobDownload(postRes.data, nombreArchivo, 'application/pdf');
      await loadContracts();
      ok('Contrato de representación generado y guardado.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo generar el contrato.'));
    } finally {
      setLoading(false);
    }
  };

  const subirContratoRepresentacionFirmado = async () => {
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    const file = contratoRepresentacionFirmadoRef.current?.files?.[0];
    if (!file) { err('Selecciona el archivo del contrato de representación firmado.'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('playerId', idJugadorSeleccionado);
      form.append('documentType', 'Contrato de representación firmado');
      form.append('description', 'Contrato de representación FORTIS firmado por el jugador');
      form.append('status', 'Vigente');
      await api.post('/documentos/cargar', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (contratoRepresentacionFirmadoRef.current) contratoRepresentacionFirmadoRef.current.value = '';
      if (activeTab === 'Perfil') await loadProfile();
      ok('Contrato de representación firmado subido correctamente.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo subir el contrato de representación firmado.'));
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = async (contractId: string) => {
    try {
      const res = await api.get(`/contratos/${contractId}/descargar`, { ...authHeaders, responseType: 'blob' });
      blobDownload(res.data, `contrato_${contractId}.pdf`, 'application/pdf');
      ok('Contrato descargado.');
    } catch { err('No se pudo descargar el contrato.'); }
  };

  // ─── Negociaciones ─────────────────────────────────────────────────────────

  const normalizarNegociacion = (n: NegotiationRow): NegotiationRow => ({
    ...n,
    monthlyAmount: n.monthlyAmount ?? n.offeredAmount ?? 0,
    installmentsPerYear: n.installmentsPerYear > 0 ? n.installmentsPerYear : 12,
    contractYears: n.contractYears > 0 ? n.contractYears : 1,
    hasHousingBonus: n.hasHousingBonus ?? false,
    hasObjectiveBonus: n.hasObjectiveBonus ?? false,
    hasGoalBonus: n.hasGoalBonus ?? false,
    hasSigningBonus: n.hasSigningBonus ?? false,
    currentVersionNumber: n.currentVersionNumber && n.currentVersionNumber > 0 ? n.currentVersionNumber : 1,
  });

  const loadNegotiationVersions = async (negotiationId: string) => {
    setNegVersionsLoading(true);
    try {
      const res = await api.get<VersionOfertaRow[]>(`/negociaciones/${negotiationId}/versiones`, authHeaders);
      setNegOfferVersions(res.data ?? []);
    } catch {
      setNegOfferVersions([]);
    } finally {
      setNegVersionsLoading(false);
    }
  };

  const registerNegotiationVersion = async (
    id: string,
    proposedBy: 'Club' | 'Agencia',
    notes: string,
    form: OfertaNegociacionForm,
  ) => {
    setNegVersionRegistering(true);
    try {
      const updated = (await api.post<NegotiationRow>(`/negociaciones/${id}/versiones`, {
        proposedBy,
        notes: notes || null,
        ...payloadOfertaApi(form),
        offerDate: new Date().toISOString().slice(0, 10),
      }, authHeaders)).data;
      aplicarNegociacionActualizada(normalizarNegociacion(updated));
      await loadNegotiationVersions(id);
      ok(`Versión registrada (${proposedBy === 'Club' ? 'contraoferta del club' : 'propuesta de la agencia'}).`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo registrar la nueva versión de la oferta.'));
    } finally {
      setNegVersionRegistering(false);
    }
  };

  const loadAllNegotiations = async () => {
    setNegEstadoLoading(true);
    try {
      const res = await api.get<Paged<NegotiationRow>>('/negociaciones?page=1&pageSize=200', authHeaders);
      const items = (res.data.items ?? []).map(normalizarNegociacion);
      setAllNegotiations(items);
      if (selectedNegEstadoId && !items.some((n) => n.id === selectedNegEstadoId)) {
        setSelectedNegEstadoId(null);
      }
    } catch { err('No se pudieron cargar las negociaciones.'); }
    finally { setNegEstadoLoading(false); }
  };

  const aplicarNegociacionActualizada = (updated: NegotiationRow) => {
    setAllNegotiations((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
    setNegotiations((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
  };

  const changeNegotiationStatus = async (id: string, status: EstadoNegociacionCodigo) => {
    setNegStatusUpdating(true);
    const body = { status };
    const etiqueta = etiquetaEstadoNegociacion(status);
    try {
      let updated: NegotiationRow | null = null;

      const recargarNegociacion = async () => {
        const lista = await api.get<Paged<NegotiationRow>>('/negociaciones?page=1&pageSize=200', authHeaders);
        return (lista.data.items ?? []).find((n) => n.id === id) ?? null;
      };

      const porInteraccion = async () => {
        await api.post('/negociaciones/interacciones', {
          negotiationId: id,
          interactionType: 'Cambio de estado',
          summary: `Estado actualizado a ${etiqueta}`,
          nextStep: etiqueta,
          updatedStatus: status,
        }, authHeaders);
        return recargarNegociacion();
      };

      const intentosDedicados: Array<() => Promise<NegotiationRow>> = [
        async () => (await api.post<NegotiationRow>(`/negociaciones/${id}/cambiar-estado`, body, authHeaders)).data,
        async () => (await api.patch<NegotiationRow>(`/negociaciones/${id}/estado`, body, authHeaders)).data,
        async () => (await api.put<NegotiationRow>(`/negociaciones/${id}/estado`, body, authHeaders)).data,
      ];

      try {
        updated = await porInteraccion();
      } catch {
        for (const intentar of intentosDedicados) {
          try {
            updated = await intentar();
            break;
          } catch {
            /* siguiente */
          }
        }
      }

      if (!updated) {
        throw new Error('No se pudo confirmar el cambio de estado.');
      }

      aplicarNegociacionActualizada(updated);
      if (selectedNegEstadoId === id) {
        await loadNegotiationVersions(id);
      }
      ok(`Estado actualizado: ${etiquetaEstadoNegociacion(updated.status)}`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo actualizar el estado.'));
    } finally {
      setNegStatusUpdating(false);
    }
  };

  const loadNegotiations = async () => {
    if (!idJugadorSeleccionado) {
      setNegotiations([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<NegotiationRow[]>(`/negociaciones/jugador/${idJugadorSeleccionado}`, authHeaders);
      setNegotiations((res.data ?? []).map(normalizarNegociacion));
    } catch { err('No se pudieron cargar las ofertas.'); }
    finally { setLoading(false); }
  };

  const createNegotiation = async (e: FormEvent) => {
    e.preventDefault();
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    try {
      await api.post('/negociaciones', {
        playerId: idJugadorSeleccionado,
        ...payloadOfertaApi(ofertaForm),
        offerDate: new Date().toISOString().slice(0, 10),
      }, authHeaders);
      setOfertaForm(ofertaNegociacionVacia());
      ok('Oferta registrada.');
      await loadNegotiations();
    } catch (ex) { err(mensajeErrorApi(ex, 'No se pudo crear la negociación.')); }
  };

  const saveEditNeg = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNeg || !editingNegForm) return;
    try {
      await api.put(`/negociaciones/${editingNeg.id}`, payloadOfertaApi(editingNegForm), authHeaders);
      setEditingNeg(null);
      setEditingNegForm(null);
      await loadNegotiations();
      ok('Negociación actualizada.');
    } catch (ex) { err(mensajeErrorApi(ex, 'No se pudo actualizar la negociación.')); }
  };

  const abrirEdicionNeg = (n: NegotiationRow) => {
    const row = normalizarNegociacion(n);
    setEditingNeg(row);
    setEditingNegForm(ofertaDesdeNegociacion(row));
  };

  const deleteNegotiation = async (id: string, desdeEstado = false) => {
    const mensaje = desdeEstado
      ? `¿Eliminar la negociación con este club y todas sus versiones de oferta?\n\nSi el proceso se cayó y ya no hay trato, la negociación dejará de aparecer en el sistema.`
      : '¿Eliminar esta negociación?';
    if (!confirmAction(mensaje)) return;
    setNegDeleting(true);
    try {
      await api.delete(`/negociaciones/${id}`, authHeaders);
      if (selectedNegEstadoId === id) {
        setSelectedNegEstadoId(null);
        setNegOfferVersions([]);
      }
      await loadNegotiations();
      await loadAllNegotiations();
      ok('Negociación y oferta eliminadas.');
    } catch {
      err('No se pudo eliminar la negociación.');
    } finally {
      setNegDeleting(false);
    }
  };

  // ─── Transferencias ────────────────────────────────────────────────────────

  const loadTransfersList = async (page = trPage, opts?: { club?: string; tipo?: string }) => {
    if (!idJugadorSeleccionado) {
      err('Selecciona un jugador para ver sus transferencias.');
      return;
    }
    const club = opts?.club ?? trClubFiltro;
    const tipo = opts?.tipo ?? trTipoFiltro;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set('playerId', idJugadorSeleccionado);
      if (club.trim()) p.set('club', club.trim());
      if (tipo) p.set('transferType', tipo);
      p.set('page', String(page)); p.set('pageSize', '10');
      const res = await api.get<Paged<TransferRow>>(`/transferencias?${p}`, authHeaders);
      setTransfers(res.data.items ?? []);
      setTrTotal(res.data.totalItems ?? 0);
      setTrPage(page);
    } catch { err('No se pudieron cargar transferencias.'); }
    finally { setLoading(false); }
  };

  const mostrarTodasTransferencias = () => {
    setTrClubFiltro('');
    setTrTipoFiltro('');
    void loadTransfersList(1, { club: '', tipo: '' });
  };

  const buscarTransferenciasHistorial = () => {
    void loadTransfersList(1);
  };

  const abrirVistaPreviaDocumento = async (ruta: string, titulo: string, nombreArchivoDefecto: string) => {
    setLoading(true);
    try {
      const res = await api.get(ruta, {
        ...authHeaders,
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 300,
      });
      const contentTypeRaw = String(res.headers['content-type'] ?? res.headers['Content-Type'] ?? '');
      if (contentTypeRaw.includes('application/json') || contentTypeRaw.includes('text/html')) {
        const texto = res.data instanceof Blob ? await res.data.text() : '';
        let mensaje = 'No se pudo cargar el archivo.';
        try {
          const json = JSON.parse(texto) as { message?: string };
          if (json.message) mensaje = json.message;
        } catch { /* respuesta no JSON */ }
        err(mensaje);
        return;
      }
      let mimeType = (contentTypeRaw.split(';')[0] || '').trim();
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = nombreArchivoDefecto.match(/\.(\w+)$/i)?.[1]?.toLowerCase();
        mimeType = ext === 'png' ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : ext === 'webp' ? 'image/webp'
          : 'application/pdf';
      }
      const blob = res.data instanceof Blob
        ? (res.data.type && res.data.type !== 'application/octet-stream'
          ? res.data
          : new Blob([res.data], { type: mimeType }))
        : new Blob([res.data], { type: mimeType });
      let filename = nombreArchivoDefecto;
      const disposition = String(res.headers['content-disposition'] ?? res.headers['Content-Disposition'] ?? '');
      const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
      if (match?.[1]) filename = decodeURIComponent(match[1].trim());
      if (!/\.\w{2,5}$/i.test(filename)) {
        if (mimeType === 'application/pdf') filename += '.pdf';
        else if (mimeType === 'image/jpeg') filename += '.jpg';
        else if (mimeType === 'image/png') filename += '.png';
        else if (mimeType === 'image/webp') filename += '.webp';
      }
      const url = URL.createObjectURL(blob);
      setVistaPreviaContrato((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url, titulo, blob, filename, mimeType };
      });
    } catch (e) {
      err(await mensajeErrorApiBlob(e, 'No se pudo abrir la vista previa del documento.'));
    } finally {
      setLoading(false);
    }
  };

  const vistaPreviaContratoClub = (documentId: string, destino: string) => {
    const nombreSeguro = destino.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'club';
    void abrirVistaPreviaDocumento(
      `/documentos/${documentId}/descargar`,
      `Contrato con el club — ${destino}`,
      `contrato_club_${nombreSeguro}`,
    );
  };

  const resetTransferForm = () => {
    setOriginClub('');
    setDestinationClub('');
    setTrTransferDate(new Date().toISOString().slice(0, 10));
    setTrType('Definitiva');
    setTrSinMonto(false);
    setTrAmount('');
    setTrCurrency('USD');
    setTrContratoClubNombre('');
    setTrContratoClubFile(null);
    if (transferContratoClubRegistroRef.current) transferContratoClubRegistroRef.current.value = '';
  };

  const abrirEditarTransferencia = (t: TransferRow) => {
    setEditingTransfer(t);
    setEditSinMonto(tipoTransferenciaRequiereMonto(t.transferType) && t.amount == null);
    setEditContratoClubFile(null);
    setEditContratoClubNombre('');
    if (editContratoClubRef.current) editContratoClubRef.current.value = '';
  };

  const cerrarEditarTransferencia = () => {
    setEditingTransfer(null);
    setEditContratoClubFile(null);
    setEditContratoClubNombre('');
    if (editContratoClubRef.current) editContratoClubRef.current.value = '';
  };

  const createTransfer = async (e: FormEvent) => {
    e.preventDefault();
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    if (!originClub.trim() || !destinationClub.trim()) {
      err('Indica club de origen y destino.');
      return;
    }
    if (tipoTransferenciaRequiereMonto(trType) && !trSinMonto && (!trAmount.trim() || Number(trAmount) <= 0)) {
      err('Indica un monto válido o marca «Sin monto».');
      return;
    }
    const archivoContrato = trContratoClubFile;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('playerId', idJugadorSeleccionado);
      form.append('originClub', originClub.trim());
      form.append('destinationClub', destinationClub.trim());
      form.append('transferDate', trTransferDate);
      form.append('transferType', trType);
      const monto = montoTransferenciaPayload(trType, trSinMonto, trAmount);
      if (monto != null) form.append('amount', String(monto));
      form.append('currency', trCurrency.trim() || 'USD');
      form.append('conditions', '');
      form.append('managedBy', email || 'Portal');
      if (archivoContrato) form.append('clubContract', archivoContrato);
      await api.post<TransferRow>('/transferencias/registrar', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      ok(archivoContrato ? 'Transferencia registrada con contrato del club.' : 'Transferencia registrada.');
      resetTransferForm();
      mostrarTodasTransferencias();
    } catch (ex) {
      err(mensajeErrorApi(ex, 'No se pudo registrar la transferencia.'));
    } finally { setLoading(false); }
  };

  const saveEditTransfer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;
    if (tipoTransferenciaRequiereMonto(editingTransfer.transferType) && !editSinMonto) {
      const m = editingTransfer.amount;
      if (m == null || m <= 0) {
        err('Indica un monto válido o marca «Sin monto».');
        return;
      }
    }
    setLoading(true);
    try {
      const tipo = editingTransfer.transferType;
      await api.put(`/transferencias/${editingTransfer.id}`, {
        originClub: editingTransfer.originClub.trim(),
        destinationClub: editingTransfer.destinationClub.trim(),
        transferDate: editingTransfer.transferDate,
        transferType: tipo,
        amount: montoTransferenciaPayload(
          tipo,
          editSinMonto,
          editingTransfer.amount != null ? String(editingTransfer.amount) : '',
        ),
        currency: editingTransfer.currency.trim() || 'USD',
        conditions: '',
        managedBy: email || editingTransfer.managedBy || 'Portal',
      }, authHeaders);
      if (editContratoClubFile && idJugadorSeleccionado) {
        const form = new FormData();
        form.append('file', editContratoClubFile);
        form.append('playerId', idJugadorSeleccionado);
        form.append('transferId', editingTransfer.id);
        form.append('documentType', 'Contrato con el club');
        form.append('relatedClub', editingTransfer.destinationClub.trim());
        form.append('description', `Contrato con ${editingTransfer.destinationClub.trim()}`);
        form.append('status', 'Vigente');
        await api.post('/documentos/cargar', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      cerrarEditarTransferencia();
      await loadTransfersList(trPage);
      ok(editContratoClubFile ? 'Transferencia y contrato actualizados.' : 'Transferencia actualizada.');
    } catch (ex) {
      err(mensajeErrorApi(ex, 'No se pudo actualizar la transferencia.'));
    } finally { setLoading(false); }
  };

  const deleteTransfer = async (id: string) => {
    if (!confirmAction('¿Eliminar esta transferencia?')) return;
    try {
      await api.delete(`/transferencias/${id}`, authHeaders);
      await loadTransfersList(trPage);
      ok('Transferencia eliminada.');
    } catch { err('No se pudo eliminar la transferencia.'); }
  };

  // ─── Historial de clubes y logros deportivos ───────────────────────────────

  const loadClubHistory = async () => {
    if (!idJugadorSeleccionado) { setClubHistoryRows([]); return; }
    try {
      const res = await api.get<ClubHistoryRow[]>(`/historial-clubes/jugador/${idJugadorSeleccionado}`, authHeaders);
      setClubHistoryRows(res.data ?? []);
    } catch (ex) {
      setClubHistoryRows([]);
      throw ex;
    }
  };

  const loadAchievements = async () => {
    if (!idJugadorSeleccionado) { setAchievementRows([]); return; }
    try {
      const res = await api.get<AchievementRow[]>(`/logros-deportivos/jugador/${idJugadorSeleccionado}`, authHeaders);
      setAchievementRows(res.data ?? []);
    } catch (ex) {
      setAchievementRows([]);
      throw ex;
    }
  };

  const cargarHistorialYLogros = async () => {
    if (!idJugadorSeleccionado) {
      err('Selecciona un jugador.');
      return;
    }
    setLoading(true);
    try {
      await Promise.all([loadClubHistory(), loadAchievements()]);
      ok('Historial y logros cargados.');
    } catch {
      err('No se pudo cargar el historial del jugador.');
    } finally {
      setLoading(false);
    }
  };

  const resetClubHistoryForm = () => {
    setHcClubName('');
    setHcCategory('PrimeraDivision');
    setHcYear(String(ANIO_ACTUAL));
    setHcNotes('');
    setEditingClubHistory(null);
  };

  const resetAchievementForm = () => {
    setLogroTipo('TituloTorneo');
    setLogroTorneo('');
    setLogroPais('');
    setLogroYear(String(ANIO_ACTUAL));
    setLogroNotes('');
    setEditingAchievement(null);
  };

  const crearClubHistory = async (e: FormEvent) => {
    e.preventDefault();
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    if (!hcClubName.trim()) { err('Indica el club.'); return; }
    const year = Number(hcYear);
    if (!Number.isFinite(year) || year < 1950 || year > ANIO_ACTUAL + 1) {
      err(`Indica un año válido (1950–${ANIO_ACTUAL + 1}).`);
      return;
    }
    setLoading(true);
    try {
      if (editingClubHistory) {
        await api.put(`/historial-clubes/${editingClubHistory.id}`, {
          clubName: hcClubName.trim(),
          category: hcCategory,
          year,
          notes: hcNotes.trim() || null,
        }, authHeaders);
        ok('Registro de club actualizado.');
      } else {
        await api.post('/historial-clubes', {
          playerId: idJugadorSeleccionado,
          clubName: hcClubName.trim(),
          category: hcCategory,
          year,
          notes: hcNotes.trim() || null,
        }, authHeaders);
        ok('Club agregado al historial.');
      }
      resetClubHistoryForm();
      await loadClubHistory();
    } catch (ex) {
      err(mensajeErrorApi(ex, 'No se pudo guardar el historial de club.'));
    } finally {
      setLoading(false);
    }
  };

  const eliminarClubHistory = async (id: string) => {
    if (!confirmAction('¿Eliminar este registro del historial de clubes?')) return;
    setLoading(true);
    try {
      await api.delete(`/historial-clubes/${id}`, authHeaders);
      if (editingClubHistory?.id === id) resetClubHistoryForm();
      await loadClubHistory();
      ok('Registro eliminado.');
    } catch {
      err('No se pudo eliminar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const editarClubHistory = (row: ClubHistoryRow) => {
    setEditingClubHistory(row);
    setHcClubName(row.clubName);
    setHcCategory(row.category || 'PrimeraDivision');
    setHcYear(String(row.year));
    setHcNotes(row.notes ?? '');
  };

  const crearLogroDeportivo = async (e: FormEvent) => {
    e.preventDefault();
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    if (!logroTorneo.trim()) { err('Indica el nombre del torneo.'); return; }
    if (!logroPais.trim()) { err('Indica el país.'); return; }
    const year = Number(logroYear);
    if (!Number.isFinite(year) || year < 1950 || year > ANIO_ACTUAL + 1) {
      err(`Indica un año válido (1950–${ANIO_ACTUAL + 1}).`);
      return;
    }
    setLoading(true);
    try {
      if (editingAchievement) {
        await api.put(`/logros-deportivos/${editingAchievement.id}`, {
          achievementType: logroTipo,
          tournamentName: logroTorneo.trim(),
          country: logroPais.trim(),
          year,
          notes: logroNotes.trim() || null,
        }, authHeaders);
        ok('Logro deportivo actualizado.');
      } else {
        await api.post('/logros-deportivos', {
          playerId: idJugadorSeleccionado,
          achievementType: logroTipo,
          tournamentName: logroTorneo.trim(),
          country: logroPais.trim(),
          year,
          notes: logroNotes.trim() || null,
        }, authHeaders);
        ok('Logro deportivo registrado.');
      }
      resetAchievementForm();
      await loadAchievements();
    } catch (ex) {
      err(mensajeErrorApi(ex, 'No se pudo guardar el logro deportivo.'));
    } finally {
      setLoading(false);
    }
  };

  const eliminarLogroDeportivo = async (id: string) => {
    if (!confirmAction('¿Eliminar este logro deportivo?')) return;
    setLoading(true);
    try {
      await api.delete(`/logros-deportivos/${id}`, authHeaders);
      if (editingAchievement?.id === id) resetAchievementForm();
      await loadAchievements();
      ok('Logro eliminado.');
    } catch {
      err('No se pudo eliminar el logro.');
    } finally {
      setLoading(false);
    }
  };

  const editarLogroDeportivo = (row: AchievementRow) => {
    setEditingAchievement(row);
    setLogroTipo(row.achievementType);
    setLogroTorneo(row.tournamentName);
    setLogroPais(row.country);
    setLogroYear(String(row.year));
    setLogroNotes(row.notes ?? '');
  };

  // ─── Reportes ──────────────────────────────────────────────────────────────

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [dash, negs, trs, cnts] = await Promise.all([
        api.get<DashboardReport>('/reportes/panel', authHeaders),
        api.get<NegReportRow>('/reportes/negociaciones', authHeaders),
        api.get<TrReportRow>('/reportes/transferencias', authHeaders),
        api.get<ContractsReport>('/reportes/contratos', authHeaders),
      ]);
      setDashboard(dash.data); setNegReport(negs.data);
      setTrReport(trs.data); setContractsReport(cnts.data);
      ok('Reportes actualizados.');
    } catch { err('No se pudieron cargar los reportes.'); }
    finally { setLoading(false); }
  };

  const exportCsv = async (endpoint: string, filename: string) => {
    try {
      const res = await api.get(endpoint, { ...authHeaders, responseType: 'blob' });
      blobDownload(res.data, filename);
      ok('Exportación descargada.');
    } catch { err('No se pudo exportar.'); }
  };

  // ─── Inteligencia ──────────────────────────────────────────────────────────

  const loadRanking = async (silencioso = false) => {
    setLoading(true);
    try {
      const res = await api.get('/inteligencia/ranking', authHeaders);
      setRanking(res.data);
      if (!silencioso) ok('Ranking calculado.');
    } catch { err('No se pudo cargar el ranking.'); }
    finally { setLoading(false); }
  };

  const loadCompatibility = async () => {
    if (!intelligenceWeightsValid) {
      err('La suma de pesos debe ser exactamente 100 para calcular compatibilidad.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/inteligencia/compatibilidad', {
        targetPosition, minAge: Number(minAge), maxAge: Number(maxAge),
        weightPosition: wPosition, weightAge: wAge,
        weightContract: wContract, weightActivity: wActivity
      }, authHeaders);
      setCompatibility(res.data);
      ok('Compatibilidad calculada.');
    } catch { err('No se pudo calcular la compatibilidad.'); }
    finally { setLoading(false); }
  };

  // ─── Estadísticas ──────────────────────────────────────────────────────────

  const crearEstadisticaJugador = async (e: FormEvent) => {
    e.preventDefault();
    if (!statPlayerIdCargaManual) { err('Selecciona un jugador para carga manual.'); return; }
    try {
      await api.post('/estadisticas-jugador', {
        playerId: statPlayerIdCargaManual, matchDate: statMatchDate,
        opponent: statOpponent, minutesPlayed: Number(statMinutes),
        goals: Number(statGoals), assists: Number(statAssists),
        yellowCards: Number(statYellowCards), redCards: Number(statRedCards), rating: Number(statRating),
        physicalStatus: statPhysicalStatus, notes: statNotes.trim() || 'Carga manual desde configuración'
      }, authHeaders);
      ok('Estadística registrada.');
      setStatOpponent('');
      setStatGoals('0');
      setStatAssists('0');
      setStatYellowCards('0');
      setStatRedCards('0');
      setStatRating('7.5');
      setStatMinutes('90');
      setStatNotes('');
      const res = await api.get<StatRow[]>(`/estadisticas-jugador/jugador/${statPlayerIdCargaManual}`, authHeaders);
      setStatsManualHistory(res.data ?? []);
    } catch { err('No se pudo registrar estadística.'); }
  };

  const cargarEstadisticasCargaManual = async (playerId = statPlayerIdCargaManual, silencioso = false) => {
    if (!playerId) {
      setStatsManualHistory([]);
      if (!silencioso) err('Selecciona un jugador para ver historial.');
      return;
    }
    try {
      const res = await api.get<StatRow[]>(`/estadisticas-jugador/jugador/${playerId}`, authHeaders);
      setStatsManualHistory(res.data ?? []);
      if (!silencioso) ok('Historial de carga manual actualizado.');
    } catch {
      err('No se pudo cargar historial del jugador.');
    }
  };

  const cargarEstadisticasJugador = async (silencioso = false) => {
    if (!idJugadorSeleccionado) { err('Selecciona un jugador.'); return; }
    try {
      const res = await api.get<StatRow[]>(`/estadisticas-jugador/jugador/${idJugadorSeleccionado}`, authHeaders);
      setStatsHistory(res.data ?? []);
      if (!silencioso) ok('Historial cargado.');
    } catch { err('No se pudo cargar el historial.'); }
  };

  const cargarComparativaJugador = async () => {
    if (!statsComparePlayerId) { err('Selecciona un jugador para comparar.'); return; }
    if (statsComparePlayerId === idJugadorSeleccionado) { err('El jugador de comparación debe ser distinto al activo.'); return; }
    try {
      const res = await api.get<StatRow[]>(`/estadisticas-jugador/jugador/${statsComparePlayerId}`, authHeaders);
      setStatsCompareHistory(res.data ?? []);
      ok('Comparativa cargada.');
    } catch {
      err('No se pudo cargar la comparativa.');
    }
  };

  const downloadCurriculum = async () => {
    const playerId = jugadorPerfil?.id ?? idJugadorSeleccionado;
    if (!playerId) { err('Selecciona un jugador y carga el perfil.'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/jugadores/${playerId}/curriculum`, {
        ...authHeaders,
        responseType: 'blob',
        params: { _: Date.now() },
      });
      const contentType = String(res.headers['content-type'] ?? res.headers['Content-Type'] ?? '');
      const blob = res.data as Blob;
      if (!contentType.includes('pdf') || blob.size < 500) {
        let detalle = 'El servidor no devolvió un PDF válido.';
        try {
          const texto = await blob.text();
          if (texto.startsWith('{')) {
            const json = JSON.parse(texto) as { message?: string; title?: string };
            detalle = json.message ?? json.title ?? detalle;
          } else if (texto.length < 180) detalle = texto;
        } catch { /* ignore */ }
        err(`${detalle} Reinicia la API (dotnet run) si acabas de actualizar.`);
        return;
      }
      const baseName = jugadorPerfil
        ? `curriculum_${jugadorPerfil.firstName}_${jugadorPerfil.lastName}`.replace(/[^\w.-]+/g, '_')
        : 'curriculum_jugador';
      blobDownload(res.data, `${baseName}.pdf`);
      ok('Currículum descargado.');
    } catch (e) {
      err(await mensajeErrorApiBlob(e, 'No se pudo descargar el currículum. Reinicia la API si el diseño no se actualiza.'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Notificaciones ────────────────────────────────────────────────────────

  const loadNotifications = async (silencioso = false) => {
    try {
      const res = await api.get<NotificationRow[]>('/notificaciones', authHeaders);
      setNotifications(res.data ?? []);
      const unread = (res.data ?? []).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      if (!silencioso) ok('Notificaciones cargadas.');
    } catch { err('No se pudieron cargar notificaciones.'); }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leida`, {}, authHeaders);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      ok('Notificación marcada como leída.');
    } catch { err('No se pudo marcar la notificación.'); }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      try {
        await api.patch('/notificaciones/leidas', {}, authHeaders);
      } catch (bulkErr) {
        const es404 = axios.isAxiosError(bulkErr) && bulkErr.response?.status === 404;
        if (!es404) throw bulkErr;
        let lista = notifications;
        if (!lista.some((n) => !n.isRead)) {
          const res = await api.get<NotificationRow[]>('/notificaciones', authHeaders);
          lista = res.data ?? [];
        }
        const pendientes = lista.filter((n) => !n.isRead);
        if (pendientes.length === 0) {
          setUnreadCount(0);
          await loadNotifications(true);
          ok('Todas las notificaciones ya estaban leídas.');
          return;
        }
        await Promise.all(
          pendientes.map((n) => api.patch(`/notificaciones/${n.id}/leida`, {}, authHeaders)),
        );
      }
      await loadNotifications(true);
      ok('Todas las notificaciones marcadas como leídas.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudieron marcar todas las notificaciones.'));
    }
  };

  // ─── Auditoría ─────────────────────────────────────────────────────────────

  const loadAudit = async (page = auditPage, silencioso = false) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (auditEntity.trim()) p.set('entityName', auditEntity.trim());
      if (auditAction.trim()) p.set('action', auditAction.trim());
      if (auditUser.trim()) p.set('createdBy', auditUser.trim());
      if (auditFrom) p.set('from', auditFrom);
      if (auditTo) p.set('to', auditTo);
      p.set('page', String(page)); p.set('pageSize', '20');
      const res = await api.get<Paged<AuditRow>>(`/auditoria?${p}`, authHeaders);
      setAuditLogs(res.data.items ?? []);
      setAuditTotal(res.data.totalItems ?? 0);
      setAuditPage(page);
      if (!silencioso) ok('Auditoría cargada.');
    } catch { err('No se pudo cargar la auditoría.'); }
    finally { setLoading(false); }
  };

  // ─── Parámetros de configuración ───────────────────────────────────────────

  const cargarListasParametros = async (opts?: { silent?: boolean; sincronizarDesplegablesJugador?: boolean }) => {
    try {
      const res = await api.get<CatalogRow[]>('/catalogos', authHeaders);
      setCatalogs(res.data ?? []);
      await refreshStandardListItems();
      if (!opts?.silent) ok('Listas de parámetros cargadas.');
      if (opts?.sincronizarDesplegablesJugador) await cargarCatalogosFormularioJugador();
    } catch {
      if (!opts?.silent) err('No se pudieron cargar las listas de parámetros.');
    }
  };


  const deleteCatalogItemById = async (itemId: string) => {
    if (!confirmAction('¿Eliminar este ítem de la lista? Si un jugador ya tiene ese valor guardado, seguirá viéndose hasta que edites la ficha.')) return;
    setLoading(true);
    try {
      await api.delete(`/catalogos/elementos/${itemId}`, authHeaders);
      await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });
      if (selectedCatalogId) await loadCatalogItems(selectedCatalogId);
      ok('Ítem eliminado.');
    } catch {
      err('No se pudo eliminar el ítem.');
    } finally {
      setLoading(false);
    }
  };

  const addQuickParamItem = async (code: (typeof CONFIG_STANDARD_LISTS)[number]['code']) => {
    const draft = paramDraft[code];
    const name = draft?.name?.trim() ?? '';
    if (!name) {
      err(code === 'CLUBES' ? 'Escribe el nombre del club.' : 'Escribe el nombre.');
      return;
    }
    setLoading(true);
    try {
      // 1. Siempre refrescar la lista de catálogos desde el servidor para tener el ID correcto
      let freshCats: CatalogRow[] = [];
      try {
        const resCats = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        freshCats = resCats.data ?? [];
        setCatalogs(freshCats);
      } catch { /* si falla, usamos el estado actual */ freshCats = catalogs; }

      // 2. Buscar el catálogo; si no existe, crearlo
      let catalog = freshCats.find((c) => c.code === code);
      if (!catalog) {
        const def = CONFIG_STANDARD_LISTS.find((d) => d.code === code)!;
        try {
          await api.post('/catalogos', {
            code: def.code,
            name: def.title,
            description: `${def.hint} Ejemplos: ${def.examples}`,
          }, authHeaders);
        } catch {
          // El catálogo ya puede existir (creado en una sesión anterior) — ignoramos y recargamos
        }
        // Recargar para obtener el ID correcto
        const resCats2 = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        freshCats = resCats2.data ?? [];
        setCatalogs(freshCats);
        catalog = freshCats.find((c) => c.code === code);
      }
      if (!catalog) {
        err('No se pudo preparar la lista de catálogos. ¿Tienes permisos de administrador?');
        return;
      }

      // 3. Obtener ítems actuales frescos para evitar colisión de códigos
      let freshItems: CatalogItemRow[] = [];
      try {
        const resItems = await api.get<CatalogItemRow[]>(`/catalogos/por-codigo/${code}/elementos`, authHeaders);
        freshItems = resItems.data ?? [];
      } catch { freshItems = paramItemsByCode[code] ?? []; }

      // 4. Generar código único
      const existingCodes = freshItems.map((i) => i.code);
      const generatedCode =
        code === 'CLUBES'
          ? slugCatalogItemCode([name, draft?.city, draft?.country].filter(Boolean).join('_'), existingCodes)
          : code === 'CIUDADES' && draft?.parentItemId
          ? slugCatalogItemCode([draft.parentItemId.slice(0, 4), name].join('_'), existingCodes)
          : slugCatalogItemCode(name, existingCodes);

      // 5. Insertar el ítem
      const nextOrder = freshItems.length + 1;
      const parentId = draft?.parentItemId?.trim() || undefined;
      const base = {
        catalogId: catalog.id,
        code: generatedCode,
        name,
        sortOrder: nextOrder,
        parentItemId: parentId || null,
      };
      await api.post(
        '/catalogos/elementos',
        code === 'CLUBES'
          ? {
              ...base,
              country: draft?.country?.trim() || null,
              city: draft?.city?.trim() || null,
              league: draft?.league?.trim() || null,
              parentItemId: draft?.parentItemId?.trim() || null,
            }
          : base,
        authHeaders
      );
      setParamDraft((p) => ({
        ...p,
        [code]: { name: '', order: '1', country: '', city: '', league: '', parentItemId: '', categoryItemId: '', nationality: '' },
      }));
      await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });

      // Tras crear un país, crear automáticamente la nacionalidad vinculada
      if (code === 'PAISES') {
        const natName = draft?.nationality?.trim();
        if (natName) {
          try {
            // Obtener el ID del país recién creado
            const allPaises = await api.get<CatalogItemRow[]>(`/catalogos/por-codigo/PAISES/elementos`, authHeaders);
            const newPais = (allPaises.data ?? []).find(i => i.name.trim().toLowerCase() === name.trim().toLowerCase());

            // Obtener o crear el catálogo NACIONALIDADES
            let catNat = freshCats.find(c => c.code === 'NACIONALIDADES');
            if (!catNat) {
              try {
                await api.post('/catalogos', {
                  code: 'NACIONALIDADES', name: 'Nacionalidades',
                  description: 'Vincula cada nacionalidad a su país de origen.',
                }, authHeaders);
              } catch { /* ya existe */ }
              const resCats3 = await api.get<CatalogRow[]>('/catalogos', authHeaders);
              freshCats = resCats3.data ?? [];
              catNat = freshCats.find(c => c.code === 'NACIONALIDADES');
            }

            if (catNat && newPais) {
              const natItems = await api.get<CatalogItemRow[]>(`/catalogos/por-codigo/NACIONALIDADES/elementos`, authHeaders);
              const natCodes = (natItems.data ?? []).map(i => i.code);
              const natCode = slugCatalogItemCode(natName, natCodes);
              const natOrder = (natItems.data ?? []).length + 1;
              await api.post('/catalogos/elementos', {
                catalogId: catNat.id, code: natCode, name: natName,
                sortOrder: natOrder, parentItemId: newPais.id,
              }, authHeaders);
              await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });
              ok(`País «${name}» y nacionalidad «${natName}» creados correctamente.`);
            } else {
              ok(`«${name}» agregado. No se pudo crear la nacionalidad automáticamente.`);
            }
          } catch {
            ok(`«${name}» agregado. La nacionalidad no se pudo crear automáticamente.`);
          }
        } else {
          ok(`«${name}» agregado correctamente.`);
        }
      } else {
        ok(`«${name}» agregado correctamente.`);
      }
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { message?: string }; status?: number } };
      const backendMsg = axErr?.response?.data?.message;
      const status = axErr?.response?.status;
      if (status === 401 || status === 403) {
        err('Sin permiso. Inicia sesión de nuevo o contacta al administrador.');
      } else if (backendMsg) {
        err(`Error del servidor: ${backendMsg}`);
      } else {
        err('No se pudo agregar. Verifica tu conexión y que el servidor esté activo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Importación masiva de países + nacionalidades (lista FIFA precargada)
  const [importandoPaises, setImportandoPaises] = useState(false);

  const importarPaisesFifa = async () => {
    if (importandoPaises) return;
    if (!confirmAction(`Se importarán ${PAISES_FIFA.length} países con su nacionalidad. Los que ya existan se omiten. ¿Continuar?`)) return;
    setImportandoPaises(true);
    setLoading(true);
    const normalizar = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    try {
      // 1. Asegurar catálogos PAISES y NACIONALIDADES
      let freshCats: CatalogRow[] = [];
      try {
        const resCats = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        freshCats = resCats.data ?? [];
      } catch { freshCats = catalogs; }

      const asegurarCatalogo = async (code: string, name: string, description: string) => {
        let cat = freshCats.find((c) => c.code === code);
        if (cat) return cat;
        try {
          await api.post('/catalogos', { code, name, description }, authHeaders);
        } catch { /* puede existir ya */ }
        const res = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        freshCats = res.data ?? [];
        cat = freshCats.find((c) => c.code === code);
        return cat;
      };

      const catPaises = await asegurarCatalogo('PAISES', 'Países', 'Base de todo: países usados en ciudades, clubes y nacionalidades.');
      const catNat = await asegurarCatalogo('NACIONALIDADES', 'Nacionalidades', 'Vincula cada nacionalidad a su país de origen.');
      if (!catPaises || !catNat) {
        err('No se pudieron preparar los catálogos. ¿Tienes permisos de administrador?');
        return;
      }

      // 2. Ítems existentes
      const [resPaises, resNat] = await Promise.all([
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/PAISES/elementos', authHeaders),
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/NACIONALIDADES/elementos', authHeaders),
      ]);
      const paisesExistentes = resPaises.data ?? [];
      const natExistentes = resNat.data ?? [];

      const paisPorNombre = new Map<string, CatalogItemRow>();
      paisesExistentes.forEach((p) => paisPorNombre.set(normalizar(p.name), p));
      const natPorNombre = new Set(natExistentes.map((n) => normalizar(n.name)));
      const codigosPais = paisesExistentes.map((p) => p.code);
      const codigosNat = natExistentes.map((n) => n.code);

      let paisesCreados = 0;
      let natCreadas = 0;
      let ordenPais = paisesExistentes.length;
      let ordenNat = natExistentes.length;

      // 3. Crear país + nacionalidad faltantes (secuencial para mantener relación e IDs)
      for (const fila of PAISES_FIFA) {
        const clavePais = normalizar(fila.nombre);
        let pais = paisPorNombre.get(clavePais);

        if (!pais) {
          const codigo = slugCatalogItemCode(fila.nombre, codigosPais);
          codigosPais.push(codigo);
          ordenPais += 1;
          try {
            const res = await api.post<CatalogItemRow>('/catalogos/elementos', {
              catalogId: catPaises.id,
              code: codigo,
              name: fila.nombre,
              sortOrder: ordenPais,
              parentItemId: null,
            }, authHeaders);
            pais = res.data;
            paisPorNombre.set(clavePais, pais);
            paisesCreados += 1;
          } catch { /* omitir país que falle y seguir */ }
        }

        const claveNat = normalizar(fila.nacionalidad);
        if (pais && !natPorNombre.has(claveNat)) {
          const codigoNat = slugCatalogItemCode(fila.nacionalidad, codigosNat);
          codigosNat.push(codigoNat);
          ordenNat += 1;
          try {
            await api.post('/catalogos/elementos', {
              catalogId: catNat.id,
              code: codigoNat,
              name: fila.nacionalidad,
              sortOrder: ordenNat,
              parentItemId: pais.id,
            }, authHeaders);
            natPorNombre.add(claveNat);
            natCreadas += 1;
          } catch { /* omitir nacionalidad que falle */ }
        }
      }

      await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });
      if (paisesCreados === 0 && natCreadas === 0) {
        ok('Todo estaba al día: no había países ni nacionalidades nuevas por importar.');
      } else {
        ok(`Importación lista: ${paisesCreados} país(es) y ${natCreadas} nacionalidad(es) nuevas.`);
      }
    } catch {
      err('No se pudo completar la importación. Revisa tu conexión y permisos.');
    } finally {
      setImportandoPaises(false);
      setLoading(false);
    }
  };

  // Carga las ciudades de un país concreto para el formulario de Clubes
  const cargarCiudadesPorPais = async (paisItemId: string) => {
    if (!paisItemId) { setClubCityOptions([]); return; }
    try {
      const res = await api.get<CatalogItemRow[]>(
        `/catalogos/por-codigo/CIUDADES/elementos?parentItemId=${paisItemId}`,
        authHeaders
      );
      setClubCityOptions(res.data ?? []);
    } catch { setClubCityOptions([]); }
  };

  const loadSportsStructureBase = useCallback(async (silencioso = false) => {
    try {
      const [countriesRes, categoriesRes, sourcesRes] = await Promise.all([
        api.get<SportsCountryRow[]>('/paises', authHeaders),
        api.get<SportsCategoryRow[]>('/categorias-competitivas', authHeaders),
        api.get<SportsDataSourceRow[]>('/fuentes-datos', authHeaders),
      ]);
      setSportsCountries(countriesRes.data ?? []);
      setSportsCategories(categoriesRes.data ?? []);
      setSportsDataSources(sourcesRes.data ?? []);
      if (!silencioso) ok('Estructura deportiva cargada.');
    } catch {
      if (!silencioso) err('No se pudo cargar la estructura deportiva.');
    }
  }, [authHeaders, err, ok]);

  const loadSportsCities = useCallback(async (countryId: string, silencioso = true) => {
    if (!countryId) {
      setSportsCities([]);
      return;
    }
    try {
      const res = await api.get<SportsCityRow[]>(`/paises/${countryId}/ciudades`, authHeaders);
      setSportsCities(res.data ?? []);
      if (!silencioso) ok('Ciudades cargadas.');
    } catch {
      setSportsCities([]);
      if (!silencioso) err('No se pudieron cargar las ciudades.');
    }
  }, [authHeaders, err, ok]);

  const loadSportsCompetitions = useCallback(async (countryId: string, season: string, silencioso = true) => {
    if (!countryId || !season.trim()) {
      setSportsCompetitions([]);
      return;
    }
    try {
      const res = await api.get<SportsCompetitionRow[]>(
        `/paises/${countryId}/competiciones?temporada=${encodeURIComponent(season.trim())}`,
        authHeaders,
      );
      setSportsCompetitions(res.data ?? []);
      if (!silencioso) ok('Competiciones cargadas.');
    } catch {
      setSportsCompetitions([]);
      if (!silencioso) err('No se pudieron cargar las competiciones.');
    }
  }, [authHeaders, err, ok]);

  const loadSportsCompetitionClubs = useCallback(async (competitionId: string, season: string, silencioso = true) => {
    if (!competitionId || !season.trim()) {
      setSportsCompetitionClubs([]);
      return;
    }
    try {
      const res = await api.get<SportsCompetitionClubRow[]>(
        `/competiciones/${competitionId}/clubes?temporada=${encodeURIComponent(season.trim())}`,
        authHeaders,
      );
      setSportsCompetitionClubs(res.data ?? []);
      if (!silencioso) ok('Clubes de competición cargados.');
    } catch {
      setSportsCompetitionClubs([]);
      if (!silencioso) err('No se pudieron cargar los clubes de la competición.');
    }
  }, [authHeaders, err, ok]);

  const syncSportsCountryToCatalogs = async (countryId: string, season: string, silencioso = false, manageLoading = true) => {
    if (!countryId || !season.trim()) {
      if (!silencioso) err('Selecciona país y temporada para sincronizar.');
      return;
    }
    const normalizeText = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (manageLoading) setLoading(true);
    try {
      const [catalogsRes, sportsCountriesRes, sportsCitiesRes, sportsCompetitionsRes] = await Promise.all([
        api.get<CatalogRow[]>('/catalogos', authHeaders),
        api.get<SportsCountryRow[]>('/paises', authHeaders),
        api.get<SportsCityRow[]>(`/paises/${countryId}/ciudades`, authHeaders),
        api.get<SportsCompetitionRow[]>(`/paises/${countryId}/competiciones?temporada=${encodeURIComponent(season.trim())}`, authHeaders),
      ]);

      let freshCatalogs = catalogsRes.data ?? [];
      const sportsCountry = (sportsCountriesRes.data ?? []).find((c) => c.id === countryId);
      if (!sportsCountry) {
        if (!silencioso) err('No se encontró el país en la estructura deportiva.');
        return;
      }

      const ensureCatalog = async (code: string, name: string, description: string) => {
        let cat = freshCatalogs.find((c) => c.code === code);
        if (cat) return cat;
        await api.post('/catalogos', { code, name, description }, authHeaders);
        const res = await api.get<CatalogRow[]>('/catalogos', authHeaders);
        freshCatalogs = res.data ?? [];
        cat = freshCatalogs.find((c) => c.code === code);
        if (!cat) throw new Error(`No se pudo preparar catálogo ${code}`);
        return cat;
      };

      const [catPaises, catCiudades, catCategorias, catClubes] = await Promise.all([
        ensureCatalog('PAISES', 'Países', 'Base de todo: crea los países primero.'),
        ensureCatalog('CIUDADES', 'Ciudades', 'Ciudades vinculadas a un país.'),
        ensureCatalog('CATEGORIAS_LIGA', 'Categorías', 'Niveles competitivos.'),
        ensureCatalog('CLUBES', 'Clubes', 'Clubes con país, ciudad, categoría y liga/torneo.'),
      ]);

      const [paisesItemsRes, ciudadesItemsRes, categoriasItemsRes, clubesItemsRes] = await Promise.all([
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/PAISES/elementos', authHeaders),
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/CIUDADES/elementos', authHeaders),
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/CATEGORIAS_LIGA/elementos', authHeaders),
        api.get<CatalogItemRow[]>('/catalogos/por-codigo/CLUBES/elementos', authHeaders),
      ]);

      const paisesItems = paisesItemsRes.data ?? [];
      const ciudadesItems = ciudadesItemsRes.data ?? [];
      const categoriasItems = categoriasItemsRes.data ?? [];
      const clubesItems = clubesItemsRes.data ?? [];

      // 1) País en catálogo
      let paisItem = paisesItems.find((p) => normalizeText(p.name) === normalizeText(sportsCountry.name));
      if (!paisItem) {
        const countryCode = slugCatalogItemCode(sportsCountry.name, paisesItems.map((x) => x.code));
        const created = await api.post<CatalogItemRow>('/catalogos/elementos', {
          catalogId: catPaises.id,
          code: countryCode,
          name: sportsCountry.name,
          sortOrder: paisesItems.length + 1,
          parentItemId: null,
        }, authHeaders);
        paisItem = created.data;
        paisesItems.push(created.data);
      }

      // 2) Ciudades del país
      const sportsCities = sportsCitiesRes.data ?? [];
      const cityCodes = ciudadesItems.map((x) => x.code);
      let cityOrder = ciudadesItems.length;
      const cityByNormalized = new Map(
        ciudadesItems
          .filter((c) => c.parentItemId === paisItem.id)
          .map((c) => [normalizeText(c.name), c]),
      );
      for (const sc of sportsCities) {
        if (cityByNormalized.has(normalizeText(sc.name))) continue;
        const cityCode = slugCatalogItemCode(`${sportsCountry.name}_${sc.name}`, cityCodes);
        cityCodes.push(cityCode);
        cityOrder += 1;
        const createdCity = await api.post<CatalogItemRow>('/catalogos/elementos', {
          catalogId: catCiudades.id,
          code: cityCode,
          name: sc.name,
          sortOrder: cityOrder,
          parentItemId: paisItem.id,
        }, authHeaders);
        ciudadesItems.push(createdCity.data);
        cityByNormalized.set(normalizeText(sc.name), createdCity.data);
      }

      // 3) Categorías usadas por competiciones
      const sportsCompetitions = sportsCompetitionsRes.data ?? [];
      const categoryCodes = categoriasItems.map((x) => x.code);
      let catOrder = categoriasItems.length;
      const categoryByNormalized = new Map(categoriasItems.map((c) => [normalizeText(c.name), c]));
      for (const cp of sportsCompetitions) {
        const key = normalizeText(cp.competitiveCategoryName);
        if (categoryByNormalized.has(key)) continue;
        const catCode = slugCatalogItemCode(cp.competitiveCategoryName, categoryCodes);
        categoryCodes.push(catCode);
        catOrder += 1;
        const createdCategory = await api.post<CatalogItemRow>('/catalogos/elementos', {
          catalogId: catCategorias.id,
          code: catCode,
          name: cp.competitiveCategoryName,
          sortOrder: catOrder,
          parentItemId: null,
        }, authHeaders);
        categoriasItems.push(createdCategory.data);
        categoryByNormalized.set(key, createdCategory.data);
      }

      // 4) Clubes por competición y temporada -> catálogo CLUBES
      const clubCodes = clubesItems.map((x) => x.code);
      let clubOrder = clubesItems.length;
      const clubExists = new Set(
        clubesItems.map((c) =>
          `${normalizeText(c.name)}|${normalizeText(c.country ?? '')}|${normalizeText(c.league ?? '')}`),
      );
      for (const cp of sportsCompetitions) {
        const clubsRes = await api.get<SportsCompetitionClubRow[]>(
          `/competiciones/${cp.id}/clubes?temporada=${encodeURIComponent(season.trim())}`,
          authHeaders,
        );
        const categoryItem = categoryByNormalized.get(normalizeText(cp.competitiveCategoryName));
        for (const sc of clubsRes.data ?? []) {
          const key = `${normalizeText(sc.clubName)}|${normalizeText(sportsCountry.name)}|${normalizeText(cp.name)}`;
          if (clubExists.has(key)) continue;
          const clubCode = slugCatalogItemCode(`${sc.clubName}_${sportsCountry.name}_${cp.name}`, clubCodes);
          clubCodes.push(clubCode);
          clubOrder += 1;
          await api.post('/catalogos/elementos', {
            catalogId: catClubes.id,
            code: clubCode,
            name: sc.clubName,
            sortOrder: clubOrder,
            country: sportsCountry.name,
            city: sc.cityName ?? null,
            league: cp.name,
            parentItemId: categoryItem?.id ?? null,
          }, authHeaders);
          clubExists.add(key);
        }
      }

      await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });
      if (!silencioso) ok(`Sincronización completada: ${sportsCountry.name} ${season}.`);
    } catch (e) {
      if (!silencioso) err(mensajeErrorApi(e, 'No se pudo sincronizar la estructura al catálogo.'));
    } finally {
      if (manageLoading) setLoading(false);
    }
  };

  const createSportsCountryQuick = async () => {
    const name = window.prompt('Nuevo país (nombre oficial):', '');
    if (!name?.trim()) return;
    const nationality = window.prompt('Nacionalidad (opcional):', '') ?? '';
    try {
      await api.post('/paises', {
        name: name.trim(),
        nationality: nationality.trim() || null,
        fifaCode: null,
        iso2Code: null,
      }, authHeaders);
      await loadSportsStructureBase(true);
      ok(`País «${name.trim()}» creado.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo crear el país.'));
    }
  };

  const createSportsCityQuick = async () => {
    if (!sportsCountryId) { err('Selecciona un país para crear la ciudad.'); return; }
    const name = window.prompt('Nueva ciudad:', '');
    if (!name?.trim()) return;
    const regionDepartment = window.prompt('Región / departamento (opcional):', '') ?? '';
    try {
      await api.post('/ciudades', {
        countryId: sportsCountryId,
        name: name.trim(),
        regionDepartment: regionDepartment.trim() || null,
      }, authHeaders);
      await loadSportsCities(sportsCountryId, true);
      ok(`Ciudad «${name.trim()}» creada.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo crear la ciudad.'));
    }
  };

  const createSportsCategoryQuick = async () => {
    const name = window.prompt('Nueva categoría competitiva (ej. Primera División):', '');
    if (!name?.trim()) return;
    try {
      await api.post('/categorias-competitivas', { name: name.trim(), level: null, description: null }, authHeaders);
      await loadSportsStructureBase(true);
      ok(`Categoría «${name.trim()}» creada.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo crear la categoría.'));
    }
  };

  const createSportsCompetitionQuick = async () => {
    if (!sportsCountryId) { err('Selecciona un país.'); return; }
    if (!sportsCategoryId) { err('Selecciona una categoría competitiva.'); return; }
    if (!sportsSeason.trim()) { err('Escribe la temporada.'); return; }
    const name = window.prompt(`Nombre de competición para temporada ${sportsSeason}:`, '');
    if (!name?.trim()) return;
    try {
      await api.post('/competiciones', {
        countryId: sportsCountryId,
        competitiveCategoryId: sportsCategoryId,
        name: name.trim(),
        season: sportsSeason.trim(),
        divisionLevel: null,
        isProfessional: true,
        dataSourceId: sportsDataSourceId || null,
      }, authHeaders);
      await loadSportsCompetitions(sportsCountryId, sportsSeason, true);
      ok(`Competición «${name.trim()}» creada.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo crear la competición.'));
    }
  };

  const createSportsClub = async () => {
    if (!sportsCountryId) { err('Selecciona un país.'); return; }
    if (!sportsCompetitionId) { err('Selecciona una competición.'); return; }
    if (!sportsSeason.trim()) { err('Escribe la temporada.'); return; }
    if (!sportsClubName.trim()) { err('Escribe el nombre del club.'); return; }
    try {
      await api.post('/clubes', {
        name: sportsClubName.trim(),
        countryId: sportsCountryId,
        cityId: sportsCityId || null,
        shortName: sportsClubShortName.trim() || null,
        crestUrl: null,
        apiProvider: null,
        apiTeamId: null,
        dataSourceId: sportsDataSourceId || null,
        validationStatus: sportsValidationStatus,
        competitionId: sportsCompetitionId,
        season: sportsSeason.trim(),
        competitionStatus: 'activo',
      }, authHeaders);
      setSportsClubName('');
      setSportsClubShortName('');
      await loadSportsCompetitionClubs(sportsCompetitionId, sportsSeason, true);
      ok('Club registrado y vinculado a la competición/temporada.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo registrar el club.'));
    }
  };

  const updateSportsClubValidationStatus = async (clubId: string, validationStatus: 'pendiente' | 'validado' | 'observado' | 'duplicado' | 'descartado') => {
    await api.patch(`/clubes/${clubId}/validacion`, { validationStatus }, authHeaders);
  };

  const validarDuplicadosCompeticionActual = async () => {
    if (!sportsCompetitionId || !sportsSeason.trim()) {
      err('Selecciona una competición y temporada para validar duplicados.');
      return;
    }
    if (sportsCompetitionClubs.length === 0) {
      err('No hay clubes cargados en la competición actual.');
      return;
    }
    const normalizeText = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '').trim().toLowerCase();

    const grouped = new Map<string, SportsCompetitionClubRow[]>();
    for (const row of sportsCompetitionClubs) {
      const key = `${normalizeText(row.clubName)}|${normalizeText(row.cityName ?? '')}`;
      const arr = grouped.get(key) ?? [];
      arr.push(row);
      grouped.set(key, arr);
    }

    const duplicateIds = new Set<string>();
    grouped.forEach((arr) => {
      if (arr.length > 1) arr.forEach((r) => duplicateIds.add(r.clubId));
    });

    const updates: Array<Promise<unknown>> = [];
    let markedDuplicates = 0;
    let restoredPending = 0;
    for (const row of sportsCompetitionClubs) {
      if (duplicateIds.has(row.clubId) && row.validationStatus !== 'duplicado') {
        updates.push(updateSportsClubValidationStatus(row.clubId, 'duplicado'));
        markedDuplicates += 1;
      } else if (!duplicateIds.has(row.clubId) && row.validationStatus === 'duplicado') {
        updates.push(updateSportsClubValidationStatus(row.clubId, 'pendiente'));
        restoredPending += 1;
      }
    }

    if (updates.length === 0) {
      ok(duplicateIds.size === 0
        ? 'Validación completa: no se detectaron duplicados.'
        : 'Validación completa: los duplicados ya estaban marcados.');
      return;
    }

    try {
      setLoading(true);
      await Promise.all(updates);
      await loadSportsCompetitionClubs(sportsCompetitionId, sportsSeason, true);
      ok(`Validación aplicada: ${markedDuplicates} marcado(s) como duplicado y ${restoredPending} restaurado(s) a pendiente.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo actualizar el estado de validación de duplicados.'));
    } finally {
      setLoading(false);
    }
  };

  const importarPresetBolivia2026 = async () => {
    if (!confirmAction('Esto preparará Bolivia 2026 (categorías, competiciones y clubes base de Primera División). ¿Continuar?')) return;
    const normalizeText = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    try {
      setLoading(true);

      // 1) Asegurar país Bolivia
      let countries = (await api.get<SportsCountryRow[]>('/paises', authHeaders)).data ?? [];
      let bolivia = countries.find((c) => normalizeText(c.name) === normalizeText('Bolivia'));
      if (!bolivia) {
        bolivia = (await api.post<SportsCountryRow>('/paises', {
          name: 'Bolivia',
          nationality: 'Boliviano',
          fifaCode: 'BOL',
          iso2Code: 'BO',
        }, authHeaders)).data;
        countries = [...countries, bolivia];
      }

      // 2) Asegurar fuente base manual
      let sources = (await api.get<SportsDataSourceRow[]>('/fuentes-datos', authHeaders)).data ?? [];
      let fuente = sources.find((s) => normalizeText(s.name) === normalizeText('Carga manual Fortis'));
      if (!fuente) {
        fuente = (await api.post<SportsDataSourceRow>('/fuentes-datos', {
          name: 'Carga manual Fortis',
          type: 'Manual',
          url: null,
          reliability: 'Media-Alta',
        }, authHeaders)).data;
        sources = [...sources, fuente];
      }

      // 3) Asegurar ciudades base de Bolivia
      const cityNames = Array.from(new Set(BOLIVIA_2026_CLUBES_PRIMERA.map((c) => c.city)));
      let cities = (await api.get<SportsCityRow[]>(`/paises/${bolivia.id}/ciudades`, authHeaders)).data ?? [];
      const citySet = new Set(cities.map((c) => normalizeText(c.name)));
      for (const cityName of cityNames) {
        if (citySet.has(normalizeText(cityName))) continue;
        try {
          const createdCity = await api.post<SportsCityRow>('/ciudades', {
            countryId: bolivia.id,
            name: cityName,
            regionDepartment: null,
          }, authHeaders);
          cities = [...cities, createdCity.data];
          citySet.add(normalizeText(cityName));
        } catch {
          // omitir y continuar
        }
      }

      // 4) Asegurar categorías competitivas
      let categories = (await api.get<SportsCategoryRow[]>('/categorias-competitivas', authHeaders)).data ?? [];
      const categoryByName = new Map(categories.map((c) => [normalizeText(c.name), c]));
      for (const c of BOLIVIA_2026_CATEGORIAS) {
        if (categoryByName.has(normalizeText(c.name))) continue;
        try {
          const created = await api.post<SportsCategoryRow>('/categorias-competitivas', {
            name: c.name,
            level: c.level,
            description: null,
          }, authHeaders);
          categories = [...categories, created.data];
          categoryByName.set(normalizeText(created.data.name), created.data);
        } catch {
          // omitir y continuar
        }
      }

      // 5) Asegurar competiciones Bolivia 2026
      let competitions = (await api.get<SportsCompetitionRow[]>(
        `/paises/${bolivia.id}/competiciones?temporada=2026`,
        authHeaders,
      )).data ?? [];
      const competitionByName = new Map(competitions.map((c) => [normalizeText(c.name), c]));
      for (const cp of BOLIVIA_2026_COMPETICIONES) {
        if (competitionByName.has(normalizeText(cp.name))) continue;
        const cat = categoryByName.get(normalizeText(cp.category));
        if (!cat) continue;
        try {
          const created = await api.post<SportsCompetitionRow>('/competiciones', {
            countryId: bolivia.id,
            competitiveCategoryId: cat.id,
            name: cp.name,
            season: '2026',
            divisionLevel: cp.divisionLevel,
            isProfessional: cp.isProfessional,
            dataSourceId: fuente?.id ?? null,
          }, authHeaders);
          competitions = [...competitions, created.data];
          competitionByName.set(normalizeText(created.data.name), created.data);
        } catch {
          // omitir y continuar
        }
      }

      // 6) Cargar clubes base en Primera División 2026
      const primera = competitionByName.get(normalizeText('Liga de la División Profesional'));
      if (primera) {
        const cityByName = new Map(cities.map((c) => [normalizeText(c.name), c]));
        for (const cl of BOLIVIA_2026_CLUBES_PRIMERA) {
          const city = cityByName.get(normalizeText(cl.city));
          const short = slugCatalogItemCode(cl.name).replace(/_/g, '').slice(0, 6) || null;
          try {
            await api.post('/clubes', {
              name: cl.name,
              countryId: bolivia.id,
              cityId: city?.id ?? null,
              shortName: short,
              crestUrl: null,
              apiProvider: null,
              apiTeamId: null,
              dataSourceId: fuente?.id ?? null,
              validationStatus: 'validado',
              competitionId: primera.id,
              season: '2026',
              competitionStatus: 'activo',
            }, authHeaders);
          } catch {
            // omitir y continuar
          }
        }
      }

      // 7) refrescar UI y fijar filtros de trabajo
      setSportsCountryId(bolivia.id);
      setSportsSeason('2026');
      await loadSportsStructureBase(true);
      await loadSportsCities(bolivia.id, true);
      await loadSportsCompetitions(bolivia.id, '2026', true);
      const refreshedComp = (await api.get<SportsCompetitionRow[]>(
        `/paises/${bolivia.id}/competiciones?temporada=2026`,
        authHeaders,
      )).data ?? [];
      const primeraFinal = refreshedComp.find((c) => normalizeText(c.name) === normalizeText('Liga de la División Profesional'));
      if (primeraFinal) {
        setSportsCategoryId(primeraFinal.competitiveCategoryId);
        setSportsCompetitionId(primeraFinal.id);
        await loadSportsCompetitionClubs(primeraFinal.id, '2026', true);
      } else {
        setSportsCompetitionId('');
        setSportsCompetitionClubs([]);
      }
      await syncSportsCountryToCatalogs(bolivia.id, '2026', true, false);
      ok('Preset Bolivia 2026 aplicado. Revisa y ajusta lo que falte.');
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo aplicar el preset Bolivia 2026.'));
    } finally {
      setLoading(false);
    }
  };

  const importarPresetSudamericaBase = async () => {
    if (!confirmAction('Se cargará Sudamérica base (países CONMEBOL, liga principal y clubes destacados) para la temporada actual seleccionada. ¿Continuar?')) return;
    const normalizeText = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const season = sportsSeason.trim() || '2026';
    try {
      setLoading(true);

      // Fuente base
      let sources = (await api.get<SportsDataSourceRow[]>('/fuentes-datos', authHeaders)).data ?? [];
      let source = sources.find((s) => normalizeText(s.name) === normalizeText('Carga inicial Sudamérica Fortis'));
      if (!source) {
        source = (await api.post<SportsDataSourceRow>('/fuentes-datos', {
          name: 'Carga inicial Sudamérica Fortis',
          type: 'Manual',
          url: null,
          reliability: 'Media-Alta',
        }, authHeaders)).data;
      }

      // Categoría base Primera División
      let categories = (await api.get<SportsCategoryRow[]>('/categorias-competitivas', authHeaders)).data ?? [];
      let primera = categories.find((c) => normalizeText(c.name) === normalizeText('Primera División'));
      if (!primera) {
        primera = (await api.post<SportsCategoryRow>('/categorias-competitivas', {
          name: 'Primera División',
          level: 1,
          description: 'Nivel profesional principal',
        }, authHeaders)).data;
      }

      let countries = (await api.get<SportsCountryRow[]>('/paises', authHeaders)).data ?? [];
      let createdCountries = 0;
      let createdCities = 0;
      let createdCompetitions = 0;
      let createdClubMappings = 0;

      for (const preset of SUDAMERICA_BASE) {
        // País
        let country = countries.find((c) => normalizeText(c.name) === normalizeText(preset.country));
        if (!country) {
          try {
            country = (await api.post<SportsCountryRow>('/paises', {
              name: preset.country,
              nationality: preset.nationality,
              fifaCode: null,
              iso2Code: null,
            }, authHeaders)).data;
            countries = [...countries, country];
            createdCountries += 1;
          } catch {
            continue;
          }
        }

        // Ciudades
        let cities = (await api.get<SportsCityRow[]>(`/paises/${country.id}/ciudades`, authHeaders)).data ?? [];
        const cityByName = new Map(cities.map((c) => [normalizeText(c.name), c]));
        for (const club of preset.clubs) {
          if (cityByName.has(normalizeText(club.city))) continue;
          try {
            const createdCity = (await api.post<SportsCityRow>('/ciudades', {
              countryId: country.id,
              name: club.city,
              regionDepartment: null,
            }, authHeaders)).data;
            cities = [...cities, createdCity];
            cityByName.set(normalizeText(createdCity.name), createdCity);
            createdCities += 1;
          } catch {
            // continue
          }
        }

        // Competición principal por país
        let competitions = (await api.get<SportsCompetitionRow[]>(
          `/paises/${country.id}/competiciones?temporada=${encodeURIComponent(season)}`,
          authHeaders,
        )).data ?? [];
        let competition = competitions.find((cp) => normalizeText(cp.name) === normalizeText(preset.firstDivisionCompetition));
        if (!competition) {
          try {
            competition = (await api.post<SportsCompetitionRow>('/competiciones', {
              countryId: country.id,
              competitiveCategoryId: primera.id,
              name: preset.firstDivisionCompetition,
              season,
              divisionLevel: 1,
              isProfessional: true,
              dataSourceId: source?.id ?? null,
            }, authHeaders)).data;
            createdCompetitions += 1;
          } catch {
            continue;
          }
        }

        // Clubes
        for (const club of preset.clubs) {
          const city = cityByName.get(normalizeText(club.city));
          const short = slugCatalogItemCode(club.name).replace(/_/g, '').slice(0, 6) || null;
          try {
            await api.post('/clubes', {
              name: club.name,
              countryId: country.id,
              cityId: city?.id ?? null,
              shortName: short,
              crestUrl: null,
              apiProvider: null,
              apiTeamId: null,
              dataSourceId: source?.id ?? null,
              validationStatus: 'pendiente',
              competitionId: competition.id,
              season,
              competitionStatus: 'activo',
            }, authHeaders);
            createdClubMappings += 1;
          } catch {
            // puede existir, se omite
          }
        }
        await syncSportsCountryToCatalogs(country.id, season, true, false);
      }

      await loadSportsStructureBase(true);
      ok(`Sudamérica base aplicada: países +${createdCountries}, ciudades +${createdCities}, competiciones +${createdCompetitions}, clubes vinculados +${createdClubMappings}.`);
    } catch (e) {
      err(mensajeErrorApi(e, 'No se pudo aplicar el preset Sudamérica base.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || activeTab !== 'Parámetros de configuración' || paramSubTab !== 'CLUBES') return;
    void loadSportsStructureBase(true);
  }, [token, activeTab, paramSubTab, loadSportsStructureBase]);

  useEffect(() => {
    if (!token || activeTab !== 'Parámetros de configuración' || paramSubTab !== 'CLUBES') return;
    if (!sportsCountryId) {
      setSportsCities([]);
      setSportsCompetitions([]);
      setSportsCompetitionId('');
      setSportsCityId('');
      setSportsCompetitionClubs([]);
      return;
    }
    setSportsCompetitionId('');
    setSportsCityId('');
    void loadSportsCities(sportsCountryId, true);
    void loadSportsCompetitions(sportsCountryId, sportsSeason, true);
  }, [token, activeTab, paramSubTab, sportsCountryId, sportsSeason, loadSportsCities, loadSportsCompetitions]);

  useEffect(() => {
    if (!token || activeTab !== 'Parámetros de configuración' || paramSubTab !== 'CLUBES') return;
    void loadSportsCompetitionClubs(sportsCompetitionId, sportsSeason, true);
  }, [token, activeTab, paramSubTab, sportsCompetitionId, sportsSeason, loadSportsCompetitionClubs]);

  const createCatalog = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalogos', { code: catCode, name: catName, description: catDesc }, authHeaders);
      setCatCode(''); setCatName(''); setCatDesc('');
      await cargarListasParametros({ silent: true, sincronizarDesplegablesJugador: true });
      ok('Catálogo adicional creado.');
    } catch { err('No se pudo crear el catálogo.'); }
  };

  const loadCatalogItems = async (id: string) => {
    setSelectedCatalogId(id);
    try {
      const res = await api.get<CatalogItemRow[]>(`/catalogos/${id}/elementos`, authHeaders);
      setCatalogItems(res.data ?? []);
      ok('Ítems cargados.');
    } catch { err('No se pudieron cargar ítems.'); }
  };

  const createCatalogItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogId) { err('Selecciona un catálogo.'); return; }
    const sel = catalogs.find((c) => c.id === selectedCatalogId);
    const clubExtra = sel?.code === 'CLUBES';
    try {
      const body: Record<string, unknown> = {
        catalogId: selectedCatalogId,
        code: itemCode,
        name: itemName,
        sortOrder: Number(itemOrder),
      };
      if (clubExtra) {
        body.country = itemCountry.trim() || null;
        body.city = itemCity.trim() || null;
        body.league = itemLeague.trim() || null;
      }
      await api.post('/catalogos/elementos', body, authHeaders);
      setItemCode(''); setItemName(''); setItemCountry(''); setItemCity(''); setItemLeague('');
      await loadCatalogItems(selectedCatalogId);
      await refreshStandardListItems();
      await cargarCatalogosFormularioJugador();
      ok('Ítem creado.');
    } catch { err('No se pudo crear el ítem.'); }
  };

  // ─── Usuarios ──────────────────────────────────────────────────────────────

  const loadUsers = async (silencioso = false) => {
    try {
      const res = await api.get<UserRow[]>('/usuarios', authHeaders);
      setUsers(res.data ?? []);
      if (!silencioso) ok('Usuarios cargados.');
    } catch { err('No se pudieron cargar usuarios.'); }
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', { email: newUserEmail, fullName: newUserName, password: newUserPassword, role: newUserRole }, authHeaders);
      setNewUserEmail(''); setNewUserName(''); setNewUserPassword('');
      await loadUsers();
      ok('Usuario creado.');
    } catch { err('No se pudo crear el usuario. Verifique la contraseña (mín. 8 chars, mayúscula, número, símbolo).'); }
  };

  const changeRole = async (userId: string, role: string) => {
    try {
      await api.patch(`/usuarios/${userId}/rol`, { role }, authHeaders);
      await loadUsers();
      ok('Rol actualizado.');
    } catch { err('No se pudo cambiar el rol.'); }
  };

  const deactivateUser = async (userId: string) => {
    if (!confirmAction('¿Desactivar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${userId}`, authHeaders);
      await loadUsers();
      ok('Usuario desactivado.');
    } catch { err('No se pudo desactivar el usuario.'); }
  };

  // ─── Computed ──────────────────────────────────────────────────────────────

  const totalPaginasJugadores = totalPages(totalJugadores, TAMANIO_PAGINA_JUGADORES);
  const totalTrPages = totalPages(trTotal, 10);
  const totalAuditPages = totalPages(auditTotal, 20);
  const esAdministrador = sessionUser?.roles.includes('Administrador') ?? false;
  const usuariosPorRol = ROLES_SISTEMA.map((rol) => ({
    rol,
    usuarios: users.filter((u) => u.isActive && u.roles.includes(rol)),
  }));

  const negChartData = negReport ? [
    { name: 'En análisis', valor: negReport.enAnalisis },
    { name: 'Negociación', valor: negReport.enNegociacion },
    { name: 'Pte. firma', valor: negReport.pendienteFirma },
    { name: 'Completadas', valor: negReport.completadas },
    { name: 'Canceladas', valor: negReport.canceladas },
  ] : [];

  const trChartData = trReport ? [
    { name: 'En análisis', valor: trReport.enAnalisis },
    { name: 'Negociación', valor: trReport.enNegociacion },
    { name: 'Pte. firma', valor: trReport.pendienteFirma },
    { name: 'Completadas', valor: trReport.completadas },
    { name: 'Canceladas', valor: trReport.canceladas },
  ] : [];

  const contractsPieData = contractsReport ? [
    { name: 'Vigentes', value: contractsReport.vigentes },
    { name: 'Vencidos', value: contractsReport.vencidos },
    { name: 'Próx. vencer', value: contractsReport.proximosAVencer },
  ] : [];
  const intelligenceWeightsTotal = wPosition + wAge + wContract + wActivity;
  const intelligenceWeightsValid = intelligenceWeightsTotal === 100;
  const topRanking = ranking[0] ?? null;
  const avgRankingScore = ranking.length > 0
    ? (ranking.reduce((sum, row) => sum + Number(row.score), 0) / ranking.length).toFixed(1)
    : '—';
  const recomendacionesShortlist = ranking.slice(0, 8);
  const opcionesPosicionRol = (() => {
    const desdeCatalogo = (paramItemsByCode['POSICIONES'] ?? []).map((p) => p.name).filter(Boolean);
    if (desdeCatalogo.length > 0) return desdeCatalogo;
    return ['Delantero', 'Volante', 'Defensa central', 'Lateral', 'Portero', 'Mediocampista'];
  })();

  const statsWindowLimit = statsWindow === 'all' ? Number.POSITIVE_INFINITY : Number(statsWindow);
  const statsHistorySorted = [...statsHistory].sort((a, b) => b.matchDate.localeCompare(a.matchDate));
  const statsHistoryView = statsHistorySorted.slice(0, statsWindowLimit);
  const statsTotalGoals = statsHistoryView.reduce((s, x) => s + x.goals, 0);
  const statsTotalAssists = statsHistoryView.reduce((s, x) => s + x.assists, 0);
  const statsTotalMinutes = statsHistoryView.reduce((s, x) => s + x.minutesPlayed, 0);
  const statsContribuciones = statsTotalGoals + statsTotalAssists;
  const statsAvgRating = statsHistoryView.length > 0
    ? (statsHistoryView.reduce((s, x) => s + x.rating, 0) / statsHistoryView.length).toFixed(2)
    : '—';
  const statsPer90 = statsTotalMinutes > 0
    ? ((statsContribuciones / statsTotalMinutes) * 90).toFixed(2)
    : '0.00';
  const statsRecentForm = statsHistoryView.length > 0
    ? statsHistoryView
      .slice(0, 5)
      .reduce((sum, row) => sum + row.rating, 0) / Math.min(5, statsHistoryView.length)
    : null;
  const statsTrendData = [...statsHistoryView]
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate))
    .slice(-Math.min(10, statsHistoryView.length))
    .map((s, idx) => ({
      jornada: `J${idx + 1}`,
      rival: s.opponent,
      rating: Number(s.rating.toFixed(1)),
      contribucion: s.goals + s.assists,
    }));

  const comparePlayer = jugadores.find((j) => j.id === statsComparePlayerId) ?? null;
  const statsCompareHistoryView = [...statsCompareHistory]
    .sort((a, b) => b.matchDate.localeCompare(a.matchDate))
    .slice(0, statsWindowLimit);
  const compareGoals = statsCompareHistoryView.reduce((s, x) => s + x.goals, 0);
  const compareAssists = statsCompareHistoryView.reduce((s, x) => s + x.assists, 0);
  const compareMinutes = statsCompareHistoryView.reduce((s, x) => s + x.minutesPlayed, 0);
  const compareAvgRating = statsCompareHistoryView.length > 0
    ? statsCompareHistoryView.reduce((s, x) => s + x.rating, 0) / statsCompareHistoryView.length
    : 0;
  const comparePer90 = compareMinutes > 0
    ? ((compareGoals + compareAssists) / compareMinutes) * 90
    : 0;
  const comparisonChartData = [
    {
      metrica: 'Goles',
      titular: statsTotalGoals,
      comparado: compareGoals,
    },
    {
      metrica: 'Asistencias',
      titular: statsTotalAssists,
      comparado: compareAssists,
    },
    {
      metrica: 'Rating',
      titular: Number(statsAvgRating === '—' ? '0' : statsAvgRating),
      comparado: Number(compareAvgRating.toFixed(2)),
    },
    {
      metrica: 'Contrib./90',
      titular: Number(statsPer90),
      comparado: Number(comparePer90.toFixed(2)),
    },
  ];

  const selectorJugador = (
    <select
      value={idJugadorSeleccionado}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => setIdJugadorSeleccionado(e.target.value)}
      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cfd8e3', minWidth: '220px' }}
    >
      <option value="">-- Jugador activo --</option>
      {jugadores.map((p) => (
        <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mainPosition})</option>
      ))}
    </select>
  );

  useEffect(() => {
    if (activeTab !== 'Estadísticas') return;
    setStatsComparePlayerId('');
    setStatsCompareHistory([]);
    if (!idJugadorSeleccionado) {
      setStatsHistory([]);
      return;
    }
    void cargarEstadisticasJugador(true);
  }, [activeTab, idJugadorSeleccionado]);

  useEffect(() => {
    if (activeTab !== 'Parámetros de configuración' || paramSubTab !== 'DATOS_ANALISIS') return;
    if (jugadores.length === 0) {
      void cargarJugadores(1);
    }
  }, [activeTab, paramSubTab, jugadores.length]);

  useEffect(() => {
    if (activeTab !== 'Parámetros de configuración' || paramSubTab !== 'DATOS_ANALISIS') return;
    if (!statPlayerIdCargaManual) {
      setStatsManualHistory([]);
      return;
    }
    void cargarEstadisticasCargaManual(statPlayerIdCargaManual, true);
  }, [activeTab, paramSubTab, statPlayerIdCargaManual]);

  const refreshActiveTab = async () => {
    if (activeTab === null) {
      try {
        const dash = await api.get<DashboardReport>('/reportes/panel', authHeaders);
        setDashboard(dash.data);
      } catch {
        /* mismo criterio que la carga inicial del panel */
      }
      return;
    }
    switch (activeTab) {
      case 'Jugadores': await cargarJugadores(paginaJugadores); break;
      case 'Perfil': await loadProfile(); break;
      case 'Contratos': await loadContracts(); break;
      case 'Historial de clubes': await cargarHistorialYLogros(); break;
      case 'Negociaciones':
        if (subVistaNegociaciones === 'estado') await loadAllNegotiations();
        else if (subVistaNegociaciones === 'historial') await loadAllNegotiations();
        else if (subVistaNegociaciones === 'ofertas') await loadNegotiations();
        break;
      case 'Transferencias':
        if (idJugadorSeleccionado) {
          setTrClubFiltro('');
          setTrTipoFiltro('');
          await loadTransfersList(1, { club: '', tipo: '' });
        }
        break;
      case 'Reportes': await loadAllReports(); break;
      case 'Inteligencia':
        if (subVistaInteligencia === 'ranking' || subVistaInteligencia === 'recomendaciones') await loadRanking();
        break;
      case 'Estadísticas': await cargarEstadisticasJugador(); break;
      case 'Notificaciones': await loadNotifications(); break;
      case 'Auditoría':
        setSubVistaSeguridad('bitacoras');
        setActiveTab('Administración');
        await loadAudit(auditPage);
        break;
      case 'Parámetros de configuración': await cargarListasParametros(); break;
      case 'Administración':
        if (subVistaSeguridad === 'usuarios' || subVistaSeguridad === 'roles') await loadUsers(true);
        else if (subVistaSeguridad === 'bitacoras') await loadAudit(auditPage, true);
        break;
      default: break;
    }
  };

  // Rutas del portal público (sin token)
  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className={`materio-app${isDarkTheme ? ' theme-dark' : ''}`}>
      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.text}</div>
        ))}
      </div>

      <Routes>
        {/* ── Portal público ── */}
        <Route path="/" element={<><NavbarPortal /><PaginaInicio /><FooterPortal /></>} />
        <Route path="/jugadores" element={<><NavbarPortal /><PaginaCatalogo /><FooterPortal /></>} />
        <Route path="/jugadores/:id" element={<><NavbarPortal /><PaginaJugador /><FooterPortal /></>} />
        <Route path="/servicios" element={<><NavbarPortal /><PaginaServicios /><FooterPortal /></>} />
        <Route path="/contacto" element={<><NavbarPortal /><PaginaContacto /><FooterPortal /></>} />

        {/* ── Login ── */}
        <Route path="/login" element={
          token ? <Navigate to="/admin" replace /> : (
            <section className="auth-shell">
              <div className="auth-card">
                <button
                  className="auth-volver"
                  onClick={() => navigate('/')}
                  type="button"
                >
                  <i className="ri-arrow-left-line" /> Volver al portal
                </button>
                <div className="auth-brand-wrap">
                  <img className="auth-logo" src="/logo-login.png" alt="Logo Fortis Glesnor Group" />
                  <div className="auth-brand">FORTIS GLESNOR GROUP</div>
                </div>
                <h2>Acceso al sistema</h2>
                <p className="muted">Portal de gestión deportiva</p>
                <form onSubmit={login} className="auth-form">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" />
                  <button type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Iniciar sesión'}</button>
                </form>
              </div>
            </section>
          )
        } />

        {/* ── Admin (requiere token) ── */}
        <Route path="/admin" element={
          !token ? <Navigate to="/login" replace /> : (
        <div className={`materio-shell${isSidebarCompact ? ' sidebar-compact' : ''}`}>
          <aside className="materio-sidebar">
            <div className="materio-brand">
              <img className="materio-brand-logo" src="/logo-login.png" alt="Fortis Glesnor Group" width={36} height={36} />
              <div>
                <div className="materio-brand-title">Fortis Group</div>
                <div className="materio-brand-subtitle">Sports CRM</div>
              </div>
            </div>
            <div className="materio-menu-label">Módulos del portal</div>
            <nav className="materio-tab-list materio-tab-list-modulos" aria-label="Módulos del portal Fortis">
              {MODULOS_MENU.map((modulo) => {
                const moduloAbierto = Boolean(modulosAbiertos[modulo.id]);
                const moduloTienePestanaActiva = activeTab !== null && modulo.opciones.some((o) => o.pestana === activeTab);
                return (
                  <div
                    key={modulo.id}
                    className={`sidebar-modulo${moduloAbierto ? ' sidebar-modulo--abierto' : ''}${moduloTienePestanaActiva ? ' sidebar-modulo--activo' : ''}`}
                  >
                    <button
                      type="button"
                      className="sidebar-modulo-cabecera"
                      id={`cabecera-modulo-${modulo.id}`}
                      aria-expanded={moduloAbierto}
                      aria-controls={`panel-modulo-${modulo.id}`}
                      title={modulo.titulo}
                      onClick={() => alternarModulo(modulo.id)}
                    >
                      <span className="sidebar-modulo-cabecera-icono" aria-hidden>
                        <i className={modulo.iconoModulo} />
                      </span>
                      <span className="sidebar-modulo-cabecera-texto">{modulo.titulo}</span>
                      <span className="sidebar-modulo-cabecera-chevron" aria-hidden>
                        <i className="ri-arrow-down-s-line" />
                      </span>
                    </button>
                    <div
                      className="sidebar-modulo-cuerpo"
                      id={`panel-modulo-${modulo.id}`}
                      role="region"
                      aria-labelledby={`cabecera-modulo-${modulo.id}`}
                    >
                      <div className="sidebar-modulo-cuerpo-inner">
                        <div className="sidebar-modulo-opciones">
                          {modulo.opciones.map((opcion, indice) => {
                            const pestanaDestino = opcion.pestana;
                            const clave = `${modulo.id}-${indice}-${opcion.etiqueta.slice(0, 24)}`;
                            const activa = menuOpcionClave === clave;
                            return (
                              <button
                                key={clave}
                                type="button"
                                className={`materio-tab materio-tab-anidado${activa ? ' active' : ''}`}
                                title={opcion.etiqueta}
                                onClick={() => {
                                  abrirSoloModulo(modulo.id);
                                  setActiveTab(pestanaDestino);
                                  setMenuOpcionClave(clave);
                                  if (opcion.subVista) setSubVistaNegociaciones(opcion.subVista);
                                  if (opcion.subVistaInteligencia) setSubVistaInteligencia(opcion.subVistaInteligencia);
                                  if (opcion.subVistaSeguridad) setSubVistaSeguridad(opcion.subVistaSeguridad);
                                  if (opcion.paramSubTabDestino) setParamSubTab(opcion.paramSubTabDestino);
                                  else if (pestanaDestino === 'Parámetros de configuración') setParamSubTab('PAISES');
                                }}
                              >
                                <span className="materio-tab-icon"><i className={TAB_META[pestanaDestino].icon} /></span>
                                <span className="materio-tab-text">{opcion.etiqueta}</span>
                                {pestanaDestino === 'Notificaciones' && unreadCount > 0 && (
                                  <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
            {/* Controles del portal en el sidebar */}
            <div className="sidebar-controles">
              <button type="button" className="sidebar-ctrl-btn" onClick={() => { void refreshActiveTab(); }} title="Actualizar módulo">
                <i className="ri-refresh-line" />
                <span className="sidebar-ctrl-texto">Actualizar módulo</span>
              </button>
              <button type="button" className="sidebar-ctrl-btn" onClick={() => setIsDarkTheme((p) => !p)} title={isDarkTheme ? 'Modo claro' : 'Modo oscuro'}>
                <i className={isDarkTheme ? 'ri-sun-line' : 'ri-moon-line'} />
                <span className="sidebar-ctrl-texto">{isDarkTheme ? 'Modo claro' : 'Modo oscuro'}</span>
              </button>
              <button type="button" className="sidebar-ctrl-btn" onClick={() => setIsSidebarCompact((p) => !p)} title={isSidebarCompact ? 'Expandir menú' : 'Compactar menú'}>
                <i className={isSidebarCompact ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} />
                <span className="sidebar-ctrl-texto">{isSidebarCompact ? 'Expandir menú' : 'Compactar menú'}</span>
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary materio-logout"
              onClick={() => {
                setToken('');
                setUnreadCount(0);
                setActiveTab(null);
                setModulosAbiertos(estadoInicialModulosCerrados());
              }}
            >
              <i className="ri-logout-box-r-line" /> Cerrar sesión
            </button>
          </aside>

          <div className="materio-main">
            <input
              type="file"
              ref={contratoRepresentacionFirmadoRef}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'none' }}
              onChange={() => { void subirContratoRepresentacionFirmado(); }}
            />
            <header className="materio-topbar card">
              <div>
                <h1>FORTIS GLESNOR GROUP</h1>
                <p>
                  Portal de gestión deportiva
                  {activeTab === 'Administración'
                    ? ` · ${TITULOS_SUBVISTA_SEGURIDAD[subVistaSeguridad]}`
                    : activeTab
                      ? ` · ${tituloModuloDePestana(activeTab)}`
                      : ''}
                </p>
              </div>
              <div className="materio-session">
                {loading && <span className="spinner" />}
                <i className="ri-user-3-line" />
                <span>{sessionUser?.email || email}</span>
                {sessionUser?.roles[0] && (
                  <span className="profile-badge" style={{ marginLeft: 8 }}>{sessionUser.roles[0]}</span>
                )}
                {unreadCount > 0 && <span className="badge-inline">{unreadCount} sin leer</span>}
              </div>
            </header>

            <div className="materio-content">
              {activeTab === null ? (
                <section className="portal-bienvenida">
                  <div className="portal-bienvenida-inner">
                    <img src="/logo-login.png" alt="Fortis Glesnor Group" className="portal-bienvenida-logo" />
                    <h2 className="portal-bienvenida-titulo">Bienvenido al Portal Fortis Glesnor Group</h2>
                    <p className="portal-bienvenida-subtitulo">
                      Sistema de gestión de representación deportiva.<br />
                      Seleccione un módulo del menú lateral para comenzar.
                    </p>
                    <div className="portal-bienvenida-kpi">
                      <div className="portal-bienvenida-kpi-item">
                        <i className="ri-team-line" />
                        <span className="portal-bienvenida-kpi-valor">{dashboard?.totalPlayers ?? '—'}</span>
                        <span className="portal-bienvenida-kpi-etiq">Jugadores</span>
                      </div>
                      <div className="portal-bienvenida-kpi-item">
                        <i className="ri-handshake-line" />
                        <span className="portal-bienvenida-kpi-valor">{dashboard?.activeNegotiations ?? '—'}</span>
                        <span className="portal-bienvenida-kpi-etiq">Negociaciones activas</span>
                      </div>
                      <div className="portal-bienvenida-kpi-item">
                        <i className="ri-exchange-funds-line" />
                        <span className="portal-bienvenida-kpi-valor">{dashboard?.activeTransfers ?? '—'}</span>
                        <span className="portal-bienvenida-kpi-etiq">Transferencias registradas</span>
                      </div>
                      <div className="portal-bienvenida-kpi-item">
                        <i className="ri-notification-3-line" />
                        <span className="portal-bienvenida-kpi-valor">{dashboard?.unreadNotifications ?? unreadCount}</span>
                        <span className="portal-bienvenida-kpi-etiq">Notificaciones sin leer</span>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="card kpi-dashboard">
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-label">Jugadores</div>
                      <div className="kpi-value">{dashboard?.totalPlayers ?? '—'}</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Negociaciones activas</div>
                      <div className="kpi-value">{dashboard?.activeNegotiations ?? '—'}</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Transferencias registradas</div>
                      <div className="kpi-value">{dashboard?.activeTransfers ?? '—'}</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Notificaciones sin leer</div>
                      <div className="kpi-value">{dashboard?.unreadNotifications ?? unreadCount}</div>
                    </div>
                  </div>
                  {loading && (
                    <div className="skeleton-row">
                      <span /><span /><span /><span />
                    </div>
                  )}
                </section>
              )}

          {/* ════════ JUGADORES ════════ */}
          {activeTab === 'Jugadores' && (
            <section className="card jugadores-modulo">
              <h2>Jugadores</h2>

              <h3 className="jugadores-subtitulo">Registrar nuevo jugador</h3>
              {(opcionesNacionalidad.length === 0 || opcionesPosicion.length === 0) && (
                <p className="muted" style={{ marginTop: 0 }}>
                  Configura los ítems en <strong>Parámetros de configuración</strong>: <code>POSICIONES</code>, <code>NACIONALIDADES</code> y, si usas lista de clubes, <code>CLUBES</code>.
                </p>
              )}
              <form onSubmit={crearJugador} className="jugadores-registro-form">
                <div className="jugadores-foto-panel">
                  <input
                    ref={inputFotoRegistroRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="jugadores-foto-input-sr-only"
                    onChange={onFotoRegistroSeleccionada}
                  />
                  <button
                    type="button"
                    className="jugadores-foto-preview-wrap jugadores-foto-preview-wrap--clickable"
                    onClick={() => inputFotoRegistroRef.current?.click()}
                    title="Clic para elegir foto"
                  >
                    {previewFotoRegistro ? (
                      <img src={previewFotoRegistro} alt="Vista previa" className="jugadores-foto-preview" />
                    ) : (
                      <div className="jugadores-foto-placeholder"><i className="ri-camera-line" /><span>Clic para foto</span></div>
                    )}
                  </button>
                  <div className="jugadores-foto-acciones">
                    <button type="button" className="btn-secondary" onClick={() => inputFotoRegistroRef.current?.click()}>
                      <i className="ri-image-add-line" /> Elegir foto
                    </button>
                    {fotoRegistroArchivo && (
                      <button type="button" className="btn-secondary" onClick={limpiarFotoRegistro}>Quitar</button>
                    )}
                  </div>
                  {fotoRegistroArchivo && (
                    <p className="jugadores-foto-nombre" title={fotoRegistroArchivo.name}>{fotoRegistroArchivo.name}</p>
                  )}
                  <p className="muted jugadores-foto-hint">JPG, PNG o WEBP · máx. 6 MB · visible en el portal</p>
                </div>
                <div className="jugadores-registro-fields">
                  <div className="jugadores-field-row jugadores-field-row--3">
                    <label className="form-field">
                      <span>Nombre</span>
                      <input value={nombreJugador} onChange={(e) => setNombreJugador(e.target.value)} placeholder="Nombre" required />
                    </label>
                    <label className="form-field">
                      <span>Apellido</span>
                      <input value={apellidoJugador} onChange={(e) => setApellidoJugador(e.target.value)} placeholder="Apellido" required />
                    </label>
                    <label className="form-field">
                      <span>Fecha de nacimiento</span>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        min={fechaMinNacimientoJugador}
                        max={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </label>
                  </div>
                  <div className="jugadores-field-row jugadores-field-row--3">
                    <label className="form-field">
                      <span>Nacionalidad</span>
                      <select className="form-select" value={nacionalidadJugador} onChange={(e) => setNacionalidadJugador(e.target.value)} required>
                        <option value="">Selecciona nacionalidad</option>
                        {opcionesNacionalidad.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Posición</span>
                      <select className="form-select" value={posicionPrincipal} onChange={(e) => setPosicionPrincipal(e.target.value)} required>
                        <option value="">Selecciona posición</option>
                        {opcionesPosicion.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Club actual</span>
                      <select className="form-select" value={clubActual} onChange={(e) => setClubActual(e.target.value)}>
                        <option value="">Sin club / Libre</option>
                        {opcionesClubes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="jugadores-field-row jugadores-field-row--3">
                    <label className="form-field">
                      <span>Altura (cm)</span>
                      <input type="number" min="0" step="0.1" value={alturaCm} onChange={(e) => setAlturaCm(e.target.value)} placeholder="Opcional · Ej. 178" />
                    </label>
                    <label className="form-field">
                      <span>Peso (kg)</span>
                      <input type="number" min="0" step="0.1" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="Opcional · Ej. 74" />
                    </label>
                    <label className="form-field">
                      <span>Pie dominante</span>
                      <select className="form-select" value={pieHabil} onChange={(e) => setPieHabil(e.target.value)}>
                        <option value="">Opcional</option>
                        <option value="Derecha">Derecha</option>
                        <option value="Izquierda">Izquierda</option>
                        <option value="Ambos">Ambos</option>
                      </select>
                    </label>
                  </div>
                  <h4 className="jugadores-subtitulo jugadores-subtitulo--sm">Datos personales</h4>
                  <div className="jugadores-field-row jugadores-field-row--4">
                    <label className="form-field">
                      <span>Nº de carnet</span>
                      <input value={carnetJugador} onChange={(e) => setCarnetJugador(e.target.value)} placeholder="Para contrato FORTIS" maxLength={60} />
                    </label>
                    <label className="form-field">
                      <span>Celular</span>
                      <input value={telefonoJugador} onChange={(e) => setTelefonoJugador(e.target.value)} placeholder="78420712" maxLength={30} />
                    </label>
                    <label className="form-field">
                      <span>Número de jugador</span>
                      <input type="number" min={0} max={99} value={numeroJugador} onChange={(e) => setNumeroJugador(e.target.value)} placeholder="0-99" />
                    </label>
                    <label className="form-field">
                      <span>Correo</span>
                      <input type="email" value={correoJugador} onChange={(e) => setCorreoJugador(e.target.value)} placeholder="correo@ejemplo.com" />
                    </label>
                  </div>
                  <div className="jugadores-field-row jugadores-field-row--2">
                    <label className="form-field">
                      <span>Ciudad</span>
                      <select className="form-select" value={ciudadJugador} onChange={(e) => setCiudadJugador(e.target.value)}>
                        <option value="">Opcional</option>
                        {ciudadJugador && !opcionesCiudades.some((c) => c.name === ciudadJugador) && (
                          <option value={ciudadJugador}>{ciudadJugador}</option>
                        )}
                        {opcionesCiudades.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Domicilio</span>
                      <input value={domicilioJugador} onChange={(e) => setDomicilioJugador(e.target.value)} placeholder="Calle, zona, referencia" maxLength={300} />
                    </label>
                  </div>
                  <div className="jugadores-registro-actions">
                    <button type="submit" className="btn-primary-green" disabled={loading}><i className="ri-user-add-line" /> Registrar jugador</button>
                  </div>
                </div>
              </form>

              <h3 className="jugadores-subtitulo">Importación masiva CSV</h3>
              <p className="muted" style={{ marginTop: 0 }}>Columnas: <code>Nombre,Apellido,Nacionalidad,Posición,FechaNac(opc.),Club(opc.)</code></p>
              <form onSubmit={bulkImport} className="grid">
                <input type="file" ref={csvImportRef} accept=".csv" />
                <button type="submit" disabled={loading}>{loading ? 'Importando...' : 'Importar CSV'}</button>
              </form>
              {bulkResult && (
                <div className="status-bar" style={{ marginTop: '8px' }}>
                  Creados: <strong>{bulkResult.created}</strong> · Omitidos: <strong>{bulkResult.skipped}</strong>
                  {bulkResult.errors.length > 0 && <ul style={{ margin: '4px 0 0' }}>{bulkResult.errors.map((e, i) => <li key={i} style={{ color: '#b33a3a' }}>{e}</li>)}</ul>}
                </div>
              )}

              <div className="toolbar jugadores-toolbar-lista">
                <button type="button" onClick={() => void cargarJugadores(paginaJugadores)} disabled={loading}>
                  {loading ? 'Cargando...' : 'Actualizar listado'}
                </button>
                <span className="muted">Pág. {paginaJugadores}/{totalPaginasJugadores} · {totalJugadores} jugadores</span>
                <button type="button" disabled={paginaJugadores <= 1 || loading} onClick={() => void cargarJugadores(Math.max(1, paginaJugadores - 1))}>‹ Ant.</button>
                <button type="button" disabled={paginaJugadores >= totalPaginasJugadores || loading} onClick={() => void cargarJugadores(paginaJugadores + 1)}>Sig. ›</button>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr>
                    <th className="jugadores-col-foto">Foto</th>
                    <th>Nombre</th>
                    <th>#</th>
                    <th>Posición</th>
                    <th>Club</th>
                    <th>Ciudad</th>
                    <th>Nacionalidad</th>
                    <th>Pie</th>
                    <th>Alt.</th>
                    <th>Sel.</th>
                    <th>Acciones</th>
                  </tr></thead>
                  <tbody>
                    {jugadores.map((p) => (
                      <tr key={p.id} className={idJugadorSeleccionado === p.id ? 'row-selected' : ''}>
                        <td className="jugadores-col-foto">
                          {urlFotoJugador(p.photoUrl) ? (
                            <img src={urlFotoJugador(p.photoUrl)} alt="" className="jugadores-thumb-foto" />
                          ) : (
                            <span className="jugadores-thumb-iniciales">{(p.firstName[0] ?? '?')}{(p.lastName[0] ?? '?')}</span>
                          )}
                        </td>
                        <td>{p.firstName} {p.lastName}</td>
                        <td>{p.jerseyNumber ?? '—'}</td>
                        <td>{p.mainPosition}</td>
                        <td>{p.currentClub ?? '—'}</td>
                        <td>{p.city ?? '—'}</td>
                        <td>{p.nationality}</td>
                        <td>{p.preferredFoot ?? '—'}</td>
                        <td>{p.heightCm ? `${p.heightCm}` : '—'}</td>
                        <td>
                          <button type="button" className="btn-secondary" onClick={() => setIdJugadorSeleccionado(p.id)}>
                            {idJugadorSeleccionado === p.id ? '✓' : 'Sel.'}
                          </button>
                        </td>
                        <td className="actions">
                          <button type="button" className="btn-secondary" onClick={() => void abrirEdicionJugador(p.id)}>Editar</button>{' '}
                          <button type="button" className="btn-danger" onClick={() => void eliminarJugador(p.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {jugadores.length === 0 && <tr><td colSpan={11} className="muted empty-state-cell">No hay jugadores en esta página. Ajusta los filtros de abajo o registra uno nuevo.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="jugadores-filtros-panel">
                <h3 className="jugadores-subtitulo jugadores-subtitulo--filtros"><i className="ri-search-line" /> Buscar y filtrar jugadores</h3>
                <p className="muted jugadores-filtros-intro">
                  Combina criterios y pulsa <strong>Aplicar filtros</strong>. La búsqueda por texto incluye nombre completo, nacionalidad, posición y club actual.
                </p>
                <div className="jugadores-filtros-grid">
                  <label className="form-field">
                    <span>Búsqueda</span>
                    <input value={busquedaJugadores} onChange={(e) => setBusquedaJugadores(e.target.value)} placeholder="Nombre, club, posición…" onKeyDown={(e) => e.key === 'Enter' && void cargarJugadores(1, { toast: true })} />
                  </label>
                  <label className="form-field">
                    <span>Nacionalidad</span>
                    <select className="form-select" value={nacionalidadFiltroJugadores} onChange={(e) => setNacionalidadFiltroJugadores(e.target.value)}>
                      <option value="">Todas</option>
                      {opcionesNacionalidad.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Posición</span>
                    <select className="form-select" value={filtroPosicion} onChange={(e) => setFiltroPosicion(e.target.value)}>
                      <option value="">Todas</option>
                      {opcionesPosicion.map((po) => <option key={po.id} value={po.name}>{po.name}</option>)}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Estado agencia</span>
                    <input value={estadoAgenciaFiltro} onChange={(e) => setEstadoAgenciaFiltro(e.target.value)} placeholder="Ej. Activo" />
                  </label>
                  <label className="form-field">
                    <span>Pie dominante</span>
                    <select className="form-select" value={pieFiltro} onChange={(e) => setPieFiltro(e.target.value)}>
                      <option value="">Cualquiera</option>
                      <option value="Derecha">Derecha</option>
                      <option value="Izquierda">Izquierda</option>
                      <option value="Ambos">Ambos</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Edad mín.</span>
                    <input type="number" min="0" max="99" value={edadMinimaFiltro} onChange={(e) => setEdadMinimaFiltro(e.target.value)} placeholder="Años" />
                  </label>
                  <label className="form-field">
                    <span>Edad máx.</span>
                    <input type="number" min="0" max="99" value={edadMaximaFiltro} onChange={(e) => setEdadMaximaFiltro(e.target.value)} placeholder="Años" />
                  </label>
                  <div className="jugadores-filtros-acciones">
                    <button type="button" className="btn-primary-green" onClick={() => void cargarJugadores(1, { toast: true })} disabled={loading}>Aplicar filtros</button>
                    <button type="button" className="btn-secondary" onClick={() => {
                      setBusquedaJugadores(''); setEstadoAgenciaFiltro(''); setFiltroPosicion('');
                      setNacionalidadFiltroJugadores(''); setPieFiltro(''); setEdadMinimaFiltro(''); setEdadMaximaFiltro('');
                      void cargarJugadores(1);
                    }}>Limpiar</button>
                  </div>
                </div>
              </div>

              {jugadorEnEdicion && (
                <form className="edit-box jugadores-edit-form" onSubmit={guardarEdicionJugador}>
                  <h3>Editar: {jugadorEnEdicion.firstName} {jugadorEnEdicion.lastName}</h3>
                  <div className="jugadores-edit-layout">
                    <div className="jugadores-foto-panel jugadores-foto-panel--compact">
                      <input
                        ref={inputFotoEdicionRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="jugadores-foto-input-sr-only"
                        onChange={onFotoEdicionSeleccionada}
                      />
                      <button
                        type="button"
                        className="jugadores-foto-preview-wrap jugadores-foto-preview-wrap--sm jugadores-foto-preview-wrap--clickable"
                        onClick={() => inputFotoEdicionRef.current?.click()}
                        title="Clic para cambiar foto"
                      >
                        {previewUrlFotoEdicion ? (
                          <img src={previewUrlFotoEdicion} alt="Vista previa" className="jugadores-foto-preview" />
                        ) : urlFotoJugador(jugadorEnEdicion.photoUrl) ? (
                          <img src={urlFotoJugador(jugadorEnEdicion.photoUrl)} alt="" className="jugadores-foto-preview" />
                        ) : (
                          <div className="jugadores-foto-placeholder"><i className="ri-camera-line" /></div>
                        )}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => inputFotoEdicionRef.current?.click()}>
                        Cambiar foto
                      </button>
                    </div>
                    <div className="grid jugadores-edit-grid">
                      <input value={jugadorEnEdicion.firstName} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, firstName: e.target.value })} placeholder="Nombre" />
                      <input value={jugadorEnEdicion.lastName} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, lastName: e.target.value })} placeholder="Apellido" />
                      <input type="date" min={fechaMinNacimientoJugador} max={new Date().toISOString().slice(0, 10)} value={jugadorEnEdicion.birthDate} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, birthDate: e.target.value })} />
                      <select className="form-select" value={jugadorEnEdicion.nationality} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, nationality: e.target.value })}>
                        {!opcionesNacionalidad.some((n) => n.name === jugadorEnEdicion.nationality) && <option value={jugadorEnEdicion.nationality}>{jugadorEnEdicion.nationality}</option>}
                        {opcionesNacionalidad.map((n) => <option key={n.id} value={n.name}>{n.name}</option>)}
                      </select>
                      <select className="form-select" value={jugadorEnEdicion.mainPosition} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, mainPosition: e.target.value })}>
                        {!opcionesPosicion.some((p) => p.name === jugadorEnEdicion.mainPosition) && <option value={jugadorEnEdicion.mainPosition}>{jugadorEnEdicion.mainPosition}</option>}
                        {opcionesPosicion.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <select
                        className="form-select"
                        value={jugadorEnEdicion.currentClub ?? ''}
                        onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, currentClub: e.target.value || undefined })}
                      >
                        <option value="">Sin club / Libre</option>
                        {jugadorEnEdicion.currentClub && !opcionesClubes.some((c) => c.name === jugadorEnEdicion.currentClub) && (
                          <option value={jugadorEnEdicion.currentClub}>{jugadorEnEdicion.currentClub} (valor actual)</option>
                        )}
                        {opcionesClubes.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <input type="number" value={jugadorEnEdicion.heightCm ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, heightCm: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Altura (cm)" />
                      <input type="number" value={jugadorEnEdicion.weightKg ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, weightKg: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Peso (kg)" />
                      <select
                        className="form-select"
                        value={jugadorEnEdicion.preferredFoot ?? ''}
                        onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, preferredFoot: e.target.value || undefined })}
                      >
                        <option value="">Sin especificar</option>
                        <option value="Derecha">Derecha</option>
                        <option value="Izquierda">Izquierda</option>
                        <option value="Ambos">Ambos</option>
                      </select>
                      <input value={jugadorEnEdicion.idCardNumber ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, idCardNumber: e.target.value || undefined })} placeholder="N. carnet" />
                      <input value={jugadorEnEdicion.phoneNumber ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, phoneNumber: e.target.value || undefined })} placeholder="Celular" />
                      <input type="number" min={0} max={99} value={jugadorEnEdicion.jerseyNumber ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, jerseyNumber: e.target.value === '' ? null : Number(e.target.value) })} placeholder="N. jugador" />
                      <input type="email" value={jugadorEnEdicion.email ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, email: e.target.value || undefined })} placeholder="Correo" />
                      <select className="form-select" value={jugadorEnEdicion.city ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, city: e.target.value || undefined })}>
                        <option value="">Ciudad</option>
                        {jugadorEnEdicion.city && !opcionesCiudades.some((c) => c.name === jugadorEnEdicion.city) && (
                          <option value={jugadorEnEdicion.city}>{jugadorEnEdicion.city}</option>
                        )}
                        {opcionesCiudades.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <input value={jugadorEnEdicion.address ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, address: e.target.value || undefined })} placeholder="Domicilio" />
                      <input value={jugadorEnEdicion.agencyStatus} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, agencyStatus: e.target.value })} placeholder="Estado agencia" />
                      <input value={jugadorEnEdicion.contractStatus} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, contractStatus: e.target.value })} placeholder="Estado contractual" />
                      <label className="check">
                        <input type="checkbox" checked={jugadorEnEdicion.isVisible} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, isVisible: e.target.checked })} />
                        Visible en portal web
                      </label>
                      <input value={jugadorEnEdicion.notes ?? ''} onChange={(e) => setJugadorEnEdicion({ ...jugadorEnEdicion, notes: e.target.value })} placeholder="Observaciones" />
                    </div>
                  </div>
                  <div className="toolbar">
                    <button type="submit">Guardar cambios</button>
                    <button type="button" className="btn-secondary" onClick={() => { setJugadorEnEdicion(null); setFotoEdicionArchivo(null); }}>Cancelar</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ════════ PERFIL ════════ */}
          {activeTab === 'Perfil' && (
            <section className="perfil-scouting-wrap">
              <h2>Perfil y ficha del jugador</h2>
              <div className="perfil-scouting-toolbar">
                {selectorJugador}
                <button type="button" onClick={loadProfile} disabled={!idJugadorSeleccionado || profileLoading}>
                  {profileLoading ? 'Cargando...' : 'Cargar perfil'}
                </button>
                {idJugadorSeleccionado && (
                  <>
                    <button type="button" disabled={loading} onClick={() => void generateContract()}>
                      Generar contrato FORTIS
                    </button>
                    <button type="button" className="btn-secondary" disabled={loading} onClick={() => contratoRepresentacionFirmadoRef.current?.click()}>
                      Subir contrato firmado
                    </button>
                  </>
                )}
              </div>

              {profileLoading && <div className="loading-bar" />}
              {!jugadorPerfil && !profileLoading && (
                <p className="muted" style={{ marginTop: 12 }}>Selecciona un jugador y pulsa «Cargar perfil».</p>
              )}

              {jugadorPerfil && (
                <PerfilJugadorScouting
                  jugador={jugadorPerfil}
                  fotoUrl={urlFotoJugador(jugadorPerfil.photoUrl) ?? null}
                  stats={profileStats}
                  contracts={profileContracts}
                  transfers={profileTransfers}
                  clubHistory={profileClubHistory}
                  achievements={profileAchievements}
                  negotiations={profileNegs}
                  docsCount={profileDocs.length}
                  etiquetaCategoria={etiquetaCategoriaClub}
                  etiquetaTipoLogro={etiquetaTipoLogro}
                  etiquetaTipoTransferencia={etiquetaTipoTransferencia}
                  textoMontoTransferencia={textoMontoTransferencia}
                  onCurriculum={downloadCurriculum}
                  onInforme={downloadFullReport}
                  onContratoPdf={(id) => void downloadContract(id)}
                />
              )}
            </section>
          )}

          {/* ════════ CONTRATOS ════════ */}
          {activeTab === 'Contratos' && (
            <section className="card">
              <h2>Contratos</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Genera el contrato de representación FORTIS (plantilla oficial, tamaño carta) o sube el contrato ya firmado por el jugador.
              </p>
              <div className="toolbar">{selectorJugador}</div>
              {!idJugadorSeleccionado ? (
                <p className="muted">Selecciona un jugador en Jugadores o en el selector de arriba.</p>
              ) : (
                <div className="grid" style={{ gap: '20px', marginTop: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  <div className="card" style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>Contrato de representación FORTIS</h3>
                    <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                      Requiere carnet, fecha de nacimiento, ciudad, domicilio y correo en el registro del jugador.
                    </p>
                    <form onSubmit={generateContract} className="grid" style={{ gap: '10px' }}>
                      <label className="form-field">
                        <span>Duración (años)</span>
                        <input type="number" min={1} max={30} value={contractDuration} onChange={(e) => setContractDuration(e.target.value)} placeholder="Ej. 2" />
                      </label>
                      <button type="submit" className="btn-primary-green" disabled={loading}>
                        {loading ? 'Generando...' : 'Generar y descargar PDF'}
                      </button>
                      <button type="button" className="btn-secondary" disabled={loading} onClick={() => void vistaPreviaRepresentacion()}>
                        Vista previa
                      </button>
                    </form>
                  </div>
                  <div className="card" style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>Contrato de representación firmado</h3>
                    <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                      Sube el PDF o imagen del contrato FORTIS ya firmado por el jugador.
                    </p>
                    <button type="button" className="btn-secondary" disabled={loading} onClick={() => contratoRepresentacionFirmadoRef.current?.click()}>
                      Subir contrato firmado
                    </button>
                  </div>
                </div>
              )}
              <h3 style={{ marginTop: '24px' }}>Historial — contratos de representación</h3>
              <div className="toolbar" style={{ marginBottom: '8px' }}>
                <button type="button" className="btn-secondary" onClick={loadContracts}>Actualizar listado</button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Inicio</th><th>Fin</th><th>Estado</th><th>Versión</th><th>Descargar</th></tr></thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id}><td>{c.startDate}</td><td>{c.endDate}</td><td>{c.status}</td><td>{c.version}</td>
                        <td><button type="button" className="btn-secondary" onClick={() => void downloadContract(c.id)}>PDF</button></td>
                      </tr>
                    ))}
                    {contracts.length === 0 && <tr><td colSpan={5} className="muted empty-state-cell">Sin contratos guardados para este jugador.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ════════ HISTORIAL DE CLUBES Y LOGROS ════════ */}
          {activeTab === 'Historial de clubes' && (
            <section className="card historial-clubes-modulo">
              <h2>Historial de clubes y logros deportivos</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Registra en qué clubes jugó cada futbolista y por año, además de títulos y participaciones internacionales.
              </p>
              <div className="toolbar">{selectorJugador}</div>
              {!idJugadorSeleccionado ? (
                <p className="muted">Selecciona un jugador para ver y editar su historial.</p>
              ) : (
                <>
                  <div className="card historial-clubes-seccion">
                    <h3 className="historial-clubes-subtitulo">Historial de clubes</h3>
                    <p className="muted historial-clubes-ayuda">
                      Indica cada club en el que estuvo el jugador y el año correspondiente (puede haber varios registros por año si cambió de equipo).
                    </p>
                    <form onSubmit={crearClubHistory} className="historial-clubes-form">
                      <label className="form-field">
                        <span>Club</span>
                        <input
                          list="historial-clubes-datalist"
                          value={hcClubName}
                          onChange={(e) => setHcClubName(e.target.value)}
                          placeholder="Ej. San Antonio"
                          required
                        />
                        <datalist id="historial-clubes-datalist">
                          {opcionesClubes.map((c) => (
                            <option key={c.id} value={c.name} />
                          ))}
                        </datalist>
                      </label>
                      <label className="form-field">
                        <span>Categoría / etapa</span>
                        <select value={hcCategory} onChange={(e) => setHcCategory(e.target.value)} required>
                          {CATEGORIA_CLUB_OPCIONES.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Año</span>
                        <input
                          type="number"
                          min={1950}
                          max={ANIO_ACTUAL + 1}
                          value={hcYear}
                          onChange={(e) => setHcYear(e.target.value)}
                          required
                        />
                      </label>
                      <label className="form-field historial-clubes-notas">
                        <span>Notas (opcional)</span>
                        <input
                          value={hcNotes}
                          onChange={(e) => setHcNotes(e.target.value)}
                          placeholder="Ej. goleador del torneo, préstamo"
                        />
                      </label>
                      <div className="historial-clubes-form-acciones">
                        <button type="submit" className="btn-primary-green" disabled={loading}>
                          {editingClubHistory ? 'Guardar cambios' : 'Agregar al historial'}
                        </button>
                        {editingClubHistory && (
                          <button type="button" className="btn-secondary" onClick={resetClubHistoryForm}>Cancelar edición</button>
                        )}
                      </div>
                    </form>
                    <div className="table-wrap" style={{ marginTop: '16px' }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>Año</th><th>Club</th><th>Categoría</th><th>Notas</th><th className="actions">Acciones</th></tr>
                        </thead>
                        <tbody>
                          {clubHistoryRows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.year}</td>
                              <td>{row.clubName}</td>
                              <td>{etiquetaCategoriaClub(row.category)}</td>
                              <td>{row.notes?.trim() ? row.notes : '—'}</td>
                              <td className="actions">
                                <button type="button" className="btn-secondary" onClick={() => editarClubHistory(row)}>Editar</button>
                                <button type="button" className="btn-danger" onClick={() => void eliminarClubHistory(row.id)}>Eliminar</button>
                              </td>
                            </tr>
                          ))}
                          {clubHistoryRows.length === 0 && (
                            <tr>
                              <td colSpan={5} className="muted empty-state-cell">
                                Sin registros. Agrega el primer club del historial arriba.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card historial-clubes-seccion historial-clubes-seccion--logros">
                    <h3 className="historial-clubes-subtitulo">Logros deportivos</h3>
                    <p className="muted historial-clubes-ayuda">
                      Títulos ganados (campeón de torneo) o participaciones en torneos internacionales, con país y año.
                    </p>
                    <form onSubmit={crearLogroDeportivo} className="historial-clubes-form">
                      <label className="form-field">
                        <span>Tipo de logro</span>
                        <select value={logroTipo} onChange={(e) => setLogroTipo(e.target.value)}>
                          {TIPO_LOGRO_OPCIONES.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span>Torneo</span>
                        <input
                          value={logroTorneo}
                          onChange={(e) => setLogroTorneo(e.target.value)}
                          placeholder="Ej. Copa Libertadores, Sudamericano Sub-20"
                          required
                        />
                      </label>
                      <label className="form-field">
                        <span>País</span>
                        <input
                          list="historial-logros-paises"
                          value={logroPais}
                          onChange={(e) => setLogroPais(e.target.value)}
                          placeholder="Ej. Bolivia"
                          required
                        />
                        <datalist id="historial-logros-paises">
                          {opcionesPaises.map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
                      </label>
                      <label className="form-field">
                        <span>Año</span>
                        <input
                          type="number"
                          min={1950}
                          max={ANIO_ACTUAL + 1}
                          value={logroYear}
                          onChange={(e) => setLogroYear(e.target.value)}
                          required
                        />
                      </label>
                      <label className="form-field historial-clubes-notas">
                        <span>Detalle (opcional)</span>
                        <input
                          value={logroNotes}
                          onChange={(e) => setLogroNotes(e.target.value)}
                          placeholder="Ej. goleador del torneo, fase de grupos"
                        />
                      </label>
                      <div className="historial-clubes-form-acciones">
                        <button type="submit" className="btn-primary-green" disabled={loading}>
                          {editingAchievement ? 'Guardar cambios' : 'Registrar logro'}
                        </button>
                        {editingAchievement && (
                          <button type="button" className="btn-secondary" onClick={resetAchievementForm}>Cancelar edición</button>
                        )}
                      </div>
                    </form>
                    <div className="table-wrap" style={{ marginTop: '16px' }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>Año</th><th>Tipo</th><th>Torneo</th><th>País</th><th>Detalle</th><th className="actions">Acciones</th></tr>
                        </thead>
                        <tbody>
                          {achievementRows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.year}</td>
                              <td>{etiquetaTipoLogro(row.achievementType)}</td>
                              <td>{row.tournamentName}</td>
                              <td>{row.country}</td>
                              <td>{row.notes?.trim() ? row.notes : '—'}</td>
                              <td className="actions">
                                <button type="button" className="btn-secondary" onClick={() => editarLogroDeportivo(row)}>Editar</button>
                                <button type="button" className="btn-danger" onClick={() => void eliminarLogroDeportivo(row.id)}>Eliminar</button>
                              </td>
                            </tr>
                          ))}
                          {achievementRows.length === 0 && (
                            <tr>
                              <td colSpan={6} className="muted empty-state-cell">
                                Sin logros registrados. Agrega títulos o participaciones internacionales arriba.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="toolbar" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-secondary" onClick={() => void cargarHistorialYLogros()} disabled={loading}>
                      Actualizar listas
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ════════ NEGOCIACIONES ════════ */}
          {activeTab === 'Negociaciones' && subVistaNegociaciones === 'estado' && (
            <section className="card">
              <h2>Estado de negociación</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Consulta todas las ofertas y avanza cada negociación por etapas del proceso.
              </p>
              <EstadoNegociacion
                items={allNegotiations}
                loading={negEstadoLoading}
                selectedId={selectedNegEstadoId}
                onSelect={setSelectedNegEstadoId}
                onChangeStatus={changeNegotiationStatus}
                statusUpdating={negStatusUpdating}
                versions={negOfferVersions}
                versionsLoading={negVersionsLoading}
                versionRegistering={negVersionRegistering}
                onRegisterVersion={registerNegotiationVersion}
                onDeleteNegotiation={(id) => deleteNegotiation(id, true)}
                deletingNegotiation={negDeleting}
              />
            </section>
          )}

          {activeTab === 'Negociaciones' && subVistaNegociaciones === 'historial' && (
            <section className="card">
              <h2>Historial de conversaciones</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Registra mensajes, correos, reuniones y notas por jugador y club.
                Cada entrada queda ligada al club con el que se habló.
              </p>
              <HistorialConversaciones
                jugadores={histConvJugadores}
                loadingJugadores={histConvJugadoresLoading}
                selectedPlayerId={histConvPlayerId}
                onSelectPlayer={setHistConvPlayerId}
                clubesSugeridos={clubesSugeridosHistorial}
                conversaciones={histConversations}
                loadingConversaciones={histConvLoading}
                saving={histConvSaving}
                onSubmitConversacion={registrarConversacionNegociacion}
                onDeleteConversacion={eliminarConversacionNegociacion}
              />
            </section>
          )}

          {activeTab === 'Negociaciones' && subVistaNegociaciones === 'ofertas' && (
            <section className="card">
              <h2>Administrar ofertas</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                Registra y consulta las ofertas del jugador seleccionado. El responsable es quien crea la oferta en el sistema.
              </p>
              <div className="toolbar">{selectorJugador}</div>
              {!idJugadorSeleccionado ? (
                <p className="muted">Selecciona un jugador para ver o registrar ofertas.</p>
              ) : (
              <>
              <h3>Nueva oferta</h3>
              <FormularioOfertaNegociacion
                form={ofertaForm}
                onChange={setOfertaForm}
                onSubmit={createNegotiation}
                submitLabel="Registrar oferta"
                loading={loading}
              />
              <h3 style={{ marginTop: 20 }}>Ofertas del jugador</h3>
              {negotiations.length === 0 && !loading && (
                <p className="muted">No hay ofertas registradas para este jugador.</p>
              )}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th>Contrato</th>
                      <th>Bonos</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Responsable</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negotiations.map((n) => {
                      const row = normalizarNegociacion(n);
                      return (
                        <tr key={n.id}>
                          <td>{row.clubName}</td>
                          <td><span className="oferta-tabla-contrato">{resumenContratoOferta(row)}</span></td>
                          <td><span className="oferta-tabla-bonos">{etiquetaBonosOferta(row)}</span></td>
                          <td>{etiquetaEstadoNegociacion(row.status)}</td>
                          <td>{row.offerDate}</td>
                          <td>{row.responsibleName}</td>
                          <td className="actions">
                            <button type="button" className="btn-secondary" onClick={() => abrirEdicionNeg(row)}>Editar</button>{' '}
                            <button type="button" className="btn-danger" onClick={() => void deleteNegotiation(n.id)}>Eliminar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {editingNeg && editingNegForm && (
                <div className="edit-box" style={{ marginTop: '1.25rem' }}>
                  <h3>Editar oferta — {editingNeg.clubName}</h3>
                  <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
                    Responsable: <strong>{editingNeg.responsibleName}</strong> (no se modifica al editar)
                  </p>
                  <FormularioOfertaNegociacion
                    form={editingNegForm}
                    onChange={setEditingNegForm}
                    onSubmit={saveEditNeg}
                    submitLabel="Guardar cambios"
                    loading={loading}
                  />
                  <div className="toolbar" style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setEditingNeg(null); setEditingNegForm(null); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              </>
              )}
            </section>
          )}

          {/* ════════ TRANSFERENCIAS ════════ */}
          {activeTab === 'Transferencias' && (
            <section className="card transferencias-modulo">
              <h2>Transferencias</h2>
              <div className="toolbar">{selectorJugador}</div>
              <p className="muted" style={{ marginTop: 0 }}>
                Registra movimientos ya realizados. Indica fecha, tipo y monto solo si aplica (préstamo o venta).
              </p>
              {!idJugadorSeleccionado ? (
                <p className="muted">Selecciona un jugador arriba para continuar.</p>
              ) : (
              <>
              <NegociacionesCompletadasTransfer
                items={transferNegCompletadas}
                loading={transferNegLoading}
                selectedId={transferNegSeleccionadaId}
                clubActualJugador={transferClubActualJugador}
                onSelect={aplicarNegociacionATransferencia}
              />
              <div className="card transferencias-card transferencias-card--registro">
              <h3 className="transferencias-card-titulo">Registrar transferencia</h3>
              <form onSubmit={createTransfer} className="transferencias-alta-form">
                <label className="form-field">
                  <span>Club origen</span>
                  <input value={originClub} onChange={(e) => setOriginClub(e.target.value)} placeholder="Ej. San Felipe" required disabled={!idJugadorSeleccionado} />
                </label>
                <label className="form-field">
                  <span>Club destino</span>
                  <input value={destinationClub} onChange={(e) => setDestinationClub(e.target.value)} placeholder="Ej. Oriente" required disabled={!idJugadorSeleccionado} />
                </label>
                <label className="form-field">
                  <span>Fecha de la transferencia</span>
                  <input type="date" value={trTransferDate} onChange={(e) => setTrTransferDate(e.target.value)} required disabled={!idJugadorSeleccionado} />
                </label>
                <label className="form-field">
                  <span>Tipo</span>
                  <select
                    value={trType}
                    disabled={!idJugadorSeleccionado}
                    onChange={(e) => {
                      const v = e.target.value as TipoTransferencia;
                      setTrType(v);
                      if (!tipoTransferenciaRequiereMonto(v)) { setTrSinMonto(false); setTrAmount(''); }
                    }}
                  >
                    {TIPO_TRANSFERENCIA_OPCIONES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                {tipoTransferenciaRequiereMonto(trType) && (
                  <div className="transferencias-monto-grupo">
                    <label className="form-field transferencias-monto-check">
                      <input type="checkbox" checked={trSinMonto} disabled={!idJugadorSeleccionado} onChange={(e) => { setTrSinMonto(e.target.checked); if (e.target.checked) setTrAmount(''); }} />
                      <span>Sin monto</span>
                    </label>
                    {!trSinMonto && (
                      <>
                        <label className="form-field">
                          <span>Monto</span>
                          <input type="number" min={1} step="any" value={trAmount} onChange={(e) => setTrAmount(e.target.value)} placeholder="Ej. 300000" disabled={!idJugadorSeleccionado} />
                        </label>
                        <label className="form-field">
                          <span>Moneda</span>
                          <select value={trCurrency} onChange={(e) => setTrCurrency(e.target.value)} disabled={!idJugadorSeleccionado}>
                            <option value="USD">USD</option>
                            <option value="BOB">BOB</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                )}
                <label className="form-field transferencias-archivo-contrato">
                  <span>Contrato con el club de destino</span>
                  <input
                    ref={transferContratoClubRegistroRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
                    disabled={!idJugadorSeleccionado}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setTrContratoClubFile(f);
                      setTrContratoClubNombre(f?.name ?? '');
                    }}
                  />
                  {trContratoClubNombre ? (
                    <span className="transferencias-archivo-nombre">{trContratoClubNombre}</span>
                  ) : (
                    <span className="muted" style={{ fontSize: '0.85rem' }}>PDF o imagen del contrato con el club destino (opcional)</span>
                  )}
                </label>
                <div className="transferencias-alta-acciones">
                  <button type="submit" className="btn-primary-green" disabled={loading || !idJugadorSeleccionado}>
                    {loading ? 'Guardando...' : 'Registrar transferencia'}
                  </button>
                </div>
              </form>
              </div>
              </>
              )}
              <h3 className="transferencias-subtitulo">Historial de transferencias</h3>
              <p className="muted transferencias-historial-ayuda">
                Al elegir un jugador se listan todas sus transferencias. Usa los filtros solo si quieres acotar por club o tipo.
              </p>
              <div className="transferencias-historial-acciones">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loading || !idJugadorSeleccionado}
                  onClick={mostrarTodasTransferencias}
                >
                  Ver todas las transferencias
                </button>
              </div>
              <div className="transferencias-busqueda">
                <label className="form-field">
                  <span>Club (origen o destino)</span>
                  <input
                    value={trClubFiltro}
                    onChange={(e) => setTrClubFiltro(e.target.value)}
                    placeholder="Opcional, ej. oriente"
                    disabled={!idJugadorSeleccionado}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarTransferenciasHistorial(); } }}
                  />
                </label>
                <label className="form-field">
                  <span>Tipo</span>
                  <select value={trTipoFiltro} onChange={(e) => setTrTipoFiltro(e.target.value)} disabled={!idJugadorSeleccionado}>
                    <option value="">Todos</option>
                    {TIPO_TRANSFERENCIA_OPCIONES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn-primary-green" onClick={buscarTransferenciasHistorial} disabled={loading || !idJugadorSeleccionado}>Buscar con filtros</button>
              </div>
              <div className="toolbar">
                <span className="muted">Pág. {trPage}/{totalTrPages} · {trTotal} registro{trTotal === 1 ? '' : 's'}</span>
                <button type="button" disabled={trPage <= 1 || loading} onClick={() => void loadTransfersList(Math.max(1, trPage - 1))}>‹ Ant.</button>
                <button type="button" disabled={trPage >= totalTrPages || loading} onClick={() => void loadTransfersList(trPage + 1)}>Sig. ›</button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th>Tipo</th><th>Monto</th><th>Contrato club</th><th className="actions">Acciones</th></tr></thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t.id}>
                        <td>{t.transferDate}</td>
                        <td>{t.originClub}</td><td>{t.destinationClub}</td>
                        <td>{etiquetaTipoTransferencia(t.transferType)}</td>
                        <td>{textoMontoTransferencia(t)}</td>
                        <td>
                          {t.clubContractDocumentId ? (
                            <button
                              type="button"
                              className="btn-ghost btn-sm"
                              onClick={() => vistaPreviaContratoClub(t.clubContractDocumentId!, t.destinationClub)}
                            >
                              Ver archivo
                            </button>
                          ) : (
                            <span className="muted" style={{ fontSize: '0.85rem' }}>Sin archivo</span>
                          )}
                        </td>
                        <td className="actions transferencias-fila-acciones">
                          <button type="button" className="btn-secondary" onClick={() => abrirEditarTransferencia(t)}>Editar</button>
                          <button type="button" className="btn-danger" onClick={() => void deleteTransfer(t.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {transfers.length === 0 && (
                      <tr><td colSpan={7} className="muted empty-state-cell">Sin transferencias para este jugador. Registra una arriba o pulsa «Ver todas las transferencias».</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {editingTransfer && (
                <form className="edit-box" onSubmit={saveEditTransfer}>
                  <h3>Editar transferencia</h3>
                  <div className="grid">
                    <input value={editingTransfer.originClub} onChange={(e) => setEditingTransfer({ ...editingTransfer, originClub: e.target.value })} placeholder="Origen" />
                    <input value={editingTransfer.destinationClub} onChange={(e) => setEditingTransfer({ ...editingTransfer, destinationClub: e.target.value })} placeholder="Destino" />
                    <input type="date" value={editingTransfer.transferDate} onChange={(e) => setEditingTransfer({ ...editingTransfer, transferDate: e.target.value })} />
                    <select value={editingTransfer.transferType} onChange={(e) => {
                      const v = e.target.value;
                      setEditingTransfer({ ...editingTransfer, transferType: v, amount: tipoTransferenciaRequiereMonto(v) ? editingTransfer.amount : undefined });
                      if (!tipoTransferenciaRequiereMonto(v)) setEditSinMonto(false);
                    }}>
                      {TIPO_TRANSFERENCIA_OPCIONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {tipoTransferenciaRequiereMonto(editingTransfer.transferType) && (
                      <>
                        <label className="transferencias-monto-check" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={editSinMonto} onChange={(e) => { setEditSinMonto(e.target.checked); if (e.target.checked) setEditingTransfer({ ...editingTransfer, amount: undefined }); }} />
                          Sin monto
                        </label>
                        {!editSinMonto && (
                          <input type="number" min={1} value={editingTransfer.amount ?? ''} onChange={(e) => setEditingTransfer({ ...editingTransfer, amount: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Monto" />
                        )}
                      </>
                    )}
                  </div>
                  <label className="form-field transferencias-archivo-contrato transferencias-editar-contrato">
                    <span>Contrato con el club de destino</span>
                    {editingTransfer.clubContractDocumentId && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => vistaPreviaContratoClub(editingTransfer.clubContractDocumentId!, editingTransfer.destinationClub)}
                      >
                        Ver contrato actual
                      </button>
                    )}
                    <input
                      ref={editContratoClubRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setEditContratoClubFile(f);
                        setEditContratoClubNombre(f?.name ?? '');
                      }}
                    />
                    {editContratoClubNombre ? (
                      <span className="transferencias-archivo-nombre">Nuevo archivo: {editContratoClubNombre}</span>
                    ) : editingTransfer.clubContractDocumentId ? (
                      <span className="muted" style={{ fontSize: '0.85rem' }}>Elige un archivo para reemplazar el contrato actual (opcional).</span>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.85rem' }}>PDF o imagen del contrato (opcional).</span>
                    )}
                  </label>
                  <div className="toolbar">
                    <button type="submit" className="btn-primary-green" disabled={loading}>Guardar cambios</button>
                    <button type="button" className="btn-secondary" onClick={cerrarEditarTransferencia}>Cancelar</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ════════ REPORTES ════════ */}
          {activeTab === 'Reportes' && (
            <section className="card">
              <h2>Reportes y exportaciones</h2>
              <div className="toolbar">
                <button type="button" onClick={loadAllReports} disabled={loading}>{loading ? 'Cargando...' : 'Cargar todos'}</button>
                <button type="button" className="btn-secondary" onClick={() => void exportCsv('/reportes/contratos/exportar/csv', 'contratos.csv')}>Contratos CSV</button>
                <button type="button" className="btn-secondary" onClick={() => void exportCsv('/reportes/negociaciones/exportar/csv', 'negociaciones.csv')}>Negociaciones CSV</button>
                <button type="button" className="btn-secondary" onClick={() => void exportCsv('/reportes/transferencias/exportar/csv', 'transferencias.csv')}>Transferencias CSV</button>
                <button type="button" className="btn-secondary" onClick={() => void exportCsv('/reportes/panel/exportar/pdf', 'dashboard.pdf')}>Dashboard PDF</button>
              </div>

              {dashboard && (
                <div className="grid" style={{ marginTop: '16px' }}>
                  {[
                    ['Jugadores', dashboard.totalPlayers],
                    ['Neg. activas', dashboard.activeNegotiations],
                    ['Transferencias', dashboard.activeTransfers],
                    ['Contratos x vencer', dashboard.contractsExpiringSoon],
                    ['Notif. sin leer', dashboard.unreadNotifications],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="stat-card">
                      <div className="stat-value">{value}</div>
                      <div className="stat-label">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {negReport && (
                <><h3>Negociaciones por estado</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={negChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip />
                      <Bar dataKey="valor" name="Negociaciones" radius={[4, 4, 0, 0]}>
                        {negChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {trReport && (
                <><h3>Transferencias por estado</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip />
                      <Bar dataKey="valor" name="Transferencias" radius={[4, 4, 0, 0]}>
                        {trChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {contractsReport && contractsPieData.some((d) => d.value > 0) && (
                <><h3>Contratos por estado</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={contractsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {contractsPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </section>
          )}

          {/* ════════ INTELIGENCIA ════════ */}
          {activeTab === 'Inteligencia' && subVistaInteligencia === 'ranking' && (
            <section className="card">
              <h2>Generar ranking de jugadores</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Orden global de la cartera por prioridad de scouting (rendimiento reciente, proyección, contrato y actividad).
                No filtra por rol: para una vacante concreta usa <strong>Buscar candidatos para un rol</strong> en el menú.
              </p>
              <div className="toolbar">
                <button type="button" onClick={() => void loadRanking()} disabled={loading}>
                  {loading ? 'Calculando...' : 'Actualizar ranking'}
                </button>
              </div>
              {ranking.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', margin: '10px 0', flexWrap: 'wrap' }}>
                  <span className="profile-badge">Mejor valorado: <strong>{topRanking?.fullName ?? '—'}</strong></span>
                  <span className="profile-badge">Posición líder: <strong>{topRanking?.mainPosition ?? '—'}</strong></span>
                  <span className="profile-badge">Puntuación media: <strong>{avgRankingScore}</strong></span>
                </div>
              )}
              {ranking.length > 0 ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>#</th><th>Jugador</th><th>Posición</th><th>Club</th><th>Puntuación</th></tr></thead>
                    <tbody>
                      {ranking.map((r, i) => (
                        <tr key={r.playerId}>
                          <td>{i + 1}</td>
                          <td>{r.fullName}</td>
                          <td>{r.mainPosition}</td>
                          <td>{r.currentClub ?? '—'}</td>
                          <td>
                            <span style={{ background: '#e8f0fb', borderRadius: '4px', padding: '2px 8px', fontWeight: 700, color: '#0f4c81' }}>
                              {r.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">Pulsa «Actualizar ranking» para calcular la clasificación de tu plantilla.</p>
              )}
            </section>
          )}

          {activeTab === 'Inteligencia' && subVistaInteligencia === 'recomendaciones' && (
            <section className="card">
              <h2>Generar recomendaciones</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Shortlist comercial: a quién mover ahora según el ranking (acciones concretas para la agencia, no búsqueda por rol).
              </p>
              <div className="toolbar">
                <button type="button" onClick={() => void loadRanking()} disabled={loading}>
                  {loading ? 'Actualizando...' : 'Refrescar shortlist'}
                </button>
              </div>
              {recomendacionesShortlist.length > 0 ? (
                <ul className="intel-rec-list">
                  {recomendacionesShortlist.map((r, i) => (
                    <li key={r.playerId} className="intel-rec-card">
                      <div className="intel-rec-head">
                        <span className="intel-rec-rank">#{i + 1}</span>
                        <strong>{r.fullName}</strong>
                        <span className="muted">{r.mainPosition}{r.currentClub ? ` · ${r.currentClub}` : ''}</span>
                        <span className="intel-rec-score">{Number(r.score).toFixed(1)} pts</span>
                      </div>
                      <p className="intel-rec-action">{scoutingRecommendationText(r, i)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Calcula primero el ranking o pulsa «Refrescar shortlist».</p>
              )}
            </section>
          )}

          {activeTab === 'Inteligencia' && subVistaInteligencia === 'compatibilidad' && (
            <section className="card">
              <h2>Buscar candidatos para un rol</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Cuando un club pide un perfil concreto (posición y edad), obtén candidatos ordenados por encaje.
                Es distinto del ranking general y de las recomendaciones comerciales.
              </p>
              <div className="intel-preset-row">
                {PERFILES_ROL_SCOUTING.map((perfil) => (
                  <button
                    key={perfil.label}
                    type="button"
                    className="btn-secondary intel-preset-btn"
                    onClick={() => {
                      setTargetPosition(perfil.position);
                      setMinAge(String(perfil.min));
                      setMaxAge(String(perfil.max));
                    }}
                  >
                    {perfil.label}
                  </button>
                ))}
              </div>
              <div className="stats-step-box">
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <label className="form-field">
                    <span>Posición buscada</span>
                    <select value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)}>
                      {opcionesPosicionRol.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                      {!opcionesPosicionRol.includes(targetPosition) && (
                        <option value={targetPosition}>{targetPosition}</option>
                      )}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Edad mínima</span>
                    <input type="number" min={15} max={45} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                  </label>
                  <label className="form-field">
                    <span>Edad máxima</span>
                    <input type="number" min={15} max={45} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                  </label>
                </div>
              </div>
              {!intelligenceWeightsValid && (
                <p className="muted" style={{ color: '#c0392b' }}>
                  Los pesos del modelo deben sumar 100. Ajústalos en <strong>Pesos del modelo de scouting</strong> (menú Configuración).
                </p>
              )}
              <div className="toolbar">
                <button
                  type="button"
                  className="btn-primary-green"
                  onClick={() => void loadCompatibility()}
                  disabled={loading || !intelligenceWeightsValid}
                >
                  {loading ? 'Buscando...' : 'Buscar candidatos'}
                </button>
              </div>
              {compatibility.length > 0 && (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Jugador</th><th>Encaje</th><th>Pos.</th><th>Edad</th><th>Contrato</th><th>Actividad</th><th>Resumen</th></tr>
                    </thead>
                    <tbody>
                      {compatibility.map((c) => {
                        const detail = parseCompatibilityExplanation(c.explanation);
                        const score = Number(c.compatibilityScore);
                        const resumen = score >= 85 ? 'Muy recomendable' : score >= 70 ? 'Candidato viable' : 'Encaje bajo';
                        return (
                          <tr key={c.playerId}>
                            <td>{c.fullName}</td>
                            <td><strong>{score.toFixed(1)}</strong></td>
                            <td>{detail.position > 0 ? detail.position.toFixed(0) : '—'}</td>
                            <td>{detail.age > 0 ? detail.age.toFixed(0) : '—'}</td>
                            <td>{detail.contract > 0 ? detail.contract.toFixed(0) : '—'}</td>
                            <td>{detail.activity > 0 ? detail.activity.toFixed(0) : '—'}</td>
                            <td title={c.explanation}>{resumen}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'Inteligencia' && subVistaInteligencia === 'parametros' && (
            <section className="card">
              <h2>Pesos del modelo de scouting</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Afectan solo a <strong>Buscar candidatos para un rol</strong>. El ranking usa su propia fórmula interna.
              </p>
              <h4 style={{ margin: '16px 0 8px' }}>
                Distribución (suma:{' '}
                <strong style={{ color: intelligenceWeightsValid ? '#27ae60' : '#c0392b' }}>{intelligenceWeightsTotal}</strong> / 100)
              </h4>
              <div className="weights-grid">
                {([
                  ['Posición', wPosition, setWPosition],
                  ['Edad', wAge, setWAge],
                  ['Contrato', wContract, setWContract],
                  ['Actividad', wActivity, setWActivity],
                ] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
                  <div key={label} className="weight-item">
                    <label>{label}: <strong>{val}</strong></label>
                    <input type="range" min={0} max={100} value={val} onChange={(e) => setter(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
              {!intelligenceWeightsValid && (
                <p className="muted" style={{ color: '#c0392b' }}>
                  La suma debe ser exactamente 100 para poder buscar candidatos por rol.
                </p>
              )}
            </section>
          )}

          {/* ════════ ESTADÍSTICAS ════════ */}
          {activeTab === 'Estadísticas' && (
            <section className="card">
              <h2>Analizar datos de jugadores</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Selecciona un jugador para ver rendimiento, tendencia y comparativa scouting.
              </p>
              <div className="stats-step-box">
                <h3 style={{ marginTop: 0 }}>1) Jugador a analizar</h3>
                <div className="toolbar">
                  {selectorJugador}
                  <button type="button" onClick={() => void cargarEstadisticasJugador()} disabled={!idJugadorSeleccionado}>
                    Actualizar análisis
                  </button>
                  <button type="button" className="btn-secondary" onClick={downloadCurriculum} disabled={!idJugadorSeleccionado}>
                    Currículum PDF
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setActiveTab('Parámetros de configuración');
                      setParamSubTab('DATOS_ANALISIS');
                    }}
                  >
                    Cargar datos manuales
                  </button>
                </div>
              </div>

              <p className="muted" style={{ marginBottom: 10 }}>
                La carga manual de partidos se realiza en <strong>Configuración y parámetros → Datos análisis</strong>.
              </p>
              <div className="stats-analysis-shell">
                <div className="toolbar">
                  <h3 style={{ margin: 0 }}>2) Rendimiento del jugador</h3>
                  <select
                    value={statsWindow}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatsWindow(e.target.value as '5' | '10' | '20' | 'all')}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cfd8e3', minWidth: '220px' }}
                  >
                    <option value="5">Últimos 5 partidos</option>
                    <option value="10">Últimos 10 partidos</option>
                    <option value="20">Últimos 20 partidos</option>
                    <option value="all">Todo el historial</option>
                  </select>
                </div>
                <p className="muted" style={{ marginTop: -4, marginBottom: 10 }}>
                  Vista visual y comparativa del jugador activo para scouting operativo.
                </p>

                {!idJugadorSeleccionado ? (
                  <div className="stats-empty-box">
                    Primero selecciona un jugador en el paso 1.
                  </div>
                ) : statsHistoryView.length === 0 ? (
                  <div className="stats-empty-box">
                    Este jugador no tiene partidos cargados aún. Registra al menos un partido y el análisis aparecerá automáticamente.
                  </div>
                ) : (
                  <>
                    <div className="stats-kpi-grid">
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Partidos analizados</span>
                        <strong className="stats-kpi-value">{statsHistoryView.length}</strong>
                      </div>
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Goles</span>
                        <strong className="stats-kpi-value">{statsTotalGoals}</strong>
                      </div>
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Asistencias</span>
                        <strong className="stats-kpi-value">{statsTotalAssists}</strong>
                      </div>
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Rating medio</span>
                        <strong className="stats-kpi-value">{statsAvgRating}</strong>
                      </div>
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Contribuciones / 90</span>
                        <strong className="stats-kpi-value">{statsPer90}</strong>
                      </div>
                      <div className="stats-kpi-card">
                        <span className="stats-kpi-label">Forma (5 últimos)</span>
                        <strong className="stats-kpi-value">{statsRecentForm != null ? statsRecentForm.toFixed(2) : '—'}</strong>
                      </div>
                    </div>

                    <div className="stats-chart-block">
                      <h3 style={{ marginTop: 0 }}>Tendencia de rendimiento</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={statsTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="jornada" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value, name) => [value, name === 'rating' ? 'Rating' : 'Contribuciones']}
                            labelFormatter={(_, payload) => {
                              const point = payload?.[0]?.payload as { rival?: string } | undefined;
                              return point?.rival ? `Rival: ${point.rival}` : 'Partido';
                            }}
                          />
                          <Legend formatter={(value) => (value === 'rating' ? 'Rating' : 'Goles + Asistencias')} />
                          <Bar yAxisId="left" dataKey="rating" fill="#0f4c81" radius={[3, 3, 0, 0]} />
                          <Bar yAxisId="right" dataKey="contribucion" fill="#27ae60" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>

              <div className="stats-compare-panel">
                <h3 style={{ marginTop: 0 }}>3) Comparativa rápida</h3>
                <div className="toolbar">
                  <select
                    value={statsComparePlayerId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      setStatsComparePlayerId(e.target.value);
                      setStatsCompareHistory([]);
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cfd8e3', minWidth: '240px' }}
                  >
                    <option value="">-- Elegir jugador para comparar --</option>
                    {jugadores
                      .filter((p) => p.id !== idJugadorSeleccionado)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({p.mainPosition})
                        </option>
                      ))}
                  </select>
                  <button type="button" onClick={cargarComparativaJugador} disabled={!statsComparePlayerId}>
                    Comparar
                  </button>
                </div>

                {!idJugadorSeleccionado ? (
                  <p className="muted">Primero selecciona un jugador para activar la comparativa.</p>
                ) : statsHistoryView.length === 0 ? (
                  <p className="muted">Este jugador no tiene historial para comparar.</p>
                ) : statsCompareHistoryView.length === 0 ? (
                  <p className="muted">Selecciona un jugador y pulsa <strong>Comparar</strong>.</p>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Métrica</th>
                            <th>Jugador activo</th>
                            <th>{comparePlayer ? `${comparePlayer.firstName} ${comparePlayer.lastName}` : 'Comparado'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Partidos analizados</td>
                            <td>{statsHistoryView.length}</td>
                            <td>{statsCompareHistoryView.length}</td>
                          </tr>
                          <tr>
                            <td>Goles</td>
                            <td>{statsTotalGoals}</td>
                            <td>{compareGoals}</td>
                          </tr>
                          <tr>
                            <td>Asistencias</td>
                            <td>{statsTotalAssists}</td>
                            <td>{compareAssists}</td>
                          </tr>
                          <tr>
                            <td>Rating medio</td>
                            <td>{statsAvgRating}</td>
                            <td>{compareAvgRating.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Contribuciones / 90</td>
                            <td>{statsPer90}</td>
                            <td>{comparePer90.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metrica" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="titular" name="Activo" fill="#0f4c81" radius={[3, 3, 0, 0]} />
                        <Bar
                          dataKey="comparado"
                          name={comparePlayer ? `${comparePlayer.firstName} ${comparePlayer.lastName}` : 'Comparado'}
                          fill="#27ae60"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>

              {statsHistory.length > 0 && (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Fecha</th><th>Rival</th><th>G</th><th>A</th><th>Min</th><th>Rating</th></tr></thead>
                    <tbody>
                      {statsHistory.map((s) => (
                        <tr key={s.id}><td>{s.matchDate}</td><td>{s.opponent}</td><td>{s.goals}</td><td>{s.assists}</td><td>{s.minutesPlayed}</td><td>{s.rating}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ════════ NOTIFICACIONES ════════ */}
          {activeTab === 'Notificaciones' && (
            <section className="card">
              <h2>Notificaciones</h2>
              <div className="toolbar">
                <button type="button" onClick={() => void loadNotifications()}>Cargar</button>
                {unreadCount > 0 && (
                  <button type="button" className="btn-secondary" onClick={() => void markAllAsRead()}>
                    Marcar todas como leídas
                  </button>
                )}
                {unreadCount > 0 && <span className="badge-inline">{unreadCount} sin leer</span>}
                <span className="muted">Se actualiza automáticamente cada 30 seg.</span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Título</th><th>Mensaje</th><th>Prioridad</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id} style={{ opacity: n.isRead ? 0.6 : 1, background: !n.isRead ? '#f0f6ff' : undefined }}>
                        <td><strong>{n.title}</strong></td>
                        <td style={{ fontSize: '0.88rem' }}>{n.message}</td>
                        <td>{n.priority}</td>
                        <td style={{ fontSize: '0.82rem' }}>{new Date(n.createdAtUtc).toLocaleDateString('es-CO')}</td>
                        <td>{n.isRead ? 'Leída' : <strong style={{ color: '#0f4c81' }}>Pendiente</strong>}</td>
                        <td>{!n.isRead && <button type="button" className="btn-secondary" onClick={() => void markAsRead(n.id)}>Marcar leída</button>}</td>
                      </tr>
                    ))}
                    {notifications.length === 0 && <tr><td colSpan={6} className="muted empty-state-cell">Sin notificaciones.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ════════ PARÁMETROS DE CONFIGURACIÓN ════════ */}
          {activeTab === 'Parámetros de configuración' && (
            <section className="card">
              <div className="param-header">
                <div>
                  <h2 style={{ margin: 0 }}>Parámetros de configuración</h2>
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    Define los valores de los formularios desplegables. Los cambios se aplican de inmediato en <strong>Jugadores</strong>.
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => void cargarListasParametros()} disabled={loading}>
                  <i className="ri-refresh-line" /> Actualizar
                </button>
              </div>

              {/* Guía de orden */}
              <div className="param-guide-bar">
                <i className="ri-lightbulb-line" />
                <span>
                  <strong>Orden recomendado:</strong>{' '}
                  {['1. Países + Nacionalidades', '2. Ciudades', '3. Posiciones', '4. Categorías competitivas', '5. Competiciones/Torneos', '6. Clubes por temporada'].map((s, i, arr) => (
                    <span key={s}><span className="param-guide-step">{s}</span>{i < arr.length - 1 ? ' → ' : ''}</span>
                  ))}
                </span>
              </div>

              {/* Sub-pestañas */}
              <div className="param-subtabs">
                {([
                  { key: 'PAISES', label: 'Países', icon: 'ri-map-2-line', requires: [] },
                  { key: 'CIUDADES', label: 'Ciudades', icon: 'ri-building-4-line', requires: ['PAISES'] },
                  { key: 'POSICIONES', label: 'Posiciones', icon: 'ri-football-line', requires: [] },
                  { key: 'CATEGORIAS_LIGA', label: 'Categorías competitivas', icon: 'ri-trophy-line', requires: [] },
                  { key: 'CLUBES', label: 'Clubes', icon: 'ri-building-2-line', requires: ['PAISES', 'CIUDADES', 'CATEGORIAS_LIGA'] },
                  { key: 'AVANZADO', label: 'Otros', icon: 'ri-list-settings-line', requires: [] },
                ] as const).map(st => {
                  const missingDeps = st.requires.filter(r => (paramItemsByCode[r] ?? []).length === 0);
                  const isLocked = missingDeps.length > 0;
                  const tooltip = isLocked
                    ? `Primero configura: ${missingDeps.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')}`
                    : undefined;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      className={`param-subtab${paramSubTab === st.key ? ' param-subtab--activo' : ''}${isLocked ? ' param-subtab--locked' : ''}`}
                      onClick={() => !isLocked && setParamSubTab(st.key as ParamSubTab)}
                      title={tooltip}
                      disabled={isLocked}
                    >
                      {isLocked ? <i className="ri-lock-line" /> : <i className={st.icon} />}
                      <span>{st.label}</span>
                      {st.key !== 'AVANZADO' && !isLocked && (
                        <span className="param-subtab-count">
                          {(paramItemsByCode[st.key] ?? []).length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Contenido por sub-pestaña ── */}
              {paramSubTab === 'DATOS_ANALISIS' && (
                <div className="param-panel">
                  <div className="param-info-bar">
                    <div className="param-info-icon"><i className="ri-line-chart-line" /></div>
                    <div>
                      <strong>Carga manual de datos para análisis</strong>
                      <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginTop: 2 }}>
                        Este submódulo alimenta el módulo <strong>Analizar datos de jugadores</strong>.
                      </span>
                    </div>
                  </div>

                  <form onSubmit={crearEstadisticaJugador} className="grid">
                    <div className="form-field">
                      <label>Jugador</label>
                      <select value={statPlayerIdCargaManual} onChange={(e) => setStatPlayerIdCargaManual(e.target.value)} required>
                        <option value="">-- Selecciona jugador --</option>
                        {jugadores.map((p) => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mainPosition})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Fecha del partido</label>
                      <input type="date" value={statMatchDate} onChange={(e) => setStatMatchDate(e.target.value)} required />
                    </div>
                    <div className="form-field">
                      <label>Rival</label>
                      <input value={statOpponent} onChange={(e) => setStatOpponent(e.target.value)} placeholder="Ej. Oriente" required />
                    </div>
                    <div className="form-field">
                      <label>Minutos jugados</label>
                      <input type="number" min={0} value={statMinutes} onChange={(e) => setStatMinutes(e.target.value)} placeholder="90" required />
                    </div>
                    <div className="form-field">
                      <label>Goles</label>
                      <input type="number" min={0} value={statGoals} onChange={(e) => setStatGoals(e.target.value)} placeholder="0" />
                    </div>
                    <div className="form-field">
                      <label>Asistencias</label>
                      <input type="number" min={0} value={statAssists} onChange={(e) => setStatAssists(e.target.value)} placeholder="0" />
                    </div>
                    <div className="form-field">
                      <label>Tarjetas amarillas</label>
                      <input type="number" min={0} value={statYellowCards} onChange={(e) => setStatYellowCards(e.target.value)} placeholder="0" />
                    </div>
                    <div className="form-field">
                      <label>Tarjetas rojas</label>
                      <input type="number" min={0} value={statRedCards} onChange={(e) => setStatRedCards(e.target.value)} placeholder="0" />
                    </div>
                    <div className="form-field">
                      <label>Rating (0-10)</label>
                      <input type="number" min={0} max={10} step="0.1" value={statRating} onChange={(e) => setStatRating(e.target.value)} placeholder="7.5" required />
                    </div>
                    <div className="form-field">
                      <label>Estado físico</label>
                      <select value={statPhysicalStatus} onChange={(e) => setStatPhysicalStatus(e.target.value)}>
                        <option value="Óptimo">Óptimo</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                        <option value="Fatigado">Fatigado</option>
                        <option value="Lesionado">Lesionado</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Notas (opcional)</label>
                      <input value={statNotes} onChange={(e) => setStatNotes(e.target.value)} placeholder="Observaciones del partido" />
                    </div>
                    <button type="submit">Guardar dato para análisis</button>
                  </form>

                  <div className="toolbar">
                    <button type="button" onClick={() => void cargarEstadisticasCargaManual()}>Cargar historial del jugador</button>
                    <button type="button" className="btn-secondary" onClick={() => { setActiveTab('Estadísticas'); }}>
                      Ir a Analizar datos de jugadores
                    </button>
                  </div>

                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Fecha</th><th>Rival</th><th>G</th><th>A</th><th>Min</th><th>Rating</th></tr></thead>
                      <tbody>
                        {statsManualHistory.map((s) => (
                          <tr key={s.id}><td>{s.matchDate}</td><td>{s.opponent}</td><td>{s.goals}</td><td>{s.assists}</td><td>{s.minutesPlayed}</td><td>{s.rating}</td></tr>
                        ))}
                        {statsManualHistory.length === 0 && (
                          <tr><td colSpan={6} className="muted empty-state-cell">Sin datos cargados para el jugador seleccionado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {paramSubTab !== 'AVANZADO' && paramSubTab !== 'DATOS_ANALISIS' && (() => {
                const def = CONFIG_STANDARD_LISTS.find(d => d.code === paramSubTab)!;
                const items = paramItemsByCode[def.code] ?? [];
                const isClubs = def.code === 'CLUBES';
                const isNat = def.code === 'NACIONALIDADES';
                const isPaises = def.code === 'PAISES';
                const isCiudades = def.code === 'CIUDADES';
                const isCatLiga = def.code === 'CATEGORIAS_LIGA';
                const paisesItems = paramItemsByCode['PAISES'] ?? [];
                const catLigaItems = paramItemsByCode['CATEGORIAS_LIGA'] ?? [];
                const emptyLabel = isClubs ? 'clubes' : isNat ? 'nacionalidades' : isPaises ? 'países' : isCiudades ? 'ciudades' : isCatLiga ? 'categorías de liga' : 'posiciones';

                // Para CLUBES: el país seleccionado en draft
                const clubPaisId = paramDraft['CLUBES']?.parentItemId ?? '';
                const clubPaisItem = paisesItems.find(p => p.id === clubPaisId);

                return (
                  <div className="param-panel">
                    {/* Info */}
                    <div className="param-info-bar">
                      <div className="param-info-icon"><i className={def.icon} /></div>
                      <div>
                        <strong>{def.title}</strong>
                        <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginTop: 2 }}>{def.hint}</span>
                        <span className="muted" style={{ fontSize: '0.82rem' }}><strong>Ejemplos:</strong> {def.examples}</span>
                      </div>
                      <span className="param-count-badge">{items.length} {items.length === 1 ? 'valor' : 'valores'}</span>
                    </div>

                    {/* Importación masiva: solo Países */}
                    {isPaises && (
                      <div className="param-import-bar">
                        <div>
                          <strong>Importar lista FIFA</strong>
                          <span className="muted" style={{ display: 'block', fontSize: '0.82rem' }}>
                            Carga {PAISES_FIFA.length} países con su nacionalidad vinculada. Los que ya existan se omiten.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-primary-green"
                          disabled={loading || importandoPaises}
                          onClick={() => void importarPaisesFifa()}
                        >
                          <i className="ri-download-2-line" /> {importandoPaises ? 'Importando…' : 'Importar países FIFA'}
                        </button>
                      </div>
                    )}

                    {isClubs && (
                      <div className="param-structure-box">
                        <div className="param-structure-header">
                          <div>
                            <strong>Estructura deportiva relacional (Fase 2)</strong>
                            <span className="muted" style={{ display: 'block', fontSize: '0.82rem' }}>
                              Flujo recomendado: País → Temporada → Categoría → Competición → Ciudad → Club.
                            </span>
                          </div>
                          <div className="param-inline-actions">
                            <button type="button" className="btn-secondary" onClick={() => void importarPresetBolivia2026()} disabled={loading}>
                              <i className="ri-magic-line" /> Cargar preset Bolivia 2026
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => void importarPresetSudamericaBase()} disabled={loading}>
                              <i className="ri-earth-line" /> Cargar preset Sudamérica base
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => void syncSportsCountryToCatalogs(sportsCountryId, sportsSeason)}
                              disabled={loading || !sportsCountryId || !sportsSeason.trim()}
                            >
                              <i className="ri-links-line" /> Sincronizar a catálogos
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => void loadSportsStructureBase()}>
                              <i className="ri-refresh-line" /> Recargar estructura
                            </button>
                          </div>
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                          <div className="form-field">
                            <label>País *</label>
                            <div className="param-inline-actions">
                              <select value={sportsCountryId} onChange={(e) => setSportsCountryId(e.target.value)}>
                                <option value="">— Selecciona país —</option>
                                {sportsCountries.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <button type="button" className="btn-secondary" onClick={() => void createSportsCountryQuick()} title="Crear país">
                                <i className="ri-add-line" />
                              </button>
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Temporada *</label>
                            <input value={sportsSeason} onChange={(e) => setSportsSeason(e.target.value)} placeholder="2026 o 2025/26" />
                          </div>
                          <div className="form-field">
                            <label>Categoría competitiva *</label>
                            <div className="param-inline-actions">
                              <select value={sportsCategoryId} onChange={(e) => setSportsCategoryId(e.target.value)}>
                                <option value="">— Selecciona categoría —</option>
                                {sportsCategories.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}{c.level != null ? ` (nivel ${c.level})` : ''}</option>
                                ))}
                              </select>
                              <button type="button" className="btn-secondary" onClick={() => void createSportsCategoryQuick()} title="Crear categoría">
                                <i className="ri-add-line" />
                              </button>
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Competición / torneo *</label>
                            <div className="param-inline-actions">
                              <select value={sportsCompetitionId} onChange={(e) => setSportsCompetitionId(e.target.value)}>
                                <option value="">— Selecciona competición —</option>
                                {sportsCompetitions
                                  .filter((cp) => !sportsCategoryId || cp.competitiveCategoryId === sportsCategoryId)
                                  .map((cp) => (
                                  <option key={cp.id} value={cp.id}>
                                    {cp.name} · {cp.competitiveCategoryName}
                                  </option>
                                ))}
                              </select>
                              <button type="button" className="btn-secondary" onClick={() => void createSportsCompetitionQuick()} title="Crear competición">
                                <i className="ri-add-line" />
                              </button>
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Ciudad</label>
                            <div className="param-inline-actions">
                              <select value={sportsCityId} onChange={(e) => setSportsCityId(e.target.value)} disabled={!sportsCountryId}>
                                <option value="">— Selecciona ciudad —</option>
                                {sportsCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <button type="button" className="btn-secondary" onClick={() => void createSportsCityQuick()} title="Crear ciudad" disabled={!sportsCountryId}>
                                <i className="ri-add-line" />
                              </button>
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Club *</label>
                            <input value={sportsClubName} onChange={(e) => setSportsClubName(e.target.value)} placeholder="Ej. Bolívar" />
                          </div>
                          <div className="form-field">
                            <label>Nombre corto</label>
                            <input value={sportsClubShortName} onChange={(e) => setSportsClubShortName(e.target.value)} placeholder="Ej. BOL" />
                          </div>
                          <div className="form-field">
                            <label>Fuente</label>
                            <select value={sportsDataSourceId} onChange={(e) => setSportsDataSourceId(e.target.value)}>
                              <option value="">— Manual / sin fuente —</option>
                              {sportsDataSources.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label>Estado validación</label>
                            <select value={sportsValidationStatus} onChange={(e) => setSportsValidationStatus(e.target.value as typeof sportsValidationStatus)}>
                              <option value="pendiente">pendiente</option>
                              <option value="validado">validado</option>
                              <option value="observado">observado</option>
                              <option value="duplicado">duplicado</option>
                              <option value="descartado">descartado</option>
                            </select>
                          </div>
                          <div className="form-field param-add-btn-col">
                            <label>&nbsp;</label>
                            <button type="button" className="btn-primary-green" onClick={() => void createSportsClub()} disabled={loading}>
                              <i className="ri-save-3-line" /> Registrar club (estructura)
                            </button>
                          </div>
                        </div>

                        <div className="table-wrap" style={{ marginTop: '10px' }}>
                          <div className="toolbar" style={{ padding: '10px 10px 0' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => void validarDuplicadosCompeticionActual()}
                              disabled={loading || !sportsCompetitionId || sportsCompetitionClubs.length === 0}
                            >
                              <i className="ri-shield-check-line" /> Validar duplicados (competición actual)
                            </button>
                            <span className="muted" style={{ fontSize: '0.82rem' }}>
                              Marca como <strong>duplicado</strong> los clubes repetidos por nombre+ciudad.
                            </span>
                          </div>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Club</th><th>Ciudad</th><th>Temporada</th><th>Estado competición</th><th>Validación</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sportsCompetitionClubs.map((r) => (
                                <tr key={r.clubCompetitionSeasonId}>
                                  <td>{r.clubName}</td>
                                  <td>{r.cityName || '—'}</td>
                                  <td>{r.season}</td>
                                  <td>{r.status}</td>
                                  <td>{r.validationStatus}</td>
                                </tr>
                              ))}
                              {sportsCompetitionClubs.length === 0 && (
                                <tr><td colSpan={5} className="muted empty-state-cell">Sin clubes para la competición/temporada seleccionada.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Formulario de agregar */}
                    <div className="param-add-form">
                      <div className={`param-add-grid${isClubs ? ' param-add-grid--clubs' : isPaises ? ' param-add-grid--paises' : isCiudades || isNat ? ' param-add-grid--parent' : ''}`}>

                        {/* CIUDADES: selector de país primero */}
                        {isCiudades && (
                          <div className="form-field">
                            <label>País <span style={{ color: 'var(--m-danger)', marginLeft: 2 }}>*</span></label>
                            <select
                              value={paramDraft[def.code]?.parentItemId ?? ''}
                              onChange={e => mergeParamDraft(def.code, { parentItemId: e.target.value })}
                            >
                              <option value="">— Selecciona un país —</option>
                              {paisesItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        )}

                        {/* NACIONALIDADES: selector de país origen (opcional) */}
                        {isNat && (
                          <div className="form-field">
                            <label>País origen <span className="muted">(opcional)</span></label>
                            <select
                              value={paramDraft[def.code]?.parentItemId ?? ''}
                              onChange={e => mergeParamDraft(def.code, { parentItemId: e.target.value })}
                            >
                              <option value="">— Sin vincular —</option>
                              {paisesItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        )}

                        {/* Nombre principal */}
                        <div className="form-field">
                          <label>
                            {isClubs ? 'Nombre del club' : isNat ? 'Nombre de la nacionalidad' : isCiudades ? 'Nombre de la ciudad' : isPaises ? 'Nombre del país' : isCatLiga ? 'Nombre de la categoría' : 'Nombre de la posición'}
                          </label>
                          <input
                            value={paramDraft[def.code]?.name ?? ''}
                            onChange={e => {
                              const v = e.target.value;
                              mergeParamDraft(def.code, { name: v });
                              // Al escribir el país, auto-sugerir el gentilicio
                              if (isPaises) {
                                const suggested = GENTILICIO[v] ?? GENTILICIO[v.trim()] ?? '';
                                // Solo auto-llenar si el campo de nacionalidad está vacío o coincide con sugerencia anterior
                                setParamDraft(prev => {
                                  const prevNat = prev['PAISES']?.nationality ?? '';
                                  const wasAutoFilled = Object.values(GENTILICIO).includes(prevNat) || prevNat === '';
                                  return wasAutoFilled
                                    ? { ...prev, PAISES: { ...(prev['PAISES'] ?? emptyParamQuick()), name: v, nationality: suggested } }
                                    : prev;
                                });
                              }
                            }}
                            onKeyDown={e => e.key === 'Enter' && !isClubs && void addQuickParamItem(def.code)}
                            placeholder={
                              isClubs ? 'Ej. Millonarios FC'
                              : isNat ? 'Ej. Colombiano'
                              : isCiudades ? 'Ej. Bogotá'
                              : isPaises ? 'Ej. Colombia'
                              : isCatLiga ? 'Ej. Primera División'
                              : 'Ej. Delantero centro'
                            }
                          />
                        </div>

                        {/* PAÍSES: campo de nacionalidad derivada */}
                        {isPaises && (
                          <div className="form-field">
                            <label>
                              Nacionalidad <span className="muted">(se crea automáticamente)</span>
                            </label>
                            <input
                              value={paramDraft['PAISES']?.nationality ?? ''}
                              onChange={e => mergeParamDraft('PAISES', { nationality: e.target.value })}
                              placeholder="Ej. Colombiano (se sugiere al escribir el país)"
                            />
                          </div>
                        )}

                        {/* CLUBES: país → ciudad filtrada → categoría → liga */}
                        {isClubs && (
                          <>
                            <div className="form-field">
                              <label>País <span style={{ color: 'var(--m-danger)', marginLeft: 2 }}>*</span></label>
                              <select
                                value={paramDraft['CLUBES']?.parentItemId ?? ''}
                                onChange={e => {
                                  mergeParamDraft('CLUBES', { parentItemId: e.target.value, city: '' });
                                  void cargarCiudadesPorPais(e.target.value);
                                }}
                              >
                                <option value="">— Selecciona un país —</option>
                                {paisesItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>

                            <div className="form-field">
                              <label>Ciudad {clubCityOptions.length === 0 && clubPaisId && <span className="muted">(no hay ciudades para {clubPaisItem?.name ?? 'este país'})</span>}</label>
                              {clubCityOptions.length > 0 ? (
                                <select
                                  value={paramDraft['CLUBES']?.city ?? ''}
                                  onChange={e => mergeParamDraft('CLUBES', { city: e.target.value })}
                                >
                                  <option value="">— Selecciona ciudad —</option>
                                  {clubCityOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                              ) : (
                                <input
                                  value={paramDraft['CLUBES']?.city ?? ''}
                                  onChange={e => mergeParamDraft('CLUBES', { city: e.target.value })}
                                  placeholder="Escribe la ciudad"
                                  disabled={!clubPaisId}
                                />
                              )}
                            </div>

                            <div className="form-field">
                              <label>Categoría <span style={{ color: 'var(--m-danger)', marginLeft: 2 }}>*</span></label>
                              <select
                                value={paramDraft['CLUBES']?.categoryItemId ?? ''}
                                onChange={e => mergeParamDraft('CLUBES', { categoryItemId: e.target.value })}
                              >
                                <option value="">— Selecciona categoría —</option>
                                {catLigaItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>

                            <div className="form-field">
                              <label>Liga / Torneo <span className="muted">(opcional)</span></label>
                              <input
                                value={paramDraft['CLUBES']?.league ?? ''}
                                onChange={e => mergeParamDraft('CLUBES', { league: e.target.value })}
                                placeholder="Ej. Liga BetPlay, LFPB"
                              />
                            </div>
                          </>
                        )}

                        <div className="form-field param-add-btn-col">
                          <label>&nbsp;</label>
                          <button
                            type="button"
                            className="btn-primary-green"
                            disabled={loading || (isCiudades && !paramDraft[def.code]?.parentItemId)}
                            onClick={() => void addQuickParamItem(def.code)}
                          >
                            <i className="ri-add-line" /> Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de valores existentes */}
                    <div className="param-table-wrap">
                      {items.length === 0 ? (
                        <div className="param-empty">
                          <i className={def.icon} />
                          <p>
                            Aún no hay {emptyLabel} configurados.
                            <br />Usa el formulario de arriba para agregar el primero.
                          </p>
                        </div>
                      ) : (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>{isClubs ? 'Club' : isNat ? 'Nacionalidad' : isCiudades ? 'Ciudad' : isPaises ? 'País' : isCatLiga ? 'Categoría' : 'Posición'}</th>
                              {isPaises && <th>Nacionalidad vinculada</th>}
                              {isCiudades && <th>País</th>}
                              {isNat && <th>País origen</th>}
                              {isClubs && <><th>País</th><th>Ciudad</th><th>Categoría</th><th>Liga</th></>}
                              <th className="actions" />
                            </tr>
                          </thead>
                          <tbody>
                            {[...items].sort((a, b) => a.sortOrder - b.sortOrder).map((item, idx) => {
                              const parentName = item.parentItemId
                                ? (paramItemsByCode['PAISES'] ?? []).find(p => p.id === item.parentItemId)?.name ?? '—'
                                : '—';
                              // Para PAISES: buscar la nacionalidad vinculada a este país
                              const linkedNat = isPaises
                                ? (paramItemsByCode['NACIONALIDADES'] ?? []).find(n => n.parentItemId === item.id)
                                : null;
                              return (
                                <tr key={item.id}>
                                  <td className="muted" style={{ width: 32, fontSize: '0.82rem' }}>{idx + 1}</td>
                                  <td><strong>{item.name}</strong></td>
                                  {isPaises && (
                                    <td>
                                      {linkedNat
                                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                            <i className="ri-earth-line" style={{ color: 'var(--m-primary)', fontSize: '0.85rem' }} />
                                            {linkedNat.name}
                                          </span>
                                        : <span className="muted" style={{ fontSize: '0.82rem' }}>Sin nacionalidad</span>}
                                    </td>
                                  )}
                                  {isCiudades && <td>{parentName}</td>}
                                  {isNat && <td>{item.parentItemId ? parentName : <span className="muted">—</span>}</td>}
                                  {isClubs && (
                                    <>
                                      <td>{item.country ?? <span className="muted">—</span>}</td>
                                      <td>{item.city ?? <span className="muted">—</span>}</td>
                                      <td>
                                        {item.parentItemId
                                          ? (catLigaItems.find(c => c.id === item.parentItemId)?.name ?? <span className="muted">—</span>)
                                          : <span className="muted">—</span>}
                                      </td>
                                      <td>{item.league ?? <span className="muted">—</span>}</td>
                                    </>
                                  )}
                                  <td className="actions">
                                    <button type="button" className="btn-danger" disabled={loading} onClick={() => void deleteCatalogItemById(item.id)}>
                                      <i className="ri-delete-bin-line" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Pestaña AVANZADO ── */}
              {paramSubTab === 'AVANZADO' && (
                <div className="param-panel">
                  <div className="param-info-bar">
                    <div className="param-info-icon"><i className="ri-list-settings-line" /></div>
                    <div>
                      <strong>Otros catálogos</strong>
                      <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginTop: 2 }}>
                        Crea listas adicionales: tipos de documento, estados propios, etc. Las tres pestañas anteriores cubren posiciones, nacionalidades y clubes.
                      </span>
                    </div>
                  </div>

                  {/* Crear nuevo catálogo */}
                  <div className="param-add-form">
                    <h4 style={{ margin: '0 0 14px' }}><i className="ri-folder-add-line" style={{ color: 'var(--m-primary)', marginRight: 6 }} />Crear nuevo catálogo</h4>
                    <form onSubmit={createCatalog} className="param-add-grid">
                      <div className="form-field">
                        <label>Código único <span className="muted">(sin espacios, mayúsculas)</span></label>
                        <input value={catCode} onChange={e => setCatCode(e.target.value)} placeholder="Ej. TIPOS_DOC" required />
                      </div>
                      <div className="form-field">
                        <label>Nombre del catálogo</label>
                        <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ej. Tipos de documento" required />
                      </div>
                      <div className="form-field">
                        <label>Descripción <span className="muted">(opcional)</span></label>
                        <input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Para qué se usa" />
                      </div>
                      <div className="form-field param-add-btn-col">
                        <label>&nbsp;</label>
                        <button type="submit" className="btn-primary-green">Crear catálogo</button>
                      </div>
                    </form>
                  </div>

                  {/* Lista de catálogos existentes */}
                  {catalogs.filter(c => !['POSICIONES','NACIONALIDADES','CLUBES'].includes(c.code)).length > 0 && (
                    <div className="param-table-wrap" style={{ marginTop: 8 }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>Catálogos existentes</h4>
                      <table className="data-table">
                        <thead><tr><th>Código</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Ítems</th></tr></thead>
                        <tbody>
                          {catalogs.filter(c => !['POSICIONES','NACIONALIDADES','CLUBES'].includes(c.code)).map((c) => (
                            <tr key={c.id} className={selectedCatalogId === c.id ? 'row-selected' : ''}>
                              <td><code>{c.code}</code></td>
                              <td>{c.name}</td>
                              <td style={{ fontSize: '0.88rem', color: '#5a6b7d' }}>{c.description}</td>
                              <td>{c.isActive ? <span style={{ color: '#27ae60' }}>Activo</span> : 'Inactivo'}</td>
                              <td><button type="button" className="btn-secondary" onClick={() => void loadCatalogItems(c.id)}>Ver ítems</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Ítems del catálogo seleccionado */}
                  {selectedCatalogId && (() => {
                    const selCat = catalogs.find((x) => x.id === selectedCatalogId);
                    return (
                      <div className="param-add-form" style={{ marginTop: 0 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>
                          Ítems de: <span style={{ color: 'var(--m-primary)' }}>{selCat?.name}</span>
                        </h4>
                        <form onSubmit={createCatalogItem} className="param-add-grid">
                          <div className="form-field">
                            <label>Código ítem</label>
                            <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="Ej. MC_01" required />
                          </div>
                          <div className="form-field">
                            <label>Nombre visible</label>
                            <input value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                          </div>
                          <div className="form-field">
                            <label>Orden</label>
                            <input type="number" value={itemOrder} onChange={(e) => setItemOrder(e.target.value)} style={{ width: 80 }} />
                          </div>
                          <div className="form-field param-add-btn-col">
                            <label>&nbsp;</label>
                            <button type="submit" className="btn-primary-green">Agregar ítem</button>
                          </div>
                        </form>
                        <div className="table-wrap" style={{ marginTop: '12px' }}>
                          <table className="data-table">
                            <thead><tr><th>Código</th><th>Nombre</th><th>Orden</th><th>Estado</th><th className="actions" /></tr></thead>
                            <tbody>
                              {catalogItems.map((i) => (
                                <tr key={i.id}>
                                  <td><code>{i.code}</code></td>
                                  <td>{i.name}</td>
                                  <td>{i.sortOrder}</td>
                                  <td>{i.isActive ? <span style={{ color: '#27ae60' }}>Activo</span> : 'Inactivo'}</td>
                                  <td className="actions">
                                    <button type="button" className="btn-danger" disabled={loading} onClick={() => void deleteCatalogItemById(i.id)}>Eliminar</button>
                                  </td>
                                </tr>
                              ))}
                              {catalogItems.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: '12px', textAlign: 'center' }}>Sin ítems aún.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          )}

          {/* ════════ ADMINISTRACIÓN / SEGURIDAD ════════ */}
          {activeTab === 'Administración' && subVistaSeguridad === 'sesion' && (
            <section className="card">
              <h2>Autenticación y sesión</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Tu sesión activa en el portal. Los cambios de usuarios, roles y bitácoras están en las demás opciones del menú de seguridad.
              </p>
              <div className="seguridad-sesion-grid">
                <div className="seguridad-sesion-card">
                  <span className="seguridad-sesion-label">Usuario</span>
                  <strong>{sessionUser?.fullName || '—'}</strong>
                  <span className="muted">{sessionUser?.email || email || '—'}</span>
                </div>
                <div className="seguridad-sesion-card">
                  <span className="seguridad-sesion-label">Rol en el sistema</span>
                  <strong>{sessionUser?.roles.join(', ') || '—'}</strong>
                  <span className="muted">Define qué módulos puedes usar</span>
                </div>
                <div className="seguridad-sesion-card">
                  <span className="seguridad-sesion-label">Sesión válida hasta</span>
                  <strong>
                    {sessionUser?.expiresAtUtc
                      ? new Date(sessionUser.expiresAtUtc).toLocaleString('es-CO')
                      : '—'}
                  </strong>
                  <span className="muted">Al expirar deberás iniciar sesión de nuevo</span>
                </div>
              </div>
              <div className="stats-step-box" style={{ marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Acceso según tu rol</h3>
                <ul className="seguridad-lista-acceso">
                  {MATRIZ_PERMISOS.map((fila) => (
                    <li key={fila.politica}>
                      {sessionUser?.roles.some((r) => fila.roles.includes(r)) ? (
                        <i className="ri-checkbox-circle-fill" style={{ color: '#27ae60' }} />
                      ) : (
                        <i className="ri-close-circle-line" style={{ color: '#c0392b' }} />
                      )}
                      <span>{fila.capacidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="toolbar" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setToken('');
                    setSessionUser(null);
                    setUnreadCount(0);
                    setActiveTab(null);
                    setModulosAbiertos(estadoInicialModulosCerrados());
                  }}
                >
                  <i className="ri-logout-box-r-line" /> Cerrar sesión
                </button>
              </div>
            </section>
          )}

          {activeTab === 'Administración' && subVistaSeguridad === 'usuarios' && (
            <section className="card">
              <h2>Gestionar usuarios</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Alta, desactivación y asignación de rol. Los permisos efectivos dependen del rol (véase <strong>Administrar permisos</strong>).
              </p>
              {!esAdministrador ? (
                <div className="stats-empty-box">
                  Solo el rol <strong>Administrador</strong> puede gestionar usuarios.
                  Tu rol: <strong>{sessionUser?.roles.join(', ') || '—'}</strong>.
                </div>
              ) : (
                <>
                  <h3>Nuevo usuario</h3>
                  <form onSubmit={createUser} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label className="form-field">
                      <span>Correo</span>
                      <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} type="email" required />
                    </label>
                    <label className="form-field">
                      <span>Nombre completo</span>
                      <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                    </label>
                    <label className="form-field">
                      <span>Contraseña</span>
                      <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} type="password" required />
                    </label>
                    <label className="form-field">
                      <span>Rol inicial</span>
                      <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                        {ROLES_SISTEMA.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="submit" className="btn-primary-green">Crear usuario</button>
                    </div>
                  </form>
                  <div className="toolbar">
                    <button type="button" onClick={() => void loadUsers()}>Actualizar lista</button>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Cambiar rol</th><th>Acción</th></tr></thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                            <td>{u.fullName}</td>
                            <td>{u.email}</td>
                            <td>{u.roles.join(', ')}</td>
                            <td>{u.isActive ? <span style={{ color: '#27ae60', fontWeight: 600 }}>Activo</span> : 'Inactivo'}</td>
                            <td>
                              <select
                                value={u.roles[0] ?? 'Consulta'}
                                onChange={(e) => void changeRole(u.id, e.target.value)}
                                disabled={!u.isActive}
                              >
                                {ROLES_SISTEMA.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                            <td>
                              {u.isActive && (
                                <button type="button" className="btn-danger" onClick={() => void deactivateUser(u.id)}>
                                  Desactivar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr><td colSpan={6} className="muted empty-state-cell">No hay usuarios cargados.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'Administración' && subVistaSeguridad === 'permisos' && (
            <section className="card">
              <h2>Administrar permisos</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Matriz de políticas del portal. Cada rol hereda capacidades; para cambiar quién tiene qué rol, usa <strong>Gestionar usuarios</strong>.
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Capacidad</th>
                      <th>Política interna</th>
                      {ROLES_SISTEMA.map((r) => <th key={r}>{r}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIZ_PERMISOS.map((fila) => (
                      <tr key={fila.politica}>
                        <td>{fila.capacidad}</td>
                        <td><code>{fila.politica}</code></td>
                        {ROLES_SISTEMA.map((r) => (
                          <td key={r} style={{ textAlign: 'center' }}>
                            {fila.roles.includes(r) ? '✓' : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ marginTop: 12, fontSize: '0.88rem' }}>
                Los permisos se aplican en el servidor; no se pueden editar desde esta pantalla sin desplegar una nueva versión.
              </p>
            </section>
          )}

          {activeTab === 'Administración' && subVistaSeguridad === 'roles' && (
            <section className="card">
              <h2>Gestionar roles</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Roles predefinidos del sistema y usuarios asignados. Para cambiar el rol de alguien, ve a <strong>Gestionar usuarios</strong>.
              </p>
              {!esAdministrador ? (
                <div className="stats-empty-box">
                  Solo el <strong>Administrador</strong> puede ver el detalle de asignación por rol.
                </div>
              ) : (
                <>
                  <div className="seguridad-roles-grid">
                    {ROLES_SISTEMA.map((rol) => (
                      <div key={rol} className="seguridad-rol-card">
                        <h3 style={{ margin: '0 0 6px' }}>{rol}</h3>
                        <p className="muted" style={{ fontSize: '0.88rem', margin: '0 0 10px' }}>{DESCRIPCION_ROLES[rol]}</p>
                        <span className="profile-badge">
                          {usuariosPorRol.find((x) => x.rol === rol)?.usuarios.length ?? 0} usuario(s) activo(s)
                        </span>
                        <ul className="seguridad-rol-usuarios">
                          {(usuariosPorRol.find((x) => x.rol === rol)?.usuarios ?? []).slice(0, 5).map((u) => (
                            <li key={u.id}>{u.fullName} <span className="muted">({u.email})</span></li>
                          ))}
                          {(usuariosPorRol.find((x) => x.rol === rol)?.usuarios.length ?? 0) === 0 && (
                            <li className="muted">Sin usuarios activos con este rol</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="toolbar">
                    <button type="button" onClick={() => void loadUsers()}>Actualizar asignaciones</button>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'Administración' && subVistaSeguridad === 'bitacoras' && (
            <section className="card">
              <h2>Gestionar bitácoras</h2>
              <p className="muted" style={{ marginTop: -6 }}>
                Registro de auditoría: quién hizo qué y cuándo (jugadores, negociaciones, usuarios, etc.).
              </p>
              {!esAdministrador ? (
                <div className="stats-empty-box">
                  Solo el <strong>Administrador</strong> puede consultar la bitácora de auditoría.
                </div>
              ) : (
                <>
                  <div className="grid">
                    <input value={auditEntity} onChange={(e) => setAuditEntity(e.target.value)} placeholder="Entidad (ej. Jugador)" />
                    <input value={auditAction} onChange={(e) => setAuditAction(e.target.value)} placeholder="Acción (ej. Crear)" />
                    <input value={auditUser} onChange={(e) => setAuditUser(e.target.value)} placeholder="Usuario (email)" />
                    <input type="date" value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} />
                    <input type="date" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} />
                    <button type="button" onClick={() => void loadAudit(1)} disabled={loading}>Buscar</button>
                  </div>
                  <div className="toolbar">
                    <span className="muted">Pág. {auditPage}/{totalAuditPages} · {auditTotal} registros</span>
                    <button type="button" disabled={auditPage <= 1 || loading} onClick={() => void loadAudit(Math.max(1, auditPage - 1))}>‹ Ant.</button>
                    <button type="button" disabled={auditPage >= totalAuditPages || loading} onClick={() => void loadAudit(auditPage + 1)}>Sig. ›</button>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Fecha</th><th>Entidad</th><th>Acción</th><th>Usuario</th><th>Resumen</th></tr></thead>
                      <tbody>
                        {auditLogs.map((a) => (
                          <tr key={a.id}>
                            <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{new Date(a.actionAtUtc).toLocaleString('es-CO')}</td>
                            <td>{a.entityName}</td>
                            <td>{a.action}</td>
                            <td style={{ fontSize: '0.85rem' }}>{a.createdBy ?? '—'}</td>
                            <td style={{ fontSize: '0.85rem' }}>{a.changesSummary}</td>
                          </tr>
                        ))}
                        {auditLogs.length === 0 && (
                          <tr><td colSpan={5} className="muted empty-state-cell">Aplica filtros y pulsa Buscar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
            </div>
          </div>

          {vistaPreviaContrato && (
            <div
              className="contrato-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contrato-preview-title"
              onClick={cerrarVistaPreviaContrato}
            >
              <div className="contrato-preview-panel" onClick={(e) => e.stopPropagation()}>
                <div className="contrato-preview-header">
                  <h3 id="contrato-preview-title" style={{ margin: 0 }}>{vistaPreviaContrato.titulo}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => blobDownload(vistaPreviaContrato.blob, vistaPreviaContrato.filename, vistaPreviaContrato.mimeType)}
                    >
                      {vistaPreviaContrato.mimeType.startsWith('image/') ? 'Descargar imagen' : 'Descargar PDF'}
                    </button>
                    <button type="button" onClick={cerrarVistaPreviaContrato}>Cerrar</button>
                  </div>
                </div>
                {vistaPreviaContrato.mimeType.startsWith('image/') ? (
                  <img
                    src={vistaPreviaContrato.url}
                    alt={vistaPreviaContrato.titulo}
                    className="contrato-preview-imagen"
                  />
                ) : (
                  <iframe
                    title={vistaPreviaContrato.titulo}
                    src={vistaPreviaContrato.url}
                    className="contrato-preview-frame"
                  />
                )}
              </div>
            </div>
          )}
        </div>
          )
        } />

        {/* Cualquier ruta desconocida → portal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </main>
  );
}

export default App;
