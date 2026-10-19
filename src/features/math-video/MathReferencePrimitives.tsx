import { clamp01, fmt, project, radians, sinePath } from "./mathGeometry";

export const REF_WHITE = "#d9dde3";
export const REF_CYAN = "#4fb9c9";
export const REF_ORANGE = "#dca46a";
export const REF_DIM = "#65717e";

export function Annotation({ x, y, children, color = REF_WHITE, size = 19, anchor = "start", weight = 500 }: {
  x: number; y: number; children: React.ReactNode; color?: string; size?: number;
  anchor?: "start" | "middle" | "end"; weight?: number;
}) {
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight}
    textAnchor={anchor} fontFamily="Arial, 'DejaVu Sans', sans-serif">{children}</text>;
}

export function CircleAxes({ x = 440, y = 390, r = 153, subtle = false }: {
  x?: number; y?: number; r?: number; subtle?: boolean;
}) {
  return <g stroke={subtle ? REF_DIM : REF_WHITE} strokeWidth={subtle ? 1.4 : 1.8} fill="none">
    <circle cx={x} cy={y} r={r}/>
    <path d={`M ${x-r-42} ${y} H ${x+r+42} M ${x} ${y-r-32} V ${y+r+32}`}
      stroke={REF_DIM} strokeWidth="1.4"/>
  </g>;
}
export function RotatingProjection({ x=440, y=390, r=153, angle=55, showLabels=true, showGuides=true }: {
  x?:number; y?:number; r?:number; angle?:number; showLabels?:boolean; showGuides?:boolean;
}) {
  const p = project(x,y,r,angle);
  return <g>
    {showGuides && <path d={`M ${x} ${y} L ${fmt(p.x)} ${fmt(p.y)} L ${fmt(p.x)} ${y} Z`}
      stroke="none" fill={REF_WHITE} fillOpacity=".045"/>}
    <path d={`M ${x} ${y} L ${fmt(p.x)} ${fmt(p.y)}`} fill="none" stroke={REF_WHITE} strokeWidth="2.4"/>
    <path d={`M ${fmt(p.x)} ${fmt(p.y)} V ${y}`} stroke={REF_CYAN} strokeWidth="3.7"/>
    <path d={`M ${x} ${y} H ${fmt(p.x)}`} stroke={REF_ORANGE} strokeWidth="3.7"/>
    <circle cx={p.x} cy={p.y} r="5.6" fill={REF_WHITE}/>
    {showLabels && <g>
      <Annotation x={x+(p.x-x)/2} y={y+23} anchor="middle" color={REF_ORANGE} size={17}>Ngang cos</Annotation>
      <Annotation x={p.x+14} y={(y+p.y)/2} color={REF_CYAN} size={17}>Đọc sin</Annotation>
    </g>}
  </g>;
}

export function ReferenceCircle({ x=440,y=390,r=153,angle=55,labels=false,subtle=false }: {
  x?:number;y?:number;r?:number;angle?:number;labels?:boolean;subtle?:boolean;
}) {
  return <g><CircleAxes x={x} y={y} r={r} subtle={subtle}/>
    <RotatingProjection x={x} y={y} r={r} angle={angle} showLabels={labels}/></g>;
}

