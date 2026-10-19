import { AbsoluteFill } from "remotion";
import { FAN_BLADE_ANGLES, FAN_HUB, getFashionFanMotion } from "./fashionFanMotion";

/** A wide, flat, riveted bronze blade. Coordinates are relative to the common hub. */
function Blades({ angle }: { angle: number }) {
  return (
    <g transform={`rotate(${angle} ${FAN_HUB.x} ${FAN_HUB.y})`}>
      {FAN_BLADE_ANGLES.map((offset) => (
        <g key={offset} transform={`rotate(${offset} ${FAN_HUB.x} ${FAN_HUB.y})`}>
          <path d="M164 62 L197 62 Q205 73 211 90 L220 189 L222 507 Q222 528 214 539 Q180 551 146 539 Q138 530 138 510 L141 189 Q148 92 164 62Z"
            fill="url(#fashion-fan-bronze)" stroke="#634a3d" strokeWidth="2.3" />
          <path d="M146 190 L145 504 Q145 523 150 531" fill="none" stroke="#f8d5af" opacity=".53" strokeWidth="3.5" />
          <path d="M212 187 L216 499 Q216 520 210 529" fill="none" stroke="#392e2b" opacity=".52" strokeWidth="4" />
          <path d="M153 208 Q181 225 212 209" stroke="#4e3e36" strokeWidth="2.1" opacity=".18" fill="none" />
          <path d="M142 382 Q180 394 220 380 L221 414 Q179 427 140 413Z" fill="#372a24" opacity=".14" />
          <path d="M140 464 Q182 476 221 464 L222 489 Q179 498 139 489Z" fill="#46332c" opacity=".14" />
          <path d="M157 78 Q180 92 202 78 L205 100 Q181 111 154 100Z" fill="url(#fashion-fan-hinge)" stroke="#77533f" strokeWidth="1.4" />
          <rect x="162" y="92" width="36" height="12" rx="4" fill="#805f4b" opacity=".73" />
          <path d="M166 95 H195" stroke="#e8bf98" strokeWidth="2" opacity=".58" />
          {[168, 192].map((x) => (
            <g key={x}>
              <circle cx={x} cy="111" r="5.7" fill="#5b473a" stroke="#ba987c" strokeWidth="1.4" />
              <circle cx={x} cy="111" r="2.3" fill="#c9a187" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

/** T03: ceiling fan mounted above model, independent of external clipart assets. */
export function FashionCeilingFan({ seconds }: { seconds: number; imageSrc?: string }) {
  const motion = getFashionFanMotion(seconds);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
        <defs>
          <linearGradient id="fashion-fan-bronze" x1="0%" y1="0%" x2="100%" y2="4%">
            <stop offset="0%" stopColor="#51453d" />
            <stop offset="10%" stopColor="#917665" />
            <stop offset="29%" stopColor="#b69b7f" />
            <stop offset="46%" stopColor="#bda58b" />
            <stop offset="64%" stopColor="#8c7363" />
            <stop offset="82%" stopColor="#826757" />
            <stop offset="100%" stopColor="#41352e" />
          </linearGradient>
          <linearGradient id="fashion-fan-hinge" x1="10%" y1="10%" x2="90%" y2="85%">
            <stop offset="0%" stopColor="#d7b393" /><stop offset="48%" stopColor="#8e6d56" /><stop offset="100%" stopColor="#594335" />
          </linearGradient>
          <linearGradient id="fashion-fan-housing" x1="0%" y1="0%" x2="100%" y2="13%">
            <stop offset="0%" stopColor="#3c2c26" /><stop offset="14%" stopColor="#8a6246" />
            <stop offset="32%" stopColor="#d6a276" /><stop offset="50%" stopColor="#7b5239" />
            <stop offset="70%" stopColor="#c1936d" /><stop offset="87%" stopColor="#6f4c39" /><stop offset="100%" stopColor="#392b26" />
          </linearGradient>
          <radialGradient id="fashion-fan-boss" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#f0cfaa" /><stop offset="44%" stopColor="#b68b63" /><stop offset="100%" stopColor="#453328" />
          </radialGradient>
          <filter id="fashion-fan-rotor-shadow" x="-70%" y="-20%" width="240%" height="180%">
            <feDropShadow dx="4" dy="11" stdDeviation="6" floodColor="#15202b" floodOpacity=".45" />
          </filter>
        </defs>
        {/* Temporal echoes follow, never lead, the current blade position. */}
        {motion.blurStrength > .035 ? motion.trails.map((angle, index) => (
          <g key={index} opacity={motion.blurStrength * (0.11 - index * .023)}>
            <Blades angle={angle} />
          </g>
        )) : null}
        <g opacity={0.97 - motion.blurStrength * .29} filter="url(#fashion-fan-rotor-shadow)">
          <Blades angle={motion.angleDegrees} />
        </g>
        {/* The fixed lamp/hub overlays the moving blades, as in the overhead reference. */}
        <g>
          <ellipse cx="180" cy="-34" rx="137" ry="111" fill="#3a2b26" opacity=".47" />
          <ellipse cx="180" cy="-39" rx="135" ry="109" fill="url(#fashion-fan-housing)" stroke="#3c2c23" strokeWidth="5" />
          <ellipse cx="180" cy="-45" rx="123" ry="103" fill="none" stroke="#f6d0a1" strokeOpacity=".33" strokeWidth="4" />
          <path d="M46 25 Q180 94 314 25 L309 55 Q180 112 51 55Z" fill="url(#fashion-fan-housing)" stroke="#48332a" strokeWidth="3" />
          <path d="M55 33 Q180 94 305 33" stroke="#edc39a" strokeWidth="2.6" opacity=".52" fill="none" />
          {[84,276].map((x) => (
            <g key={x}>
              <circle cx={x} cy="45" r="7" fill="#533b2d" stroke="#c69b75" strokeWidth="1.5" />
              <circle cx={x} cy="45" r="2.3" fill="#d7b18f" />
            </g>
          ))}
          <ellipse cx="180" cy="48" rx="40" ry="9" fill="#372b24" opacity=".7" />
          <circle cx="180" cy="37" r="20" fill="url(#fashion-fan-boss)" stroke="#483228" strokeWidth="5" />
          <circle cx="180" cy="37" r="6.5" fill="#e6c39b" stroke="#755039" strokeWidth="2" />
        </g>
      </svg>
    </AbsoluteFill>
  );
}
