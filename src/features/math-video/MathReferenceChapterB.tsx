import { clamp01, ease, fmt, lerp, project, radians } from "./mathGeometry";
import type { MathReferenceBeat } from "./MathReferenceBeats";
import {
  Annotation, CircleAxes, Fork, REF_CYAN, REF_DIM, REF_ORANGE, REF_WHITE,
  ReferenceWave, RotatingProjection, SmallNoteBox, SourceFigure, TickAxis,
} from "./MathReferencePrimitives";

type BeatProps={frame:number;cue:MathReferenceBeat;local:number;t:number};
const number=(cue:MathReferenceBeat)=>Number(cue.id.replace("beat-",""));

export function MathReferenceLogo({ subscribe=true }: {subscribe?:boolean}){
  return <g>
    <Annotation x={621} y={292} anchor="middle" color={REF_CYAN} size={95}>∞</Annotation>
    <Annotation x={758} y={290} anchor="middle" color={REF_WHITE} size={53} weight={700}>VÔ HẠN</Annotation>
    <Annotation x={660} y={343} anchor="middle" color={REF_DIM} size={20}>Càng đào càng thấy</Annotation>
    {subscribe&&<g>
      <Annotation x={615} y={436} color={REF_CYAN} size={28} anchor="middle">👍</Annotation>
      <Annotation x={708} y={436} color={REF_CYAN} size={28} anchor="middle">●</Annotation>
      <Annotation x={615} y={467} size={17} anchor="middle">Thích</Annotation>
      <Annotation x={708} y={467} size={17} anchor="middle">Đăng ký</Annotation>
    </g>}
  </g>;
}

function HistoryChords({cue,frame,t}:BeatProps){
  const beat=number(cue),x=337,y=405,r=156;
  const p=project(x,y,r,70),q=project(x,y,r,-70);
  return <g>
    <circle cx={x} cy={y} r={r} stroke={REF_DIM} strokeWidth="2" fill="none"/>
    <path d={`M ${x-r-45} ${y} H ${x+r+60}`} stroke={REF_DIM} strokeWidth="1.5"/>
    <path d={`M ${fmt(p.x)} ${fmt(p.y)} Q ${x+r+25} ${y} ${fmt(q.x)} ${fmt(q.y)}`}
      stroke={REF_WHITE} strokeWidth="4" fill="none"/>
    <path d={`M ${fmt(p.x)} ${fmt(p.y)} V ${fmt(q.y)}`} stroke={REF_CYAN} strokeWidth="3"/>
    <circle cx={p.x} cy={p.y} r="5" fill={REF_WHITE}/>
    {beat===19 ? <g>
      <Annotation x={785} y={240} anchor="middle" size={27} weight={700}>Jiba</Annotation>
      <Annotation x={785} y={281} anchor="middle" size={18} color={REF_DIM}>Khoảng một nửa dây cung</Annotation>
      {t>.55&&<Annotation x={670} y={350} size={20}>jyā · Dây cung</Annotation>}
    </g>:<g>
      <Annotation x={761} y={234} anchor="middle" size={31}>j　y　b</Annotation>
      {beat>=20&&<Annotation x={760} y={355} anchor="middle" color={REF_CYAN} size={29} weight={700}>{beat===20&&t<.55?"sinus":"sin"}</Annotation>}
      {t>.22&&<Annotation x={761} y={287} anchor="middle" color={REF_DIM} size={18}>Tiếng Phạn → Latin</Annotation>}
      {beat===21&&<Annotation x={762} y={441} anchor="middle" size={16}>Nửa dây cung · Hàm sin</Annotation>}
    </g>}
  </g>;
}

function SoundWaves({cue,frame,t}:BeatProps){
  const beat=number(cue);
  if(beat===24) return <MathReferenceLogo/>;
  const active=(frame-8640)*.12;
  return <g>
    <Fork x={205} y={335} shiver={beat===22?Math.sin(active)*1.3:0.3}/>
    <ReferenceWave x={330} y={357} width={755} height={66} cycles={beat===22?5:7}
      phase={active} color={REF_CYAN} progress={ease(t*2)}/>
    <Annotation x={200} y={509} size={17} anchor="middle">Âm thoa</Annotation>
    {beat===23&&<g>
      <ReferenceWave x={330} y={357} width={755} height={31} cycles={11} phase={active*.7} color={REF_DIM}/>
      <Annotation x={768} y={225} color={REF_DIM} size={19} anchor="middle">Tần số âm thanh</Annotation>
    </g>}
  </g>;
}

