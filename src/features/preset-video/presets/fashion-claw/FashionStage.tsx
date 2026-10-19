import { AbsoluteFill, Img } from "remotion";
export { FashionLivingRoom } from "./FashionLivingRoom";

type Props = { seconds: number };

/** Three bronze ceiling-fan blades orbit together around one shared shaft. */
export function FashionCeilingFan({ seconds, imageSrc }: Props & { imageSrc?: string }) {
  // The downward blade crosses the model at t=0.48 + 0.96n.
  const degrees = 60 + (120 / .96) * seconds;
  if (imageSrc) return <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
    <Img src={imageSrc} style={{ position: "absolute", width: "170%", height: "auto", left: "-35%", top: "-23%", transform: `rotate(${degrees}deg)`, transformOrigin: "50% 43%", filter: "drop-shadow(5px 13px 7px rgba(20,25,32,.45))" }} />
  </AbsoluteFill>;
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
