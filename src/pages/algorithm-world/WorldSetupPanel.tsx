import type React from "react";
import { Activity, Car, Dice5, EyeOff, Flag, GitCompare, Lock, Map, RotateCcw, Route, Sparkles, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAZE_PRESETS, WORLD_ALGORITHMS, localize, recommendedMazeForAlgorithm } from "@/lib/algorithmWorld";
import type { AlgorithmWorldAlgorithmId, AlgorithmWorldMazeId, AlgorithmWorldProblemType, AlgorithmWorldTournamentRound } from "@/lib/algorithms";
import { WORLD_VEHICLES, type AlgorithmWorldVehiclePreset } from "@/lib/algorithmWorldVehicles";
import { resolveTournamentMatch, tournamentMatchOptions, tournamentRoundLabel } from "@/lib/algorithmWorldTournament";
import type { AlgorithmStudio } from "@/pages/studio/useAlgorithmStudio";
import { TournamentMusicControls } from "./TournamentMusicControls";

type Props = { studio: AlgorithmStudio };
type TFn = (vi: string, en: string) => string;
type PanelProps = { s: AlgorithmStudio; t: TFn };
const SETUP_TAB_CLASS = "min-w-[92px] flex-1 px-2 text-xs";

export function WorldSetupPanel({ studio: s }: Props) {
  const vars = s.current?.vars ?? {};
  const world = s.current?.world ?? s.current?.worldCompare?.left;
  const phase = String(world?.raceIntroStage ?? world?.phase ?? vars.phase ?? "setup");
  const isLong = s.worldVideoMode === "long";
  const isRace = s.worldPresentationMode === "vehicle_race";
  const compareEnabled = s.worldCompareEnabled || isRace;
  const t = (vi: string, en: string) => s.lang === "vi" ? vi : en;

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-cyan-400/25 bg-cyan-400/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200"><Map className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{t("Tìm đường ra mê cung", "Maze Pathfinding")}</p>
            <h2 className="mt-1 text-lg font-bold">{t("Phòng lab mê cung", "Maze Lab")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Tạo short/long video tìm đường ra mê cung. Algorithm World lớn hơn sẽ tách riêng sau.", "Create short/long maze pathfinding videos. The broader Algorithm World will be rebuilt later.")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label={t("Mở", "Open")} value={vars.open ?? 0} tone="cyan" />
          <Metric label={t("Đã thăm", "Visited")} value={vars.visited ?? 0} tone="violet" />
          <Metric label={t("Bước", "Steps")} value={world?.stepCount ?? "—"} tone="rose" />
        </div>
        <Button variant="outline" className="w-full" onClick={() => { s.setPlaying(false); s.setFrameIdx(0); }}>
          <RotateCcw className="mr-2 h-4 w-4" /> {t("Reset timeline", "Reset timeline")}
        </Button>
      </Card>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="setup" className={SETUP_TAB_CLASS}>{t("Setup", "Setup")}</TabsTrigger>
          <TabsTrigger value="maze" className={SETUP_TAB_CLASS}>{t("Mê cung", "Maze")}</TabsTrigger>
          <TabsTrigger value="algo" className={SETUP_TAB_CLASS}>{t("Thuật toán", "Algorithms")}</TabsTrigger>
          <TabsTrigger value="tournament" className={SETUP_TAB_CLASS}>{t("Giải đấu", "Tournament")}</TabsTrigger>
          <TabsTrigger value="frames" className={SETUP_TAB_CLASS}>{t("Frame", "Frames")}</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <VideoLayoutCard s={s} isLong={isLong} isRace={isRace} compareEnabled={compareEnabled} t={t} />
          <ProblemTypeCard s={s} t={t} />
          <PresentationCard s={s} isRace={isRace} t={t} />
          <TournamentCard s={s} t={t} compact />
        </TabsContent>

        <TabsContent value="maze" className="space-y-4">
          <MazeCard s={s} t={t} />
        </TabsContent>

        <TabsContent value="algo" className="space-y-4">
          <AlgorithmsCard s={s} isLong={isLong} compareEnabled={compareEnabled} t={t} />
        </TabsContent>

        <TabsContent value="tournament" className="space-y-4">
          <TournamentCard s={s} t={t} />
        </TabsContent>

        <TabsContent value="frames" className="space-y-4">
          <BeatCard phase={phase} t={t} />
          <CodeCard s={s} compareEnabled={compareEnabled} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoLayoutCard({ s, isLong, isRace, compareEnabled, t }: PanelProps & { isLong: boolean; isRace: boolean; compareEnabled: boolean }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-300" /><Label>{t("Khung hình video", "Video layout")}</Label></div>
      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={!isLong} icon={<Route className="h-4 w-4" />} title="Short 9:16" desc={t("1 hoặc 2 thuật toán", "1 or 2 algorithms")} onClick={() => s.setWorldVideoMode("short")} />
        <ModeButton active={isLong} icon={<GitCompare className="h-4 w-4" />} title="Long 16:9" desc={t("So sánh ngang", "Side-by-side compare")} onClick={() => s.setWorldVideoMode("long")} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2">
        <div>
          <Label>{t("So sánh 2 thuật toán", "Compare 2 algorithms")}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRace
              ? t("Mode đua xe luôn chạy VS 2 thuật toán.", "Race mode always runs two algorithms.")
              : isLong
                ? t("Long 16:9 hiển thị trái/phải.", "Long 16:9 renders left/right.")
                : t("Short 9:16 hiển thị một thuật toán trên, một thuật toán dưới.", "Short 9:16 renders one algorithm on top and one below.")}
          </p>
        </div>
        <Switch checked={compareEnabled} disabled={isRace} onCheckedChange={s.setWorldCompareEnabled} />
      </div>
    </Card>
  );
}

