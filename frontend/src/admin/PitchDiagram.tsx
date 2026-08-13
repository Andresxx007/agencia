/** Cancha simplificada con marcador de posición (tema claro). */
export function mapPositionCoords(mainPosition: string): { x: number; y: number; abbr: string; label: string } {
  const p = mainPosition.trim().toLowerCase();
  if (p.includes('portero')) return { x: 50, y: 88, abbr: 'POR', label: 'Portero' };
  if (p.includes('lateral')) {
    const right = p.includes('derech');
    return { x: right ? 86 : 14, y: 72, abbr: 'LAT', label: right ? 'Lateral derecho' : 'Lateral izquierdo' };
  }
  if (p.includes('defensa') || p.includes('central')) return { x: 50, y: 76, abbr: 'DFC', label: 'Defensa central' };
  if (p.includes('mediocamp') && p.includes('defens')) return { x: 50, y: 58, abbr: 'MCD', label: 'Mediocampista defensivo' };
  if (p.includes('volante')) return { x: 50, y: 46, abbr: 'VOL', label: 'Volante' };
  if (p.includes('mediocamp') && p.includes('ofens')) return { x: 50, y: 30, abbr: 'MCO', label: 'Mediocampista ofensivo' };
  if (p.includes('mediocamp')) return { x: 50, y: 52, abbr: 'MC', label: 'Mediocampista' };
  if (p.includes('extremo')) {
    const left = p.includes('izquierd');
    return { x: left ? 18 : 82, y: 28, abbr: 'EXT', label: left ? 'Extremo izquierdo' : 'Extremo derecho' };
  }
  if (p.includes('delantero')) return { x: 50, y: 14, abbr: 'DEL', label: 'Delantero' };
  const words = mainPosition.split(/\s+/).filter(Boolean);
  const abbr = words.length >= 2 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : mainPosition.slice(0, 3).toUpperCase();
  return { x: 50, y: 50, abbr, label: mainPosition };
}

type PitchDiagramProps = {
  mainPosition: string;
  compact?: boolean;
  className?: string;
};

export default function PitchDiagram({ mainPosition, compact, className = '' }: PitchDiagramProps) {
  const { x, y, abbr } = mapPositionCoords(mainPosition);
  const h = compact ? 36 : 118;
  const w = compact ? 40 : 100;

  return (
    <svg
      className={`ps-pitch ${className}`.trim()}
      viewBox={compact ? '0 0 40 36' : '0 0 100 118'}
      width={w}
      height={h}
      aria-hidden
    >
      <rect width="100%" height="100%" fill="#e8f5e9" rx="4" />
      <rect x="6%" y="6%" width="88%" height="88%" fill="#c8e6c9" stroke="#66bb6a" strokeWidth="0.6" rx="2" />
      <line x1="6%" y1="50%" x2="94%" y2="50%" stroke="#43a047" strokeWidth="0.5" opacity="0.45" />
      {!compact && (
        <>
          <rect x="26%" y="6%" width="48%" height="12%" fill="none" stroke="#43a047" strokeWidth="0.4" opacity="0.35" />
          <rect x="26%" y="82%" width="48%" height="12%" fill="none" stroke="#43a047" strokeWidth="0.4" opacity="0.35" />
          <circle cx="50%" cy="50%" r="12%" fill="none" stroke="#43a047" strokeWidth="0.4" opacity="0.3" />
        </>
      )}
      <circle cx={`${x}%`} cy={`${y}%`} r={compact ? '14%' : '10%'} fill="#008f4a" stroke="#fff" strokeWidth="1.2" />
      <text x={`${x}%`} y={`${y}%`} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={compact ? 5 : 7} fontWeight="bold">
        {abbr}
      </text>
    </svg>
  );
}
