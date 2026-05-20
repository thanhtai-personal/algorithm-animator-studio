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

type Props = { studio: AlgorithmStudio };

export function LeftPanel({ studio }: Props) {
  const s = studio;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div>
          <Label>{s.tr("algorithm")}</Label>
          <Select value={s.algoId} onValueChange={s.setAlgoId}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALGO_GROUPS.map((grp, gi) => (
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
          {s.shortVideoType === "kinetic-typography" && s.algo.id !== "bubble" ? (
            <p className="mt-2 text-xs text-amber-300">
              {s.lang === "vi" ? "Kinetic short hiện tối ưu trước cho Bubble Sort." : "Kinetic short is currently optimized for Bubble Sort first."}
            </p>
          ) : null}
        </div>
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
        {s.isGraph && (
          <GraphInputs studio={s} />
        )}
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

function GraphInputs({ studio: s }: Props) {
  return (
    <>
      <div>
        <Label>{s.lang === "vi" ? "Cạnh đồ thị (A-B:trọng_số)" : "Edges (A-B:weight)"}</Label>
        <Textarea className="mt-2 font-mono text-xs h-24" placeholder="A-B:4, A-D:2, B-C:3" value={s.graphInput} onChange={(e) => s.setGraphInput(e.target.value)} />
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
