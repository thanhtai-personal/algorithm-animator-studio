import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { audioEngine, type SfxKind } from "@/lib/audio";
import {uiText, SFX_OPTIONS} from "@/lib/i18n";
import { getAssetSfxOption, SWAP_ASSET_SFX_OPTIONS } from "@/lib/selectSounds";
import type { LongContentStudio } from "./useLongContentStudio";

const BASE_SFX_OPTIONS = SFX_OPTIONS.filter((option) => !option.id.startsWith("swap-"));
const TRANSITION_SFX_OPTIONS = SFX_OPTIONS.filter((option) => option.id.startsWith("swap-"));

export function KineticSfxPanel({ studio: s }: { studio: LongContentStudio }) {
  if (s.longVideoType !== "kinetic-typography") return null;
  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-background/30 p-3">
      <div>
        <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> {uiText("Âm chuyển keyword")}</Label>
        <Select value={s.kineticSlideSfx} onValueChange={(value) => s.setKineticSlideSfx(value as SfxKind)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{s.lang === "vi" ? "Âm tạo sẵn" : "Procedural sounds"}</SelectLabel>
              {BASE_SFX_OPTIONS.map((option) => <SelectItem key={option.id} value={option.id}>{option.label[s.lang]}</SelectItem>)}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{s.lang === "vi" ? "Âm chuyển slide / swap" : "Slide transition / swap sounds"}</SelectLabel>
              {TRANSITION_SFX_OPTIONS.map((option) => <SelectItem key={option.id} value={option.id}>{option.label[s.lang]}</SelectItem>)}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{s.lang === "vi" ? "Âm swap" : "Swap sounds"}</SelectLabel>
              {SWAP_ASSET_SFX_OPTIONS.map((option) => <SelectItem key={option.id} value={option.id}>{option.label[s.lang]}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-10 text-xs">SFX</span>
        <Slider value={[s.sfxVol]} min={0} max={100} onValueChange={([value]) => s.setSfxVol(value)} />
        <span className="w-10 text-right font-mono text-xs">{s.sfxVol}%</span>
      </div>
      <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => testSfx(s.kineticSlideSfx)}>
        Test âm chuyển
      </Button>
      <p className="text-xs text-muted-foreground">{uiText("Kinetic dùng âm này mỗi khi chuyển keyword/slide, kể cả lúc export.")}</p>
    </div>
  );
}

function testSfx(kind: SfxKind) {
  audioEngine.resume();
  const option = getAssetSfxOption(kind);
  if (!option) return audioEngine.playSfx(kind, 0.72);
  void option.loadUrl()
    .then((url) => audioEngine.loadAssetSfx(option.id, url))
    .then(() => audioEngine.playSfx(option.id, 0.72))
    .catch(() => undefined);
}
