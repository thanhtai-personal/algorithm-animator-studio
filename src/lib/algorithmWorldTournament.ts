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

export const TOURNAMENT_POOL: AlgorithmWorldAlgorithmId[] = [
  ...TOURNAMENT_ENTRANTS,
  "wall_follower",
  "tremaux",
  "fringe",
  "theta_star",
];

const ROUND_MATCHES = [4, 2, 1] as const;
const STRENGTH: Record<AlgorithmWorldAlgorithmId, number> = {
  astar: 95,
  theta_star: 92,
  dijkstra: 90,
  bidirectional_bfs: 88,
  weighted_astar: 86,
  fringe: 84,
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

export function tournamentSeed(round: AlgorithmWorldTournamentRound, match: number, entrants: AlgorithmWorldAlgorithmId[] = []) {
  return 311 + round * 997 + match * 173 + hash(normalizeTournamentEntrants(entrants).join("|")) % 997;
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

export function tournamentMatchOptions(round: AlgorithmWorldTournamentRound, lang: Lang, results: AlgorithmWorldTournamentResults = {}, entrants?: AlgorithmWorldAlgorithmId[]) {
  return Array.from({ length: maxTournamentMatches(round) }, (_, match) => {
    const resolved = resolveTournamentMatch(round, match, results, entrants);
    return {
      value: String(match),
      label: `${tournamentMatchLabel(round, match, lang)} · ${worldAlgorithmName(resolved.left)} VS ${worldAlgorithmName(resolved.right)}`,
    };
  });
}

export function resolveTournamentMatch(round: AlgorithmWorldTournamentRound, match: number, results: AlgorithmWorldTournamentResults = {}, entrants?: AlgorithmWorldAlgorithmId[]): ResolvedMatch {
  const safeRound = normalizeTournamentRound(round);
  const safeMatch = normalizeTournamentMatch(safeRound, match);
  const roster = normalizeTournamentEntrants(entrants);
  if (safeRound === 0) {
    const left = roster[safeMatch * 2];
    const right = roster[safeMatch * 2 + 1];
    return { round: safeRound, match: safeMatch, left, right };
  }
  const leftPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2, results, roster);
  const rightPrev = resolveTournamentMatch((safeRound - 1) as AlgorithmWorldTournamentRound, safeMatch * 2 + 1, results, roster);
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
  entrants?: AlgorithmWorldAlgorithmId[];
}): AlgorithmWorldTournamentState {
  const round = normalizeTournamentRound(args.round);
  const match = normalizeTournamentMatch(round, args.match);
  const currentWinner = args.winner ? team(args.winner) : undefined;
  const results = args.results ?? {};
  const entrants = normalizeTournamentEntrants(args.entrants);
  const rounds: AlgorithmWorldTournamentMatch[][] = [0, 1, 2].map((r) => {
    const rr = r as AlgorithmWorldTournamentRound;
    return Array.from({ length: maxTournamentMatches(rr) }, (_, m) => buildMatch(rr, m, round, match, results, currentWinner, entrants));
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

export function visibleTournamentResults(
  activeRound: AlgorithmWorldTournamentRound,
  activeMatch: number,
  results: AlgorithmWorldTournamentResults = {},
) {
  const round = normalizeTournamentRound(activeRound);
  const match = normalizeTournamentMatch(round, activeMatch);
  return Object.fromEntries(
    Object.entries(results).filter(([key]) => {
      const parsed = parseTournamentResultKey(key);
      if (!parsed) return false;
      if (parsed.round < round) return true;
      return parsed.round === round && parsed.match < match;
    }),
  ) as AlgorithmWorldTournamentResults;
}

export function normalizeTournamentEntrants(entrants?: AlgorithmWorldAlgorithmId[]) {
  const valid = new Set<AlgorithmWorldAlgorithmId>();
  const normalized = (entrants ?? []).filter((id) => {
    if (!TOURNAMENT_POOL.includes(id) || valid.has(id)) return false;
    valid.add(id);
    return true;
  });
  return normalized.length === TOURNAMENT_ENTRANTS.length ? normalized : TOURNAMENT_ENTRANTS;
}

export function nextTournamentEntrants(current: AlgorithmWorldAlgorithmId[], results: AlgorithmWorldTournamentResults = {}) {
  const previous = normalizeTournamentEntrants(current);
  const finalists = tournamentFinalists(previous, results);
  const previousSet = new Set(previous);
  const newTeams = shuffle(TOURNAMENT_POOL.filter((id) => !previousSet.has(id)), hash(JSON.stringify(results) + previous.join("|"))).slice(0, 4);
  const available = shuffle(TOURNAMENT_POOL.filter((id) => !finalists.includes(id) && !newTeams.includes(id)), hash(previous.join("-"))).slice(0, 2);
  return pairStrongTeams(shuffle([...finalists, ...newTeams, ...available], Date.now()));
}

function buildMatch(
  round: AlgorithmWorldTournamentRound,
  match: number,
  activeRound: AlgorithmWorldTournamentRound,
  activeMatch: number,
  results: AlgorithmWorldTournamentResults,
  currentWinner?: AlgorithmWorldTournamentTeam,
  entrants: AlgorithmWorldAlgorithmId[] = TOURNAMENT_ENTRANTS,
): AlgorithmWorldTournamentMatch {
  const active = round === activeRound && match === activeMatch;
  const storedWinner = results[tournamentResultKey(round, match)];
  const winner = active && currentWinner ? currentWinner : storedWinner ? team(storedWinner) : undefined;
  const leftId = matchParticipant(round, match, 0, results, entrants);
  const rightId = matchParticipant(round, match, 1, results, entrants);
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
  entrants: AlgorithmWorldAlgorithmId[] = TOURNAMENT_ENTRANTS,
): AlgorithmWorldAlgorithmId | undefined {
  if (round === 0) return entrants[match * 2 + slot];
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

function tournamentFinalists(entrants: AlgorithmWorldAlgorithmId[], results: AlgorithmWorldTournamentResults) {
  const semiA = results[tournamentResultKey(1, 0)];
  const semiB = results[tournamentResultKey(1, 1)];
  if (semiA && semiB) return [semiA, semiB];
  const final = resolveTournamentMatch(2, 0, results, entrants);
  return [final.left, final.right];
}

function pairStrongTeams(entrants: AlgorithmWorldAlgorithmId[]) {
  const ordered = [...entrants].sort((a, b) => (STRENGTH[b] ?? 0) - (STRENGTH[a] ?? 0));
  return [ordered[0], ordered[4], ordered[1], ordered[5], ordered[2], ordered[6], ordered[3], ordered[7]];
}

function shuffle<T>(items: T[], seed: number) {
  const next = [...items];
  let state = seed || 1;
  for (let i = next.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function hash(value: string) {
  let total = 0;
  for (let i = 0; i < value.length; i++) total = (total * 31 + value.charCodeAt(i)) >>> 0;
  return total;
}

function parseTournamentResultKey(key: string) {
  const match = /^r([0-2])m(\d+)$/.exec(key);
  if (!match) return null;
  const round = normalizeTournamentRound(Number(match[1]));
  const resultMatch = normalizeTournamentMatch(round, Number(match[2]));
  return { round, match: resultMatch };
}
