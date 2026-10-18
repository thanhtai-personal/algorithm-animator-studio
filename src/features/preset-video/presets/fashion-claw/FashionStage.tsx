import { AbsoluteFill } from "remotion";

type Props = { seconds: number };

/** Overhead set: blue rug, pink sofa to camera-left and a small remote. */
export function FashionLivingRoom() {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#5e798a" }}>
      <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="fashion-rug"><stop offset="0" stopColor="#849ca8" /><stop offset="0.67" stopColor="#668493" /><stop offset="1" stopColor="#425869" /></radialGradient>
          <filter id="fashion-fabric-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="3" seed="8" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope=".19" /></feComponentTransfer>
          </filter>
          <linearGradient id="fashion-sofa" x1="0%" x2="100%" y1="0%" y2="15%">
            <stop offset="0%" stopColor="#c07c74" /><stop offset="30%" stopColor="#f1bcb0" /><stop offset="69%" stopColor="#dfa397" /><stop offset="100%" stopColor="#986765" />
          </linearGradient>
          <linearGradient id="fashion-cushion" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#b77f77" /><stop offset="45%" stopColor="#ecc0b2" /><stop offset="85%" stopColor="#e4ab9e" /><stop offset="100%" stopColor="#bd8077" />
          </linearGradient>
          <filter id="fashion-sofa-shadow" x="-40%" y="-10%" width="180%" height="135%">
            <feDropShadow dx="9" dy="6" stdDeviation="9" floodColor="#112b36" floodOpacity=".42" />
          </filter>
        </defs>
        <rect width="360" height="640" fill="url(#fashion-rug)" />
        <rect width="360" height="640" filter="url(#fashion-fabric-grain)" opacity=".6" />
        <ellipse cx="172" cy="362" rx="178" ry="269" fill="#18394b" opacity=".08" />
        <g filter="url(#fashion-sofa-shadow)">
          <path d="M-48 142 C-23 113 40 116 66 151 C92 192 78 254 69 294 C57 341 67 400 82 465 C98 517 72 568 13 598 L-49 605 Z" fill="#97615e" stroke="#895d57" strokeWidth="5" />
          <path d="M-39 147 C-3 121 36 127 55 155 C77 191 67 256 59 298 C46 354 58 405 72 470 C86 521 52 558 7 583 L-35 584 Z" fill="url(#fashion-sofa)" stroke="#e5ada2" strokeWidth="4" />
          <path d="M-28 157 C7 145 31 149 44 178 C59 210 48 257 46 296 C43 347 55 403 61 452 C66 500 44 540 4 564" fill="none" stroke="#f8d5c5" strokeOpacity=".65" strokeWidth="3" />
          <path d="M-40 510 C-5 492 45 514 59 546 C65 567 33 602 -2 612 L-47 604 Z" fill="url(#fashion-cushion)" stroke="#b07b74" strokeWidth="3" />
          <path d="M-26 526 C-8 522 17 527 30 539" stroke="#ffded0" strokeOpacity=".66" strokeWidth="3" fill="none" />
          <path d="M-36 601 C-9 579 28 574 54 571" stroke="#a76f69" strokeWidth="3" opacity=".55" fill="none" />
        </g>
        <g transform="rotate(-19 319 318)" opacity=".94">
          <rect x="310" y="303" width="15" height="34" rx="3" fill="#203849" opacity=".35" transform="translate(2 3)" />
          <rect x="308" y="300" width="15" height="34" rx="2.5" fill="#e7e9e6" stroke="#8e9da0" strokeWidth="1.2" />
          <circle cx="315.5" cy="306" r="2.2" fill="#566a74" />
          {[0,1,2,3].map((row) => [0,1].map((col) => <rect key={row + "-" + col} x={311 + col * 5} y={314 + row * 4} width="3.2" height="2.3" rx=".8" fill="#879ca2" />))}
        </g>
      </svg>
    </AbsoluteFill>
  );
}

/** Three bronze ceiling-fan blades orbit together around one shared shaft. */
export function FashionCeilingFan({ seconds }: Props) {
  // The downward blade crosses the model at t=0.48 + 0.96n.
  const degrees = 60 + (120 / .96) * seconds;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="fashion-fan-metal" x1="0%" y1="0%" x2="100%" y2="10%">
            <stop offset="0" stopColor="#574036" /><stop offset=".17" stopColor="#986c50" />
            <stop offset=".4" stopColor="#eac29d" /><stop offset=".58" stopColor="#bc8763" />
            <stop offset=".84" stopColor="#714c3b" /><stop offset="1" stopColor="#453129" />
          </linearGradient>
          <linearGradient id="fashion-fan-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#32241f" /><stop offset=".3" stopColor="#cc9670" />
            <stop offset=".58" stopColor="#f0cb9f" /><stop offset="1" stopColor="#54392f" />
          </linearGradient>
          <radialGradient id="fashion-fan-boss" cx=".35" cy=".25">
            <stop offset="0" stopColor="#f6d3a8" /><stop offset=".4" stopColor="#a87652" /><stop offset="1" stopColor="#47312a" />
          </radialGradient>
          <filter id="fashion-fan-shadow" x="-100%" y="-20%" width="300%" height="160%">
            <feDropShadow dx="4" dy="13" stdDeviation="7" floodColor="#101922" floodOpacity=".46" />
          </filter>
        </defs>
        <g filter="url(#fashion-fan-shadow)" transform={"rotate(" + degrees + " 180 36)"}>
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={"rotate(" + angle + " 180 36)"}>
              <path
                d="M168 35 L192 35 Q212 96 218 174 L222 591 Q184 611 141 595 L144 179 Q146 93 168 35 Z"
                fill="url(#fashion-fan-metal)" stroke="#56392c" strokeWidth="3"
              />
              <path d="M171 72 Q155 171 154 333 L153 571" fill="none" stroke="#ffddac" strokeWidth="5" strokeOpacity=".5" />
              <path d="M199 74 Q212 195 210 374 L207 567" fill="none" stroke="#573c30" strokeWidth="4" strokeOpacity=".45" />
              <path d="M161 77 Q182 90 206 77" fill="none" stroke="#3d2924" strokeWidth="5" />
              <circle cx="171" cy="79" r="5" fill="#765444" stroke="#d5ae8c" strokeWidth="1.5" />
              <circle cx="198" cy="79" r="5" fill="#765444" stroke="#d5ae8c" strokeWidth="1.5" />
            </g>
          ))}
        </g>
        <g filter="url(#fashion-fan-shadow)">
          <ellipse cx="180" cy="-38" rx="155" ry="109" fill="url(#fashion-fan-metal)" stroke="#553e30" strokeWidth="6" />
          <path d="M26 26 Q180 114 334 26 L327 48 Q180 130 33 48 Z" fill="url(#fashion-fan-rim)" stroke="#4b332a" strokeWidth="3" />
          <ellipse cx="180" cy="-35" rx="146" ry="99" fill="none" stroke="#f5d3b4" strokeOpacity=".38" strokeWidth="4" />
          <circle cx="180" cy="18" r="25" fill="url(#fashion-fan-boss)" stroke="#4a2e25" strokeWidth="6" />
          <circle cx="180" cy="18" r="9" fill="#e4b38c" stroke="#78513b" strokeWidth="3" />
          {[76,284].map((x) => <g key={x}><circle cx={x} cy="40" r="6.5" fill="#563b2f" /><circle cx={x} cy="40" r="2.3" fill="#f7d0a5" /></g>)}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
