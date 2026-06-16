import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchGithubTrendingRepos } from "./githubTrendingApi";
import type { GithubTrendingFilter, GithubTrendingRepo, GithubTrendingVideoPlan } from "./types";

const STORAGE_KEY = "kai-studio.github-trending-video";

const DEFAULT_FILTER: GithubTrendingFilter = {
  topic: "ai",
  language: "TypeScript",
  days: 30,
  minStars: 50,
  limit: 12,
};

export function useGithubTrendingVideo() {
  const [filter, setFilter] = useState<GithubTrendingFilter>(() => readDraft()?.filter || DEFAULT_FILTER);
  const [repos, setRepos] = useState<GithubTrendingRepo[]>(() => readDraft()?.repos || []);
  const [selectedIds, setSelectedIds] = useState<number[]>(() => readDraft()?.selectedIds || []);
  const [loading, setLoading] = useState(false);
  const selectedRepos = useMemo(() => repos.filter((repo) => selectedIds.includes(repo.id)).slice(0, 6), [repos, selectedIds]);
  const plan = useMemo(() => createVideoPlan(selectedRepos), [selectedRepos]);

  async function loadTrending() {
    setLoading(true);
    try {
      const nextRepos = await fetchGithubTrendingRepos(filter);
      setRepos(nextRepos);
      setSelectedIds(nextRepos.slice(0, 5).map((repo) => repo.id));
      saveDraft({ filter, repos: nextRepos, selectedIds: nextRepos.slice(0, 5).map((repo) => repo.id) });
      toast.success(`Đã tải ${nextRepos.length} repo trending GitHub`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được GitHub trending");
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(patch: Partial<GithubTrendingFilter>) {
    setFilter((current) => {
      const next = { ...current, ...patch };
      saveDraft({ filter: next, repos, selectedIds });
      return next;
    });
  }

  function toggleRepo(id: number) {
    setSelectedIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((item) => item !== id) : [...current, id].slice(0, 6);
      saveDraft({ filter, repos, selectedIds: next });
      return next;
    });
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setFilter(DEFAULT_FILTER);
    setRepos([]);
    setSelectedIds([]);
  }

  return { filter, repos, selectedIds, selectedRepos, plan, loading, updateFilter, loadTrending, toggleRepo, clearDraft };
}

function createVideoPlan(repos: GithubTrendingRepo[]): GithubTrendingVideoPlan {
  const topNames = repos.map((repo) => repo.name).join(", ") || "new open source projects";
  const maxStars = Math.max(1, ...repos.map((repo) => repo.stars));
  const intro = repos.length ? `Today we scan ${repos.length} fast-rising GitHub repositories: ${topNames}.` : "Load trending repositories to generate the video script.";
  const bullets = repos.map((repo, index) => (
    `${index + 1}. ${repo.fullName} — ${repo.description} Stars: ${repo.stars.toLocaleString("en-US")}, language: ${repo.language}.`
  ));

  return {
    title: repos.length ? `${repos.length} Trending Open Source GitHub Projects` : "Trending Open Source GitHub Projects",
    subtitle: "Fresh developer tools, AI projects, and useful libraries worth watching.",
    hook: "These GitHub repos are growing fast, and one of them might become part of your next workflow.",
    narration: [intro, ...bullets, "Which one should we test in a real project next?"].join("\n"),
    description: ["A quick visual tour of open-source projects trending on GitHub.", "", ...bullets, "", "#GitHub #OpenSource #DeveloperTools"].join("\n"),
    tags: ["github", "open source", "developer tools", "ai tools", "programming", ...repos.flatMap((repo) => repo.topics).slice(0, 10)],
    chapters: ["0:00 Hook", ...repos.map((repo, index) => `0:${String((index + 1) * 12).padStart(2, "0")} ${repo.name}`), "1:10 Recap"],
    data: repos.length ? repos.map((repo) => Math.max(8, Math.round((repo.stars / maxStars) * 100))) : [28, 46, 72, 55, 88],
  };
}

type Draft = {
  filter: GithubTrendingFilter;
  repos: GithubTrendingRepo[];
  selectedIds: number[];
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Draft | null;
    return parsed && Array.isArray(parsed.repos) && Array.isArray(parsed.selectedIds) ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}
