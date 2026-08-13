import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { JugadorPublico } from './TarjetaJugadorPortal';
import TarjetaJugadorPortal from './TarjetaJugadorPortal';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

const NOTICIAS = [
  {
    cat: 'Transferencias', fecha: '3 Mayo 2026',
    titulo: 'Transferencia Récord: Joven Promesa al Manchester City',
    desc: 'Nuestra representada cerró un contrato histórico con uno de los clubes más importantes de Europa.',
  },
  {
    cat: 'Empresa', fecha: '28 Abril 2026',
    titulo: 'Expansión a Asia: Nueva Oficina en Tokio',
    desc: 'Fortis Glesnor Group abre su primera oficina en Asia para fortalecer lazos con el mercado asiático.',
  },
  {
    cat: 'Noticias', fecha: '15 Abril 2026',
    titulo: 'Tres Jugadores Convocados a Selecciones Nacionales',
    desc: 'Representados de Fortis Glesnor fueron llamados para los próximos partidos clasificatorios.',
  },
];

const SERVICIOS = [
  { icon: '⚽', titulo: 'Gestión de Carrera', desc: 'Planificación estratégica y desarrollo profesional personalizado para cada jugador.', puntos: ['Asesoría profesional', 'Planificación de carrera', 'Análisis de mercado'] },
  { icon: '📝', titulo: 'Negociación de Contratos', desc: 'Representación experta en negociaciones con clubes nacionales e internacionales.', puntos: ['Optimización salarial', 'Cláusulas protectoras', 'Bonos por rendimiento'] },
  { icon: '⚖️', titulo: 'Asesoría Legal', desc: 'Protección jurídica integral en todos los aspectos de la carrera deportiva.', puntos: ['Contratos deportivos', 'Derechos de imagen', 'Disputas legales'] },
  { icon: '💰', titulo: 'Gestión Financiera', desc: 'Administración inteligente del patrimonio y planificación fiscal especializada.', puntos: ['Inversiones', 'Planificación fiscal', 'Protección patrimonial'] },
  { icon: '📣', titulo: 'Marketing Personal', desc: 'Desarrollo de marca personal y gestión de patrocinios deportivos.', puntos: ['Branding personal', 'Redes sociales', 'Patrocinios'] },
  { icon: '🎓', titulo: 'Formación Continua', desc: 'Preparación académica y profesional para la vida después del fútbol.', puntos: ['Educación', 'Certificaciones', 'Segunda carrera'] },
];

const SOBRE_FEATURES = [
  { icon: '🌍', titulo: 'Red Global', desc: 'Conexiones con clubes de élite en Europa, América, Asia y África' },
  { icon: '🏆', titulo: 'Experiencia Comprobada', desc: 'Más de 15 años gestionando carreras de futbolistas profesionales' },
  { icon: '🤝', titulo: 'Desarrollo Integral', desc: 'Acompañamiento completo en la carrera deportiva y personal del jugador' },
  { icon: '👥', titulo: 'Equipo Experto', desc: 'Agentes FIFA certificados y asesores legales especializados' },
];

const SCOUTING_FEATURES = [
  { icon: '🔍', titulo: 'Búsqueda Global', desc: 'Presencia en más de 30 países buscando talento emergente' },
  { icon: '📊', titulo: 'Análisis de Datos', desc: 'Evaluación estadística profunda de rendimiento y potencial' },
  { icon: '👁️', titulo: 'Seguimiento Continuo', desc: 'Monitoreo constante de jugadores en desarrollo' },
  { icon: '📋', titulo: 'Evaluación Integral', desc: 'Análisis técnico, táctico, físico y psicológico' },
];

const ZONAS = [
  { label: 'Sudamérica', pct: 45 },
  { label: 'Europa', pct: 30 },
  { label: 'África', pct: 15 },
  { label: 'Asia', pct: 10 },
];

const POSICIONES_FILTRO = ['Todos', 'Delantero', 'Mediocampista', 'Defensa', 'Portero'];

