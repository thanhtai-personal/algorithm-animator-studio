import { clamp01, ease, fmt, lerp, project, sinePath, tanPaths } from "./mathGeometry";
import type { MathReferenceBeat } from "./MathReferenceBeats";
import {
  Annotation, AngleLabel, CircleAxes, DegreesRing, REF_CYAN, REF_DIM, REF_ORANGE,
  REF_WHITE, ReferenceCircle, ReferenceWave, RotatingProjection,
} from "./MathReferencePrimitives";

type BeatProps={frame:number;cue:MathReferenceBeat;local:number;t:number};
const beatNumber=(cue:MathReferenceBeat)=>Number(cue.id.replace("beat-",""));

function CircleProof({ frame, cue, t }:BeatProps) {
  const beat=beatNumber(cue);
  const x=425,y=399,r=169;
  const angle=beat===2 ? lerp(5,25,ease(t))
    : beat===3 ? lerp(26,60,t)
    : beat===4 ? lerp(60,90,ease(t))
    : beat===5 ? lerp(90,120,ease(clamp01(t*3)))
    : beat===6 ? 120
    : beat===7 ? lerp(120,240,t)
    : lerp(120,300,t);
  const mirror=beat>=6;
  const comp=beat>=3;
  if (beat === 2 && t < .18) {
    // Source 00:43: axis comes first. Circle and radius draw in after the opening beat.
    return <g><path d="M 320 390 H 596 M 448 226 V 555" stroke={REF_DIM} strokeWidth="1.6" fill="none"/></g>;
  }
  return <g>
    <CircleAxes x={x} y={y} r={r} subtle={beat<6}/>
    {comp && <RotatingProjection x={x} y={y} r={r} angle={angle} showLabels={beat===3||beat===4}/>}
    {!comp && <path d={`M ${x} ${y} L ${fmt(project(x,y,r,angle).x)} ${fmt(project(x,y,r,angle).y)}`}
      stroke={REF_WHITE} strokeWidth="2"/>}
    {beat===2 && <circle cx={project(x,y,r,angle).x} cy={project(x,y,r,angle).y} r="5" fill={REF_WHITE}/>}
    {beat===4 && <g>
      <Annotation x={x+265} y={y-172} color={REF_CYAN} size={21} weight={700}>sin = đối / huyền</Annotation>
      <Annotation x={x+265} y={y-134} color={REF_CYAN} size={17}>= Đọc / 1</Annotation>
      <Annotation x={x+265} y={y-98} color={REF_CYAN} size={17}>= Tọa độ dọc</Annotation>
    </g>}
    {beat===5 && <g>
      <Annotation x={x+265} y={y-156} size={20}>sin 120° &gt; 0 · cos 120° &lt; 0</Annotation>
      <Annotation x={x+265} y={y-110} color={REF_CYAN} size={20}>sin 120° = 0,866</Annotation>
      <Annotation x={x+265} y={y-72} color={REF_ORANGE} size={20}>cos 120° = −0,5</Annotation>
    </g>}
    {mirror && <g opacity=".8">
      <path d={`M ${x} ${y-r-45} V ${y+r+45} H ${x+165}`} fill="none" stroke={REF_DIM} strokeWidth="2"/>
      <path d={`M ${x-95} ${y-146} L ${x} ${y-146} V ${y+162}`}
        fill="none" stroke={REF_WHITE} strokeWidth="1.2"/>
      <path d={`M ${x-110} ${y-132} Q ${x-188} ${y} ${x-115} ${y+130}`} fill="none" stroke={REF_DIM}/>
      <Annotation x={x-118} y={y-r-32} size={16}>120°</Annotation>
      <Annotation x={x+132} y={y-r-35} size={16}>60°</Annotation>
      {beat>=8 && <g>
        <Annotation x={x+290} y={y-112} color={REF_CYAN} size={20}>sin 120° = sin 60°</Annotation>
        <Annotation x={x+290} y={y-72} color={REF_ORANGE} size={20}>cos 120° = −cos 60°</Annotation>
      </g>}
    </g>}
  </g>;
}

