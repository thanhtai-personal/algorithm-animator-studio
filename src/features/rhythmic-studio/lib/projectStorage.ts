import type { AudioSourceMeta, StoredProject, StudioSettings } from "../types";

const STORAGE_KEY = "kai-studio.rhythmic-projects.v1";

export function listRhythmicProjects(): StoredProject[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as StoredProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRhythmicProject(name: string, settings: StudioSettings, source?: AudioSourceMeta): StoredProject {
  const now = new Date().toISOString();
  const project: StoredProject = {
    id: crypto.randomUUID(),
    name,
    settings,
    source,
    createdAt: now,
    updatedAt: now,
  };
  const projects = [project, ...listRhythmicProjects()].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return project;
}

export function deleteRhythmicProject(id: string) {
  const projects = listRhythmicProjects().filter((project) => project.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects;
}
