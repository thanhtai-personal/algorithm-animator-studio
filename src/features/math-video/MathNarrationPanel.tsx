import { useEffect, useMemo, useState } from "react";
import { Volume2, MicVocal, RefreshCcw, AudioLines } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSupertonicConfig, generateSupertonicVoice, type SupertonicConfig } from "@/lib/voiceApi";
import { MATH_CHAPTERS, formatMathTime } from "./mathTimeline";
import { MATH_NARRATION_CUES, voiceDurationSeconds, type MathNarrationCue } from "./mathNarrationCues";
import { mixMathNarrationClips, type MathNarrationMixResult } from "./mathNarrationApi";

type Clip = { relativePath:string;audioUrl:string;textSnapshot:string };
type DraftState = { texts:Record<string,string>;clips:Record<string,Clip> };
const STORAGE_KEY="kai-studio.math-video.narration-v1";
const DEFAULT_TEXTS=Object.fromEntries(MATH_NARRATION_CUES.map(c=>[c.id,c.draftText]));
function storedDrafts():DraftState {
  if (typeof window==="undefined") return {texts:DEFAULT_TEXTS,clips:{}};
  try {
    const raw=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||"null") as Partial<DraftState>|null;
    return {
      texts:{...DEFAULT_TEXTS,...(raw?.texts||{})},
      clips:raw?.clips&&typeof raw.clips==="object"?raw.clips:{},
    };
  } catch { return {texts:DEFAULT_TEXTS,clips:{}}; }
}
function persist(state:DraftState) {
  try { window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
  catch { /* Incognito/quota: current session still works. */ }
}
export type MixedNarration = Pick<MathNarrationMixResult,"audioUrl"|"relativePath">;
export function MathNarrationPanel({
  onMix,onInvalidate,volume,onVolumeChange,isVi,
}:{
  onMix:(result:MixedNarration)=>void;onInvalidate:()=>void;
  volume:number;onVolumeChange:(volume:number)=>void;isVi:boolean;
}) {
  const [drafts,setDrafts]=useState<DraftState>(storedDrafts);
  const [chapterId,setChapterId]=useState("intro");
  const [selectedCueId,setSelectedCueId]=useState("intro-00");
  const [config,setConfig]=useState<SupertonicConfig|null>(null);
  const [configError,setConfigError]=useState("");
  const [voice,setVoice]=useState("");
  const [speed,setSpeed]=useState(1);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState("");
  const [warnings,setWarnings]=useState<string[]>([]);
  const chapterCues=useMemo(()=>MATH_NARRATION_CUES.filter(c=>c.chapterId===chapterId),[chapterId]);
  const cue=MATH_NARRATION_CUES.find(c=>c.id===selectedCueId)??MATH_NARRATION_CUES[0];
  const readyClips=MATH_NARRATION_CUES.filter(c=>{
    const asset=drafts.clips[c.id];return Boolean(asset?.relativePath&&asset.textSnapshot===(drafts.texts[c.id]||"").trim());
  });
  const ready=Boolean(config?.enabled&&config.serverOk&&config.endpointsOk);
  useEffect(()=>{
    getSupertonicConfig().then(next=>{
      setConfig(next);
      setVoice(current=>current||next.defaultVoice||next.voices?.[0]?.id||"");
    }).catch(error=>setConfigError(error instanceof Error?error.message:String(error)));
  },[]);

  function updateDraft(cueId:string,text:string) {
    setDrafts(current=>{
      const next={texts:{...current.texts,[cueId]:text},clips:{...current.clips}};
      delete next.clips[cueId];
      persist(next);return next;
    });
    onInvalidate();
    setWarnings([]);
  }
  async function generateCue(target:MathNarrationCue) {
    const text=(drafts.texts[target.id]||"").trim();
    if(!text)throw new Error(`Phân cảnh ${target.id} chưa có lời dẫn.`);
    const result=await generateSupertonicVoice({
      text,voice:voice||config?.defaultVoice||"M1",lang:"vi",speed,
      totalSteps:config?.defaultTotalSteps||8,
      fileName:`math-sincos-${target.id}`,
    });
    if(!result.relativePath||!result.audioUrl)throw new Error("TTS chưa tạo được file audio.");
    setDrafts(current=>{
      const next={texts:current.texts,clips:{...current.clips,
        [target.id]:{relativePath:result.relativePath,audioUrl:result.audioUrl,textSnapshot:text},
      }};
      persist(next);return next;
    });
    onInvalidate();
  }
  async function generateChapter() {
    if(busy||!ready)return;
    setBusy(true);setWarnings([]);
    try {
      const missing=chapterCues.filter(c=>(drafts.texts[c.id]||"").trim()&&!drafts.clips[c.id]);
      if(!missing.length){toast.info(isVi?"Chương đã có đủ giọng đọc.":"All chapter voice clips exist.");return;}
      for(const [index,target] of missing.entries()) {
        setStatus(`${isVi?"Tạo giọng":"Generating"} ${index+1}/${missing.length}: ${target.id}`);
        await generateCue(target);
      }
      toast.success(isVi?"Đã tạo giọng cho chương.":"Chapter narration generated.");
    }catch(error){toast.error(error instanceof Error?error.message:"TTS failed");}
    finally{setBusy(false);setStatus("");}
  }
  async function mixAll() {
    if(busy||!readyClips.length)return;
    setBusy(true);setWarnings([]);setStatus(isVi?"Đang ghép giọng theo frame…":"Mixing voice-over on frame timeline…");
    try{
      const result=await mixMathNarrationClips(readyClips.map(c=>({cueId:c.id,audioRelativePath:drafts.clips[c.id].relativePath})));
      onMix(result);
      setWarnings(result.warnings);
      toast.success(`Đã ghép ${result.cueCount}/${result.totalCues} phân cảnh · ${result.durationSeconds}s`);
    }catch(error){toast.error(error instanceof Error?error.message:"Voice mixing failed");}
    finally{setBusy(false);setStatus("");}
  }
  function selectChapter(id:string) {
    setChapterId(id);
    const first=MATH_NARRATION_CUES.find(c=>c.chapterId===id);
    if(first)setSelectedCueId(first.id);
  }

  return <section className="space-y-3 rounded-xl border bg-card/60 p-4">
    <h2 className="flex items-center gap-2 font-semibold"><MicVocal className="h-5 w-5 text-cyan-500"/>
      {isVi?"Giọng đọc & đồng bộ 25 FPS":"Narration & 25 FPS synchronization"}
    </h2>
    <p className="text-xs text-muted-foreground">{isVi
      ?"37 đoạn lời dẫn mới có thể chỉnh sửa; không phải bản chép lời video gốc. Tạo giọng Supertonic rồi ghép đúng frame. Đoạn chưa tạo giữ im lặng."
      :"37 editable original draft cues, not a source transcript. Render Supertonic voice and align to absolute frames; missing cues remain silent."}</p>
    <div className="grid gap-2">
      <label className="text-xs font-medium" htmlFor="math-narration-chapter">{isVi?"Chương":"Chapter"}</label>
      <select id="math-narration-chapter" className="w-full rounded-md border bg-background p-2 text-sm" value={chapterId} onChange={e=>selectChapter(e.target.value)} disabled={busy}>
        {MATH_CHAPTERS.map(ch=><option key={ch.id} value={ch.id}>{formatMathTime(ch.start)} · {ch.title}</option>)}
      </select>
      <label className="text-xs font-medium" htmlFor="math-narration-cue">{isVi?"Phân cảnh":"Scene"}</label>
      <select id="math-narration-cue" className="w-full rounded-md border bg-background p-2 text-sm" value={selectedCueId}
        onChange={e=>setSelectedCueId(e.target.value)} disabled={busy}>
        {chapterCues.map(c=><option key={c.id} value={c.id}>{formatMathTime(c.startFrame)} · {c.title.slice(0,65)}</option>)}
      </select>
      <p className="text-xs text-muted-foreground">{cue.id} · {voiceDurationSeconds(cue).toFixed(2)}s · {cue.startFrame}–{cue.endFrame-1} frames
        {drafts.clips[cue.id]?" · ✓ audio":""}</p>
      <textarea aria-label="Lời dẫn của phân cảnh" value={drafts.texts[cue.id]||""} disabled={busy}
        onChange={e=>updateDraft(cue.id,e.target.value)} rows={3} maxLength={1000}
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm" />
      <p className="text-xs text-muted-foreground">
        {readyClips.length}/{MATH_NARRATION_CUES.length} {isVi?"đoạn đã có audio":"cues generated"}
      </p>
      <label className="text-xs font-medium" htmlFor="math-narration-voice">{isVi?"Giọng Supertonic":"Supertonic voice"}</label>
      <select id="math-narration-voice" className="w-full rounded-md border bg-background p-2 text-sm"
        value={voice} onChange={e=>setVoice(e.target.value)} disabled={busy||!ready}>
        {(config?.voices||[]).map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
      </select>
      <label className="text-xs" htmlFor="math-narration-speed">{isVi?"Tốc độ nói":"Speech speed"}: {speed.toFixed(2)}×</label>
      <input id="math-narration-speed" type="range" min="0.7" max="2" step="0.05" value={speed} disabled={busy}
        onChange={e=>setSpeed(Number(e.target.value))}/>
      {!ready&&<p className="text-xs text-amber-500">{configError||"Supertonic chưa hoạt động. Bật dịch vụ trong Settings rồi quay lại."}</p>}
      <Button variant="secondary" onClick={()=>void generateChapter()} disabled={!ready||busy} className="w-full">
        <AudioLines className="mr-2 h-4 w-4"/>{isVi?"Tạo giọng cho các đoạn thiếu của chương":"Generate missing chapter cues"}
      </Button>
      {drafts.clips[cue.id]?.audioUrl&&<audio controls src={drafts.clips[cue.id].audioUrl} className="w-full"/>}
      <label className="flex items-center justify-between gap-2 text-xs">
        <span>{isVi?"Âm lượng giọng":"Voice volume"}: {Math.round(volume*100)}%</span>
        <Volume2 className="h-4 w-4"/>
      </label>
      <input aria-label="Âm lượng giọng đọc" type="range" min="0" max="1" step="0.05" value={volume}
        onChange={e=>onVolumeChange(Number(e.target.value))}/>
      <Button onClick={()=>void mixAll()} disabled={busy||!readyClips.length} className="w-full">
        <RefreshCcw className="mr-2 h-4 w-4"/>{isVi?"Ghép giọng theo toàn bộ timeline":"Mix narration over full timeline"}
      </Button>
      {status&&<p role="status" className="text-xs text-cyan-500">{status}</p>}
      {warnings.length>0&&<div className="space-y-1 text-xs text-amber-500" role="alert">
        <p>{isVi?"Một số đoạn nói dài hơn cửa sổ và đã bị cắt:":"Some cues were trimmed to fit their frame windows:"}</p>
        {warnings.slice(0,6).map((w,i)=><p key={i}>{w}</p>)}
      </div>}
    </div>
  </section>;
}
