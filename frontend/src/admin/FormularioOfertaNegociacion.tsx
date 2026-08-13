import { useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  type OfertaNegociacionForm,
  valorTotalContrato,
} from './negociacionOfertas';
import './negociacion-ofertas.css';

type Props = {
  form: OfertaNegociacionForm;
  onChange: (form: OfertaNegociacionForm) => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  compacto?: boolean;
};

export default function FormularioOfertaNegociacion({
  form,
  onChange,
  onSubmit,
  submitLabel,
  loading = false,
  disabled = false,
  compacto = false,
}: Props) {
  const patch = (partial: Partial<OfertaNegociacionForm>) => onChange({ ...form, ...partial });

  const totalEstimado = useMemo(() => {
    const mensual = Number(form.monthlyAmount);
    const cuotas = Number(form.installmentsPerYear);
    const anos = Number(form.contractYears);
    if (!Number.isFinite(mensual) || mensual <= 0) return null;
    if (!Number.isFinite(cuotas) || cuotas <= 0) return null;
    if (!Number.isFinite(anos) || anos <= 0) return null;
    return valorTotalContrato(mensual, cuotas, anos);
  }, [form.monthlyAmount, form.installmentsPerYear, form.contractYears]);

  return (
    <form onSubmit={onSubmit} className={`oferta-form${compacto ? ' oferta-form--compacto' : ''}`}>
      <div className="oferta-form-seccion">
        <h4>Club y remuneración base</h4>
        <div className="oferta-form-grid">
          <label className="oferta-form-field oferta-form-field--wide">
            <span>Club ofertante</span>
            <input
              value={form.clubName}
              onChange={(e) => patch({ clubName: e.target.value })}
              placeholder="Ej. Club Deportivo Oriente"
              required
              disabled={disabled}
            />
          </label>
          <label className="oferta-form-field">
            <span>Monto mensual</span>
            <input
              type="number"
              min={1}
              step="any"
              value={form.monthlyAmount}
              onChange={(e) => patch({ monthlyAmount: e.target.value })}
              placeholder="Ej. 8500"
              required
              disabled={disabled}
            />
          </label>
          <label className="oferta-form-field">
            <span>Moneda</span>
            <select
              value={form.currency}
              onChange={(e) => patch({ currency: e.target.value })}
              disabled={disabled}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BOB">BOB</option>
            </select>
          </label>
          <label className="oferta-form-field">
            <span>Cuotas por año</span>
            <input
              type="number"
              min={1}
              max={24}
              value={form.installmentsPerYear}
              onChange={(e) => patch({ installmentsPerYear: e.target.value })}
              required
              disabled={disabled}
            />
          </label>
          <label className="oferta-form-field">
            <span>Años de contrato</span>
            <input
              type="number"
              min={1}
              max={15}
              value={form.contractYears}
              onChange={(e) => patch({ contractYears: e.target.value })}
              required
              disabled={disabled}
            />
          </label>
        </div>
        {totalEstimado != null && (
          <p className="oferta-form-total">
            Valor total estimado del contrato: {totalEstimado.toLocaleString('es')} {form.currency}
          </p>
        )}
      </div>

      <div className="oferta-form-seccion">
        <h4>Bono de vivienda</h4>
        <div className="oferta-form-toggle">
          <label>
            <input
              type="radio"
              name="housingBonus"
              checked={!form.hasHousingBonus}
              onChange={() => patch({ hasHousingBonus: false, housingBonusNotes: '' })}
              disabled={disabled}
            />
            No incluye bono de vivienda
          </label>
          <label>
            <input
              type="radio"
              name="housingBonus"
              checked={form.hasHousingBonus}
              onChange={() => patch({ hasHousingBonus: true })}
              disabled={disabled}
            />
            Sí incluye bono de vivienda
          </label>
        </div>
        {form.hasHousingBonus && (
          <label className="oferta-form-field oferta-form-field--wide">
            <span>Detalle del bono de vivienda</span>
            <textarea
              rows={2}
              value={form.housingBonusNotes}
              onChange={(e) => patch({ housingBonusNotes: e.target.value })}
              placeholder="Ej. Departamento amoblado cerca del estadio"
              disabled={disabled}
            />
          </label>
        )}
      </div>

      <div className="oferta-form-seccion">
        <h4>Otros bonos</h4>
        <div className="oferta-form-grid">
          <div className="oferta-form-field--wide">
            <label className="oferta-form-toggle">
              <input
                type="checkbox"
                checked={form.hasObjectiveBonus}
                onChange={(e) => patch({
                  hasObjectiveBonus: e.target.checked,
                  objectiveBonusNotes: e.target.checked ? form.objectiveBonusNotes : '',
                })}
                disabled={disabled}
              />
              Bonos por objetivos
            </label>
            {form.hasObjectiveBonus && (
              <textarea
                rows={2}
                value={form.objectiveBonusNotes}
                onChange={(e) => patch({ objectiveBonusNotes: e.target.value })}
                placeholder="Ej. Clasificación a fase final, titularidad mínima 20 partidos"
                disabled={disabled}
              />
            )}
          </div>
          <div className="oferta-form-field--wide">
            <label className="oferta-form-toggle">
              <input
                type="checkbox"
                checked={form.hasGoalBonus}
                onChange={(e) => patch({
                  hasGoalBonus: e.target.checked,
                  goalBonusNotes: e.target.checked ? form.goalBonusNotes : '',
                })}
                disabled={disabled}
              />
              Bonos por gol
            </label>
            {form.hasGoalBonus && (
              <textarea
                rows={2}
                value={form.goalBonusNotes}
                onChange={(e) => patch({ goalBonusNotes: e.target.value })}
                placeholder="Ej. 500 USD por gol en liga"
                disabled={disabled}
              />
            )}
          </div>
          <div className="oferta-form-field--wide">
            <label className="oferta-form-toggle">
              <input
                type="checkbox"
                checked={form.hasSigningBonus}
                onChange={(e) => patch({
                  hasSigningBonus: e.target.checked,
                  signingBonusNotes: e.target.checked ? form.signingBonusNotes : '',
                })}
                disabled={disabled}
              />
              Prima / bono de firma
            </label>
            {form.hasSigningBonus && (
              <textarea
                rows={2}
                value={form.signingBonusNotes}
                onChange={(e) => patch({ signingBonusNotes: e.target.value })}
                placeholder="Ej. 50.000 USD al firmar"
                disabled={disabled}
              />
            )}
          </div>
        </div>
      </div>

      <div className="oferta-form-actions">
        <button type="submit" disabled={loading || disabled}>{submitLabel}</button>
      </div>
    </form>
  );
}
