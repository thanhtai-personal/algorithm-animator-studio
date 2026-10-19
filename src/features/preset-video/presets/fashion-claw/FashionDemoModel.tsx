import type { FashionModelPose } from "./fashionModelMotion";
import { FASHION_LOOKS } from "./fashionOutfitTimeline";

/** Transparent articulated vector placeholder; independent of customer photos. */
export function FashionDemoModel({ variation, pose }: { variation: number; pose?: FashionModelPose }) {
  const palette = FASHION_LOOKS[((variation % FASHION_LOOKS.length) + FASHION_LOOKS.length) % FASHION_LOOKS.length];
  const sleeve = palette.id === "black-white" ? "#f8ede6" : palette.dressColor;
  const bagFill = palette.handbag === "blush" ? "#dcaaa5" : palette.handbag === "blue-grey" ? "#98b8c3" : "#e79fb1";
  const p = pose ?? { leftArmDeg: 0, rightArmDeg: 0, leftLegDeg: 0, rightLegDeg: 0, headDeg: 0, skirtScale: 1 };
  return (
    <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet" aria-label="Người mẫu minh họa có cử động tay chân khi nằm trên thảm">
      <defs>
        <filter id="fashion-person-shadow"><feDropShadow dx="4" dy="6" stdDeviation="6" floodOpacity=".27" /></filter>
        <linearGradient id="fashion-person-skin"><stop stopColor="#f4d2bd" /><stop offset="1" stopColor="#c89279" /></linearGradient>
      </defs>
      <g filter="url(#fashion-person-shadow)">
        <g transform={`rotate(${p.leftLegDeg} 184 381)`}>
          <path d="M165 376 L177 460 L179 528 Q183 542 194 532 L200 448 L203 376 Z" fill="url(#fashion-person-skin)" />
          <path d="M177 520 L196 523 L196 548 Q174 557 169 540 Z" fill={palette.shoeColor} />
        </g>
        <g transform={`rotate(${p.rightLegDeg} 212 381)`}>
          <path d="M200 376 L210 462 L224 518 Q229 531 240 519 L236 442 L230 373 Z" fill="url(#fashion-person-skin)" />
          <path d="M226 514 L242 505 L247 529 Q240 543 219 540 Z" fill={palette.shoeColor} />
        </g>
        <g transform={`rotate(${p.leftArmDeg} 155 220)`}>
          <path d="M162 174 L154 204 L119 232 L105 258 Q94 275 110 279 Q126 281 132 262 L155 243 L161 286 Z" fill="#f0d0ba" />
          <path d="M154 207 L120 232 L131 251 L158 233 Z" fill={sleeve} opacity=".9" />
        </g>
        <g transform={`rotate(${p.rightArmDeg} 217 220)`}>
          <path d="M211 180 L221 208 L256 235 L270 253 Q279 268 266 279 Q252 281 245 267 L217 243 L201 283 Z" fill="#efd0b9" />
          <path d="M220 208 L255 233 L245 252 L213 234 Z" fill={sleeve} opacity=".9" />
        </g>
        <g transform={`translate(190 313) scale(${p.skirtScale} 1) translate(-190 -313)`}>
          <path d="M158 219 Q183 202 218 219 L230 287 Q240 305 271 363 Q215 407 123 367 Q139 319 150 285 Z" fill={palette.dressColor} stroke="#664f52" strokeWidth="2" />
          <path d="M151 285 Q184 294 226 285" fill="none" stroke={palette.laceColor} strokeWidth="6" opacity=".75" />
          <path d="M123 365 Q186 392 271 363" fill="none" stroke={palette.laceColor} strokeWidth="9" />
          <path d="M161 219 L173 261 Q182 279 192 258 L202 221" fill={palette.laceColor} />
          {palette.id === "champagne" ? Array.from({length: 17}, (_, i) => (
            <circle key={i} cx={153 + (i % 5) * 14} cy={279 + Math.floor(i / 5) * 20}
              r="2.3" fill="#f9e9ca" opacity=".85" />
          )) : null}
          {palette.id === "silver-blue" ? (
            <g opacity=".76" stroke={palette.laceColor} strokeWidth="3" fill="none">
              <path d="M139 337 Q191 359 254 338 M134 352 Q195 374 259 353" />
            </g>
          ) : null}
          {palette.id === "pink" ? (
            <path d="M137 323 Q191 341 250 320 M125 349 Q184 379 267 350"
              fill="none" stroke="#fae3eb" strokeWidth="6" opacity=".72" />
          ) : null}
        </g>
        <g transform={`rotate(${p.headDeg} 188 175)`}>
          <path d="M146 195 Q124 133 161 122 Q199 109 221 140 Q253 180 266 201 Q244 212 225 185 L170 194 Q144 214 116 205 Z" fill="#292029" />
          <path d="M164 178 Q148 150 165 136 Q185 123 205 138 Q222 164 211 190 Q201 216 184 207 Q170 198 164 178 Z" fill="url(#fashion-person-skin)" />
          <path d="M159 170 Q148 137 170 126 Q195 114 212 140 Q207 149 197 145 Q183 152 163 147 Z" fill="#211922" />
          <path d="M176 170 L182 169 M196 169 L202 169" stroke="#402829" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M187 186 Q193 191 199 185" stroke="#a64c59" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M157 192 Q144 201 140 214 M215 190 Q230 198 240 212" fill="none" stroke="#2c222c" strokeWidth="12" strokeLinecap="round" />
        </g>
        {palette.handbag ? (
          <g transform="translate(278 327) rotate(-17)">
            <path d="M-12 -11 Q-9 -28 0 -28 Q10 -28 13 -11"
              stroke={bagFill} strokeWidth="4.5" fill="none" />
            <rect x="-17" y="-13" width="36" height="27" rx="6"
              fill={bagFill} stroke="#896d6f" strokeWidth="1.4" />
            <path d="M-16 -3 L2 5 L18 -3" fill="none" stroke="#fff3ee" strokeWidth="2" opacity=".8" />
            <circle cx="2" cy="4" r="2" fill="#d7bb8c" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
