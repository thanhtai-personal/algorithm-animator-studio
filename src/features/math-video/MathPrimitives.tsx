import { cosDeg, fmt, project, sinDeg, sinePath, tanPaths } from "./mathGeometry";
export const WHITE = "#f0f2f6";
export const CYAN = "#58dfea";
export const ORANGE = "#e5a45b";
export const DARK = "#202226";

export function StickPerson({ x, y, scale = 1, wave = 0 }: { x: number; y: number; scale?: number; wave?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={WHITE} strokeWidth="2.8" strokeLinecap="round" fill="none">
    <circle cx="0" cy="-51" r="9" fill={WHITE} stroke="none" />
    <path d="M 0 -39 L 0 -10 M 0 -10 L -7 18 M 0 -10 L 8 18" />
    <path d={`M 0 -30 L -12 -14 M 0 -30 L ${18 + wave * 9} ${-32 - wave * 7}`} />
  </g>;
}
export function AngleArc({ x, y, r = 25, degrees = 36, stroke = ORANGE }: { x: number; y: number; r?: number; degrees?: number; stroke?: string }) {
  const end = project(x, y, r, degrees);
  return <path d={`M ${fmt(x + r)} ${fmt(y)} A ${r} ${r} 0 ${degrees > 180 ? 1 : 0} 0 ${fmt(end.x)} ${fmt(end.y)}`} stroke={stroke} strokeWidth="2" fill="none" />;
}
export function RightTriangle({ x = 430, y = 480, width = 220, height = 122, alpha = 30, showSin = true, showCos = true }: { x?: number; y?: number; width?: number; height?: number; alpha?: number; showSin?: boolean; showCos?: boolean }) {
  return <g>
    <path d={`M ${x} ${y} H ${x + width} V ${y - height} Z`} fill="#b1b1b1" fillOpacity="0.22" stroke={WHITE} strokeWidth="2" strokeLinejoin="round" />
    <path d={`M ${x + width - 15} ${y} V ${y - 15} H ${x + width}`} fill="none" stroke={WHITE} strokeWidth="1.5"/>
    <AngleArc x={x} y={y} r={42} degrees={alpha} />
    <text x={x + 46} y={y - 9} fontSize="17" fill={WHITE}>α</text>
    {showSin && <g stroke={CYAN} strokeWidth="4"><path d={`M ${x + width} ${y - height} V ${y}`} /></g>}
    {showCos && <g stroke={ORANGE} strokeWidth="4"><path d={`M ${x} ${y} H ${x + width}`} /></g>}
  </g>;
}
export function UnitCircle({ x = 480, y = 360, r = 150, angle = 40, labels = true }: { x?: number; y?: number; r?: number; angle?: number; labels?: boolean }) {
  const p = project(x, y, r, angle);
  return <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke={WHITE} strokeWidth="1.8" />
    <path d={`M ${x - r - 28} ${y} H ${x + r + 28} M ${x} ${y - r - 24} V ${y + r + 24}`} stroke="#62676d" strokeWidth="1"/>
    <path d={`M ${x} ${y} L ${fmt(p.x)} ${fmt(p.y)}`} stroke={WHITE} strokeWidth="2.5"/>
    <path d={`M ${fmt(p.x)} ${fmt(p.y)} V ${y} H ${x}`} fill="none" stroke={CYAN} strokeWidth="4"/>
    <path d={`M ${x} ${y} H ${fmt(p.x)}`} stroke={ORANGE} strokeWidth="4"/>
    <circle cx={p.x} cy={p.y} r="5" fill={WHITE}/>
    {labels && <>
      <text x={x + r + 38} y={y + 6} fontSize="21" fill={ORANGE}>cos α</text>
      <text x={x + 18} y={y - r - 28} fontSize="21" fill={CYAN}>sin α</text>
      <text x={x + 25} y={y + 26} fontSize="17" fill={ORANGE}>{Math.round(((angle % 360) + 360) % 360)}°</text>
    </>}
  </g>;
}
export function SinePlot({ x = 290, y = 400, width = 680, amplitude = 90, phase = 0, reveal = 1, cycles = 2, color = WHITE }: { x?: number; y?: number; width?: number; amplitude?: number; phase?: number; reveal?: number; cycles?: number; color?: string }) {
  return <g>
    <path d={`M ${x - 30} ${y} H ${x + width + 25}`} stroke="#737983" strokeWidth="1.5"/>
    <path d={sinePath(x, y, width, amplitude, cycles, phase, 200, reveal)} stroke={color} strokeWidth="3.3" fill="none" strokeLinecap="round"/>
  </g>;
}
export function TangentPlot({ x = 230, y = 370, width = 830, height = 110 }: { x?: number; y?: number; width?: number; height?: number }) {
  return <g>
    <path d={`M ${x} ${y} H ${x + width}`} stroke="#666" strokeWidth="1.3"/>
    {tanPaths(x, y, width, height, 2).map((d, i) => <path key={i} d={d} stroke={CYAN} strokeWidth="3" fill="none"/>)}
  </g>;
}
export function TextLines({ lines, x = 870, y = 260, color = WHITE, size = 26 }: { lines: string[]; x?: number; y?: number; color?: string; size?: number }) {
  return <text x={x} y={y} fontFamily="Arial, sans-serif" fontSize={size} fill={color} textAnchor="middle">
    {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * 1.6}>{line}</tspan>)}
  </text>;
}
export function ProjectionBars({ x = 440, y = 420, radius = 130, angle = 60 }: { x?: number; y?: number; radius?: number; angle?: number }) {
  const cosine = Math.abs(cosDeg(angle)) * radius;
  const sine = Math.abs(sinDeg(angle)) * radius;
  return <g><rect x={x} y={y-sine} width={cosine} height={sine} fill={CYAN} fillOpacity=".09" stroke={CYAN} strokeWidth="1.5" />
    <rect x={x} y={y} width={cosine} height={cosine} fill={ORANGE} fillOpacity=".18" stroke={ORANGE} strokeWidth="1.5"/></g>;
}
