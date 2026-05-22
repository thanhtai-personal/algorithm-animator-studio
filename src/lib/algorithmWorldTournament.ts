import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldTournamentMatch,
  AlgorithmWorldTournamentResults,
  AlgorithmWorldTournamentRound,
  AlgorithmWorldTournamentState,
  AlgorithmWorldTournamentTeam,
} from "./algorithms/types";
import type { Lang } from "./i18n";
import { worldAlgorithmName } from "./algorithmWorld";

export const TOURNAMENT_ENTRANTS: AlgorithmWorldAlgorithmId[] = [
  "astar",
  "dijkstra",
  "bfs",
  "dfs",
  "greedy",
  "weighted_astar",
  "beam",
  "bidirectional_bfs",
];

const ROUND_MATCHES = [4, 2, 1] as const;
const STRENGTH: Record<AlgorithmWorldAlgorithmId, number> = {
  astar: 95,
  dijkstra: 90,
  bidirectional_bfs: 88,
  weighted_astar: 86,
  bfs: 82,
  greedy: 76,
  beam: 72,
  dfs: 64,
  tremaux: 66,
  wall_follower: 58,
};

type ResolvedMatch = {
  round: AlgorithmWorldTournamentRound;
  match: number;
  left: AlgorithmWorldAlgorithmId;
  right: AlgorithmWorldAlgorithmId;
};

export function normalizeTournamentRound(value: number): AlgorithmWorldTournamentRound {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  return 2;
}

export function maxTournamentMatches(round: AlgorithmWorldTournamentRound) {
  return ROUND_MATCHES[round];
}

export function normalizeTournamentMatch(round: AlgorithmWorldTournamentRound, value: number) {
  return Math.min(Math.max(0, value), maxTournamentMatches(round) - 1);
}

export function tournamentSeed(round: AlgorithmWorldTournamentRound, match: number) {
  return 311 + round * 997 + match * 173;
}

export function tournamentRoundLabel(round: AlgorithmWorldTournamentRound, lang: Lang) {
  if (round === 0) return lang === "vi" ? "Tứ kết" : "Quarterfinals";
  if (round === 1) return lang === "vi" ? "Bán kết" : "Semifinals";
  return lang === "vi" ? "Chung kết" : "Final";
}

export function tournamentMatchLabel(round: AlgorithmWorldTournamentRound, match: number, lang: Lang) {
  const label = tournamentRoundLabel(round, lang);
  return `${label} ${match + 1}`;
}

export function tournamentResultKey(round: AlgorithmWorldTournamentRound, match: number) {
  return `r${round}m${match}`;
}

export function tournamentMatchOptions(round: AlgorithmWorldTournamentRound, lang: Lang, results: AlgorithmWorldTournamentResults = {}) {
  return Array.from({ length: maxTournamentMatches(round) }, (_, match) => {
    const resolved = resolveTournamentMatch(round, match, results);
    return {
      value: String(match),
      label: `${tournamentMatchLabel(round, match, lang)} · ${worldAlgorithmName(resolved.left)} VS ${worldAlgorithmName(resolved.right)}`,
    };
  });
}

export function resolveTournamentMatch(round: AlgorithmWorldTournamentRound, match: number, results: AlgorithmWorldTournamentResults = {}): ResolvedMatch {
  const safeRound = normalizeTournamentRound(round);
  const safeMatch = normalizeTournamentMatch(safeRound, match);
  if (safeRound === 0) {
    const left = TOURNAMENT_ENTRANTS[safeMatch * 2];
    const right = TOURNAMENT_ENTRANTS[safeMatch * 2 + 1];
    return { round: safeRound, match: safeMatch, left, right };
  }
  const leftPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2, results);
  const rightPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2 + 1, results);
  return {
    round: safeRound,
    match: safeMatch,
    left: results[tournamentResultKey(leftPrev.round, leftPrev.match)] ?? predictTournamentWinner(leftPrev.left, leftPrev.right, leftPrev.round, leftPrev.match),
    right: results[tournamentResultKey(rightPrev.round, rightPrev.match)] ?? predictTournamentWinner(rightPrev.left, rightPrev.right, rightPrev.round, rightPrev.match),
  };
}

export function buildTournamentState(args: {
  round: AlgorithmWorldTournamentRound;
  match: number;
  winner?: AlgorithmWorldAlgorithmId;
  results?: AlgorithmWorldTournamentResults;
}): AlgorithmWorldTournamentState {
  const round = normalizeTournamentRound(args.round);
  const match = normalizeTournamentMatch(round, args.match);
  const currentWinner = args.winner ? team(args.winner) : undefined;
  const results = args.results ?? {};
  const rounds: AlgorithmWorldTournamentMatch[][] = [0, 1, 2].map((r) => {
    const rr = r as AlgorithmWorldTournamentRound;
    return Array.from({ length: maxTournamentMatches(rr) }, (_, m) => buildMatch(rr, m, round, match, results, currentWinner));
  });
  return {
    titleEn: "Maze Algorithm Knockout",
    titleVi: "Giải đấu thuật toán mê cung",
    round,
    match,
    rounds,
    winnerName: currentWinner?.name,
  };
}

function buildMatch(
  round: AlgorithmWorldTournamentRound,
  match: number,
  activeRound: AlgorithmWorldTournamentRound,
  activeMatch: number,
  results: AlgorithmWorldTournamentResults,
  currentWinner?: AlgorithmWorldTournamentTeam,
): AlgorithmWorldTournamentMatch {
  const active = round === activeRound && match === activeMatch;
  const storedWinner = results[tournamentResultKey(round, match)];
  const winner = active && currentWinner ? currentWinner : storedWinner ? team(storedWinner) : undefined;
  const leftId = matchParticipant(round, match, 0, results);
  const rightId = matchParticipant(round, match, 1, results);
  return {
    id: `r${round}m${match}`,
    round,
    match,
    left: leftId ? team(leftId) : undefined,
    right: rightId ? team(rightId) : undefined,
    winner,
    active,
    pending: !winner,
  };
}

function matchParticipant(
  round: AlgorithmWorldTournamentRound,
  match: number,
  slot: 0 | 1,
  results: AlgorithmWorldTournamentResults,
): AlgorithmWorldAlgorithmId | undefined {
  if (round === 0) return TOURNAMENT_ENTRANTS[match * 2 + slot];
  const previousRound = (round - 1) as AlgorithmWorldTournamentRound;
  return results[tournamentResultKey(previousRound, match * 2 + slot)];
}

function predictTournamentWinner(
  left: AlgorithmWorldAlgorithmId,
  right: AlgorithmWorldAlgorithmId,
  round: AlgorithmWorldTournamentRound,
  match: number,
): AlgorithmWorldAlgorithmId {
  const salt = hash(`${left}-${right}-${round}-${match}`) % 11;
  const leftScore = (STRENGTH[left] ?? 60) + salt;
  const rightScore = (STRENGTH[right] ?? 60) + (10 - salt);
  return leftScore >= rightScore ? left : right;
}

function team(id: AlgorithmWorldAlgorithmId): AlgorithmWorldTournamentTeam {
  return { id, name: worldAlgorithmName(id) };
}

function hash(value: string) {
  let total = 0;
  for (let i = 0; i < value.length; i++) total = (total * 31 + value.charCodeAt(i)) >>> 0;
  return total;
}
