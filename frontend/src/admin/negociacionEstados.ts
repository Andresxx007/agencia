/** Estados oficiales del flujo de negociación (4 etapas). */
export type EstadoNegociacionCodigo =
  | 'EnAnalisis'
  | 'NegociandoOferta'
  | 'NegociandoContraOferta'
  | 'NegociacionCompletada';

export type EstadoNegociacionMeta = {
  codigo: EstadoNegociacionCodigo;
  etiqueta: string;
  descripcion: string;
  icono: string;
  orden: number;
};

export const ESTADOS_NEGOCIACION: EstadoNegociacionMeta[] = [
  {
    codigo: 'EnAnalisis',
    etiqueta: 'En análisis',
    descripcion: 'Oferta recibida; se evalúan condiciones y viabilidad.',
    icono: 'ri-search-eye-line',
    orden: 1,
  },
  {
    codigo: 'NegociandoOferta',
    etiqueta: 'Negociando oferta',
    descripcion: 'Se negocia activamente la oferta con el club interesado.',
    icono: 'ri-handshake-line',
    orden: 2,
  },
  {
    codigo: 'NegociandoContraOferta',
    etiqueta: 'Negociando contra oferta',
    descripcion: 'El club respondió; se trabaja una contraoferta.',
    icono: 'ri-exchange-line',
    orden: 3,
  },
  {
    codigo: 'NegociacionCompletada',
    etiqueta: 'Negociación completada',
    descripcion: 'Proceso cerrado con acuerdo o decisión final.',
    icono: 'ri-checkbox-circle-line',
    orden: 4,
  },
];

/** Códigos antiguos guardados en BD antes del cambio de nombres. */
const MAPEO_ESTADO_LEGADO: Record<string, EstadoNegociacionCodigo> = {
  ennegociacion: 'NegociandoOferta',
  pendientefirma: 'NegociandoContraOferta',
  completada: 'NegociacionCompletada',
};

export function normalizarCodigoEstado(codigo: string): EstadoNegociacionCodigo {
  const key = codigo.trim().toLowerCase();
  const directo = ESTADOS_NEGOCIACION.find((e) => e.codigo.toLowerCase() === key);
  if (directo) return directo.codigo;
  if (MAPEO_ESTADO_LEGADO[key]) return MAPEO_ESTADO_LEGADO[key];
  return 'EnAnalisis';
}

export function metaEstadoNegociacion(codigo: string): EstadoNegociacionMeta {
  return ESTADOS_NEGOCIACION.find((e) => e.codigo === normalizarCodigoEstado(codigo))!;
}

export function etiquetaEstadoNegociacion(codigo: string): string {
  return metaEstadoNegociacion(codigo).etiqueta;
}
