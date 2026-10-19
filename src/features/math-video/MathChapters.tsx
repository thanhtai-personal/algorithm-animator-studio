import { AngleArc, CYAN, ORANGE, ProjectionBars, RightTriangle, SinePlot, StickPerson, TangentPlot, TextLines, UnitCircle, WHITE } from "./MathPrimitives";
import { ease, frameWindow, project, sinePath } from "./mathGeometry";
import type { MathChapter } from "./mathTimeline";

export function MathChapterVisual({ chapter, frame }: { chapter: MathChapter; frame: number }) {
  const f = frame - chapter.start;
  const duration = chapter.end - chapter.start;
  const phase = f / 25;
  const angle = (40 + f / 11) % 360;
  const fade = ease(frameWindow(f, 0, 25));
  if (chapter.mode === "circle") {
    const a = f < 190 ? 15 + 95 * ease(frameWindow(f, 30, 190)) : f < 750 ? 120 : angle;
    return <g opacity={fade}>
      <UnitCircle x={510} y={382} r={178} angle={a}/>
      {f > 175 && <TextLines x={951} y={270} lines={["sin = đối / huyền", "= tọa độ dọc"]} color={CYAN} size={28}/>}
      {f > 480 && <TextLines x={950} y={404} lines={["cos = kề / huyền", "= tọa độ ngang"]} color={ORANGE} size={28}/>}
      {f > 920 && <text x="904" y="535" fill={WHITE} fontSize="25">sin 120° = √3/2</text>}
    </g>;
  }
  if (chapter.mode === "identity") {
    return <g opacity={fade}>
      <UnitCircle x={395} y={400} r={155} angle={f < 540 ? 30 : angle} labels={false}/>
      <ProjectionBars x={396} y={399} radius={145} angle={f < 540 ? 30 : angle}/>
      <TextLines x={935} y={245} lines={["sin² α + cos² α = 1", "Định lý Pythagoras"]} size={29}/>
      <text x="790" y="460" fill={CYAN} fontSize="27">sin² α</text>
      <text x="990" y="460" fill={ORANGE} fontSize="27">cos² α</text>
      <text x="923" y="525" textAnchor="middle" fill={WHITE} fontSize="24">Đối² + Kề² = Huyền²</text>
    </g>;
  }
  if (chapter.mode === "wave") {
    return <g opacity={fade}>
      <SinePlot x={230} y={400} width={820} amplitude={100} cycles={2.3} reveal={Math.min(1, f / 350)}/>
      {f > 250 && <UnitCircle x={185} y={400} r={91} angle={angle} labels={false}/>}
      {f > 610 && <TextLines x={640} y={192} lines={["Chuyển động tròn tạo thành sóng sin", "y = sin(x)"]} size={26}/>}
    </g>;
  }
  if (chapter.mode === "complement") {
    return <g opacity={fade}>
      <RightTriangle x={340} y={510} width={340} height={260} alpha={53}/>
      <TextLines x={910} y={270} lines={["cos α = sin (90° − α)", "sin α = cos (90° − α)"]} size={30}/>
      <text x="700" y="492" fill={ORANGE} fontSize="22">90° − α</text>
    </g>;
  }
  if (chapter.mode === "tangent") {
    return <g opacity={fade}>
      <TextLines x={630} y={122} lines={["tan α = sin α / cos α"]} size={36}/>
      <TangentPlot x={280} y={388} width={720} height={88}/>
      <text x="305" y="568" fill={ORANGE} fontSize="23">Đồ thị không xác định tại cos α = 0</text>
      <path d="M 462 270 V 530 M 817 270 V 530" stroke="#848484" strokeDasharray="6 12" fill="none"/>
    </g>;
  }
  if (chapter.mode === "history") {
    const p = project(450, 395, 183, 36 + (f / duration) * 40);
    const q = project(450, 395, 183, 180 - (f / duration) * 36);
    return <g opacity={fade}>
      <circle cx="450" cy="395" r="183" fill="none" stroke={WHITE} strokeWidth="2"/>
      <path d={`M ${p.x} ${p.y} L ${q.x} ${q.y}`} stroke={CYAN} strokeWidth="3"/>
      <path d={`M 450 395 L ${p.x} ${p.y} M 450 395 L ${q.x} ${q.y}`} fill="none" stroke="#777" strokeWidth="1.5"/>
      <text x="450" y="623" textAnchor="middle" fill={CYAN} fontSize="23">Cung tròn · Dây cung</text>
      <TextLines x={920} y={284} lines={["Lịch sử của sin", "Sinus · Tỉ số lượng giác"]} size={28}/>
    </g>;
  }
  if (chapter.mode === "sound") {
    return <g opacity={fade}>
      <SinePlot x={285} y={390} width={800} amplitude={70} cycles={4} reveal={Math.min(1, f / 190)} color={CYAN}/>
      <SinePlot x={285} y={390} width={800} amplitude={28} cycles={8} phase={phase / 3} color={ORANGE}/>
      <text x="642" y="195" textAnchor="middle" fill={WHITE} fontSize="31">Âm thanh là dao động</text>
      <text x="642" y="556" textAnchor="middle" fill="#a3a7af" fontSize="22">Tần số • Biên độ • Sóng hình sin</text>
    </g>;
  }
  if (chapter.mode === "astronomy") {
    const a = angle / 2;
    const p = project(415, 410, 178, a);
    return <g opacity={fade}>
      <circle cx="415" cy="410" r="185" fill="#131a24" stroke="#f0f2f5" strokeWidth="2"/>
      <ellipse cx="415" cy="410" rx="185" ry="55" fill="none" stroke="#656c76" strokeWidth="1"/>
      <ellipse cx="415" cy="410" rx="72" ry="185" fill="none" stroke="#656c76"/>
      <path d={`M 415 410 L ${p.x} ${p.y}`} stroke={ORANGE} strokeWidth="3"/>
      <circle cx={p.x} cy={p.y} r="6" fill={CYAN}/>
      <circle cx="970" cy="264" r="68" fill="#fbdb9b" fillOpacity=".13" stroke={ORANGE} strokeWidth="2"/>
      <path d="M 905 300 L 550 386" stroke={ORANGE} strokeWidth="2" strokeDasharray="9 8"/>
      <TextLines x={913} y={516} lines={["Đo đạc và thiên văn", "Góc nhìn • Khoảng cách"]} size={27}/>
    </g>;
  }
  if (chapter.mode === "height") {
    const treeHeight = 155 + Math.sin(phase / 12) * 40;
    const baseY = 544, tipY = baseY - treeHeight;
    return <g opacity={fade}>
      <path d="M 130 544 H 1130" stroke="#9298a0" strokeWidth="2"/>
      <StickPerson x={230} y={544} scale={1.55}/>
      <path d={`M 845 ${baseY} V ${tipY} M 820 ${tipY + 30} Q 845 ${tipY - 65} 873 ${tipY + 28}`} stroke={WHITE} strokeWidth="4" fill="none"/>
      <path d={`M 243 475 L 845 ${tipY} V 475 Z`} fill={CYAN} fillOpacity=".065" stroke={CYAN} strokeWidth="2"/>
      <AngleArc x={243} y={475} r={62} degrees={Math.abs(Math.atan2(475-tipY, 602) * 180/Math.PI)} />
      <text x="540" y="563" fill={ORANGE} fontSize="23">Khoảng cách (d)</text>
      <text x="865" y={tipY + treeHeight/2} fill={CYAN} fontSize="23">h</text>
      <TextLines x={870} y={125} lines={["h = d × tan(α)", "Ứng dụng đo chiều cao"]} size={28}/>
    </g>;
  }
  if (chapter.mode === "electric") {
    return <g opacity={fade}>
      <UnitCircle x={260} y={386} r={128} angle={angle} labels={false}/>
      <SinePlot x={485} y={341} width={600} amplitude={110} cycles={2} phase={-angle * Math.PI/180} color={CYAN}/>
      <SinePlot x={485} y={341} width={600} amplitude={70} cycles={2} phase={-angle * Math.PI/180 + Math.PI/2} color={ORANGE}/>
      <TextLines x={900} y={126} lines={["Dòng điện xoay chiều", "50 Hz · 220 V"]} size={30}/>
      <text x="550" y="556" fill={CYAN} fontSize="22">Sin</text>
      <text x="657" y="556" fill={ORANGE} fontSize="22">Cos · lệch pha 90°</text>
    </g>;
  }
  return <g opacity={fade}>
    <UnitCircle x={420} y={388} r={185} angle={f < 580 ? 120 : angle}/>
    <TextLines x={950} y={235} lines={["sin 120° = ?", "sin 120° = √3 / 2", "cos 120° = −1 / 2"]} size={30}/>
    <path d="M 795 482 H 1100" stroke={CYAN} strokeWidth="2"/>
    <text x="948" y="555" fill={ORANGE} fontSize="21" textAnchor="middle">Góc tù cũng có sin và cos!</text>
  </g>;
}
