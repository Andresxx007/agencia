/** URL para fotos servidas por la API (`/uploads/players/…`). En desarrollo el proxy de Vite reenvía `/uploads`. */
export function urlFotoJugador(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, '');
  return origin ? `${origin}${path}` : path;
}
