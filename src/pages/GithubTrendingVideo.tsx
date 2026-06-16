import type { ReactNode } from "react";
import { Github, RefreshCcw, RotateCcw, Sparkles, Video } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GithubTrendingProductionPanel } from "@/features/github-trending/components/GithubTrendingProductionPanel";
import { TrendingRepoCard } from "@/features/github-trending/components/TrendingRepoCard";
import { TrendingVideoScriptPanel } from "@/features/github-trending/components/TrendingVideoScriptPanel";
import { useGithubTrendingVideo } from "@/features/github-trending/useGithubTrendingVideo";
import { RemotionVideoGenerator } from "@/features/remotion-video/components/RemotionVideoGenerator";

export default function GithubTrendingVideo() {
  const studio = useGithubTrendingVideo();
  const preset = {
    template: "news-card" as const,
    title: studio.plan.title,
    subtitle: studio.plan.hook,
    algorithmLabel: "GitHub Trending",
    narration: studio.plan.narration,
    data: studio.plan.data,
    aspectRatio: "16:9" as const,
    durationSeconds: Math.max(24, studio.selectedRepos.length * 12 + 12),
    accentColor: "#22d3ee",
    primaryColor: "#020617",
    watermark: `KAI STUDIO · OPEN SOURCE · ${studio.plan.language.toUpperCase()}`,
    voiceAudioUrl: studio.generatedMedia.voiceUrl,
    backgroundMusicUrl: studio.generatedMedia.musicUrl,
    voiceVolume: studio.production.voiceVolume,
    backgroundMusicVolume: studio.production.musicVolume,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1780px] gap-4 p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden border-cyan-400/20 bg-gradient-to-br from-cyan-950/50 via-background to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Github className="h-5 w-5 text-cyan-300" /> GitHub Trend Video</CardTitle>
              <CardDescription>Tải repo open source đang lên trend, chọn repo nổi bật, sinh script và render video giới thiệu.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Topic / keyword">
                <Input value={studio.filter.topic} onChange={(event) => studio.updateFilter({ topic: event.target.value })} placeholder="ai, react, developer-tools..." />
              </Field>
              <Field label="Language">
                <Input value={studio.filter.language} onChange={(event) => studio.updateFilter({ language: event.target.value })} placeholder="TypeScript, Python..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Khoảng thời gian">
                  <Select value={String(studio.filter.days)} onValueChange={(value) => studio.updateFilter({ days: Number(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="14">14 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Số repo">
                  <Select value={String(studio.filter.limit)} onValueChange={(value) => studio.updateFilter({ limit: Number(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Min stars">
                <Input type="number" value={studio.filter.minStars} onChange={(event) => studio.updateFilter({ minStars: Number(event.target.value) })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" onClick={() => void studio.loadTrending()} disabled={studio.loading}>
                  {studio.loading ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCcw className="mr-2 h-4 w-4" />} Tải trending
                </Button>
                <Button type="button" variant="outline" onClick={studio.clearDraft}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/20">
            <CardContent className="grid gap-2 p-4 text-sm">
              <Stat label="Repo đã tải" value={String(studio.repos.length)} />
              <Stat label="Repo chọn" value={`${studio.selectedRepos.length}/6`} />
              <Stat label="Video length" value={`${preset.durationSeconds}s`} />
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-4">
          <Card className="border-cyan-400/20 bg-cyan-500/[0.03]">
            <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-300" /> Workflow video open source</CardTitle>
                <CardDescription>Chọn tối đa 6 repo để video có nhịp tốt: hook → từng repo → recap → CTA.</CardDescription>
              </div>
              <Badge variant="outline"><Video className="mr-1 h-3.5 w-3.5" /> Remotion ready</Badge>
            </CardHeader>
            <CardContent>
              {studio.repos.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {studio.repos.map((repo) => <TrendingRepoCard key={repo.id} repo={repo} selected={studio.selectedIds.includes(repo.id)} onToggle={() => studio.toggleRepo(repo.id)} />)}
                </div>
              ) : (
                <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-cyan-400/30 bg-muted/10 p-8 text-center">
                  <div className="max-w-md space-y-2">
                    <Github className="mx-auto h-10 w-10 text-cyan-300" />
                    <h2 className="text-xl font-bold">Chưa có dữ liệu trending</h2>
                    <p className="text-sm text-muted-foreground">Bấm “Tải trending” để lấy repo mới từ GitHub Search API, sau đó chọn repo để tạo video giới thiệu.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <GithubTrendingProductionPanel
            production={studio.production}
            generatedVoice={studio.generatedVoice}
            voiceUrl={studio.generatedMedia.voiceUrl}
            musicUrl={studio.generatedMedia.musicUrl}
            musicLabel={studio.generatedMedia.musicLabel}
            voiceLoading={studio.voiceLoading}
            catalogLoading={studio.catalogLoading}
            piperModels={studio.piperModels}
            elevenLabsConfig={studio.elevenLabsConfig}
            supertonicConfig={studio.supertonicConfig}
            rvcApplioConfig={studio.rvcApplioConfig}
            vieneuConfig={studio.vieneuConfig}
            assetMusicOptions={studio.assetMusicOptions}
            musicTracks={studio.musicTracks}
            updateProduction={studio.updateProduction}
            generateVoiceOver={() => void studio.generateVoiceOver()}
            clearGeneratedVoice={studio.clearGeneratedVoice}
            reloadCatalogs={() => void studio.loadProductionCatalogs()}
          />
          <TrendingVideoScriptPanel plan={studio.plan} />
          <RemotionVideoGenerator fixedTemplate="news-card" preset={preset} heading="Render video giới thiệu GitHub trending" description="Preview và render MP4 intro open source bằng Remotion backend local." onVideoCreated={() => undefined} />
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