function SunShadow({t}:BeatProps){
  const cx=450,cy=212,ground=558;
  return <g>
    <path d="M 160 558 H 1080" stroke={REF_DIM} strokeWidth="2"/>
    <SourceFigure x={198} ground={ground} gesture={1}/>
    <circle cx={cx} cy={cy} r="27" fill="#d1d5d9"/>
    {Array.from({length:10},(_,i)=>{
      const a=i*Math.PI*2/10,px=cx+40*Math.cos(a),py=cy+40*Math.sin(a);
      return <path key={i} d={`M ${fmt(px)} ${fmt(py)} l ${fmt(12*Math.cos(a))} ${fmt(12*Math.sin(a))}`} stroke={REF_WHITE} strokeWidth="2"/>;
    })}
    <path d={`M ${cx} ${cy} L 915 558`} stroke={REF_WHITE} strokeWidth="2"/>
    {t>.28&&<g>
      <path d="M 730 558 V 414" stroke={REF_CYAN} strokeWidth="3"/>
      <path d="M 730 558 H 915" stroke={REF_ORANGE} strokeWidth="3"/>
      <Annotation x={731} y={396} color={REF_CYAN}>1 m</Annotation>
      <Annotation x={809} y={583} color={REF_ORANGE} size={17}>bóng nắng</Annotation>
    </g>}
    <Annotation x={865} y={327} size={20}>Độ dốc = tang h</Annotation>
  </g>;
}

function EarthSeasons({frame,t}:BeatProps){
  const x=644,y=359,r=184;
  const shift=Math.sin((frame-9445)/93)*14;
  return <g>
    <g transform={`rotate(-24 ${x} ${y})`}>
      <circle cx={x} cy={y} r={r} fill="#8793a5" stroke={REF_WHITE} strokeWidth="1.5"/>
      <ellipse cx={x} cy={y} rx={r} ry="39" fill="none" stroke="#d8dce2" strokeWidth="2.2"/>
      <path d={`M ${x-r-10} ${y} H ${x+r+10}`} stroke={REF_CYAN} strokeWidth="4"/>
    </g>
    <path d={`M ${x-60+shift} ${y+r+80} L ${x+65+shift} ${y-r-78}`} stroke={REF_WHITE} strokeWidth="1.6"/>
    <circle cx={271} cy={554} r="50" fill={REF_WHITE}/>
    {Array.from({length:5},(_,i)=><path key={i}
      d={`M 368 ${488+i*22} l 123 -31`} stroke={REF_WHITE} strokeWidth="1.6"/>)}
    <path d="M 893 250 H 1177" fill="none" stroke={REF_DIM} strokeWidth="2"/>
    <path d="M 1035 250 V 114" stroke={REF_CYAN} strokeWidth="7"/>
    <path d="M 1035 250 H 1088" stroke={REF_ORANGE} strokeWidth="8"/>
    <Annotation x={1035} y={90} color={REF_DIM} anchor="middle" size={17}>Không theo tỉ lệ</Annotation>
    <path d="M 1035 114 L 1088 250" fill="none" stroke={REF_WHITE} strokeWidth="2.2"/>
    <Annotation x={413} y={365} size={23} weight={700}>Hà Nội</Annotation>
    <Annotation x={425} y={328} size={20}>69°</Annotation>
    <Annotation x={396} y={59} size={24} weight={700} anchor="middle">{t<.24?"Hạ chí":t<.75?"Thu phân":"Đông chí"}</Annotation>
    <Annotation x={396} y={112} size={21} color={REF_ORANGE} anchor="middle">Bóng 38 cm</Annotation>
    <Annotation x={889} y={283} color={REF_DIM} size={17}>Nam</Annotation>
    <Annotation x={1176} y={283} color={REF_DIM} size={17} anchor="end">Bắc</Annotation>
  </g>;
}

function TideCurve({frame}:BeatProps){
  return <g>
    <SourceFigure x={141} ground={580}/>
    <path d="M 260 220 V 535 H 1097" stroke={REF_DIM} strokeWidth="2" fill="none"/>
    <TickAxis x={260} y={535} width={810} step={22}/>
    <ReferenceWave x={262} y={392} width={800} height={126} cycles={.99}
      phase={Math.PI/2} color={REF_ORANGE}/>
    <Annotation x={277} y={240} size={18} color={REF_DIM}>Độ cao nước</Annotation>
    <Annotation x={276} y={302} color={REF_ORANGE} size={17}>Bắc</Annotation>
    <Annotation x={278} y={518} color={REF_CYAN} size={17}>Nam</Annotation>
    <Annotation x={1080} y={563} size={18} color={REF_DIM}>Tháng</Annotation>
    {frame>10100&&<Annotation x={735} y={458} color={REF_WHITE} size={17}>Thủy triều theo chu kỳ</Annotation>}
  </g>;
}

