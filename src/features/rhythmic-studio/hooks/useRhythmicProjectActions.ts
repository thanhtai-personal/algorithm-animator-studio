import { useCallback } from "react";
import { toast } from "sonner";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../defaults";
import { rhythmicText } from "../i18n";
import { deleteRhythmicProject, saveRhythmicProject } from "../lib/projectStorage";
import type { StoredProject } from "../types";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

export function useRhythmicProjectActions(store: RhythmicStudioStore, loadBuiltin: (name: string) => void) {
  const lang = useSystemLang();

  const saveProject = useCallback(() => {
    const name = store.projectName.trim() || rhythmicText(lang, "default.untitled");
    const saved = saveRhythmicProject(name, store.settings, store.source, store.courseOverrides, store.presetMixEnabled);
    store.setProjects([saved, ...store.projects.filter((item) => item.id !== saved.id)]);
    store.setStatus({ key: "status.projectSaved" });
    toast.success(rhythmicText(lang, "toast.presetSaved"));
  }, [lang, store]);

  const removeProject = useCallback((id: string) => store.setProjects(deleteRhythmicProject(id)), [store]);

  const loadProject = useCallback((project: StoredProject) => {
    store.replaceSettings(project.settings);
    store.setProjectName(project.name);
    store.setOverrides(project.courseOverrides ?? []);
    const mixEnabled = project.presetMixEnabled ?? false;
    if (mixEnabled) store.setPresetMixSeed(1 + Math.floor(Math.random() * 1_000_000_000));
    store.setPresetMixEnabled(mixEnabled);
    store.setSelectedNode(null);
    if (project.source?.type === "builtin" && BUILTIN_MELODIES[project.source.name]) loadBuiltin(project.source.name);
    else store.setStatus({ key: project.source ? "status.presetReimport" : "status.presetLoaded" });
  }, [loadBuiltin, store]);

  return { saveProject, removeProject, loadProject };
}
