const SERVICIOS = [
  {
    icon: '⚽', titulo: 'Gestión de Carrera',
    desc: 'Planificación estratégica y desarrollo profesional personalizado para cada jugador.',
    puntos: ['Asesoría profesional', 'Planificación de carrera', 'Análisis de mercado'],
  },
  {
    icon: '📝', titulo: 'Negociación de Contratos',
    desc: 'Representación experta en negociaciones con clubes nacionales e internacionales.',
    puntos: ['Optimización salarial', 'Cláusulas protectoras', 'Bonos por rendimiento'],
  },
  {
    icon: '⚖️', titulo: 'Asesoría Legal',
    desc: 'Protección jurídica integral en todos los aspectos de la carrera deportiva.',
    puntos: ['Contratos deportivos', 'Derechos de imagen', 'Disputas legales'],
  },
  {
    icon: '💰', titulo: 'Gestión Financiera',
    desc: 'Administración inteligente del patrimonio y planificación fiscal especializada.',
    puntos: ['Inversiones', 'Planificación fiscal', 'Protección patrimonial'],
  },
  {
    icon: '📣', titulo: 'Marketing Personal',
    desc: 'Desarrollo de marca personal y gestión de patrocinios deportivos.',
    puntos: ['Branding personal', 'Redes sociales', 'Patrocinios'],
  },
  {
    icon: '🎓', titulo: 'Formación Continua',
    desc: 'Preparación académica y profesional para la vida después del fútbol.',
    puntos: ['Educación', 'Certificaciones', 'Segunda carrera'],
  },
];

export default function PaginaServicios() {
  return (
    <div>
      <div className="ppage-header">
        <div className="ppage-header-inner">
          <div className="p-eyebrow">Servicios</div>
          <h1>Soluciones Integrales para <span className="p-acento">Jugadores</span></h1>
          <p>Ofrecemos un ecosistema completo de servicios profesionales diseñados para maximizar el potencial y proteger los intereses de nuestros representados.</p>
        </div>
      </div>

      <div className="fserv-page-contenido">
        <div className="fservicios-grid fservicios-grid--page">
          {SERVICIOS.map(s => (
            <div key={s.titulo} className="fservicio-card fservicio-card--grande">
              <div className="fservicio-icon">{s.icon}</div>
              <h3>{s.titulo}</h3>
              <p>{s.desc}</p>
              <ul>
                {s.puntos.map(pt => (
                  <li key={pt}><i className="ri-check-line" />{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="fserv-cta">
          <div className="fserv-cta-box">
            <h3>¿Listo para dar el siguiente paso?</h3>
            <p>Nuestro equipo de expertos está preparado para asesorarte en cada etapa de tu carrera profesional.</p>
            <a href="/contacto" className="f-btn-prim">Solicitar Consulta Gratuita</a>
          </div>
        </div>
      </div>
    </div>
  );
}