function PresentationCard({ s, isRace, t }: PanelProps & { isRace: boolean }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Car className="h-4 w-4 text-orange-300" /><Label>{t("Kiểu video", "Video type")}</Label></div>
      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={!isRace} icon={<Sparkles className="h-4 w-4" />} title={t("Giải thích", "Explainer")} desc={t("hiện open/closed/path", "show open/closed/path")} onClick={() => s.setWorldPresentationMode("explainer")} />
        <ModeButton active={isRace} icon={<Car className="h-4 w-4" />} title={t("Pro: Đua xe", "Pro: Car race")} desc={t("xe nào ra nhanh hơn", "which car exits faster")} onClick={() => s.setWorldPresentationMode("vehicle_race")} />
      </div>
      {isRace ? (
        <div className="flex gap-2 rounded-lg border border-orange-300/40 bg-orange-400/10 p-3 text-xs text-orange-50">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("Trong mode đua xe, cả hai map hiện đầy đủ từ đầu và giống nhau. Xe chỉ được chạy sang ô lân cận không bị tường chắn.", "In car race mode, both full maps are visible from the start and identical. Cars may only move to adjacent unblocked cells.")}</p>
        </div>
      ) : null}
    </Card>
  );
}

function ProblemTypeCard({ s, t }: PanelProps) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-emerald-300" /><Label>{t("Kiểu bài toán", "Problem type")}</Label></div>
      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={s.worldProblemType === "escape"} title={t("Tìm đường ra", "Find exit")} desc={t("chỉ cần thoát", "any valid route")} onClick={() => s.setWorldProblemType("escape")} />
        <ModeButton active={s.worldProblemType === "fastest"} title={t("Đường nhanh nhất", "Fastest path")} desc={t("ngắn/rẻ nhất", "shortest/cheapest")} onClick={() => s.setWorldProblemType("fastest")} />
      </div>
    </Card>
  );
}

function MazeCard({ s, t }: PanelProps) {
  const current = MAZE_PRESETS.find((maze) => maze.id === s.worldMazeId);
  const randomSelected = s.worldMazeId === "random";
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Map className="h-4 w-4 text-cyan-300" /><Label>{t("Mê cung", "Maze preset")}</Label></div>
      <MazeSelect value={s.worldMazeId} onChange={s.setWorldMazeId} lang={s.lang} />
      {randomSelected ? (
        <p className="flex gap-2 rounded-lg border border-yellow-300/30 bg-yellow-400/10 p-3 text-xs text-yellow-50">
          <Dice5 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("Khi xuất/play, studio sẽ random sân đấu, hiện animation quay chọn, ráp map, rồi mới chiếu intro VS.", "When playing/exporting, the studio rolls a random arena, assembles the map, then shows the VS intro.")}</span>
        </p>
      ) : current ? <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{localize(current.note, s.lang)}</p> : null}
      <Button variant="secondary" className="w-full" onClick={() => s.setWorldMazeId(recommendedMazeForAlgorithm(s.worldPrimaryAlgorithm))}>
        {t("Dùng mê cung hợp thuật toán chính", "Use maze recommended for primary algorithm")}
      </Button>
    </Card>
  );
}

