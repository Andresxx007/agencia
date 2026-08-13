import { useState } from 'react';

export default function PaginaContacto() {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', tipo: '', mensaje: '',
  });

  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
  };

  return (
    <div className="contacto-pagina">
      <div className="catalogo-header">
        <div className="catalogo-header-inner">
          <div className="seccion-eyebrow">Estamos aquí para ti</div>
          <h1 className="catalogo-titulo">Ponte en <span className="acento">contacto</span></h1>
          <p className="catalogo-subtitulo">
            Ya seas un jugador, un club o un patrocinador, queremos escucharte y encontrar la mejor manera de colaborar.
          </p>
        </div>
      </div>

      <div className="contacto-inner">
        {/* Info */}
        <div className="contacto-info">
          <div className="contacto-info-item">
            <div className="contacto-info-icono">📧</div>
            <div>
              <strong>Correo electrónico</strong>
              <span>info@fortisglesnor.com</span>
            </div>
          </div>
          <div className="contacto-info-item">
            <div className="contacto-info-icono">📞</div>
            <div>
              <strong>Teléfono / WhatsApp</strong>
              <span>+1 (555) 000-0000</span>
            </div>
          </div>
          <div className="contacto-info-item">
            <div className="contacto-info-icono">📍</div>
            <div>
              <strong>Cobertura</strong>
              <span>Latinoamérica · Europa · Oriente Medio</span>
            </div>
          </div>
          <div className="contacto-info-item">
            <div className="contacto-info-icono">🕐</div>
            <div>
              <strong>Horario de atención</strong>
              <span>Lun – Vie, 9:00 – 18:00 (UTC-4)</span>
            </div>
          </div>

          <div className="contacto-redes">
            <a href="#" className="red-social">𝕏 Twitter</a>
            <a href="#" className="red-social">in LinkedIn</a>
            <a href="#" className="red-social">📷 Instagram</a>
          </div>
        </div>

        {/* Formulario */}
        <div className="contacto-form-wrap">
          {enviado ? (
            <div className="contacto-exito">
              <div className="contacto-exito-icono">✅</div>
              <h3>¡Mensaje enviado!</h3>
              <p>Gracias por contactarnos. Nuestro equipo se comunicará contigo en las próximas 24 horas.</p>
              <button className="btn-secundario" onClick={() => setEnviado(false)}>Enviar otro mensaje</button>
            </div>
          ) : (
            <form className="contacto-form" onSubmit={enviar}>
              <h3>Envíanos un mensaje</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input name="nombre" required value={form.nombre} onChange={cambiar} placeholder="Tu nombre" />
                </div>
                <div className="form-group">
                  <label>Correo electrónico *</label>
                  <input type="email" name="email" required value={form.email} onChange={cambiar} placeholder="tu@correo.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono / WhatsApp</label>
                  <input name="telefono" value={form.telefono} onChange={cambiar} placeholder="+1 555 000 000" />
                </div>
                <div className="form-group">
                  <label>Tipo de consulta *</label>
                  <select name="tipo" required value={form.tipo} onChange={cambiar}>
                    <option value="">Selecciona una opción</option>
                    <option value="jugador">Soy jugador y quiero representación</option>
                    <option value="club">Represento a un club / institución</option>
                    <option value="patrocinador">Soy patrocinador</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mensaje *</label>
                <textarea name="mensaje" required rows={5} value={form.mensaje} onChange={cambiar} placeholder="Cuéntanos tu caso…" />
              </div>

              <button type="submit" className="btn-primario btn-block">Enviar mensaje →</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