export default function PaginaInicio() {
  const [jugadores, setJugadores] = useState<JugadorPublico[]>([]);
  const [filtroPos, setFiltroPos] = useState('Todos');
  const [cargandoJ, setCargandoJ] = useState(true);

  useEffect(() => {
    api.get('/publico/jugadores', { params: { tamanio: 8 } })
      .then(r => setJugadores(r.data.items ?? []))
      .catch(() => {})
      .finally(() => setCargandoJ(false));
  }, []);

  const jugadoresFiltrados = filtroPos === 'Todos'
    ? jugadores
    : jugadores.filter(j => j.posicion === filtroPos);

  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="fhero">
        <div className="fhero-overlay" />
        <div className="fhero-inner">
          <p className="fhero-eyebrow">Representación Deportiva de Élite</p>
          <h1 className="fhero-titulo">
            Fortis Glesnor<br /><span className="fhero-acento">Group</span>
          </h1>
          <p className="fhero-sub">
            Conectamos talento excepcional con oportunidades globales en el fútbol profesional
          </p>
          <div className="fhero-actions">
            <Link to="/jugadores" className="f-btn-prim">Ver Jugadores</Link>
            <Link to="/contacto" className="f-btn-out">Contactar</Link>
          </div>
          <div className="fhero-stats">
            <div className="fhero-stat"><span>150+</span><small>Jugadores Representados</small></div>
            <div className="fhero-stat"><span>25+</span><small>Países</small></div>
            <div className="fhero-stat"><span>500+</span><small>Transferencias Exitosas</small></div>
          </div>
        </div>
      </section>

      {/* ══════════════════ SOBRE NOSOTROS ══════════════════ */}
      <section className="fseccion fseccion-dark" id="sobre">
        <div className="fseccion-inner">
          <div className="fseccion-head">
            <p className="f-eyebrow">Sobre Nosotros</p>
            <h2>Líderes en Representación<br />Deportiva</h2>
          </div>
          <div className="fsobre-grid">
            {SOBRE_FEATURES.map(f => (
              <div key={f.titulo} className="fsobre-card">
                <div className="fsobre-icon">{f.icon}</div>
                <h4>{f.titulo}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="fsobre-mision">
            <div className="fsobre-mision-texto">
              <h3>Nuestra Misión</h3>
              <p>Potenciar el talento de futbolistas excepcionales conectándolos con las mejores oportunidades del fútbol internacional. Nos comprometemos con la excelencia, integridad y desarrollo profesional de cada jugador que confía en nosotros.</p>
              <Link to="/servicios" className="f-btn-prim" style={{ display: 'inline-flex', marginTop: 20 }}>Conoce más</Link>
            </div>
            <div className="fsobre-mision-kpi">
              <div className="fsobre-kpi"><span>98%</span><small>Satisfacción de Jugadores</small></div>
              <div className="fsobre-kpi"><span>40+</span><small>Clubes Asociados</small></div>
              <div className="fsobre-kpi"><span>85%</span><small>Tasa de Transferencias</small></div>
              <div className="fsobre-kpi"><span>24/7</span><small>Soporte Continuo</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ JUGADORES ══════════════════ */}
      <section className="fseccion" id="jugadores">
        <div className="fseccion-inner">
          <div className="fseccion-head">
            <p className="f-eyebrow">Nuestros Jugadores</p>
            <h2>Talento de Clase Mundial</h2>
            <p className="fseccion-sub">Representamos a algunos de los futbolistas más prometedores y exitosos del panorama internacional</p>
          </div>

          <div className="ffiltros">
            {POSICIONES_FILTRO.map(p => (
              <button key={p} className={`ffiltro-btn${filtroPos === p ? ' ffiltro-btn--activo' : ''}`} onClick={() => setFiltroPos(p)}>{p}</button>
            ))}
          </div>

          {cargandoJ ? (
            <div className="fcentrado" style={{ minHeight: 200 }}><div className="fpinner" /></div>
          ) : jugadoresFiltrados.length === 0 ? (
            <p className="fcentrado" style={{ color: '#64748b', paddingBottom: 40 }}>No hay jugadores en esta posición en este momento.</p>
          ) : (
            <div className="fjugadores-grid">
              {jugadoresFiltrados.slice(0, 8).map(j => <TarjetaJugadorPortal key={j.id} j={j} />)}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/jugadores" className="f-btn-prim">Ver Todos los Jugadores</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ SERVICIOS ══════════════════ */}
      <section className="fseccion fseccion-gris" id="servicios">
        <div className="fseccion-inner">
          <div className="fseccion-head">
            <p className="f-eyebrow">Servicios</p>
            <h2>Soluciones Integrales para Jugadores</h2>
            <p className="fseccion-sub">Ofrecemos un ecosistema completo de servicios profesionales diseñados para maximizar el potencial y proteger los intereses de nuestros representados</p>
          </div>
          <div className="fservicios-grid">
            {SERVICIOS.map(s => (
              <div key={s.titulo} className="fservicio-card">
                <div className="fservicio-icon">{s.icon}</div>
                <h3>{s.titulo}</h3>
                <p>{s.desc}</p>
                <ul>{s.puntos.map(pt => <li key={pt}><i className="ri-check-line" />{pt}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ SCOUTING ══════════════════ */}
      <section className="fseccion fseccion-dark" id="scouting">
        <div className="fseccion-inner">
          <div className="fseccion-head">
            <p className="f-eyebrow">Scouting</p>
            <h2>Descubrimiento de Talento Mundial</h2>
            <p className="fseccion-sub">Nuestro equipo de scouts internacionales identifica y evalúa talento emergente en ligas de todo el mundo</p>
          </div>

          <div className="fscouting-layout">
            <div className="fscouting-texto">
              <h3>Metodología Avanzada</h3>
              <p>Utilizamos tecnología de análisis de datos, seguimiento en vivo y evaluación integral para identificar a los futuros talentos del fútbol mundial. Nuestro proceso combina análisis estadístico avanzado con observación experta en campo.</p>
              <div className="fscouting-features">
                {SCOUTING_FEATURES.map(f => (
                  <div key={f.titulo} className="fscouting-feature">
                    <span className="fscouting-feature-icon">{f.icon}</span>
                    <div><strong>{f.titulo}</strong><span>{f.desc}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fscouting-zonas">
              <h3>Áreas de Búsqueda Prioritarias</h3>
              <div className="fzonas-list">
                {ZONAS.map(z => (
                  <div key={z.label} className="fzona-item">
                    <div className="fzona-header">
                      <span>{z.label}</span><span>{z.pct}%</span>
                    </div>
                    <div className="fzona-bar">
                      <div className="fzona-bar-fill" style={{ width: `${z.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="fscouting-cta-box">
                <h4>¿Tienes talento para descubrir?</h4>
                <p>Si conoces jugadores con potencial excepcional, contáctanos. Evaluamos cada recomendación profesionalmente.</p>
                <Link to="/contacto" className="f-btn-prim">Enviar Recomendación</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ NOTICIAS ══════════════════ */}
      <section className="fseccion" id="noticias">
        <div className="fseccion-inner">
          <div className="fseccion-head">
            <p className="f-eyebrow">Noticias</p>
            <h2>Últimas Novedades</h2>
            <p className="fseccion-sub">Mantente al día con las transferencias, logros y novedades de nuestros jugadores</p>
          </div>
          <div className="fnoticias-grid">
            {NOTICIAS.map(n => (
              <article key={n.titulo} className="fnoticia-card">
                <div className="fnoticia-meta">
                  <span className="fnoticia-cat">{n.cat}</span>
                  <span className="fnoticia-fecha">{n.fecha}</span>
                </div>
                <h3>{n.titulo}</h3>
                <p>{n.desc}</p>
                <a href="#" className="fnoticia-leer">Leer más <i className="ri-arrow-right-line" /></a>
              </article>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#" className="f-btn-out-dark">Ver todas las noticias</a>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="fcta-final">
        <div className="fcta-final-inner">
          <h2>Hablemos de tu Futuro</h2>
          <p>¿Listo para llevar tu carrera al siguiente nivel?<br />Nuestro equipo está aquí para ayudarte.</p>
          <Link to="/contacto" className="f-btn-prim">Contáctanos Ahora</Link>
        </div>
      </section>
    </>
  );
}
