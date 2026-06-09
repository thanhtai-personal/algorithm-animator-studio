import type { StoryProject } from "./types";

const STORAGE_KEY = "kata.story-author.projects.v1";

export function readStoryProjects() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as Partial<StoryProject>[];
    return Array.isArray(parsed) ? parsed.map(normalizeStoryProject) : [];
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
    documentLinks: "",
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

function normalizeStoryProject(project: Partial<StoryProject>): StoryProject {
  return {
    ...createEmptyStoryProject(),
    ...project,
    tags: Array.isArray(project.tags) ? project.tags : [],
    documentLinks: project.documentLinks || "",
    chapters: Array.isArray(project.chapters) ? project.chapters : [],
  };
}
