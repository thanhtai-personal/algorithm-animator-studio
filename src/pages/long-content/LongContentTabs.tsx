import { YoutubeMetadataPreview } from "@/components/YoutubeMetadataPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptPanel } from "./ScriptPanel";
import { VoicePanel } from "./VoicePanel";
import type { LongContentStudio } from "./useLongContentStudio";

export function LongContentTabs({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="publish">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="publish">{s.lang === "vi" ? "Đăng" : "Publish"}</TabsTrigger>
          <TabsTrigger value="script">{s.lang === "vi" ? "Kịch bản" : "Script"}</TabsTrigger>
          <TabsTrigger value="voice">{s.lang === "vi" ? "Voice" : "Voice"}</TabsTrigger>
        </TabsList>
        <TabsContent value="publish" className="space-y-4 pt-3">
          <YoutubeMetadataPreview algoId={s.algo.id} lang={s.lang} variant="long" longVideoType={s.longVideoType} musicLicenseText={s.music.selectedLicenseText} />
        </TabsContent>
        <TabsContent value="script" className="space-y-4 pt-3">
          <ScriptPanel studio={s} compact />
        </TabsContent>
        <TabsContent value="voice" className="space-y-4 pt-3">
          <VoicePanel studio={s} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
