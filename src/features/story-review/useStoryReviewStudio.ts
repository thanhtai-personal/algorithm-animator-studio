import { useEffect, useMemo, useState } from "react";
import { buildReviewScriptPrompt, buildVeoScenePrompts, serializeScenes } from "./prompts";
import { mergeStoryReviewVideo } from "./storyReviewApi";
import type { StoryReviewDraft, StoryReviewScene, StoryReviewStepId } from "./types";

const DRAFT_KEY = "kata.story-review.v1";

const DEFAULT_DRAFT: StoryReviewDraft = {
  storyTitle: "",
  sourceName: "",
  sourceUrl: "",
  genre: "Tiên hiệp / huyền huyễn",
  targetAudience: "Người thích nghe review truyện nhanh, có cao trào",
  angle: "Review tóm tắt cuốn hút, nhấn vào điểm lạ của cốt truyện và nhân vật chính",
  sourceNotes: "",
  reviewScript: "",
  videoFileName: "review-truyen",
  aspectRatio: "16:9",
  fitMode: "cover",
  scenes: [],
};

function readDraft(): StoryReviewDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    return { ...DEFAULT_DRAFT, ...JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}") };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function useStoryReviewStudio(options: { requireVideoGenerationAccess?: () => boolean } = {}) {
  const initialDraft = useMemo(readDraft, []);
  const [activeStep, setActiveStep] = useState<StoryReviewStepId>("story");
  const [draft, setDraft] = useState<StoryReviewDraft>(initialDraft);
  const [scenes, setScenes] = useState<StoryReviewScene[]>(initialDraft.scenes.map((scene) => ({ ...scene, file: null })));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [videoResult, setVideoResult] = useState<Awaited<ReturnType<typeof mergeStoryReviewVideo>> | null>(null);

  const scriptPrompt = useMemo(() => buildReviewScriptPrompt(draft), [draft]);
  const scenesWithFiles = scenes.filter((scene) => scene.file).length;
  const canMerge = scenes.length > 0 && scenes.every((scene) => scene.file && scene.durationSeconds > 0) && !loading;

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, scenes: serializeScenes(scenes) }));
    } catch {
      // ignore storage failures
    }
  }, [draft, scenes]);

  function updateDraft(patch: Partial<StoryReviewDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function generateScenePrompts() {
    const nextScenes = buildVeoScenePrompts(draft.reviewScript || draft.sourceNotes, draft.storyTitle);
    setScenes(nextScenes);
    setActiveStep("scenes");
    setMessage(`Đã tạo ${nextScenes.length} prompt phân cảnh Veo3.`);
  }

  function updateScene(id: string, patch: Partial<StoryReviewScene>) {
    setScenes((current) => current.map((scene) => scene.id === id ? { ...scene, ...patch } : scene));
  }

  function addScene() {
    setScenes((current) => [...current, {
      id: crypto.randomUUID(),
      title: `Cảnh ${current.length + 1}`,
      prompt: "Mô tả cảnh cần tạo bằng Veo3...",
      durationSeconds: 6,
      file: null,
    }]);
  }

  function removeScene(id: string) {
    setScenes((current) => current.filter((scene) => scene.id !== id));
  }

  async function copyToClipboard(value: string, successMessage: string) {
    await navigator.clipboard?.writeText(value);
    setMessage(successMessage);
  }

  async function mergeVideo() {
    if (!(options.requireVideoGenerationAccess?.() ?? true)) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await mergeStoryReviewVideo({
        scenes,
        audioFile,
        videoFileName: draft.videoFileName,
        aspectRatio: draft.aspectRatio,
        fitMode: draft.fitMode,
      });
      setVideoResult(result);
      setMessage("Đã ghép video review truyện.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ghép video thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return {
    activeStep,
    audioFile,
    canMerge,
    copyToClipboard,
    draft,
    generateScenePrompts,
    loading,
    message,
    scenes,
    scenesWithFiles,
    scriptPrompt,
    setActiveStep,
    setAudioFile,
    updateDraft,
    updateScene,
    addScene,
    removeScene,
    mergeVideo,
    videoResult,
  };
}
