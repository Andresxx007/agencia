import { useState } from 'react';

const OFICINAS = [
  { ciudad: 'Londres', pais: 'Reino Unido', flag: '🇬🇧' },
  { ciudad: 'París', pais: 'Francia', flag: '🇫🇷' },
  { ciudad: 'São Paulo', pais: 'Brasil', flag: '🇧🇷' },
  { ciudad: 'Buenos Aires', pais: 'Argentina', flag: '🇦🇷' },
];

export default function PaginaContacto() {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', mensaje: '',
  });
  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="ppage-header">
        <div className="ppage-header-inner">
          <div className="p-eyebrow">Contacto</div>
          <h1>Hablemos de tu <span className="p-acento">Futuro</span></h1>
          <p>¿Listo para llevar tu carrera al siguiente nivel? Nuestro equipo está aquí para ayudarte.</p>
        </div>
      </div>

      <div className="fcontacto-layout">
        {/* Formulario */}
        <div className="fcontacto-form-col">
          <h3>Envíanos un Mensaje</h3>
          {enviado ? (
            <div className="fcontacto-exito">
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h4>¡Mensaje enviado!</h4>
              <p>Nuestro equipo se comunicará contigo en las próximas 24 horas.</p>
              <button className="p-btn-secundario" onClick={() => setEnviado(false)}>Enviar otro mensaje</button>
            </div>
          ) : (
            <form className="fcontacto-form" onSubmit={e => { e.preventDefault(); setEnviado(true); }}>
              <div className="fform-row">
                <div className="fform-group">
                  <label>Nombre</label>
                  <input name="nombre" required value={form.nombre} onChange={cambiar} placeholder="Tu nombre" />
                </div>
                <div className="fform-group">
                  <label>Apellido</label>
                  <input name="apellido" required value={form.apellido} onChange={cambiar} placeholder="Tu apellido" />
                </div>
              </div>
              <div className="fform-row">
                <div className="fform-group">
                  <label>Email</label>
                  <input type="email" name="email" required value={form.email} onChange={cambiar} placeholder="tu@correo.com" />
                </div>
                <div className="fform-group">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={cambiar} placeholder="+34 900 123 456" />
                </div>
              </div>
              <div className="fform-group">
                <label>Mensaje</label>
                <textarea name="mensaje" required rows={5} value={form.mensaje} onChange={cambiar} placeholder="Cuéntanos tu caso…" />
              </div>
              <button type="submit" className="f-btn-prim" style={{ width: '100%', justifyContent: 'center' }}>
                Enviar Mensaje
              </button>
            </form>
          )}
        </div>

        {/* Información de contacto */}
        <div className="fcontacto-info-col">
          <h3>Información de Contacto</h3>
          <div className="fcontacto-datos">
            <div className="fcontacto-dato">
              <i className="ri-map-pin-2-line" />
              <div>
                <strong>Oficina Principal</strong>
                <span>Paseo de la Castellana 123, Madrid, España</span>
              </div>
            </div>
            <div className="fcontacto-dato">
              <i className="ri-phone-line" />
              <div>
                <strong>Teléfono</strong>
                <span>+34 900 123 456</span>
              </div>
            </div>
            <div className="fcontacto-dato">
              <i className="ri-mail-line" />
              <div>
                <strong>Email</strong>
                <span>info@fortisglesnor.com</span>
              </div>
            </div>
          </div>

          <div className="fcontacto-oficinas">
            <h4>Oficinas Internacionales</h4>
            <div className="foficinas-grid">
              {OFICINAS.map(o => (
                <div key={o.ciudad} className="foficina-item">
                  <span className="foficina-flag">{o.flag}</span>
                  <div>
                    <strong>{o.ciudad}</strong>
                    <span>{o.pais}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fcontacto-redes">
            <a href="#" className="fred-btn"><i className="ri-twitter-x-line" /></a>
            <a href="#" className="fred-btn"><i className="ri-linkedin-line" /></a>
            <a href="#" className="fred-btn"><i className="ri-instagram-line" /></a>
            <a href="#" className="fred-btn"><i className="ri-youtube-line" /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
