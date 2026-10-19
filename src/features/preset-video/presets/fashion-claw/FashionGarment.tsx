import { FASHION_LOOKS } from "./fashionOutfitTimeline";
import { getFashionGarmentDetail } from "./fashionVisualStyle";

type Props = { variation: number; skirtScale: number; seconds: number };
/** Separate fabric construction for each of the four original looks. */
export function FashionGarment({ variation, skirtScale, seconds }: Props) {
  const index = Number.isFinite(variation) ? Math.max(0, Math.min(3, Math.floor(variation))) : 0;
  const look = FASHION_LOOKS[index];
  const style = getFashionGarmentDetail(index);
  const shimmer = Math.sin(seconds * 2.1);
  const hem = style.hemY;
  const skirt = style.type === "tulle"
    ? `M158 221 Q187 205 219 222 L231 290 Q254 317 288 ${hem - 19} Q190 ${hem + 20} 103 ${hem - 14} Q129 319 150 287 Z`
    : `M158 221 Q187 208 219 222 L231 288 Q250 329 267 ${hem - 20} Q191 ${hem + 9} 118 ${hem - 18} Q137 323 149 286 Z`;
  return (
    <g transform={`translate(188 320) scale(${skirtScale} 1) translate(-188 -320)`}>
      <defs>
        <linearGradient id="fashion-garment-fabric" x1="0%" y1="5%" x2="100%" y2="20%">
          <stop stopColor={look.dressColor}/>
          <stop offset="36%" stopColor={look.laceColor} stopOpacity=".7"/>
          <stop offset="63%" stopColor={look.dressColor}/>
          <stop offset="100%" stopColor="#3a3945" stopOpacity=".5"/>
        </linearGradient>
      </defs>
      <path d={skirt} fill="url(#fashion-garment-fabric)" stroke={look.dressColor} strokeWidth="2"/>
      <path d="M159 224 Q185 217 219 225 L230 290 Q188 304 148 290Z" fill={look.dressColor} opacity=".87"/>
      <path d="M169 244 Q187 255 214 239 M151 291 Q189 307 233 290" fill="none" stroke={look.laceColor} strokeWidth="2" opacity=".62"/>
      {style.type === "maid" ? (
        <g>
          <path d="M158 221 Q187 245 221 222 L216 263 Q187 271 164 262Z" fill="#faf2eb"/>
          <path d="M172 232 L190 244 L205 234 L197 253 L187 255 L180 249Z" fill="#2a252c"/>
          <path d="M143 296 Q184 308 233 292 L264 365 Q193 389 121 364Z" fill="#27232d"/>
          <path d="M137 351 Q193 372 249 349" fill="none" stroke="#fff1e8" strokeWidth="11"/>
          {Array.from({length: 14},(_,i)=><circle key={i} cx={129+i*10} cy={373+Math.sin(i*.7)*2} r="3.2" fill="#fff6ee"/>)}
          {Array.from({length: 5},(_,i)=><path key={i} d={`M${145+i*20} 302 L${132+i*22} 358`} fill="none" stroke="#b9afb8" strokeWidth="1.8" opacity=".4"/>)}
        </g>
      ) : null}
      {style.type === "champagne" ? (
        <g>
          {[0,1,2].map(n=><g key={n}>
            <path d={`M${139-n*7} ${298+n*34} Q188 ${315+n*32} ${237+n*7} ${298+n*34} L${251+n*7} ${319+n*33} Q188 ${342+n*33} ${125-n*6} ${319+n*33}Z`} fill="#f1dabc" opacity=".3" stroke="#fff3db" strokeWidth="2"/>
            <path d={`M${127-n*3} ${316+n*32} Q190 ${336+n*32} ${253+n*3} ${315+n*32}`} fill="none" stroke="#fff4de" strokeWidth="2.4"/>
          </g>)}
          {Array.from({length:style.sparkleCount},(_,i)=><g key={i} transform={`translate(${150+(i%6)*16} ${252+Math.floor(i/6)*29})`}>
            <circle r={i%3===0?2.7:1.8} fill="#fff9df" opacity={.5+.3*Math.abs(Math.sin(seconds*1.7+i))}/>
            {i%4===0?<path d="M-4 0 H4 M0 -4 V4" stroke="#fff6e6" strokeWidth="1"/>:null}
          </g>)}
        </g>
      ) : null}
      {style.type === "silver" ? (
        <g>
          {[0,1,2].map(n=><g key={n}>
            <path d={`M${136-n*5} ${300+n*30} Q191 ${313+n*31} ${245+n*5} ${300+n*30} L${251+n*5} ${321+n*30} Q190 ${339+n*31} ${125-n*6} ${321+n*30}Z`} fill="#e8f7f8" opacity=".27" stroke="#f6feff" strokeWidth="2"/>
            <path d={`M${129-n*5} ${317+n*29} Q190 ${334+n*30} ${250+n*5} ${316+n*29}`} fill="none" stroke="#f7ffff" strokeWidth="3"/>
          </g>)}
          {[0,1,2,3,4].map(i=><path key={i} d={`M${143+i*21} 290 Q${138+i*22} 336 ${139+i*22} 379`} fill="none" stroke="#efffff" strokeWidth="2" opacity=".5"/>)}
          {Array.from({length:style.sparkleCount},(_,i)=><circle key={i} cx={151+(i%6)*16} cy={259+Math.floor(i/6)*34} r="2" fill="#feffff" opacity=".78"/>)}
        </g>
      ) : null}
      {style.type === "tulle" ? (
        <g>
          {[0,1,2,3].map(n=><g key={n}>
            <path d={`M${145-n*8} ${292+n*24} Q189 ${307+n*25} ${239+n*8} ${292+n*24} Q${265+n*5} ${320+n*23} ${277+n*4} ${353+n*23+shimmer*2} Q189 ${369+n*21} ${109-n*4} ${352+n*24}Z`} fill="#f7cada" opacity={.22+n*.05} stroke="#fff0f6" strokeWidth="2"/>
            <path d={`M${118-n*4} ${357+n*19} Q187 ${374+n*18} ${264+n*4} ${357+n*19}`} fill="none" stroke="#fff4f8" strokeWidth="3" opacity=".7"/>
          </g>)}
          <path d="M171 229 Q191 247 207 230 M175 251 Q191 263 209 247" stroke="#fff5f9" strokeWidth="7" opacity=".8" fill="none"/>
          {[0,1,2,3,4].map(i=><path key={i} d={`M${139+i*24} 300 Q${126+i*25} 360 ${117+i*27} 405`} fill="none" stroke="#ffe7f1" strokeWidth="1.8" opacity=".48"/>)}
        </g>
      ) : null}
      <path d={`M121 ${hem-24} Q188 ${hem+6} 262 ${hem-23}`} fill="none" stroke={look.laceColor} strokeWidth="2" opacity=".88"/>
    </g>
  );
}
