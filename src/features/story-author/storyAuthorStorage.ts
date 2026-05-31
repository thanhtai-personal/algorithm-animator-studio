import type { StoryProject } from "./types";

const STORAGE_KEY = "kata.story-author.projects.v1";

export function readStoryProjects() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as StoryProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoryProjects(projects: StoryProject[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createEmptyStoryProject(): StoryProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Truyện mới",
    genre: "Tiên hiệp",
    status: "idea",
    tags: [],
    premise: "",
    characters: "",
    worldNotes: "",
    outline: "",
    chapters: [{
      id: crypto.randomUUID(),
      title: "Chương 1",
      content: "",
      createdAt: now,
      updatedAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  };
}
