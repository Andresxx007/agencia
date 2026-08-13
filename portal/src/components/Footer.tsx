import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo-login.png" alt="Fortis Glesnor Group" className="footer-logo" />
          <div>
            <div className="footer-brand-name">FORTIS GLESNOR GROUP</div>
            <div className="footer-brand-sub">Representación deportiva de élite</div>
          </div>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Empresa</h4>
            <Link to="/">Inicio</Link>
            <Link to="/servicios">Servicios</Link>
            <Link to="/contacto">Contacto</Link>
          </div>
          <div className="footer-col">
            <h4>Jugadores</h4>
            <Link to="/jugadores">Catálogo completo</Link>
            <Link to="/jugadores?posicion=Delantero">Delanteros</Link>
            <Link to="/jugadores?posicion=Mediocampista">Mediocampistas</Link>
            <Link to="/jugadores?posicion=Defensa">Defensas</Link>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <span>📧 info@fortisglesnor.com</span>
            <span>📞 +1 (555) 000-0000</span>
            <span>📍 Latinoamérica · Europa</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Fortis Glesnor Group. Todos los derechos reservados.</span>
        <div className="footer-bottom-links">
          <a href="#">Política de privacidad</a>
          <a href="#">Términos de uso</a>
        </div>
      </div>
    </footer>
  );
}