function IdentityProof({t}:BeatProps){
  // Source 02:30–02:40: center (427,467), dashed circle r173, 120° radius.
  const x=427,y=467,r=173,p=project(x,y,r,120),cyanSide=y-p.y;
  return <g>
    <Annotation x={955} y={203} size={39} anchor="middle" weight={700}>sin² + cos² = 1</Annotation>
    <Annotation x={955} y={280} size={24} anchor="middle" weight={700}>Ngang² + dọc² = bán kính²</Annotation>
    <circle cx={x} cy={y} r={r} fill="none" stroke={REF_DIM} strokeWidth="1.7" strokeDasharray="8 8"/>
    <path d="M 205 467 H 627" stroke={REF_DIM} strokeWidth="1.3"/>
    <path d={`M ${x} ${y} L ${p.x} ${p.y} V ${y} Z`}
      stroke={REF_WHITE} strokeWidth="2" fill={REF_WHITE} fillOpacity=".09"/>
    <rect x={p.x} y={y} width={x-p.x} height={x-p.x}
      fill={REF_ORANGE} fillOpacity=".27" stroke={REF_ORANGE} strokeWidth="2.5"/>
    {t<.57 ?
      <rect x={p.x-13} y={p.y} width="13" height={cyanSide}
        fill={REF_CYAN} fillOpacity=".20" stroke={REF_CYAN} strokeWidth="3"/> :
      <g>
        <rect x={p.x-cyanSide} y={p.y} width={cyanSide} height={cyanSide}
          fill={REF_CYAN} fillOpacity=".20" stroke={REF_CYAN} strokeWidth="2.5"/>
        <Annotation x={p.x-cyanSide/2} y={p.y+82} color={REF_CYAN} size={23} anchor="middle">0,75</Annotation>
        <Annotation x={x-(x-p.x)/2} y={y+47} color={REF_ORANGE} size={22} anchor="middle">0,25</Annotation>
        <path d={`M ${p.x} ${p.y} L 490 230 L 576 381 L 427 467 Z`}
          fill={REF_WHITE} fillOpacity=".12" stroke={REF_WHITE} strokeWidth="1.8"/>
      </g>}
    <circle cx={p.x} cy={p.y} r="8" fill={REF_WHITE}/>
    {t<.57 && <Annotation x={p.x+57} y={p.y+67} size={20}>1</Annotation>}
    {t>.57 && <Annotation x={957} y={454} anchor="middle" size={28} weight={700}>0,866² + 0,5² = 1</Annotation>}
  </g>;
}

function WaveAndRadian({frame, cue, t}:BeatProps){
  const beat=beatNumber(cue), ph=(frame-4040)/27;
  if(beat===10) {
    const x=630,y=350,r=165;
    return <g><CircleAxes x={x} y={y} r={r}/>
      <path d={`M ${x} ${y} L ${fmt(project(x,y,r,ph*48).x)} ${fmt(project(x,y,r,ph*48).y)}`}
        stroke={REF_WHITE} strokeWidth="2"/>
      <circle cx={project(x,y,r,ph*48).x} cy={project(x,y,r,ph*48).y} r="5" fill={REF_WHITE}/>
    </g>;
  }
  if(beat===11||beat===12){
    return <g>
      <ReferenceWave x={231} y={407} width={850} height={95} cycles={2} phase={0}
        progress={beat===11?ease(t):1} color={beat===11?REF_WHITE:REF_CYAN}/>
      <path d="M 219 387 Q 231 430 242 387" stroke={REF_DIM} strokeWidth="2" fill="none"/>
      {beat===12 && <Annotation x={1064} y={499} color={REF_DIM} size={16}>Thời gian</Annotation>}
      {beat===12 && <Annotation x={301} y={278} color={REF_CYAN} size={22}>sin</Annotation>}
    </g>;
  }
  if(beat===13){
    return <g>
      <DegreesRing x={635} y={390} angle={(t*360)%360}/>
      <Annotation x={905} y={223} size={21}>Năm 1873, Belfast</Annotation>
      <Annotation x={905} y={260} size={20}>Radian</Annotation>
      <Annotation x={550} y={394} color={REF_DIM} size={18}>radian</Annotation>
    </g>;
  }
  return <g>
    <Annotation x={625} y={180} anchor="middle" size={17} color={REF_DIM}>Xuất phát ngang · Lệch pha 90°</Annotation>
    <ReferenceWave x={315} y={407} width={750} height={100} cycles={2} phase={0} color={REF_CYAN}/>
    <ReferenceWave x={315} y={407} width={750} height={100} cycles={2} phase={Math.PI/2} color={REF_ORANGE}/>
    <Annotation x={1084} y={410} color={REF_CYAN} size={18}>sin</Annotation>
    <Annotation x={1084} y={440} color={REF_ORANGE} size={18}>cos</Annotation>
  </g>;
}

