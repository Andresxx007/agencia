export type TipoConversacionCodigo =
  | 'Mensaje'
  | 'Correo'
  | 'Reunion'
  | 'ComentarioInterno';

export type ConversacionRow = {
  id: string;
  playerId: string;
  negotiationId?: string | null;
  conversationType: string;
  conversationTypeLabel: string;
  subject?: string | null;
  content: string;
  participants?: string | null;
  occurredAtUtc: string;
  createdBy: string;
  createdAtUtc: string;
  clubName: string;
  playerFullName?: string | null;
  negotiationStatus?: string | null;
};

export type JugadorHistorialRow = {
  id: string;
  firstName: string;
  lastName: string;
  mainPosition: string;
  currentClub?: string | null;
};

export type ConversacionForm = {
  clubName: string;
  conversationType: TipoConversacionCodigo;
  subject: string;
  content: string;
  participants: string;
  occurredAt: string;
};

export const TIPOS_CONVERSACION: {
  codigo: TipoConversacionCodigo;
  etiqueta: string;
  icono: string;
  descripcion: string;
}[] = [
  {
    codigo: 'Mensaje',
    etiqueta: 'Mensaje / chat',
    icono: 'ri-message-3-line',
    descripcion: 'WhatsApp, SMS o mensaje directo con club o jugador.',
  },
  {
    codigo: 'Correo',
    etiqueta: 'Correo electrónico',
    icono: 'ri-mail-line',
    descripcion: 'Email enviado o recibido sobre la negociación.',
  },
  {
    codigo: 'Reunion',
    etiqueta: 'Reunión',
    icono: 'ri-group-line',
    descripcion: 'Llamada, videollamada o reunión presencial.',
  },
  {
    codigo: 'ComentarioInterno',
    etiqueta: 'Comentario interno',
    icono: 'ri-sticky-note-line',
    descripcion: 'Nota privada del equipo Fortis (no compartida con el club).',
  },
];

export const conversacionFormVacio = (clubName = ''): ConversacionForm => ({
  clubName,
  conversationType: 'ComentarioInterno',
  subject: '',
  content: '',
  participants: '',
  occurredAt: new Date().toISOString().slice(0, 16),
});

export const payloadConversacionApi = (form: ConversacionForm) => ({
  clubName: form.clubName.trim(),
  conversationType: form.conversationType,
  subject: form.subject.trim() || null,
  content: form.content.trim(),
  participants: form.participants.trim() || null,
  occurredAtUtc: form.occurredAt
    ? new Date(form.occurredAt).toISOString()
    : new Date().toISOString(),
});

export const metaTipoConversacion = (codigo: string) =>
  TIPOS_CONVERSACION.find((t) => t.codigo === codigo)
  ?? TIPOS_CONVERSACION.find((t) => t.codigo.toLowerCase() === codigo.toLowerCase())
  ?? TIPOS_CONVERSACION[3];

export const formatearFechaConversacion = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};
