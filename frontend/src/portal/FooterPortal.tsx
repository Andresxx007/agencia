import { Link } from 'react-router-dom';

export default function FooterPortal() {
  return (
    <footer className="ffooter">
      <div className="ffooter-inner">
        <div className="ffooter-marca">
          <Link to="/" className="ffooter-logo">
            <img src="/logo-login.png" alt="Fortis Glesnor" height={40} />
            <div>
              <span className="ffooter-nombre">Fortis Glesnor Group</span>
              <span className="ffooter-eslogan">Representación Deportiva de Élite</span>
            </div>
          </Link>
          <p className="ffooter-desc">Conectamos talento excepcional con oportunidades globales en el fútbol profesional.</p>
          <div className="ffooter-redes">
            <a href="#" aria-label="Twitter"><i className="ri-twitter-x-line" /></a>
            <a href="#" aria-label="LinkedIn"><i className="ri-linkedin-line" /></a>
            <a href="#" aria-label="Instagram"><i className="ri-instagram-line" /></a>
            <a href="#" aria-label="YouTube"><i className="ri-youtube-line" /></a>
          </div>
        </div>

        <div className="ffooter-links">
          <div className="ffooter-col">
            <h5>Navegación</h5>
            <Link to="/">Inicio</Link>
            <Link to="/jugadores">Jugadores</Link>
            <Link to="/servicios">Servicios</Link>
            <Link to="/contacto">Contacto</Link>
          </div>
          <div className="ffooter-col">
            <h5>Servicios</h5>
            <Link to="/servicios">Gestión de Carrera</Link>
            <Link to="/servicios">Negociación de Contratos</Link>
            <Link to="/servicios">Asesoría Legal</Link>
            <Link to="/servicios">Gestión Financiera</Link>
          </div>
          <div className="ffooter-col">
            <h5>Contacto</h5>
            <span>Paseo de la Castellana 123</span>
            <span>Madrid, España</span>
            <a href="tel:+34900123456">+34 900 123 456</a>
            <a href="mailto:info@fortisglesnor.com">info@fortisglesnor.com</a>
          </div>
        </div>
      </div>
      <div className="ffooter-copy">
        <span>© {new Date().getFullYear()} Fortis Glesnor Group. Todos los derechos reservados.</span>
        <Link to="/login" className="ffooter-admin-link">Acceso al sistema</Link>
      </div>
    </footer>
  );
}