function ComplementProof({t}:BeatProps){
  const x=397,y=545;
  return <g>
    <path d={`M ${x} ${y} L 680 215 V ${y} Z`} fill="#8f9297" fillOpacity=".18" stroke={REF_WHITE} strokeWidth="1.7"/>
    <path d={`M 680 ${y-22} H 657 V ${y}`} fill="none" stroke={REF_WHITE} strokeWidth="1.4"/>
    <path d={`M ${x} ${y} H 680`} fill="none" stroke={REF_ORANGE} strokeWidth="3"/>
    <path d={`M 680 215 V ${y}`} fill="none" stroke={REF_CYAN} strokeWidth="3"/>
    <AngleLabel x={x} y={y} r={45} angle={49}/>
    {t>.26 && <Annotation x={905} y={335} size={24}>cos α = sin (90° − α)</Annotation>}
    {t>.65 && <Annotation x={905} y={386} color={REF_DIM} size={19}>Complement sinus → cosinus</Annotation>}
  </g>;
}

function TangentProof({frame,cue,t}:BeatProps){
  const beat=beatNumber(cue),angle=beat===16?lerp(36,80,t):beat===17?lerp(70,98,t):lerp(65,18,t);
  const x=330,y=420,r=123,p=project(x,y,r,angle);
  return <g>
    <Annotation x={178} y={100} size={23} weight={700}>tang = sin / cos</Annotation>
    <Annotation x={178} y={131} color={REF_DIM} size={17}>Không xác định ở 90°</Annotation>
    <CircleAxes x={x} y={y} r={r} subtle/>
    <path d={`M ${x} ${y} L ${fmt(p.x)} ${fmt(p.y)}`} stroke={REF_WHITE} strokeWidth="2"/>
    <path d={`M ${fmt(p.x)} ${fmt(p.y)} V ${y} H ${x}`} stroke={REF_CYAN} strokeWidth="3" fill="none"/>
    <line x1={x+r} y1={y-172} x2={x+r} y2={y+172} stroke={REF_DIM} strokeDasharray="5 8"/>
    {beat>=17 && <g>
      <path d="M 665 263 V 610 M 643 444 H 1149" stroke={REF_DIM} strokeWidth="1.6"/>
      <line x1="939" y1="253" x2="939" y2="609" stroke={REF_DIM} strokeDasharray="5 8"/>
      {tanPaths(665,444,464,75,0.73,360).map((d,i)=><path key={i} d={d} stroke={REF_WHITE} strokeWidth="3" fill="none"/>)}
      <Annotation x={987} y={330} size={18}>tang</Annotation>
      <Annotation x={917} y={638} size={17} color={REF_DIM}>90°</Annotation>
      {beat===17 && <Annotation x={985} y={569} size={16} color={REF_DIM}>Tiệm cận</Annotation>}
    </g>}
    {beat===16 && <path d={`M ${x} ${y} L ${fmt(x+r+55)} ${fmt(y-190)}`} stroke={REF_WHITE} strokeWidth="2"/>}
  </g>;
}

export function MathReferenceChapterA(props:BeatProps){
  switch(props.cue.chapterId){
    case "circle":return <CircleProof {...props}/>;
    case "identity":return <IdentityProof {...props}/>;
    case "wave":return <WaveAndRadian {...props}/>;
    case "complement":return <ComplementProof {...props}/>;
    case "tangent":return <TangentProof {...props}/>;
    default:return null;
  }
}
