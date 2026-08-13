import { Link } from 'react-router-dom';

const SERVICIOS = [
  {
    icon: '🤝',
    titulo: 'Representación legal',
    desc: 'Negociamos contratos en nombre del jugador con transparencia y compromiso total.',
  },
  {
    icon: '🌍',
    titulo: 'Expansión internacional',
    desc: 'Red de contactos en ligas de Europa, América y Asia para abrir mercados globales.',
  },
  {
    icon: '📊',
    titulo: 'Análisis de mercado',
    desc: 'Valoramos a cada jugador con datos reales y encontramos la mejor oferta del momento.',
  },
  {
    icon: '🏆',
    titulo: 'Gestión de imagen',
    desc: 'Construimos la marca personal del deportista para maximizar su proyección y sponsors.',
  },
  {
    icon: '📋',
    titulo: 'Contratos y documentación',
    desc: 'Redacción, revisión y gestión de toda la documentación contractual de forma segura.',
  },
  {
    icon: '💬',
    titulo: 'Asesoría continua',
    desc: 'Acompañamiento permanente al jugador y su familia a lo largo de toda su carrera.',
  },
];

const NUMEROS = [
  { valor: '12+', etiq: 'Años de experiencia' },
  { valor: '200+', etiq: 'Jugadores representados' },
  { valor: '35+', etiq: 'Ligas internacionales' },
  { valor: '98%', etiq: 'Satisfacción de clientes' },
];

export default function PaginaInicio() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-shape" />
        <div className="hero-content">
          <div className="hero-eyebrow">Representación deportiva de élite</div>
          <h1 className="hero-titulo">
            Impulsamos<br />
            <span className="hero-titulo-acento">carreras</span><br />
            al siguiente nivel
          </h1>
          <p className="hero-subtitulo">
            Somos el puente entre el talento y las mejores oportunidades del fútbol mundial.
            Confianza, estrategia y resultados.
          </p>
          <div className="hero-actions">
            <Link to="/jugadores" className="btn-hero-primario">Ver nuestros jugadores</Link>
            <Link to="/contacto" className="btn-hero-secundario">Contáctenos</Link>
          </div>
        </div>
        <div className="hero-imagen-wrap">
          <div className="hero-img-deco" />
          <div className="hero-img-card">
            <div className="hero-img-card-icon">⚽</div>
            <div className="hero-img-card-text">
              <strong>Fortis Glesnor</strong>
              <span>Tu carrera, nuestra misión</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NÚMEROS ── */}
      <section className="numeros">
        <div className="numeros-inner">
          {NUMEROS.map((n) => (
            <div key={n.etiq} className="numero-item">
              <div className="numero-valor">{n.valor}</div>
              <div className="numero-etiq">{n.etiq}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className="seccion servicios-seccion" id="servicios">
        <div className="seccion-inner">
          <div className="seccion-encabezado">
            <div className="seccion-eyebrow">Lo que ofrecemos</div>
            <h2 className="seccion-titulo">Servicios <span className="acento">integrales</span> para el deportista</h2>
            <p className="seccion-subtitulo">
              Cada jugador merece representación profesional que proteja su carrera y maximice su potencial.
            </p>
          </div>
          <div className="servicios-grid">
            {SERVICIOS.map((s) => (
              <div key={s.titulo} className="servicio-card">
                <div className="servicio-icono">{s.icon}</div>
                <h3 className="servicio-titulo">{s.titulo}</h3>
                <p className="servicio-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JUGADORES DESTAQUE ── */}
      <section className="seccion catalogo-preview-seccion">
        <div className="seccion-inner">
          <div className="seccion-encabezado">
            <div className="seccion-eyebrow">Nuestro talento</div>
            <h2 className="seccion-titulo">Jugadores <span className="acento">disponibles</span></h2>
            <p className="seccion-subtitulo">
              Explora nuestra cartera de jugadores profesionales listos para dar el siguiente paso en su carrera.
            </p>
          </div>
          <div className="catalogo-preview-cta">
            <Link to="/jugadores" className="btn-primario">
              Ver catálogo completo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOBRE NOSOTROS ── */}
      <section className="seccion nosotros-seccion" id="nosotros">
        <div className="seccion-inner nosotros-inner">
          <div className="nosotros-imagen">
            <div className="nosotros-img-deco" />
            <div className="nosotros-stat-card">
              <span className="nosotros-stat-num">2012</span>
              <span className="nosotros-stat-etiq">Fundada</span>
            </div>
          </div>
          <div className="nosotros-texto">
            <div className="seccion-eyebrow">Sobre nosotros</div>
            <h2 className="seccion-titulo">La agencia que <span className="acento">confía</span> en tu talento</h2>
            <p>
              Fortis Glesnor Group nació con una misión clara: ser la agencia de representación deportiva más transparente y eficaz de Latinoamérica.
              Más de una década acompañando jugadores desde sus primeros pasos profesionales hasta las grandes ligas internacionales.
            </p>
            <p>
              Contamos con un equipo multidisciplinario de abogados, analistas y expertos en marketing deportivo dedicados a construir el futuro de cada atleta.
            </p>
            <Link to="/contacto" className="btn-primario" style={{ display: 'inline-block', marginTop: '20px' }}>
              Conócenos mejor
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-final">
        <div className="cta-final-inner">
          <h2>¿Listo para dar el salto?</h2>
          <p>Hablemos sobre cómo podemos llevar tu carrera al siguiente nivel juntos.</p>
          <Link to="/contacto" className="btn-hero-primario">Iniciar conversación</Link>
        </div>
      </section>
    </>
  );
}
