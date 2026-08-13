import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

export interface JugadorPublico {
  id: string;
  nombre: string;
  apellido: string;
  nacionalidad: string;
  posicion: string;
  clubActual?: string;
  alturaCm?: number;
  pesoKg?: number;
  pieDominante?: string;
  edad: number;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export async function fetchJugadores(params?: {
  busqueda?: string;
  posicion?: string;
  pagina?: number;
}): Promise<PagedResult<JugadorPublico>> {
  const res = await api.get<PagedResult<JugadorPublico>>('/publico/jugadores', {
    params: {
      busqueda: params?.busqueda || undefined,
      posicion: params?.posicion || undefined,
      pagina: params?.pagina ?? 1,
      tamanio: 12,
    },
  });
  return res.data;
}

export async function fetchJugador(id: string): Promise<JugadorPublico> {
  const res = await api.get<JugadorPublico>(`/publico/jugadores/${id}`);
  return res.data;
}