function AlgorithmsCard({ s, isLong, compareEnabled, t }: PanelProps & {
  isLong: boolean;
  compareEnabled: boolean;
}) {
  const isRace = s.worldPresentationMode === "vehicle_race";
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-300" /><Label>{t("Thuật toán có thể build", "Buildable algorithms")}</Label></div>
      {s.worldTournamentEnabled ? <div className="rounded-lg border border-yellow-300/30 bg-yellow-400/10 p-3 text-xs text-yellow-50">{t("Giải đấu đang bật: cặp thuật toán được lấy tự động từ bracket.", "Tournament is on: the algorithm pair is picked automatically from the bracket.")}</div> : null}
      <AlgorithmSelect label={compareEnabled ? t("Thuật toán trên/trái", "Top/left algorithm") : t("Thuật toán", "Algorithm")} value={s.worldPrimaryAlgorithm} onChange={s.setWorldPrimaryAlgorithm} problemType={s.worldProblemType} lang={s.lang} />
      {compareEnabled ? <AlgorithmSelect label={isLong ? t("Thuật toán phải", "Right algorithm") : t("Thuật toán dưới", "Bottom algorithm")} value={s.worldSecondaryAlgorithm} onChange={s.setWorldSecondaryAlgorithm} problemType={s.worldProblemType} lang={s.lang} /> : null}
      {isRace ? (
        <div className="space-y-3 rounded-lg border border-orange-300/30 bg-orange-400/10 p-3">
          <VehicleGarage title={t("1. Chọn xe cho thuật toán trên/trái", "1. Pick the top/left algorithm car")} selectedId={s.worldPrimaryVehicleId} onSelect={s.setWorldPrimaryVehicleId} />
          <VehicleGarage title={isLong ? t("2. Chọn xe cho thuật toán phải", "2. Pick the right algorithm car") : t("2. Chọn xe cho thuật toán dưới", "2. Pick the bottom algorithm car")} selectedId={s.worldSecondaryVehicleId} onSelect={s.setWorldSecondaryVehicleId} />
        </div>
      ) : null}
      <div className="space-y-2 pt-1">
        {WORLD_ALGORITHMS.map((item) => (
          <div key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{item.name}</span>
              <span className="font-mono text-yellow-300">{item.runtime}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{localize(item.note, s.lang)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TournamentCard({ s, t, compact = false }: PanelProps & { compact?: boolean }) {
  const round = s.worldTournamentRound as AlgorithmWorldTournamentRound;
  const match = resolveTournamentMatch(round, s.worldTournamentMatch, s.worldTournamentResults, s.worldTournamentEntrants);
  const options = tournamentMatchOptions(round, s.lang, s.worldTournamentResults, s.worldTournamentEntrants);
  const savedResults = Object.keys(s.worldTournamentResults).length;
  const entrantNames = s.worldTournamentEntrants.map((id) => WORLD_ALGORITHMS.find((item) => item.id === id)?.name ?? id.toUpperCase()).join(" · ");
  return (
    <Card className="space-y-3 border-yellow-300/25 bg-yellow-400/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-300" /><Label>{t("Giải đấu loại trực tiếp", "Knockout tournament")}</Label></div>
        <Switch checked={s.worldTournamentEnabled} onCheckedChange={s.setWorldTournamentEnabled} />
      </div>
      <p className="text-xs text-muted-foreground">{t("Shorts xuất từng trận riêng. Long 16:9 xuất toàn bộ giải: tứ kết trước, bán kết sau, rồi chung kết.", "Shorts export one match at a time. Long 16:9 exports the whole tournament: quarterfinals first, semifinals next, then the final.")}</p>
      {s.worldTournamentEnabled ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("Vòng đấu", "Round")}</Label>
              <Select value={String(round)} onValueChange={(value) => s.setWorldTournamentRound(Number(value) as AlgorithmWorldTournamentRound)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map((item) => <SelectItem key={item} value={String(item)}>{tournamentRoundLabel(item as AlgorithmWorldTournamentRound, s.lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("Trận", "Match")}</Label>
              <Select value={String(s.worldTournamentMatch)} onValueChange={(value) => s.setWorldTournamentMatch(Number(value))}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg border border-yellow-300/30 bg-slate-950/40 p-3 text-xs">
            <div className="font-semibold text-yellow-100">{worldMatchTitle(match.left, match.right)}</div>
            <div className="mt-1 text-muted-foreground">{s.worldVideoMode === "long" ? t("Long video sẽ tự ghép 7 trận theo thứ tự vòng ngoài vào vòng trong.", "Long video stitches all 7 matches from outer rounds to inner rounds.") : t("Map: random theo trận · Intro random → ráp map → VS → đua → winner → cây giải đấu", "Map: match-random · random roll → map assembly → VS → race → winner → bracket tree")}</div>
            <div className="mt-2 text-[11px] text-muted-foreground">{entrantNames}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("Link playlist YouTube", "YouTube playlist link")}</Label>
            <Input value={s.worldTournamentPlaylistUrl} onChange={(event) => s.setWorldTournamentPlaylistUrl(event.target.value)} placeholder="https://www.youtube.com/playlist?list=..." />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-xs">
            <span className="text-muted-foreground">{t(`Đã lưu ${savedResults} kết quả`, `${savedResults} saved results`)}</span>
            <Button variant="outline" size="sm" onClick={s.resetWorldTournamentResults}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> {t("Reset giải đấu", "Reset tournament")}
            </Button>
          </div>
        </div>
      ) : compact ? null : (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
          {t("Tắt giải đấu thì bạn tự chọn 2 thuật toán và mê cung ở các tab còn lại.", "When tournament is off, pick the two algorithms and maze manually in the other tabs.")}
        </div>
      )}
      <TournamentMusicControls studio={s} t={t} />
    </Card>
  );
}

function worldMatchTitle(left: AlgorithmWorldAlgorithmId, right: AlgorithmWorldAlgorithmId) {
  const a = WORLD_ALGORITHMS.find((item) => item.id === left)?.name ?? left.toUpperCase();
  const b = WORLD_ALGORITHMS.find((item) => item.id === right)?.name ?? right.toUpperCase();
  return `${a} VS ${b}`;
}

function VehicleGarage(props: { title: string; selectedId: string; onSelect: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{props.title}</Label>
      <div className="grid grid-cols-2 gap-2">
        {WORLD_VEHICLES.map((vehicle) => (
          <VehicleOption key={vehicle.id} vehicle={vehicle} active={props.selectedId === vehicle.id} onClick={() => props.onSelect(vehicle.id)} />
        ))}
      </div>
    </div>
  );
}

function VehicleOption(props: { vehicle: AlgorithmWorldVehiclePreset; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${props.active ? "border-emerald-300 bg-emerald-400/15 text-emerald-50" : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40"}`}
    >
      <MiniVehicle vehicle={props.vehicle} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{props.vehicle.name}</span>
        <span className="block font-mono text-[10px] opacity-80">{props.vehicle.color}</span>
      </span>
    </button>
  );
}

function MiniVehicle({ vehicle }: { vehicle: AlgorithmWorldVehiclePreset }) {
  const truck = vehicle.shape === "truck";
  const formula = vehicle.shape === "formula";
  return (
    <span className="relative block h-9 w-14 shrink-0">
      <span className="absolute left-1 top-3 h-4 rounded-sm" style={{ width: truck ? 42 : formula ? 34 : 38, backgroundColor: vehicle.color, boxShadow: `0 0 12px ${vehicle.color}` }} />
      <span className="absolute top-2 h-3 rounded-sm bg-white/70" style={{ left: formula ? 18 : 22, width: truck ? 10 : 12 }} />
      <span className="absolute bottom-1 left-2 h-2 w-2 rounded-full bg-slate-950 ring-1 ring-white/70" />
      <span className="absolute bottom-1 right-2 h-2 w-2 rounded-full bg-slate-950 ring-1 ring-white/70" />
    </span>
  );
}

function BeatCard({ phase, t }: { phase: string; t: (vi: string, en: string) => string }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-300" /><Label>{t("Danh sách frame", "Frame list")}</Label></div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <Beat active={phase === "randomizing"} text={t("1. Random sân đấu", "1. Random arena roll")} />
        <Beat active={phase === "assembling"} text={t("2. Ráp sân đấu vào map", "2. Assemble arena map")} />
        <Beat active={phase === "versus"} text={t("3. Chiếu intro VS", "3. Show VS intro")} />
        <Beat active={phase === "search" || phase === "setup"} text={t("4. Hai xe bắt đầu đua", "4. Cars start racing")} />
        <Beat active={phase === "winner" || phase === "done"} text={t("5. Đẩy WINNER lên giữa video", "5. Push WINNER to center")} />
        <Beat active={phase === "bracket"} text={t("6. Hiện cây giải đấu và đội đi tiếp", "6. Show bracket tree and advancing team")} />
      </div>
    </Card>
  );
}

function CodeCard({ s, compareEnabled, t }: PanelProps & { compareEnabled: boolean }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>{s.tr("showCodeInVideo")}</Label>
          {compareEnabled ? <p className="mt-1 text-xs text-muted-foreground">{t("VS mode không thể bật code để tránh che bố cục so sánh.", "VS mode cannot show code because it would cover the comparison layout.")}</p> : null}
        </div>
        <Switch checked={s.showCode && !compareEnabled} disabled={compareEnabled} onCheckedChange={s.setShowCode} />
      </div>
      {s.exportLocked ? <div className="flex items-center gap-2 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100"><Lock className="h-3.5 w-3.5" />{t("Cần đăng nhập để xuất video.", "Login is required to export video.")}</div> : null}
      <pre className="max-h-52 overflow-auto rounded-lg border border-border/50 bg-slate-950/60 p-3 text-[11px] text-slate-200">{s.codeForPanel}</pre>
    </Card>
  );
}

function AlgorithmSelect(props: { label: string; value: AlgorithmWorldAlgorithmId; problemType: AlgorithmWorldProblemType; lang: "en" | "vi"; onChange: (value: AlgorithmWorldAlgorithmId) => void }) {
  const t = (vi: string, en: string) => props.lang === "vi" ? vi : en;
  return (
    <div>
      <Label className="text-xs">{props.label}</Label>
      <Select value={props.value} onValueChange={(value) => props.onChange(value as AlgorithmWorldAlgorithmId)}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          {WORLD_ALGORITHMS.map((item) => {
            const recommended = item.taskFit.includes(props.problemType);
            return <SelectItem key={item.id} value={item.id}>{item.name} · {item.runtime}{recommended ? "" : ` · ${t("không tối ưu", "not ideal")}`}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function MazeSelect(props: { value: AlgorithmWorldMazeId; lang: "en" | "vi"; onChange: (value: AlgorithmWorldMazeId) => void }) {
  const t = (vi: string, en: string) => props.lang === "vi" ? vi : en;
  return (
    <Select value={props.value} onValueChange={(value) => props.onChange(value as AlgorithmWorldMazeId)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="random">🎲 {t("Ngẫu nhiên sân đấu", "Random arena")}</SelectItem>
        {MAZE_PRESETS.map((maze) => (
          <SelectItem key={maze.id} value={maze.id}>{localize(maze.name, props.lang)} · {maze.recommendedFor.map((id) => id.toUpperCase()).join("/")}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Metric(props: { label: string; value: unknown; tone: "cyan" | "violet" | "rose" }) {
  const toneClass = props.tone === "cyan" ? "text-cyan-200" : props.tone === "violet" ? "text-violet-200" : "text-rose-200";
  return (
    <div className="rounded-lg border border-border/50 bg-background/60 p-2">
      <div className={`font-mono text-lg font-bold ${toneClass}`}>{String(props.value)}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{props.label}</div>
    </div>
  );
}

function ModeButton(props: { active: boolean; title: string; desc: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-lg border p-3 text-left text-xs transition ${props.active ? "border-emerald-300 bg-emerald-400/10 text-emerald-100" : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40"}`}
    >
      <div className="flex items-center gap-2 font-semibold">{props.icon}{props.title}</div>
      <div className="mt-1 opacity-80">{props.desc}</div>
    </button>
  );
}

function Beat({ active, text }: { active: boolean; text: string }) {
  return <div className={active ? "rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-200" : "px-2 py-1"}>{text}</div>;
}
