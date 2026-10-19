import { AngleArc, CYAN, ORANGE, RightTriangle, StickPerson, WHITE } from "./MathPrimitives";
import { ease, frameWindow } from "./mathGeometry";

export function MathIntro({ frame }: { frame: number }) {
  const axis = frame >= 800;
  const triangle = frame >= 35;
  const wave = Math.sin(frame / 24) * 0.5 + 0.5;
  if (axis) {
    const x = 90, y = 558, w = 1070;
    return <g>
      <text x="90" y="96" fill={WHITE} fontSize="23" fontWeight="600">Các ngành tam giác vuông ứng dụng</text>
      <line x1={x} y1={y} x2={x+w} y2={y} stroke="#a8a8a8" strokeWidth="2"/>
      {Array.from({ length: 19 }, (_, i) => <g key={i}>
        <line x1={x+i*w/18} y1={y} x2={x+i*w/18} y2={y+12} stroke="#a8a8a8" strokeWidth="1"/>
        <text x={x+i*w/18} y={y+35} textAnchor="middle" fontSize="15" fill={WHITE}>{i*10}°</text>
      </g>)}
      <rect x="235" y="262" width={Math.min(380, (frame-800)*5)} height="295" fill="#8e8e8e" fillOpacity=".15" stroke="#c2c2c2"/>
      <StickPerson x={Math.min(1050, 650 + (frame-800)*1.6)} y={y} scale={1.4} wave={wave}/>
      <text x="260" y="243" fontSize="17" fill={WHITE}>0° đến 90°</text>
    </g>;
  }
  return <g>
    <StickPerson x={108 + Math.min(16, frame * 0.15)} y={545} scale={1.5} wave={frame < 40 ? 0 : wave} />
    {triangle && <g opacity={ease(frameWindow(frame, 35, 70))}>
      <RightTriangle x={410} y={475} width={260} height={151} showSin={frame >= 125} showCos={frame >= 175}/>
    </g>}
    {frame >= 125 && <g opacity={ease(frameWindow(frame, 125, 151))}>
      <text x="585" y="130" fill={CYAN} fontSize="28" fontWeight="700" textAnchor="middle">sin = đối / huyền</text>
    </g>}
    {frame >= 175 && <g opacity={ease(frameWindow(frame, 175, 202))}>
      <text x="585" y="171" fill={ORANGE} fontSize="28" fontWeight="700" textAnchor="middle">cos = kề / huyền</text>
    </g>}
    {frame >= 250 && frame < 540 && Array.from({ length: 4 }, (_, i) => <g key={i}>
      <rect x={705+i*47} y="490" width="32" height="44" fill="none" stroke="#a2a7ad" strokeWidth="1"/>
      {frame > 255+i*37 && <path d={`M ${711+i*47} 511 l 9 9 l 13 -19`} stroke={WHITE} strokeWidth="2" fill="none"/>}
    </g>)}
    {frame >= 345 && <g opacity={ease(frameWindow(frame, 345, 365))}>
      <rect x="898" y="265" width="260" height="156" fill="#202124" stroke="#8b8b8b" strokeWidth="2"/>
      <text x="928" y="298" fontSize="15" fill="#acb0b5">Đối diện góc tù</text>
      <text x="928" y="356" fontSize="32" fontWeight="600" fill={WHITE}>sin 120° = ?</text>
    </g>}
    {frame >= 440 && frame < 560 && <g opacity=".7">
      <line x1="410" y1="475" x2="610" y2="370" stroke={CYAN} strokeWidth="2"/>
      <AngleArc x={410} y={475} r={55} degrees={120} />
      <text x="500" y="464" fill={ORANGE} fontSize="24">120°</text>
    </g>}
    {frame >= 625 && <g opacity={ease(frameWindow(frame, 625, 651))}>
      <rect x="904" y="452" width="96" height="128" rx="3" fill="#131518" stroke="#646a70" strokeWidth="2"/>
      <rect x="915" y="464" width="73" height="23" fill="#303439" />
      {Array.from({length: 12}, (_, i) => <rect key={i} x={914+(i%3)*25} y={499+Math.floor(i/3)*18} width="17" height="12" fill="none" stroke="#88919b" strokeWidth="1"/> )}
      <rect x="1024" y="455" width="128" height="125" fill="#181a1e" stroke="#7d838b"/>
      {Array.from({length: 4}, (_,i) => <line key={i} x1="1035" x2="1140" y1={475+i*24} y2={475+i*24} stroke="#58606a"/>)}
    </g>}
  </g>;
}
