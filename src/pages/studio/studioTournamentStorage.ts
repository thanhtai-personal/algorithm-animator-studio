import type { Frame, AlgorithmWorldAlgorithmId, AlgorithmWorldTournamentResults, AlgorithmWorldTournamentRound } from "@/lib/algorithms";
import type { BackgroundMusicId } from "@/lib/backgroundMusic";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import { normalizeTournamentEntrants, normalizeTournamentMatch, normalizeTournamentRound } from "@/lib/algorithmWorldTournament";

const WORLD_TOURNAMENT_RESULTS_KEY = "algoshorts.mazeTournamentResults.v1";
const WORLD_TOURNAMENT_SETTINGS_KEY = "algoshorts.mazeTournamentSettings.v1";

export function readTournamentResults(): AlgorithmWorldTournamentResults {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WORLD_TOURNAMENT_RESULTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const validIds = new Set(Object.keys(WORLD_ALGORITHMS_FOR_STORAGE));
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string" && validIds.has(value)),
    ) as AlgorithmWorldTournamentResults;
  } catch {
    return {};
  }
}

export function writeTournamentResults(results: AlgorithmWorldTournamentResults) {
  if (typeof window === "undefined") return;
  if (Object.keys(results).length === 0) {
    window.localStorage.removeItem(WORLD_TOURNAMENT_RESULTS_KEY);
    return;
  }
  window.localStorage.setItem(WORLD_TOURNAMENT_RESULTS_KEY, JSON.stringify(results));
}

export type StoredTournamentSettings = {
  enabled: boolean;
  round: AlgorithmWorldTournamentRound;
  match: number;
  entrants: AlgorithmWorldAlgorithmId[];
  playlistUrl: string;
  worldRandomSeed: number;
  startMusic: BackgroundMusicId;
  raceMusic: BackgroundMusicId;
  resultMusic: BackgroundMusicId;
};

export function readTournamentSettings(): StoredTournamentSettings {
  const fallback: StoredTournamentSettings = { enabled: false, round: 0, match: 0, entrants: normalizeTournamentEntrants(), playlistUrl: "", worldRandomSeed: createWorldRandomSeed(), startMusic: "off", raceMusic: "off", resultMusic: "off" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(WORLD_TOURNAMENT_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredTournamentSettings>;
    const round = normalizeTournamentRound(Number(parsed.round ?? 0));
    return {
      enabled: Boolean(parsed.enabled),
      round,
      match: normalizeTournamentMatch(round, Number(parsed.match ?? 0)),
      entrants: normalizeTournamentEntrants(parsed.entrants),
      playlistUrl: typeof parsed.playlistUrl === "string" ? parsed.playlistUrl : "",
      worldRandomSeed: normalizeWorldRandomSeed(parsed.worldRandomSeed, fallback.worldRandomSeed),
      startMusic: normalizeBackgroundMusicId(parsed.startMusic),
      raceMusic: normalizeBackgroundMusicId(parsed.raceMusic),
      resultMusic: normalizeBackgroundMusicId(parsed.resultMusic),
    };
  } catch {
    return fallback;
  }
}

export function createWorldRandomSeed() {
  return Math.floor(Date.now() % 1_000_000_000);
}

function normalizeWorldRandomSeed(value: unknown, fallback: number) {
  const seed = Number(value);
  return Number.isFinite(seed) ? seed : fallback;
}

export function writeTournamentSettings(settings: StoredTournamentSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORLD_TOURNAMENT_SETTINGS_KEY, JSON.stringify(settings));
}

function normalizeBackgroundMusicId(value: unknown): BackgroundMusicId {
  if (value === "off" || value === "lofi" || value === "ambient" || value === "chill" || value === "upbeat" || value === "custom") return value;
  if (typeof value === "string" && (value.startsWith("asset:") || value.startsWith("library:"))) return value as BackgroundMusicId;
  return "off";
}

export function tournamentMusicForFrame(
  frame: Frame | null | undefined,
  music: { start: BackgroundMusicId; race: BackgroundMusicId; result: BackgroundMusicId },
) {
  const intro = frame?.worldCompare?.raceIntro;
  const stage = intro?.stage ?? frame?.world?.raceIntroStage;
  if (stage === "winner" || intro?.winnerAlgorithm) return music.result;
  if (stage === "race") return music.race;
  return music.start;
}

export function tournamentMusicLicenseText(presets: BackgroundMusicId[], tracks: MusicLibraryTrack[]) {
  const text = presets
    .map((preset) => tracks.find((track) => track.id === preset)?.licenseText)
    .filter((license): license is string => Boolean(license));
  return Array.from(new Set(text)).join("\n");
}

const WORLD_ALGORITHMS_FOR_STORAGE: Record<AlgorithmWorldAlgorithmId, true> = {
  dfs: true,
  bfs: true,
  dijkstra: true,
  astar: true,
  greedy: true,
  weighted_astar: true,
  beam: true,
  bidirectional_bfs: true,
  wall_follower: true,
  tremaux: true,
  fringe: true,
  theta_star: true,
};