function TreeHeight({frame,t}:BeatProps){
  return <g>
    <path d="M 130 569 H 1150" stroke={REF_DIM} strokeWidth="2"/>
    <path d="M 687 569 V 279 M 645 333 Q 590 299 624 257 Q 648 232 664 199 Q 690 167 718 206 Q 737 246 767 283 Q 781 318 737 347 Z"
      stroke={REF_WHITE} strokeWidth="2.5" fill="#92999f" fillOpacity=".28"/>
    <path d="M 760 569 L 650 211" stroke={REF_WHITE} strokeWidth="1.8"/>
    <SourceFigure x={770} ground={569}/>
    <path d="M 687 569 H 770" stroke={REF_ORANGE} strokeWidth="3"/>
    <path d="M 570 569 V 237" stroke={REF_CYAN} strokeWidth="3"/>
    <Annotation x={555} y={415} size={17} color={REF_CYAN}>≈13 m</Annotation>
    <Annotation x={728} y={604} size={17} color={REF_ORANGE}>5 m</Annotation>
    <Annotation x={860} y={270} size={23} weight={700}>5 × tang 69° = 13 m</Annotation>
    {t>.65&&<Annotation x={860} y={321} size={18} color={REF_DIM}>Đo cây bằng lượng giác</Annotation>}
  </g>;
}
function Wheelchair({x=264,y=558}:{x?:number;y?:number}) {
  return <g stroke={REF_WHITE} strokeWidth="3" fill="none">
    <circle cx={x+35} cy={y-14} r="17"/><circle cx={x+35} cy={y-14} r="7"/>
    <circle cx={x+14} cy={y-54} r="6" fill={REF_WHITE}/>
    <path d={`M ${x+14} ${y-46} L ${x+22} ${y-28} H ${x+52} M ${x+22} ${y-28} V ${y-10}`}/>
  </g>;
}
function WheelchairSlope({frame,t}:BeatProps){
  const ground=576;
  const w=lerp(220,700,ease(t)),rise=lerp(2,42,ease(t));
  return <g>
    <Annotation x={635} y={107} size={20} anchor="middle">QCVN 10:2024 — độ dốc dốc lên tối đa</Annotation>
    <Annotation x={635} y={140} size={18} anchor="middle">1/12 = 8,33%</Annotation>
    <path d={`M 150 ${ground} H 1174`} stroke={REF_DIM} strokeWidth="2"/>
    <SourceFigure x={236} ground={ground}/>
    <Wheelchair x={256} y={ground}/>
    <path d={`M 480 ${ground} L ${480+w} ${ground-rise} L ${480+w} ${ground} Z`}
      fill="#92989d" fillOpacity=".35" stroke={REF_WHITE} strokeWidth="2"/>
    {frame>11130&&<g>
      <Annotation x={795} y={ground-45} color={REF_CYAN} size={17}>h = 0,75 m</Annotation>
      <Annotation x={784} y={ground+29} color={REF_ORANGE} size={17}>9 m</Annotation>
    </g>}
  </g>;
}

function SlopePercent({frame,t}:BeatProps){
  // The source starts this beat with a small triangle and a figure at the left.
  return <g>
    <Annotation x={640} y={38} color={REF_DIM} size={13} anchor="middle">Đ Ộ   D Ố C   P H Ầ N   T R Ă M</Annotation>
    <SourceFigure x={94} ground={550}/>
    <path d="M 126 301 L 200 174 L 274 301 Z" fill="none" stroke={REF_WHITE} strokeWidth="3"/>
    {t>.6 && <g opacity={ease((t-.6)/.4)}>
      <path d="M 450 575 H 1050" stroke={REF_DIM} strokeWidth="2"/>
      <Annotation x={720} y={505} color={REF_DIM} size={17} anchor="middle">Độ dốc % = tang × 100</Annotation>
      <path d="M 480 574 H 880 L 880 545 Z" stroke={REF_WHITE} strokeWidth="1.5" fill="none"/>
      <Annotation x={682} y={607} color={REF_ORANGE} size={17} anchor="middle">100 m</Annotation>
    </g>}
  </g>;
}

