import { RefreshCw } from "lucide-react";
import { ALGORITHMS, ALGO_GROUPS, COMPLEXITY } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SHORT_VIDEO_TYPES, type ShortVideoType } from "@/lib/shortVideoTypes";
import { AlgorithmStudio } from "./useAlgorithmStudio";
import { uiText } from "@/lib/i18n";
import { canUseAlgorithm3DVideo, hasWebGLVideoSupport, isAlgorithm3DRenderMode, type AlgorithmVideoRenderMode } from "@/lib/algorithmVideoRenderMode";
import { ALGORITHM_VIDEO_ADS, ALGORITHM_VIDEO_AD_SLOTS, type AlgorithmVideoAdId } from "@/lib/algorithmVideoAds";

type Props = { studio: AlgorithmStudio };

export function LeftPanel({ studio }: Props) {
  const s = studio;
  const algorithmGroups = s.mazePathfindingEnabled
    ? ALGO_GROUPS
    : ALGO_GROUPS.map((group) => ({ ...group, ids: group.ids.filter((id) => id !== "astar") })).filter((group) => group.ids.length);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div>
          <Label>{s.tr("algorithm")}</Label>
          <Select value={s.algoId} onValueChange={s.setAlgoId}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {algorithmGroups.map((grp, gi) => (
                <div key={grp.label.en}>
                  {gi > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel className="bg-emerald-500/10 text-emerald-300 uppercase tracking-wider text-[11px] py-1.5 my-1 rounded">
                      {grp.label[s.lang]}
                    </SelectLabel>
                    {grp.ids.map((id) => (
                      <SelectItem key={id} value={id}>{ALGORITHMS[id].name}</SelectItem>
                    ))}
                  </SelectGroup>
                </div>
              ))}
            </SelectContent>
          </Select>
          {COMPLEXITY[s.algoId] && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                Time {COMPLEXITY[s.algoId].time}
              </span>
              {COMPLEXITY[s.algoId].best && COMPLEXITY[s.algoId].best !== COMPLEXITY[s.algoId].time && (
                <span className="px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                  Best {COMPLEXITY[s.algoId].best}
                </span>
              )}
              {COMPLEXITY[s.algoId].worst && COMPLEXITY[s.algoId].worst !== COMPLEXITY[s.algoId].time && (
                <span className="px-2 py-0.5 rounded bg-rose-400/15 text-rose-300 border border-rose-400/30">
                  Worst {COMPLEXITY[s.algoId].worst}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                Space {COMPLEXITY[s.algoId].space}
              </span>
            </div>
          )}
        </div>
        <div>
          <Label>{s.lang === "vi" ? "Kiểu video" : "Video type"}</Label>
          <Select value={s.shortVideoType} onValueChange={(v) => s.setShortVideoType(v as ShortVideoType)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHORT_VIDEO_TYPES.map((type) => <SelectItem key={type.id} value={type.id}>{type.label[s.lang]}</SelectItem>)}
            </SelectContent>
          </Select>
          {s.shortVideoType === "kinetic-typography" && !["bubble", "odd_even", "pancake", "bitonic", "bfs", "dfs", "dijkstra"].includes(s.algo.id) ? (
            <p className="mt-2 text-xs text-amber-300">
              {s.lang === "vi" ? "Kinetic short hiện chưa có thiết kế riêng cho thuật toán này." : "Kinetic short does not have a dedicated design for this algorithm yet."}
            </p>
          ) : null}
        </div>
        <VideoRenderModeSelect studio={s} />
        {!s.isGraph && (
          <div>
            <Label>{s.tr("inputArr")}</Label>
            <Input
              className="mt-2"
              disabled={s.columnVisualMode === "animal"}
              placeholder="5, 2, 8, 1, 9, 3"
              value={s.input}
              onChange={(e) => s.setInput(e.target.value)}
            />
            {s.columnVisualMode === "animal" && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {s.lang === "vi"
                  ? "Animal mode chỉ dùng trọng số cố định của từng sprite."
                  : "Animal mode only uses each sprite's fixed weight."}
              </p>
            )}
          </div>
        )}
        {s.isSearch && (
          <div>
            <Label>{s.tr("target")}</Label>
            <Input className="mt-2" placeholder="42" value={s.target} onChange={(e) => s.setTarget(e.target.value)} />
          </div>
        )}
        {s.isGraph && (s.algo.id === "astar" ? <WorldInputs studio={s} /> : <GraphInputs studio={s} />)}
        {!s.isGraph && (
          <>
            <div>
              <div className="flex justify-between mb-2">
                <Label>{s.tr("randomSize")}</Label>
                <Input
                  type="number"
                  min={2}
                  max={s.randomSizeMax}
                  value={s.size}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n) && n > 0) s.setSize(Math.min(s.randomSizeMax, n));
                  }}
                  className="h-7 w-20 text-right text-emerald-400 font-mono"
                />
              </div>
              <Slider value={[Math.min(s.size, s.randomSizeMax, 100)]} onValueChange={([v]) => s.setSize(v)} min={2} max={Math.min(s.randomSizeMax, 100)} step={1} />
            </div>
            <Button onClick={s.newArray} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> {s.tr("newArray")}
            </Button>
          </>
        )}
      </Card>

      <CodePanel studio={s} />
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <Label className="text-sm">{s.tr("variables")}</Label>
        </div>
        <div className="font-mono text-sm text-emerald-300 min-h-6 break-all">
          {s.current && Object.keys(s.current.vars).length
            ? Object.entries(s.current.vars).map(([k, v]) => `${k}=${v}`).join("  ")
            : "—"}
        </div>
      </Card>
    </div>
  );
}