export function ReferenceWave({ x=310,y=397,width=700,height=89,cycles=2,phase=0,progress=1,color=REF_WHITE }: {
  x?:number;y?:number;width?:number;height?:number;cycles?:number;phase?:number;progress?:number;color?:string;
}) {
  return <g>
    <path d={`M ${x-18} ${y} H ${x+width+26}`} stroke={REF_DIM} strokeWidth="1.6"/>
    <path d={sinePath(x,y,width,height,cycles,phase,240,progress)} stroke={color} strokeWidth="3" fill="none"/>
  </g>;
}
export function Fork({ x=195,y=330,shiver=0 }: { x?:number;y?:number;shiver?:number }) {
  return <g stroke={REF_WHITE} fill="none" strokeWidth="5" strokeLinecap="round">
    <path d={`M ${x-14-shiver} ${y-98} V ${y-8} Q ${x-14} ${y+18} ${x} ${y+19} Q ${x+14} ${y+18} ${x+14} ${y-8} V ${y-98}`} />
    <path d={`M ${x} ${y+19} V ${y+130}`} strokeWidth="5"/>
  </g>;
}
export function SourceFigure({ x, ground=570, gesture=0 }: { x:number;ground?:number;gesture?:number }) {
  return <g transform={`translate(${x} ${ground})`} stroke={REF_WHITE} strokeWidth="6" strokeLinecap="round" fill="none">
    <circle cx="0" cy="-111" r="10" fill={REF_WHITE} stroke="none"/>
    <path d="M 0 -97 V -53 M 0 -53 L -11 0 M 0 -53 L 11 0"/>
    <path d={gesture > .5 ? "M 0 -89 L 42 -90 M 0 -89 L -12 -60" : "M 0 -89 L 13 -61 M 0 -89 L -14 -60"}/>
  </g>;
}
export function TickAxis({ x=205,y=530,width=880,step=10 }: {x?:number;y?:number;width?:number;step?:number}) {
  const count=Math.max(1,Math.round(width/step));
  return <g stroke={REF_DIM} fill="none">
    <path d={`M ${x} ${y} H ${x+width}`} strokeWidth="2"/>
    {Array.from({length:count+1},(_,i)=><path key={i} d={`M ${x+i*width/count} ${y-3} V ${y+(i%5===0?9:5)}`} strokeWidth=".8"/>)}
  </g>;
}
export function AngleLabel({x,y,r=35,angle=30,color=REF_ORANGE}:{x:number;y:number;r?:number;angle?:number;color?:string}) {
  const p=project(x,y,r,angle);
  return <g>
    <path d={`M ${x+r} ${y} A ${r} ${r} 0 ${angle>180?1:0} 0 ${fmt(p.x)} ${fmt(p.y)}`}
      fill="none" stroke={color} strokeWidth="2"/>
    <Annotation x={x+r+8} y={y-14} color={color} size={16}>{Math.round(angle)}°</Annotation>
  </g>;
}
export function SmallNoteBox({ x,y,w=280,h=160,title,detail,accent=REF_WHITE }: {
  x:number;y:number;w?:number;h?:number;title:string;detail?:string;accent?:string;
}) {
  return <g><rect x={x} y={y} width={w} height={h} fill="#15171a" stroke={REF_DIM} strokeWidth="1.5"/>
    <Annotation x={x+w/2} y={y+29} color={REF_DIM} anchor="middle" size={15}>{title}</Annotation>
    {detail && <Annotation x={x+w/2} y={y+h/2+14} anchor="middle" color={accent} size={26} weight={600}>{detail}</Annotation>}
  </g>;
}
export function DegreesRing({ x,y,r=155,angle=40 }: {x:number;y:number;r?:number;angle?:number}) {
  return <g><circle cx={x} cy={y} r={r} stroke={REF_DIM} strokeWidth="4" fill="none"/>
    {Array.from({length:36},(_,i)=>{
      const a=i*10,outer=project(x,y,r+3,a),inner=project(x,y,r-(i%3===0?14:7),a);
      return <path key={i} d={`M ${fmt(outer.x)} ${fmt(outer.y)} L ${fmt(inner.x)} ${fmt(inner.y)}`} stroke={REF_DIM} strokeWidth="1.4"/>;
    })}
    <path d={`M ${x} ${y} L ${fmt(project(x,y,r-2,angle).x)} ${fmt(project(x,y,r-2,angle).y)}`}
      stroke={REF_WHITE} strokeWidth="2"/>
    <Annotation x={x} y={y+r+40} anchor="middle" size={18}>360°</Annotation>
  </g>;
}
export const waveAngle=(frame:number,cycleFrames=260)=>(frame%cycleFrames)/cycleFrames*Math.PI*2;
export const beatAlpha=(t:number)=>clamp01(t*11);
export const heightFromAngle=(deg:number,base:number)=>Math.abs(Math.tan(radians(deg)))*base;
