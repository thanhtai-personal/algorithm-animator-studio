import type { GithubTrendingOutputLanguage, GithubTrendingRepo, GithubTrendingVideoPlan } from "./types";

export function createVideoPlan(repos: GithubTrendingRepo[], language: GithubTrendingOutputLanguage): GithubTrendingVideoPlan {
  const maxStars = Math.max(1, ...repos.map((repo) => repo.stars));
  const topNames = repos.map((repo) => repo.name).join(", ") || phrase(language, "new open source projects", "các dự án mã nguồn mở mới", "新的开源项目", "新しいオープンソースプロジェクト", "새로운 오픈소스 프로젝트");
  const bullets = repos.map((repo, index) => formatRepoLine(repo, index, language));
  const narration = repos.length
    ? [introLine(repos.length, topNames, language), ...bullets, closingLine(language)].join("\n")
    : emptyNarration(language);

  return {
    title: repos.length ? titleLine(repos.length, language) : titleLine(0, language),
    subtitle: phrase(language,
      "Fresh developer tools, AI projects, and useful libraries worth watching.",
      "Những developer tools, dự án AI và thư viện hữu ích đáng theo dõi.",
      "值得关注的开发者工具、AI 项目和实用库。",
      "注目したい開発者ツール、AIプロジェクト、便利なライブラリ。",
      "주목할 만한 개발자 도구, AI 프로젝트, 유용한 라이브러리입니다.",
    ),
    hook: phrase(language,
      "These GitHub repos are growing fast, and one of them might become part of your next workflow.",
      "Những repo GitHub này đang tăng trưởng rất nhanh, và có thể một repo sẽ bước vào workflow tiếp theo của bạn.",
      "这些 GitHub 仓库增长很快，其中一个也许会进入你的下一个工作流。",
      "これらのGitHubリポジトリは急成長中で、次のワークフローに入るかもしれません。",
      "이 GitHub 저장소들은 빠르게 성장 중이며, 다음 워크플로에 들어올 수도 있습니다.",
    ),
    narration,
    description: [descriptionIntro(language), "", ...bullets, "", hashtagLine(language)].join("\n"),
    tags: ["github", "open source", "developer tools", "ai tools", "programming", language, ...repos.flatMap((repo) => repo.topics)].slice(0, 20),
    chapters: ["0:00 Hook", ...repos.map((repo, index) => `0:${String((index + 1) * 12).padStart(2, "0")} ${repo.name}`), "1:10 Recap"],
    data: repos.length ? repos.map((repo) => Math.max(8, Math.round((repo.stars / maxStars) * 100))) : [28, 46, 72, 55, 88],
    language,
  };
}

function formatRepoLine(repo: GithubTrendingRepo, index: number, language: GithubTrendingOutputLanguage) {
  const stats = `${repo.stars.toLocaleString("en-US")} stars · ${repo.forks.toLocaleString("en-US")} forks · ${repo.language}`;
  return phrase(language,
    `${index + 1}. ${repo.fullName} — ${repo.description} ${stats}.`,
    `${index + 1}. ${repo.fullName} — ${repo.description} Số liệu: ${stats}.`,
    `${index + 1}. ${repo.fullName} — ${repo.description} 数据：${stats}.`,
    `${index + 1}. ${repo.fullName} — ${repo.description} データ: ${stats}.`,
    `${index + 1}. ${repo.fullName} — ${repo.description} 지표: ${stats}.`,
  );
}

function titleLine(count: number, language: GithubTrendingOutputLanguage) {
  return phrase(language,
    count ? `${count} Trending Open Source GitHub Projects` : "Trending Open Source GitHub Projects",
    count ? `${count} dự án GitHub open source đang trend` : "Dự án GitHub open source đang trend",
    count ? `${count} 个 GitHub 开源趋势项目` : "GitHub 开源趋势项目",
    count ? `${count}個のGitHub注目オープンソース` : "GitHub注目オープンソース",
    count ? `${count}개의 GitHub 트렌딩 오픈소스` : "GitHub 트렌딩 오픈소스",
  );
}

function introLine(count: number, names: string, language: GithubTrendingOutputLanguage) {
  return phrase(language,
    `Today we scan ${count} fast-rising GitHub repositories: ${names}.`,
    `Hôm nay mình lướt qua ${count} repo GitHub đang tăng trưởng nhanh: ${names}.`,
    `今天我们快速浏览 ${count} 个正在增长的 GitHub 仓库：${names}。`,
    `今日は急成長しているGitHubリポジトリを${count}個見ていきます：${names}。`,
    `오늘은 빠르게 성장 중인 GitHub 저장소 ${count}개를 살펴봅니다: ${names}.`,
  );
}

function closingLine(language: GithubTrendingOutputLanguage) {
  return phrase(language,
    "Which one should we test in a real project next?",
    "Repo nào nên được test trong project thật tiếp theo?",
    "下一个真实项目中，我们应该测试哪一个？",
    "次の実プロジェクトで試すなら、どれがいいでしょう？",
    "다음 실제 프로젝트에서 어떤 저장소를 테스트해볼까요?",
  );
}

function descriptionIntro(language: GithubTrendingOutputLanguage) {
  return phrase(language,
    "A quick visual tour of open-source projects trending on GitHub.",
    "Video giới thiệu nhanh các dự án open source đang lên trend trên GitHub.",
    "快速可视化介绍 GitHub 上的开源趋势项目。",
    "GitHubで注目されているオープンソースを素早くビジュアル紹介します。",
    "GitHub에서 트렌딩 중인 오픈소스 프로젝트를 빠르게 소개합니다.",
  );
}

function emptyNarration(language: GithubTrendingOutputLanguage) {
  return phrase(language,
    "Load trending repositories to generate the video script.",
    "Tải danh sách repo trending để tạo script video.",
    "加载趋势仓库以生成视频脚本。",
    "トレンドリポジトリを読み込むと動画スクリプトを生成できます。",
    "트렌딩 저장소를 불러오면 영상 스크립트를 생성할 수 있습니다.",
  );
}

function hashtagLine(language: GithubTrendingOutputLanguage) {
  return language === "vi" ? "#GitHub #OpenSource #LapTrinh" : "#GitHub #OpenSource #DeveloperTools";
}

function phrase<T>(lang: GithubTrendingOutputLanguage, en: T, vi: T, zh: T, ja: T, ko: T) {
  return ({ en, vi, zh, ja, ko } as Record<GithubTrendingOutputLanguage, T>)[lang];
}
