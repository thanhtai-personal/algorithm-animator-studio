import type {
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldTournamentMatch,
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

export function tournamentMatchOptions(round: AlgorithmWorldTournamentRound, lang: Lang) {
  return Array.from({ length: maxTournamentMatches(round) }, (_, match) => {
    const resolved = resolveTournamentMatch(round, match);
    return {
      value: String(match),
      label: `${tournamentMatchLabel(round, match, lang)} · ${worldAlgorithmName(resolved.left)} VS ${worldAlgorithmName(resolved.right)}`,
    };
  });
}

export function resolveTournamentMatch(round: AlgorithmWorldTournamentRound, match: number): ResolvedMatch {
  const safeRound = normalizeTournamentRound(round);
  const safeMatch = normalizeTournamentMatch(safeRound, match);
  if (safeRound === 0) {
    const left = TOURNAMENT_ENTRANTS[safeMatch * 2];
    const right = TOURNAMENT_ENTRANTS[safeMatch * 2 + 1];
    return { round: safeRound, match: safeMatch, left, right };
  }
  const leftPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2);
  const rightPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2 + 1);
  return {
    round: safeRound,
    match: safeMatch,
    left: predictTournamentWinner(leftPrev.left, leftPrev.right, leftPrev.round, leftPrev.match),
    right: predictTournamentWinner(rightPrev.left, rightPrev.right, rightPrev.round, rightPrev.match),
  };
}

export function buildTournamentState(args: {
  round: AlgorithmWorldTournamentRound;
  match: number;
  winner?: AlgorithmWorldAlgorithmId;
}): AlgorithmWorldTournamentState {
  const round = normalizeTournamentRound(args.round);
  const match = normalizeTournamentMatch(round, args.match);
  const currentWinner = args.winner ? team(args.winner) : undefined;
  const rounds: AlgorithmWorldTournamentMatch[][] = [0, 1, 2].map((r) => {
    const rr = r as AlgorithmWorldTournamentRound;
    return Array.from({ length: maxTournamentMatches(rr) }, (_, m) => buildMatch(rr, m, round, match, currentWinner));
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
  currentWinner?: AlgorithmWorldTournamentTeam,
): AlgorithmWorldTournamentMatch {
  const resolved = resolveTournamentMatch(round, match);
  const active = round === activeRound && match === activeMatch;
  const winner = active ? currentWinner : round < activeRound ? team(predictTournamentWinner(resolved.left, resolved.right, round, match)) : undefined;
  return {
    id: `r${round}m${match}`,
    round,
    match,
    left: team(resolved.left),
    right: team(resolved.right),
    winner,
    active,
    pending: !winner && round >= activeRound,
  };
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
