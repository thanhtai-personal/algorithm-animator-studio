import { BookMarked, Library, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryChapterEditor } from "@/features/story-author/components/StoryChapterEditor";
import { StoryDetailsPanel } from "@/features/story-author/components/StoryDetailsPanel";
import { StoryLibraryPanel } from "@/features/story-author/components/StoryLibraryPanel";
import { useStoryAuthorStudio } from "@/features/story-author/useStoryAuthorStudio";
import { uiText } from "@/lib/i18n";

export default function StoryAuthorStudio() {
  const studio = useStoryAuthorStudio();
  const totalChapters = studio.projects.reduce((sum, project) => sum + project.chapters.length, 0);
  const totalCharacters = studio.projects.reduce((sum, project) => (
    sum + project.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.content.length, 0)
  ), 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1780px] grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 lg:p-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 xl:sticky xl:top-4 xl:self-start">
          <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-950/45 via-background to-background shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
            <CardHeader className="space-y-3 p-4 sm:p-5">
              <CardTitle className="flex items-start gap-2 text-lg leading-7 sm:text-xl">
                <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <span>{uiText("Hỗ trợ sáng tác truyện")}</span>
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Lưu ý tưởng, outline, nhân vật và nội dung chương. Dùng filter để tìm lại truyện đã sáng tác.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 p-4 pt-0 text-sm sm:p-5 sm:pt-0">
              <Metric label={uiText("Tổng truyện")} value={`${studio.projects.length}`} />
              <Metric label={uiText("Tổng chương")} value={`${totalChapters}`} />
              <Metric label={uiText("Số ký tự")} value={totalCharacters.toLocaleString("vi-VN")} />
              {studio.selectedProject ? <Badge variant="outline" className="justify-center">{studio.selectedProject.title}</Badge> : null}
            </CardContent>
          </Card>
          <StoryLibraryPanel studio={studio} />
        </aside>

        <section className="min-w-0">
          <Tabs defaultValue="details" className="min-w-0">
            <div className="sticky top-0 z-20 -mx-3 mb-3 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1">
                <TabsTrigger value="details" className="gap-2"><Library className="h-4 w-4" /> {uiText("Hồ sơ truyện")}</TabsTrigger>
                <TabsTrigger value="chapters" className="gap-2"><BookMarked className="h-4 w-4" /> {uiText("Chương truyện")}</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="details" className="mt-0"><StoryDetailsPanel studio={studio} /></TabsContent>
            <TabsContent value="chapters" className="mt-0"><StoryChapterEditor studio={studio} /></TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="min-w-0 text-muted-foreground">{props.label}</span>
      <span className="font-medium">{props.value}</span>
    </div>
  );
}
