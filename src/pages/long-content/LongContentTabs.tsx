import { YoutubeMetadataPreview } from "@/components/YoutubeMetadataPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackgroundImagePanel } from "./BackgroundImagePanel";
import { MusicPanel } from "./MusicPanel";
import { ScriptPanel } from "./ScriptPanel";
import type { LongContentStudio } from "./useLongContentStudio";

export function LongContentTabs({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="publish">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="publish">{s.lang === "vi" ? "Đăng" : "Publish"}</TabsTrigger>
          <TabsTrigger value="media">{s.lang === "vi" ? "Media" : "Media"}</TabsTrigger>
          <TabsTrigger value="script">{s.lang === "vi" ? "Kịch bản" : "Script"}</TabsTrigger>
        </TabsList>
        <TabsContent value="publish" className="space-y-4 pt-3">
          <YoutubeMetadataPreview algoId={s.algo.id} lang={s.lang} variant="long" longVideoType={s.longVideoType} musicLicenseText={s.music.selectedLicenseText} />
        </TabsContent>
        <TabsContent value="media" className="space-y-4 pt-3">
          <BackgroundImagePanel studio={s} />
          <MusicPanel studio={s} compact />
        </TabsContent>
        <TabsContent value="script" className="space-y-4 pt-3">
          <ScriptPanel studio={s} compact />
        </TabsContent>
      </Tabs>
    </div>
  );
}
