/** Lightweight vector stand-in shown before the user uploads outfit photos. */
export function FashionDemoModel({ variation }: { variation: number }) {
  const palette = [
    { dress: "#23222d", lace: "#f8ebe2" },
    { dress: "#f0b9c5", lace: "#fff4ee" },
    { dress: "#d7ccad", lace: "#fff1d9" },
  ][variation % 3];
  return (
    <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet" aria-label="Người mẫu minh họa nhìn từ trên xuống">
      <defs>
        <filter id="fashion-person-shadow"><feDropShadow dx="4" dy="6" stdDeviation="6" floodOpacity=".27" /></filter>
        <linearGradient id="fashion-person-skin"><stop stopColor="#f4d2bd" /><stop offset="1" stopColor="#c89279" /></linearGradient>
      </defs>
      <g filter="url(#fashion-person-shadow)">
        <path d="M146 195 Q124 133 161 122 Q199 109 221 140 Q253 180 266 201 Q244 212 225 185 L170 194 Q144 214 116 205 Z" fill="#292029" />
        <path d="M162 174 L154 204 L119 232 L105 258 Q94 275 110 279 Q126 281 132 262 L155 243 L161 286 Z" fill="#f0d0ba" />
        <path d="M211 180 L221 208 L256 235 L270 253 Q279 268 266 279 Q252 281 245 267 L217 243 L201 283 Z" fill="#efd0b9" />
        <path d="M165 376 L177 460 L179 528 Q183 542 194 532 L200 448 L203 376 Z" fill="url(#fashion-person-skin)" />
        <path d="M200 376 L210 462 L224 518 Q229 531 240 519 L236 442 L230 373 Z" fill="url(#fashion-person-skin)" />
        <path d="M177 520 L196 523 L196 548 Q174 557 169 540 Z M226 514 L242 505 L247 529 Q240 543 219 540 Z" fill="#1c1b20" />
        <path d="M158 219 Q183 202 218 219 L230 287 Q240 305 271 363 Q215 407 123 367 Q139 319 150 285 Z" fill={palette.dress} stroke="#664f52" strokeWidth="2" />
        <path d="M151 285 Q184 294 226 285" fill="none" stroke={palette.lace} strokeWidth="6" opacity=".75" />
        <path d="M123 365 Q186 392 271 363" fill="none" stroke={palette.lace} strokeWidth="9" />
        <path d="M161 219 L173 261 Q182 279 192 258 L202 221" fill={palette.lace} />
        <path d="M164 178 Q148 150 165 136 Q185 123 205 138 Q222 164 211 190 Q201 216 184 207 Q170 198 164 178 Z" fill="url(#fashion-person-skin)" />
        <path d="M159 170 Q148 137 170 126 Q195 114 212 140 Q207 149 197 145 Q183 152 163 147 Z" fill="#211922" />
        <path d="M176 170 L182 169 M196 169 L202 169" stroke="#402829" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M187 186 Q193 191 199 185" stroke="#a64c59" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M157 192 Q144 201 140 214 M215 190 Q230 198 240 212" fill="none" stroke="#2c222c" strokeWidth="12" strokeLinecap="round" />
      </g>
    </svg>
  );
}
