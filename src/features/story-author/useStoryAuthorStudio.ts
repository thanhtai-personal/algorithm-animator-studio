import { useEffect, useMemo, useState } from "react";
import { createEmptyStoryProject, readStoryProjects, writeStoryProjects } from "./storyAuthorStorage";
import type { StoryAuthorFilters, StoryChapter, StoryProject } from "./types";

const EMPTY_FILTERS: StoryAuthorFilters = { query: "", status: "all", genre: "all", tag: "all" };

export function useStoryAuthorStudio() {
  const [projects, setProjects] = useState<StoryProject[]>(() => readStoryProjects());
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id || "");
  const [selectedChapterId, setSelectedChapterId] = useState(() => projects[0]?.chapters[0]?.id || "");
  const [filters, setFilters] = useState<StoryAuthorFilters>(EMPTY_FILTERS);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const selectedChapter = selectedProject?.chapters.find((chapter) => chapter.id === selectedChapterId) || selectedProject?.chapters[0] || null;
  const genres = useMemo(() => unique(projects.map((project) => project.genre).filter(Boolean)), [projects]);
  const tags = useMemo(() => unique(projects.flatMap((project) => project.tags)), [projects]);
  const filteredProjects = useMemo(() => filterProjects(projects, filters), [projects, filters]);

  useEffect(() => {
    writeStoryProjects(projects);
  }, [projects]);

  function createProject() {
    const project = createEmptyStoryProject();
    setProjects((current) => [project, ...current]);
    setSelectedProjectId(project.id);
    setSelectedChapterId(project.chapters[0]?.id || "");
  }

  function updateProject(patch: Partial<StoryProject>) {
    if (!selectedProject) return;
    setProjects((current) => current.map((project) => (
      project.id === selectedProject.id ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project
    )));
  }

  function deleteProject(id: string) {
    const nextProjects = projects.filter((project) => project.id !== id);
    setProjects(nextProjects);
    setSelectedProjectId(nextProjects[0]?.id || "");
    setSelectedChapterId(nextProjects[0]?.chapters[0]?.id || "");
  }

  function selectProject(id: string) {
    const project = projects.find((item) => item.id === id);
    setSelectedProjectId(id);
    setSelectedChapterId(project?.chapters[0]?.id || "");
  }

  function addChapter() {
    if (!selectedProject) return;
    const now = new Date().toISOString();
    const chapter: StoryChapter = {
      id: crypto.randomUUID(),
      title: `Chương ${selectedProject.chapters.length + 1}`,
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    updateProject({ chapters: [...selectedProject.chapters, chapter] });
    setSelectedChapterId(chapter.id);
  }

  function updateChapter(patch: Partial<StoryChapter>) {
    if (!selectedProject || !selectedChapter) return;
    const chapters = selectedProject.chapters.map((chapter) => (
      chapter.id === selectedChapter.id ? { ...chapter, ...patch, updatedAt: new Date().toISOString() } : chapter
    ));
    updateProject({ chapters });
  }

  function deleteChapter(id: string) {
    if (!selectedProject) return;
    const chapters = selectedProject.chapters.filter((chapter) => chapter.id !== id);
    updateProject({ chapters });
    setSelectedChapterId(chapters[0]?.id || "");
  }

  return {
    addChapter,
    createProject,
    deleteChapter,
    deleteProject,
    filteredProjects,
    filters,
    genres,
    projects,
    selectedChapter,
    selectedChapterId,
    selectedProject,
    selectedProjectId,
    selectProject,
    setFilters,
    setSelectedChapterId,
    tags,
    updateChapter,
    updateProject,
  };
}

function filterProjects(projects: StoryProject[], filters: StoryAuthorFilters) {
  const query = filters.query.trim().toLowerCase();
  return projects.filter((project) => {
    const haystack = [
      project.title,
      project.genre,
      project.premise,
      project.outline,
      project.documentLinks,
      ...project.tags,
    ].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (filters.status !== "all" && project.status !== filters.status) return false;
    if (filters.genre !== "all" && project.genre !== filters.genre) return false;
    if (filters.tag !== "all" && !project.tags.includes(filters.tag)) return false;
    return true;
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));
}
