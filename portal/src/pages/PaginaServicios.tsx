import { Link } from 'react-router-dom';

const SERVICIOS = [
  {
    num: '01', icon: '🤝', titulo: 'Representación y negociación',
    desc: 'Gestionamos cada negociación con los clubes de manera profesional y transparente, asegurándonos de que el jugador reciba las mejores condiciones contractuales.',
    puntos: ['Contratos de fichaje y renovación', 'Cláusulas de rescisión y bonificaciones', 'Negociación salarial y de imagen'],
  },
  {
    num: '02', icon: '🌍', titulo: 'Expansión internacional',
    desc: 'Tenemos presencia activa en más de 35 ligas internacionales. Conectamos a nuestros jugadores con oportunidades en Europa, América, Asia y Oriente Medio.',
    puntos: ['Red de scouting en 5 continentes', 'Visa y documentación migratoria', 'Adaptación cultural y logística'],
  },
  {
    num: '03', icon: '📊', titulo: 'Análisis y valoración de mercado',
    desc: 'Utilizamos datos actuales del mercado para valuar correctamente a cada jugador y negociar desde una posición de fortaleza.',
    puntos: ['Informe de valor de mercado', 'Comparativa con jugadores similares', 'Histórico de transferencias por posición'],
  },
  {
    num: '04', icon: '🏆', titulo: 'Gestión de imagen y patrocinios',
    desc: 'Construimos la marca personal del deportista y buscamos alianzas con marcas que se alineen a sus valores y proyección.',
    puntos: ['Identidad y marca personal', 'Acuerdos con patrocinadores', 'Presencia en medios y redes sociales'],
  },
  {
    num: '05', icon: '📋', titulo: 'Documentación y asesoría legal',
    desc: 'Nuestro equipo legal revisa cada contrato, cláusula y documentación para proteger los intereses del jugador en todo momento.',
    puntos: ['Revisión y redacción de contratos', 'Asesoría fiscal y financiera', 'Gestión de derechos de imagen'],
  },
  {
    num: '06', icon: '💬', titulo: 'Acompañamiento continuo',
    desc: 'No somos solo agentes, somos aliados de por vida. Acompañamos al jugador y su familia en cada etapa de su carrera.',
    puntos: ['Psicología deportiva y bienestar', 'Planificación de carrera a largo plazo', 'Apoyo en retiro y reconversión'],
  },
];

export default function PaginaServicios() {
  return (
    <div className="servicios-pagina">
      <div className="catalogo-header">
        <div className="catalogo-header-inner">
          <div className="seccion-eyebrow">Lo que hacemos</div>
          <h1 className="catalogo-titulo">Nuestros <span className="acento">servicios</span></h1>
          <p className="catalogo-subtitulo">
            Ofrecemos una gestión integral de la carrera deportiva con enfoque en el largo plazo y la integridad profesional.
          </p>
        </div>
      </div>

      <div className="servicios-pagina-lista">
        {SERVICIOS.map((s) => (
          <div key={s.num} className="servicio-detalle">
            <div className="servicio-detalle-num">{s.num}</div>
            <div className="servicio-detalle-contenido">
              <div className="servicio-detalle-icono">{s.icon}</div>
              <h2>{s.titulo}</h2>
              <p>{s.desc}</p>
              <ul>
                {s.puntos.map((p) => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <section className="cta-final">
        <div className="cta-final-inner">
          <h2>¿Listo para trabajar con nosotros?</h2>
          <p>Contáctanos hoy y cuéntanos tu historia. Estamos aquí para escucharte.</p>
          <Link to="/contacto" className="btn-hero-primario">Hablemos</Link>
        </div>
      </section>
    </div>
  );
}
