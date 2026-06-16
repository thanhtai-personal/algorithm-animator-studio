export type GithubTrendingRepo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  createdAt: string;
  pushedAt: string;
};

export type GithubTrendingFilter = {
  topic: string;
  language: string;
  days: number;
  minStars: number;
  limit: number;
};

export type GithubTrendingVideoPlan = {
  title: string;
  subtitle: string;
  hook: string;
  narration: string;
  description: string;
  tags: string[];
  chapters: string[];
  data: number[];
};
