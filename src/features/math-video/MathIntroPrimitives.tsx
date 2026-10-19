import { clamp01, ease, lerp } from "./mathGeometry";

export const REF_CYAN = "#40b8ca";
export const REF_ORANGE = "#efa959";
export const REF_WHITE = "#edf0f4";
const REF_GRAY = "#8290a2";

/** The reference's thick, filled stick figure (feet anchored at x, ground). */
export function ReferencePerson({ x = 148, ground = 602, pointing = false }: { x?: number; ground?: number; pointing?: boolean }) {
  return <g transform={`translate(${x},${ground})`} fill={REF_WHITE} stroke={REF_WHITE} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
    <circle cy="-148" r="14" stroke="none"/>
    <path d="M 0 -129 L 0 -77" strokeWidth="11"/>
    <path d="M 0 -77 L -8 -3 M 0 -77 L 8 -3"/>
    <path d={pointing ? "M 0 -124 L 55 -122 M 0 -122 L 11 -70" : "M 0 -123 L 13 -72"} />
  </g>;
}

export function ReferenceTriangle({ frame }: { frame: number }) {
  // Triangular flip at 16–19 s, reset before the angle-sector explanation.
  const tilt = frame < 400 ? 0 : frame < 448 ? ease((frame - 400) / 48) : frame < 487 ? 1 : 1 - ease((frame - 487) / 34);
  const x = lerp(667, 162, tilt);
  const y = lerp(302, 167, tilt);
  const showCosSide = frame >= 175 && frame < 800;
  const showSinSide = frame >= 125 && frame < 400;
  const showAngle = frame >= 85;
  return <g>
    <path d={`M 346 487 L ${x.toFixed(2)} ${y.toFixed(2)} L 667 487 Z`}
      fill="#262729" stroke={REF_WHITE} strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M 643 487 V 463 H 667" fill="none" stroke={REF_WHITE} strokeWidth="1.8" />
    {showCosSide && <path d="M 346 487 H 667" stroke={REF_ORANGE} strokeWidth="4.2" strokeLinecap="round"/>}
    {showSinSide && tilt < 0.05 && <path d="M 667 487 V 302" stroke={REF_CYAN} strokeWidth="4" strokeLinecap="round"/>}
    {showAngle && <g>
      <path d={tilt > 0.3 ? "M 406 487 A 60 60 0 0 0 315 432" : "M 406 487 A 60 60 0 0 0 399 454"} fill="none" stroke={REF_WHITE} strokeWidth="1.9"/>
      <text x={tilt > 0.3 ? 367 : 425} y={tilt > 0.3 ? 413 : 470} fill={REF_WHITE} fontSize="21" fontWeight="600">{tilt > 0.3 ? "120°" : "α"}</text>
    </g>}
    {frame >= 514 && frame <= 606 && <g>
      <path d="M 346 487 L 321 438 Q 333 432 349 434 Z" fill="#5f626a" fillOpacity=".8" stroke={REF_WHITE} strokeWidth="2"/>
      <path d="M 667 302 L 614 302 A 53 53 0 0 1 638 257 Z" fill="#5f626a" fillOpacity=".8" stroke={REF_WHITE} strokeWidth="2"/>
      <path d="M 667 487 L 720 487 A 53 53 0 0 0 667 434 Z" fill={REF_CYAN} fillOpacity=".38" stroke={REF_CYAN} strokeWidth="2"/>
    </g>}
  </g>;
}

export function ReferenceCheckCards({ frame }: { frame: number }) {
  return <g opacity={frame < 222 ? ease((frame - 204) / 18) : 1}>
    {Array.from({length:4},(_,i)=> {
      const x = 806 + i * 90;
      return <g key={i}>
        <rect x={x} y="483" width="68" height="88" fill="#121417" stroke={REF_WHITE} strokeWidth="1.7"/>
        {[511, 525, 539, 553].map(y=><line key={y} x1={x+12} y1={y} x2={x+56} y2={y} stroke={REF_GRAY} strokeWidth="1.15" />)}
        {frame >= 220 + i*26 && i < 2 && <path d={`M ${x+12} 529 l 15 17 l 29 -39`} stroke={REF_WHITE} strokeWidth="4" strokeLinejoin="round" fill="none"/>}
      </g>;
    })}
  </g>;
}

export function ReferenceQuestion({ frame }: { frame: number }) {
  return <g opacity={ease((frame - 320)/26)}>
    <rect x="866" y="180" width="294" height="214" fill="#17181b" stroke={REF_WHITE} strokeWidth="2"/>
    <text x="1013" y="219" fontSize="21" fontWeight="650" fill={REF_GRAY} textAnchor="middle">Đề kiểm tra</text>
    <text x="1013" y="307" fontSize="40" fontWeight="700" fill={REF_WHITE} textAnchor="middle">sin 120° = ?</text>
  </g>;
}

export function ReferenceCalculator({ frame }: { frame: number }) {
  const a = ease((frame - 628) / 25);
  return <g opacity={a}>
    <rect x="766" y="434" width="94" height="147" fill="#0b0d0e" stroke={REF_WHITE} strokeWidth="2"/>
    <rect x="777" y="444" width="72" height="33" fill="#0f1111" stroke={REF_WHITE} strokeWidth="1.4"/>
    {Array.from({length:9},(_,i)=> {
      const col = i % 3, row = Math.floor(i/3);
      return <rect key={i} x={780 + 24*col} y={511+22*row} width="17" height="16" fill="#111317" stroke={REF_GRAY} strokeWidth="1.2"/>;
    })}
    {frame >= 720 && <g>
      <rect x="944" y="450" width="95" height="132" fill="#111216" stroke={REF_GRAY}/>
      {[474,501,526,551].map(y=><line key={y} x1="955" x2="1027" y1={y} y2={y} stroke={REF_GRAY}/>)}
    </g>}
  </g>;
}

export function ReferenceAngleAxis({ frame }: { frame: number }) {
  const stage = clamp01((frame-800)/150);
  const rect = clamp01((frame - 896)/28);
  const left = 239, spacing = 133.5, base = 534;
  return <g>
    <text x="638" y="37" fontSize="11" letterSpacing="4.5" fill={REF_GRAY} textAnchor="middle">ĐỊNH NGHĨA ĐƯỢC DẠY</text>
    <text x="639" y="121" fontSize="32" fill={REF_GRAY} fontWeight="700" textAnchor="middle">sin = đối / huyền</text>
    {frame >= 827 && <line x1="479" y1="113" x2="801" y2="113" stroke={REF_WHITE} strokeWidth="3.4"/>}
    <path d="M 145 534 H 1134" stroke="#7f8b9c" strokeWidth="2"/>
    {Array.from({length:7},(_,i)=>{
      const x = left + i*spacing;
      return <g key={i}>
        <path d={`M ${x} 522 V 545`} stroke="#7f8b9c" strokeWidth="2"/>
        <text x={x} y="575" textAnchor="middle" fontSize="19" fontWeight="600" fill={REF_GRAY}>{i*30}°</text>
      </g>;
    })}
    {rect > 0 && <g opacity={rect}>
      <rect x="239" y="246" width={401*rect} height="287" fill="#202124" fillOpacity=".70" stroke={REF_WHITE} strokeWidth="2"/>
      <line x1="640" y1="246" x2="640" y2="534" stroke={REF_CYAN} strokeWidth="3"/>
      <text x="221" y="219" fill={REF_WHITE} fontSize="23" fontWeight="700">Góc nhọn: tam giác vuông dùng được</text>
    </g>}
    <ReferencePerson x={lerp(497, 510, stage)} ground={534}/>
  </g>;
}
