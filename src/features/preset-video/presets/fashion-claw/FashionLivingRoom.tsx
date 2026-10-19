import { AbsoluteFill } from "remotion";
import { getFashionRemotePose } from "./fashionSetTiming";

/**
 * T02 scene-only overhead set in 360x640 source coordinates.
 * Fan and model remain independent layers for T03 and T04.
 */
export function FashionLivingRoom({ seconds = 0 }: { seconds?: number }) {
  const remote = getFashionRemotePose(seconds);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#637b8b" }}>
      <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="fashion-set-rug" cx="58%" cy="34%" r="90%">
            <stop offset="0%" stopColor="#8299a7" />
            <stop offset="49%" stopColor="#6f8797" />
            <stop offset="78%" stopColor="#5d7180" />
            <stop offset="100%" stopColor="#405767" />
          </radialGradient>
          <filter id="fashion-set-rug-mottle" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.019 0.030" numOctaves="4" seed="13" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope="0.29" /></feComponentTransfer>
          </filter>
          <filter id="fashion-set-rug-fibres" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.31 0.21" numOctaves="2" seed="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope="0.10" /></feComponentTransfer>
          </filter>
          <linearGradient id="fashion-set-seat" x1="10%" y1="5%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#eab4a7" />
            <stop offset="30%" stopColor="#dfa396" />
            <stop offset="62%" stopColor="#d49488" />
            <stop offset="100%" stopColor="#a76966" />
          </linearGradient>
          <linearGradient id="fashion-set-seam" x1="10%" y1="0%" x2="100%" y2="15%">
            <stop offset="0%" stopColor="#aa6d68" />
            <stop offset="46%" stopColor="#efbeb0" />
            <stop offset="78%" stopColor="#cc8e86" />
            <stop offset="100%" stopColor="#8d5756" />
          </linearGradient>
          <linearGradient id="fashion-set-pillow" x1="0%" y1="0%" x2="90%" y2="85%">
            <stop offset="0%" stopColor="#e4a99e" />
            <stop offset="55%" stopColor="#d4948e" />
            <stop offset="100%" stopColor="#ac706c" />
          </linearGradient>
          <filter id="fashion-set-sofa-shadow" x="-50%" y="-10%" width="200%" height="150%">
            <feDropShadow dx="6" dy="7" stdDeviation="7" floodColor="#1f2b3b" floodOpacity="0.52" />
          </filter>
          <filter id="fashion-set-remote-shadow" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#172432" floodOpacity="0.38" />
          </filter>
        </defs>
        {/* Blue mottled rug, full bleed. */}
        <rect width="360" height="640" fill="url(#fashion-set-rug)" />
        <rect width="360" height="640" filter="url(#fashion-set-rug-mottle)" opacity="0.63" />
        <rect width="360" height="640" filter="url(#fashion-set-rug-fibres)" opacity="0.48" />
        <path d="M0 0 H360 V640 H0 Z" fill="#162d3b" opacity="0.045" />

        {/* Dusty-rose curved sofa entering from left; detailed seams and tufted cushion. */}
        <g filter="url(#fashion-set-sofa-shadow)">
          <path d="M-85 103 C-27 92 24 103 50 125 C85 160 93 208 82 284 C73 345 80 425 92 480 C109 549 67 583 -3 602 L-85 605 Z"
            fill="#855c5b" stroke="#785157" strokeWidth="4" />
          <path d="M-88 114 C-30 105 17 114 38 136 C71 168 79 222 69 285 C57 351 70 420 80 477 C90 536 58 560 -5 583 L-89 585 Z"
            fill="url(#fashion-set-seat)" stroke="#c4847a" strokeWidth="3" />
          <path d="M-7 112 C46 117 68 154 75 203 C83 261 65 306 62 346 C62 400 84 472 80 502 C75 552 48 568 0 578"
            fill="none" stroke="#986969" strokeWidth="11" opacity="0.78" />
          <path d="M-7 114 C42 120 64 159 70 203 C77 260 60 309 57 348 C56 406 77 471 75 501 C70 548 47 565 -2 573"
            fill="none" stroke="url(#fashion-set-seam)" strokeWidth="7" />
          <path d="M-8 114 C40 120 61 156 68 200 C74 258 56 305 54 346 C53 406 76 474 70 506"
            fill="none" stroke="#ffe1d0" strokeWidth="1.9" opacity="0.72" />
          <path d="M-75 512 C-34 492 23 493 51 518 C71 535 64 572 34 584 C-7 608 -53 603 -80 588 Z"
            fill="url(#fashion-set-pillow)" stroke="#ad7975" strokeWidth="3" />
          <path d="M-80 517 C-29 504 5 509 27 529 M-47 595 C-22 572 10 566 45 576"
            fill="none" stroke="#f2c9b8" strokeWidth="2" opacity="0.72" />
          <path d="M-28 511 C-22 548 -8 563 23 573 M-75 543 C-48 552 -33 573 -31 595"
            fill="none" stroke="#9e6b6b" strokeWidth="1.8" opacity="0.48" />
          <circle cx="-9" cy="556" r="2.2" fill="#a87372" />
          <circle cx="24" cy="568" r="2" fill="#a87372" />
        </g>

        {/* White remote diagonally beside black outfit; upright for champagne. */}
        {remote.visible ? (
          <g transform={"translate(" + remote.x + " " + remote.y + ") rotate(" + remote.rotation + ")"} filter="url(#fashion-set-remote-shadow)">
            <rect x="-6" y="-17" width="12" height="34" rx="2.3" fill="#e4e5e2" stroke="#707e80" strokeWidth="1.1" />
            <rect x="-4.8" y="-15.5" width="9.6" height="30.5" rx="1.5" fill="#f6f2e9" />
            <circle cx="0" cy="-11.5" r="1.75" fill="#666f75" />
            <rect x="-3.6" y="-7.7" width="7.2" height="3" rx="1" fill="#9fa6a5" />
            {Array.from({ length: 5 }, (_, row) => (
              <g key={row}>
                <rect x="-3.7" y={-2.3 + row * 3.05} width="3" height="2.1" rx="0.65" fill="#acb1ad" />
                <rect x="0.8" y={-2.3 + row * 3.05} width="3" height="2.1" rx="0.65" fill="#acb1ad" />
              </g>
            ))}
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
