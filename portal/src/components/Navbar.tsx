import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="nav-header">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <img src="/logo-login.png" alt="Fortis Glesnor Group" />
          <span className="nav-logo-text">
            <strong>FORTIS</strong><span>GLESNOR GROUP</span>
          </span>
        </Link>

        <button
          className="nav-hamburger"
          onClick={() => setMenuAbierto((p) => !p)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links${menuAbierto ? ' nav-links--open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuAbierto(false)}>Inicio</NavLink>
          <NavLink to="/jugadores" onClick={() => setMenuAbierto(false)}>Jugadores</NavLink>
          <NavLink to="/servicios" onClick={() => setMenuAbierto(false)}>Servicios</NavLink>
          <NavLink to="/contacto" onClick={() => setMenuAbierto(false)}>Contacto</NavLink>
          <Link to="/contacto" className="nav-cta" onClick={() => setMenuAbierto(false)}>
            Trabajar con nosotros
          </Link>
        </nav>
      </div>
    </header>
  );
}
