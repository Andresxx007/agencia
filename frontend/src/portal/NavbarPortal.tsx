import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/jugadores', label: 'Jugadores' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/contacto', label: 'Contacto' },
];

export default function NavbarPortal() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fnav${scrolled ? ' fnav--scrolled' : ''}`}>
      <div className="fnav-inner">
        {/* Logo */}
        <Link to="/" className="fnav-brand">
          <img src="/logo-login.png" alt="Fortis Glesnor" height={40} />
          <span className="fnav-brand-name">Fortis Glesnor<b>Group</b></span>
        </Link>

        {/* Links desktop */}
        <nav className="fnav-links">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `fnav-link${isActive ? ' fnav-link--activo' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA: Ingresar al sistema */}
        <div className="fnav-acciones">
          <Link to="/login" className="fnav-login-btn">
            <i className="ri-lock-line" />
            Ingresar al sistema
          </Link>
          {/* Hamburguesa mobile */}
          <button className="fnav-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto && (
        <div className="fnav-mobile">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `fnav-mobile-link${isActive ? ' fnav-link--activo' : ''}`}
              onClick={() => setMenuAbierto(false)}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/login" className="fnav-login-btn" onClick={() => setMenuAbierto(false)}>
            Ingresar al sistema
          </Link>
        </div>
      )}
    </header>
  );
}
