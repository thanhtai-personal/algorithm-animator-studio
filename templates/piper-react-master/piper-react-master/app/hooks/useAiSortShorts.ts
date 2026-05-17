import { useEffect, useMemo, useState } from "react";
import {
  editAiShorts,
  generateAiShorts,
  getAiShortsConfig,
  type AiShortsConfigResponse,
  type AiShortsVideoResult,
  type SortAlgorithm,
} from "../api/shortsApi";
import type { VideoAspectRatio, VideoFitMode } from "../api/videoApi";
import { useI18n } from "../i18n";

export const SORT_ALGORITHMS: Array<{ value: SortAlgorithm; label: string }> = [
  { value: "bubble", label: "Bubble Sort" },
  { value: "selection", label: "Selection Sort" },
  { value: "insertion", label: "Insertion Sort" },
  { value: "quick", label: "Quick Sort" },
  { value: "merge", label: "Merge Sort" },
  { value: "heap", label: "Heap Sort" },
  { value: "counting", label: "Counting Sort" },
  { value: "radix", label: "Radix Sort" },
  { value: "shell", label: "Shell Sort" },
  { value: "custom", label: "Custom" },
];

export function useAiSortShorts() {
  const { t } = useI18n();
  const [config, setConfig] = useState<AiShortsConfigResponse | null>(null);
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>("bubble");
  const [customAlgorithmName, setCustomAlgorithmName] = useState("");
  const [itemCount, setItemCount] = useState(20);
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [stylePrompt, setStylePrompt] = useState("Cute animal bars, playful motion, clean dark background, high contrast numbers, satisfying swaps");
  const [palettePrompt, setPalettePrompt] = useState("neon cyan, violet, amber accents");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [videoFileName, setVideoFileName] = useState("sort-short");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("9:16");
  const [fitMode, setFitMode] = useState<VideoFitMode>("cover");
  const [trimStartSeconds, setTrimStartSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(0);
  const [result, setResult] = useState<AiShortsVideoResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void getAiShortsConfig()
      .then(setConfig)
      .catch(() => setConfig({ ok: true, configured: false, provider: "gemini-veo", model: "veo-3.1-fast-generate-preview" }))
      .finally(() => setIsInitializing(false));
  }, []);

  const promptPreview = useMemo(() => {
    const algorithmName = algorithm === "custom" ? customAlgorithmName || "custom sorting algorithm" : SORT_ALGORITHMS.find((item) => item.value === algorithm)?.label || algorithm;
    return [
      `Create a vertical 9:16 Shorts video visualizing ${algorithmName}.`,
      `Use ${itemCount} sortable items and show clear compare/swap/merge steps within ${durationSeconds} seconds.`,
      `Style: ${stylePrompt}.`,
      `Palette: ${palettePrompt}.`,
      extraPrompt ? `Extra: ${extraPrompt}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [algorithm, customAlgorithmName, durationSeconds, extraPrompt, itemCount, palettePrompt, stylePrompt]);

  async function generate() {
    setLoading(true);
    setMessage("");

    try {
      const nextResult = await generateAiShorts({
        algorithm,
        customAlgorithmName,
        durationSeconds,
        extraPrompt,
        itemCount,
        palettePrompt,
        stylePrompt,
        videoFileName,
      });
      setResult(nextResult);
      setMessage(t("shortsGenerateSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("shortsGenerateFailure"));
    } finally {
      setLoading(false);
    }
  }

  async function edit() {
    if (!result?.relativePath) {
      setMessage(t("shortsMissingVideo"));
      return;
    }

    setEditing(true);
    setMessage("");

    try {
      const nextResult = await editAiShorts({
        aspectRatio,
        fitMode,
        maxDurationSeconds,
        relativePath: result.relativePath,
        trimStartSeconds,
        videoFileName: `${videoFileName}-edited`,
      });
      setResult(nextResult);
      setMessage(t("shortsEditSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("shortsEditFailure"));
    } finally {
      setEditing(false);
    }
  }

  return {
    algorithm,
    aspectRatio,
    config,
    customAlgorithmName,
    durationSeconds,
    edit,
    editing,
    extraPrompt,
    fitMode,
    generate,
    itemCount,
    loading,
    isInitializing,
    maxDurationSeconds,
    message,
    palettePrompt,
    promptPreview,
    result,
    setAlgorithm,
    setAspectRatio,
    setCustomAlgorithmName,
    setDurationSeconds,
    setExtraPrompt,
    setFitMode,
    setItemCount,
    setMaxDurationSeconds,
    setPalettePrompt,
    setStylePrompt,
    setTrimStartSeconds,
    setVideoFileName,
    stylePrompt,
    trimStartSeconds,
    videoFileName,
  };
}