function VideoRenderModeSelect({ studio: s }: Props) {
  const compatible = canUseAlgorithm3DVideo({
    shortVideoType: s.shortVideoType,
    columnVisualMode: s.columnVisualMode,
    hasWorldScene: Boolean(s.current?.world || s.current?.worldCompare),
  });
  const webgl = hasWebGLVideoSupport();
  const available = compatible && webgl;

  return (
    <div>
      <Label>{s.lang === "vi" ? "Chế độ hiển thị" : "Render mode"}</Label>
      <Select value={s.videoRenderMode} onValueChange={(value) => s.setVideoRenderMode(value as AlgorithmVideoRenderMode)}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="2d">{s.lang === "vi" ? "2D — chế độ gốc" : "2D — original mode"}</SelectItem>
          <SelectItem value="3d" disabled={!available}>3D — WebGL</SelectItem>
          <SelectItem value="3d-story" disabled={!available || s.algo.category !== "sort"}>{s.lang === "vi" ? "3D Story — Giữ chân người xem" : "3D Story — Retention"}</SelectItem>
          <SelectItem value="3d-hyper" disabled={!available || s.algo.category !== "sort"}>{s.lang === "vi" ? "3D Hyper — Shorts / Reels" : "3D Hyper — Shorts / Reels"}</SelectItem>
        </SelectContent>
      </Select>
      {isAlgorithm3DRenderMode(s.videoRenderMode) ? (
        <p className={`mt-2 text-xs ${available ? "text-cyan-300" : "text-amber-300"}`}>
          {available
            ? (s.videoRenderMode === "3d-story"
              ? (s.lang === "vi" ? "Story Mode thêm hook, dự đoán, reward và progress nhưng giữ nguyên camera cố định." : "Story Mode adds hooks, prediction, rewards and progress while keeping the camera locked.")
              : s.videoRenderMode === "3d-hyper"
                ? (s.lang === "vi" ? "Hyper Mode nén timeline thành các beat rất ngắn, ưu tiên swap/milestone; hard-cut chỉ dùng viền nhấn nhẹ, không chớp toàn màn hình." : "Hyper Mode compresses the timeline into short swap/milestone beats; hard cuts use only a subtle edge pulse with no full-screen flash.")
                : (s.lang === "vi" ? "Preview và video xuất sẽ dùng scene 3D. Mode 2D gốc vẫn được giữ nguyên." : "Preview and export use the 3D scene. The original 2D mode remains unchanged."))
            : (s.lang === "vi" ? "3D không khả dụng với scene/mode hiện tại; hệ thống sẽ dùng 2D gốc." : "3D is unavailable for the current scene/mode; the original 2D renderer will be used.")}
        </p>
      ) : null}
      {isAlgorithm3DRenderMode(s.videoRenderMode) && available ? (
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <div>
            <Label>{s.lang === "vi" ? "Quảng cáo trong không gian 3D" : "3D scene advertisements"}</Label>
            <p className="mt-1 text-[11px] text-white/55">
              {s.lang === "vi"
                ? "Mỗi vị trí quảng cáo có lựa chọn riêng. Mặc định scene hiển thị TEST quảng cáo để bạn thấy đúng vị trí trước khi chọn thương hiệu."
                : "Each ad slot has its own selection. TEST advertisements are shown by default so you can see the exact placement before choosing a brand."}
            </p>
          </div>
          {ALGORITHM_VIDEO_AD_SLOTS.map((slot) => (
            <div key={slot.id}>
              <Label className="text-xs text-white/75">{slot.label[s.lang]}</Label>
              <Select value={s.algorithmVideoAds[slot.id]} onValueChange={(value) => s.setAlgorithmVideoAdForSlot(slot.id, value as AlgorithmVideoAdId)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALGORITHM_VIDEO_ADS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label[s.lang]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WorldInputs({ studio: s }: Props) {
  return (
    <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-3 text-xs text-cyan-100 space-y-2">
      <div className="font-semibold text-cyan-200">
        {s.lang === "vi" ? "Preset: Maze Pathfinding" : "Preset: Maze Pathfinding"}
      </div>
      <p>
        {s.lang === "vi"
          ? "A* chạy trong module tìm đường ra mê cung: open set, closed set, f = g + h, tường realtime và replan."
          : "A* runs in Maze Pathfinding with open set, closed set, f = g + h, real-time walls and replanning."}
      </p>
      <p className="text-cyan-200/80">
        {s.lang === "vi"
          ? "Muốn setup mê cung riêng, hãy dùng mode Tìm đường ra mê cung ở header."
          : "Use Maze Pathfinding in the header for the dedicated maze setup."}
      </p>
    </div>
  );
}

function GraphInputs({ studio: s }: Props) {
  return (
    <>
      <div>
        <Label>{s.lang === "vi" ? "Cạnh đồ thị (A-B:trọng_số)" : "Edges (A-B:weight)"}</Label>
        <Textarea className="mt-2 font-mono text-xs h-24" placeholder={uiText("A-B:4, A-D:2, B-C:3")} value={s.graphInput} onChange={(e) => s.setGraphInput(e.target.value)} />
        <p className="text-[10px] text-muted-foreground mt-1">
          {s.lang === "vi" ? "Cách nhau bởi dấu phẩy. Bỏ ':trọng_số' nếu không cần." : "Comma separated. Omit ':weight' for unweighted."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <GraphPointSelect label={s.lang === "vi" ? "Điểm bắt đầu" : "Start"} value={s.startLabel} fallback={s.graphLabels[0]} labels={s.graphLabels} onChange={s.setStartLabel} />
        <GraphPointSelect label={s.lang === "vi" ? "Điểm kết thúc" : "End"} value={s.endLabel} fallback={s.graphLabels[s.graphLabels.length - 1]} labels={s.graphLabels} onChange={s.setEndLabel} />
      </div>
    </>
  );
}

function GraphPointSelect(props: { label: string; value: string; fallback?: string; labels: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{props.label}</Label>
      <Select value={props.labels.includes(props.value) ? props.value : props.fallback} onValueChange={props.onChange}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {props.labels.map((label) => <SelectItem key={label} value={label}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function CodePanel({ studio: s }: Props) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-pink-500" />
        <Label className="text-sm">{s.tr("codeJs")}</Label>
        <span className="ml-auto text-xs text-emerald-400">● {s.showCode ? "ON" : "OFF"}</span>
      </div>
      {s.isCustom ? (
        <>
          <Textarea value={s.customCode} onChange={(e) => s.setCustomCode(e.target.value)} className="text-[11px] leading-5 font-mono h-72 bg-slate-950/60" />
          <p className="text-xs text-muted-foreground">{s.tr("customCodeHint")}</p>
        </>
      ) : (
        <pre className="text-[11px] leading-5 font-mono bg-slate-950/60 rounded-lg p-3 overflow-auto max-h-72 border border-border/40">
          {s.codeForPanel.split("\n").map((ln, i) => (
            <div key={i} className={`flex gap-3 px-1 ${s.current && s.current.line === i ? "bg-yellow-300/15 text-yellow-200 rounded" : "text-slate-300"}`}>
              <span className="text-slate-500 w-6 text-right select-none">{i + 1}</span>
              <span className="whitespace-pre">{ln}</span>
            </div>
          ))}
        </pre>
      )}
      <div className="flex items-center justify-between pt-1">
        <Label className="text-sm">{s.tr("showCodeInVideo")}</Label>
        <Switch checked={s.showCode} onCheckedChange={s.setShowCode} />
      </div>
    </Card>
  );
}
