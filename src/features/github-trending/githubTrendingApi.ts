import type { GithubTrendingFilter, GithubTrendingRepo } from "./types";

const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";

export async function fetchGithubTrendingRepos(filter: GithubTrendingFilter): Promise<GithubTrendingRepo[]> {
  const createdAfter = new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const queryParts = [
    filter.topic.trim(),
    filter.language.trim() ? `language:${filter.language.trim()}` : "",
    `stars:>${Math.max(0, filter.minStars)}`,
    `created:>${createdAfter}`,
    "archived:false",
  ].filter(Boolean);
  const url = new URL(GITHUB_SEARCH_URL);
  url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(Math.min(30, Math.max(5, filter.limit))));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/vnd.github+json" },
  });
  const payload = await response.json().catch(() => null) as GithubSearchResponse | null;
  if (!response.ok) {
    const message = payload?.message || "Không tải được danh sách trending GitHub.";
    throw new Error(`${message}${response.status === 403 ? " Có thể GitHub API đang giới hạn rate limit." : ""}`);
  }
  return (payload?.items || []).map(normalizeRepo);
}

type GithubSearchResponse = {
  message?: string;
  items?: GithubRepoItem[];
};

type GithubRepoItem = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  homepage?: string | null;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  created_at: string;
  pushed_at: string;
  owner?: { login?: string };
};

function normalizeRepo(repo: GithubRepoItem): GithubTrendingRepo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || repo.full_name.split("/")[0] || "unknown",
    description: repo.description || "No description yet.",
    url: repo.html_url,
    homepage: repo.homepage || "",
    language: repo.language || "Unknown",
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    openIssues: repo.open_issues_count || 0,
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 8) : [],
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
  };
}