function ElectricPhases({frame, cue,t}:BeatProps){
  const beat=number(cue),x=214,y=339,r=113;
  if(beat===32) {
    const a=project(x,y,r,115),b=project(x,y,r,-50);
    return <g>
      <CircleAxes x={x} y={y} r={r}/>
      <path d={`M ${x} ${y} L ${fmt(a.x)} ${fmt(a.y)} M ${x} ${y} L ${fmt(b.x)} ${fmt(b.y)}`}
        stroke={REF_WHITE} strokeWidth="3"/>
      <path d={`M ${x} ${y} V ${a.y}`} stroke={REF_CYAN} strokeWidth="4"/>
      <Annotation x={x-92} y={y-45} size={20} color={REF_CYAN}>220 V</Annotation>
      <Annotation x={x+94} y={y+22} size={20}>√3 × 220 V</Annotation>
      <SmallNoteBox x={860} y={350} w={154} h={153} title="Điện áp dây" detail="380 V"/>
    </g>;
  }
  const degrees=(frame-12695)/8,radiansAngle=radians(degrees);
  const early=frame<12970;
  const showWave=frame>=13080;
  return <g>
    <Annotation x={640} y={38} size={15} color={REF_DIM} anchor="middle">{showWave?"Điện ba pha - 50 Hz":"Đ I Ệ N  B A  P H A"}</Annotation>
    <CircleAxes x={x} y={y} r={r}/>
    {Array.from({length:early?0:3},(_,i)=>{
      const offset=i*120,p=project(x,y,r,degrees-offset);
      return <g key={i}>
        <path d={`M ${x} ${y} L ${fmt(p.x)} ${fmt(p.y)}`}
          stroke={[REF_CYAN,REF_WHITE,REF_DIM][i]} strokeWidth="2.4"/>
        <circle cx={p.x} cy={p.y} r="5" fill={[REF_CYAN,REF_WHITE,REF_DIM][i]}/>
      </g>;
    })}
    {showWave && <g><path d="M 431 339 H 1177" stroke={REF_DIM} strokeWidth="1.5"/>
    {Array.from({length:3},(_,i)=>{
      const offset=i*2*Math.PI/3;
      const points=Array.from({length:151},(_,j)=> {
        const u=j/150,xp=431+739*u,yp=339-92*Math.sin(u*4*Math.PI-radiansAngle+offset);
        return `${j?"L":"M"}${fmt(xp)},${fmt(yp)}`;
      }).join(" ");
      return <path key={i} d={points} stroke={[REF_CYAN,REF_WHITE,REF_DIM][i]} strokeWidth="2.3" fill="none"/>;
    })}
    <Annotation x={826} y={563} anchor="middle" color={REF_DIM} size={17}>20 ms</Annotation></g>}
    {showWave&&<Annotation x={x} y={y+r+43} anchor="middle" size={17}>Tổng = 0</Annotation>}
  </g>;
}

function FinalReview({cue,t}:BeatProps){
  const beat=number(cue);
  if(beat===36)return <MathReferenceLogo/>;
  if(beat===33||beat===34){
    const x=748,y=359,r=161;
    return <g>
      <SourceFigure x={175} ground={590}/>
      <circle cx={x} cy={y} r={r} stroke={REF_DIM} strokeWidth="2" strokeDasharray="9 8" fill="none"/>
      <path d={`M ${x} ${y} V ${y-r} A ${r} ${r} 0 0 1 ${x+r} ${y} Z`}
        stroke={REF_CYAN} strokeWidth="2" fill={REF_CYAN} fillOpacity=".19"/>
      <path d={`M ${x} ${y} L ${x+122} ${y-101} V ${y} Z`}
        stroke={REF_WHITE} strokeWidth="1.5" fill={REF_WHITE} fillOpacity=".12"/>
      <Annotation x={x+40} y={y-r-26} anchor="middle" size={23} weight={700}>Một phần tư</Annotation>
      {beat===33&&<g>
        {["Ngoại lệ","Góc phụ","Bảng dấu"].map((label,i)=><g key={i}>
          <rect x={295+i%2*9} y={444+i*31} width="133" height="65"
            stroke={REF_WHITE} strokeWidth="1.5" fill="none"/>
          <Annotation x={361} y={478+i*31} anchor="middle" size={19} weight={700}>{label}</Annotation>
        </g>)}
      </g>}
    </g>;
  }
  return <g>
    <SourceFigure x={65} ground={570} gesture={1}/>
    <CircleAxes x={325} y={363} r={146} subtle/>
    <RotatingProjection x={325} y={363} r={146} angle={120} showLabels={false}/>
    <SmallNoteBox x={845} y={267} w={260} h={194} title="Đề kiểm tra"
      detail={t>.84?"sin 120° = 0,866":"sin 120° = ?"} accent={t>.84?REF_CYAN:REF_WHITE}/>
    <Annotation x={247} y={326} color={REF_CYAN} size={18}>0,866</Annotation>
  </g>;
}

export function MathReferenceChapterB(props:BeatProps){
  switch(props.cue.chapterId){
    case "history":return <HistoryChords {...props}/>;
    case "sound":return <SoundWaves {...props}/>;
    case "astronomy":return number(props.cue)===25?<SunShadow {...props}/>:<EarthSeasons {...props}/>;
    case "height":{
      const beat=number(props.cue);
      return beat===27?<TideCurve {...props}/>:beat===28?<TreeHeight {...props}/>:beat===29?<WheelchairSlope {...props}/>:<SlopePercent {...props}/>;
    }
    case "electric":return <ElectricPhases {...props}/>;
    case "final":return <FinalReview {...props}/>;
    default:return null;
  }
}
