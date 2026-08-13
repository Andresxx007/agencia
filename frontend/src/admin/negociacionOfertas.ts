export type OfertaNegociacionForm = {
  clubName: string;
  monthlyAmount: string;
  installmentsPerYear: string;
  contractYears: string;
  currency: string;
  hasHousingBonus: boolean;
  housingBonusNotes: string;
  hasObjectiveBonus: boolean;
  objectiveBonusNotes: string;
  hasGoalBonus: boolean;
  goalBonusNotes: string;
  hasSigningBonus: boolean;
  signingBonusNotes: string;
};

export type OfertaNegociacionDetalle = {
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
};

export const ofertaNegociacionVacia = (): OfertaNegociacionForm => ({
  clubName: '',
  monthlyAmount: '',
  installmentsPerYear: '12',
  contractYears: '1',
  currency: 'USD',
  hasHousingBonus: false,
  housingBonusNotes: '',
  hasObjectiveBonus: false,
  objectiveBonusNotes: '',
  hasGoalBonus: false,
  goalBonusNotes: '',
  hasSigningBonus: false,
  signingBonusNotes: '',
});

export const ofertaDesdeNegociacion = (n: OfertaNegociacionDetalle): OfertaNegociacionForm => ({
  clubName: n.clubName,
  monthlyAmount: String(n.monthlyAmount || n.offeredAmount || ''),
  installmentsPerYear: String(n.installmentsPerYear || 12),
  contractYears: String(n.contractYears || 1),
  currency: n.currency || 'USD',
  hasHousingBonus: n.hasHousingBonus,
  housingBonusNotes: n.housingBonusNotes ?? '',
  hasObjectiveBonus: n.hasObjectiveBonus,
  objectiveBonusNotes: n.objectiveBonusNotes ?? '',
  hasGoalBonus: n.hasGoalBonus,
  goalBonusNotes: n.goalBonusNotes ?? '',
  hasSigningBonus: n.hasSigningBonus,
  signingBonusNotes: n.signingBonusNotes ?? '',
});

export const payloadOfertaApi = (form: OfertaNegociacionForm) => ({
  clubName: form.clubName.trim(),
  monthlyAmount: Number(form.monthlyAmount),
  installmentsPerYear: Number(form.installmentsPerYear),
  contractYears: Number(form.contractYears),
  currency: form.currency.trim() || 'USD',
  hasHousingBonus: form.hasHousingBonus,
  housingBonusNotes: form.hasHousingBonus ? form.housingBonusNotes.trim() : null,
  hasObjectiveBonus: form.hasObjectiveBonus,
  objectiveBonusNotes: form.hasObjectiveBonus ? form.objectiveBonusNotes.trim() : null,
  hasGoalBonus: form.hasGoalBonus,
  goalBonusNotes: form.hasGoalBonus ? form.goalBonusNotes.trim() : null,
  hasSigningBonus: form.hasSigningBonus,
  signingBonusNotes: form.hasSigningBonus ? form.signingBonusNotes.trim() : null,
});

export const valorTotalContrato = (
  monthly: number,
  cuotasAnio: number,
  anos: number,
) => monthly * cuotasAnio * anos;

export const etiquetaBonosOferta = (n: Pick<
  OfertaNegociacionDetalle,
  'hasHousingBonus' | 'hasObjectiveBonus' | 'hasGoalBonus' | 'hasSigningBonus'
>) => {
  const partes: string[] = [];
  if (n.hasHousingBonus) partes.push('Vivienda');
  if (n.hasObjectiveBonus) partes.push('Objetivos');
  if (n.hasGoalBonus) partes.push('Goles');
  if (n.hasSigningBonus) partes.push('Prima');
  return partes.length ? partes.join(', ') : 'Sin bonos';
};

export const resumenContratoOferta = (n: OfertaNegociacionDetalle) => {
  const mensual = n.monthlyAmount || n.offeredAmount;
  const cuotas = n.installmentsPerYear || 12;
  const anos = n.contractYears || 1;
  const total = valorTotalContrato(mensual, cuotas, anos);
  return `${mensual.toLocaleString('es')} ${n.currency}/mes · ${cuotas} cuotas/año · ${anos} año(s) · ~${total.toLocaleString('es')} ${n.currency} total`;
};

export type ItemCondicionOferta = {
  titulo: string;
  valor: string;
  detalle?: string;
  icono?: string;
  tipo?: 'si' | 'no' | 'info';
};

export type BloquesCondicionesOferta = {
  remuneracion: ItemCondicionOferta[];
  bonos: ItemCondicionOferta[];
};

const textoDuracion = (anos: number) => (anos === 1 ? '1 año' : `${anos} años`);

const itemBono = (
  titulo: string,
  incluido: boolean,
  detalle: string | null | undefined,
  iconoSi: string,
): ItemCondicionOferta => ({
  titulo,
  valor: incluido ? 'Sí, incluido' : 'No incluido',
  detalle: incluido && detalle?.trim() ? detalle.trim() : undefined,
  icono: incluido ? iconoSi : 'ri-close-circle-line',
  tipo: incluido ? 'si' : 'no',
});

export const bloquesCondicionesOferta = (n: OfertaNegociacionDetalle): BloquesCondicionesOferta => {
  const mensual = n.monthlyAmount || n.offeredAmount;
  const cuotas = n.installmentsPerYear || 12;
  const anos = n.contractYears || 1;
  const total = valorTotalContrato(mensual, cuotas, anos);

  return {
    remuneracion: [
      {
        titulo: 'Sueldo mensual',
        valor: `${mensual.toLocaleString('es')} ${n.currency}`,
        icono: 'ri-money-dollar-circle-line',
        tipo: 'info',
      },
      {
        titulo: 'Pagos al año',
        valor: `${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'}`,
        icono: 'ri-calendar-check-line',
        tipo: 'info',
      },
      {
        titulo: 'Duración del contrato',
        valor: textoDuracion(anos),
        icono: 'ri-time-line',
        tipo: 'info',
      },
      {
        titulo: 'Valor total estimado',
        valor: `${total.toLocaleString('es')} ${n.currency}`,
        icono: 'ri-funds-line',
        tipo: 'info',
      },
    ],
    bonos: [
      itemBono('Bono de vivienda', n.hasHousingBonus, n.housingBonusNotes, 'ri-home-smile-line'),
      itemBono('Bonos por objetivos', n.hasObjectiveBonus, n.objectiveBonusNotes, 'ri-trophy-line'),
      itemBono('Bonos por gol', n.hasGoalBonus, n.goalBonusNotes, 'ri-football-line'),
      itemBono('Prima / bono de firma', n.hasSigningBonus, n.signingBonusNotes, 'ri-hand-coin-line'),
    ],
  };
};

export const normalizarOfertaDetalle = (n: OfertaNegociacionDetalle): OfertaNegociacionDetalle => ({
  ...n,
  monthlyAmount: n.monthlyAmount ?? n.offeredAmount ?? 0,
  installmentsPerYear: n.installmentsPerYear > 0 ? n.installmentsPerYear : 12,
  contractYears: n.contractYears > 0 ? n.contractYears : 1,
  hasHousingBonus: n.hasHousingBonus ?? false,
  hasObjectiveBonus: n.hasObjectiveBonus ?? false,
  hasGoalBonus: n.hasGoalBonus ?? false,
  hasSigningBonus: n.hasSigningBonus ?? false,
});
