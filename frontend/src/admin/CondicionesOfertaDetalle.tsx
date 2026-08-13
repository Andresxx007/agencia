import {
  bloquesCondicionesOferta,
  type OfertaNegociacionDetalle,
} from './negociacionOfertas';
import './negociacion-estado.css';

type Props = {
  oferta: OfertaNegociacionDetalle;
  compacto?: boolean;
  ocultarTitulo?: boolean;
};

export default function CondicionesOfertaDetalle({
  oferta,
  compacto = false,
  ocultarTitulo = false,
}: Props) {
  const bloques = bloquesCondicionesOferta(oferta);
  const clase = compacto
    ? 'neg-estado-condiciones neg-estado-condiciones--compacto'
    : 'neg-estado-condiciones';

  const seccionRemuneracion = (
    <div className="neg-estado-condiciones-seccion">
      <p className="neg-estado-condiciones-seccion-label">Remuneración y plazo</p>
      <ul className="neg-estado-condiciones-lista">
        {bloques.remuneracion.map((item) => (
          <li key={item.titulo} className="neg-estado-condicion-fila">
            {item.icono && <i className={item.icono} aria-hidden />}
            <div className="neg-estado-condicion-texto">
              <span className="neg-estado-condicion-label">{item.titulo}</span>
              <span className="neg-estado-condicion-valor">{item.valor}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const seccionBonos = (
    <div className="neg-estado-condiciones-seccion">
      <p className="neg-estado-condiciones-seccion-label">Bonos y beneficios</p>
      <ul className="neg-estado-condiciones-lista">
        {bloques.bonos.map((item) => (
          <li
            key={item.titulo}
            className={`neg-estado-condicion-fila neg-estado-condicion-fila--${item.tipo ?? 'info'}`}
          >
            {item.icono && <i className={item.icono} aria-hidden />}
            <div className="neg-estado-condicion-texto">
              <span className="neg-estado-condicion-label">{item.titulo}</span>
              <span className="neg-estado-condicion-valor">{item.valor}</span>
              {item.detalle && (
                <p className="neg-estado-condicion-detalle">{item.detalle}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      className={clase}
      aria-labelledby={ocultarTitulo ? undefined : 'condiciones-oferta-titulo'}
    >
      {!ocultarTitulo && (
        <h4 id="condiciones-oferta-titulo" className="neg-estado-condiciones-titulo">
          Condiciones de la oferta
        </h4>
      )}

      {compacto ? (
        <div className="neg-estado-condiciones-grid">
          {seccionRemuneracion}
          {seccionBonos}
        </div>
      ) : (
        <>
          {seccionRemuneracion}
          {seccionBonos}
        </>
      )}
    </section>
  );
}
