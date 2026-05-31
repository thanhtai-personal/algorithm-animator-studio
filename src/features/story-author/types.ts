export type StoryStatus = "idea" | "drafting" | "editing" | "completed" | "paused";

export type StoryChapter = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type StoryProject = {
  id: string;
  title: string;
  genre: string;
  status: StoryStatus;
  tags: string[];
  premise: string;
  characters: string;
  worldNotes: string;
  outline: string;
  chapters: StoryChapter[];
  createdAt: string;
  updatedAt: string;
};

export type StoryAuthorFilters = {
  query: string;
  status: "all" | StoryStatus;
  genre: string;
  tag: string;
};

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  idea: "Ý tưởng",
  drafting: "Đang viết",
  editing: "Biên tập",
  completed: "Hoàn thành",
  paused: "Tạm dừng",
};
