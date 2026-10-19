import { ease } from "./mathGeometry";
import {
  REF_CYAN, REF_ORANGE, ReferenceAngleAxis, ReferenceCalculator,
  ReferenceCheckCards, ReferencePerson, ReferenceQuestion, ReferenceTriangle,
} from "./MathIntroPrimitives";

export function MathIntro({ frame }: { frame: number }) {
  if (frame >= 800) return <g opacity={frame >= 1000 ? 1-ease((frame-1000)/42) : 1}><ReferenceAngleAxis frame={frame}/></g>;
  return <g>
    <ReferencePerson x={frame < 200 ? 148 : 137} ground={602} pointing={frame >= 223 && frame < 314}/>
    {frame >= 28 && <g opacity={ease((frame - 28) / 25)}>
      <ReferenceTriangle frame={frame}/>
    </g>}
    {frame >= 122 && <text x="379" y="145" fill={REF_CYAN} fontSize="32" fontWeight="700"
      opacity={ease((frame - 122) / 28)}>sin = đối / huyền</text>}
    {frame >= 166 && <text x="380" y="205" fill={REF_ORANGE} fontSize="32" fontWeight="700"
      opacity={ease((frame - 166) / 25)}>cos = kề / huyền</text>}
    {frame >= 210 && frame < 310 && <ReferenceCheckCards frame={frame}/>}
    {frame >= 320 && <ReferenceQuestion frame={frame}/>}
    {frame >= 628 && <ReferenceCalculator frame={frame}/>}
  </g>;
}
