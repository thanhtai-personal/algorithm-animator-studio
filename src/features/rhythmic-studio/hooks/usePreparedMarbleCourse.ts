import { useEffect, useRef, useState } from "react";
import type { NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { MarbleCoursePreparationInput } from "../engine/marbleCoursePreparation";

interface WorkerProgressMessage {
  id: number;
  type: "progress";
  progress: number;
}

interface WorkerDoneMessage {
  id: number;
  type: "done";
  platforms: MarblePlatform[];
}

interface WorkerErrorMessage {
  id: number;
  type: "error";
  message: string;
}

type WorkerMessage = WorkerProgressMessage | WorkerDoneMessage | WorkerErrorMessage;

export interface PreparedMarbleCourse {
  platforms: MarblePlatform[];
  isPreparing: boolean;
  progress: number;
  error: string | null;
}

function preparationInput(
  events: NoteEvent[],
  settings: StudioSettings,
  width: number,
  presetMixEnabled: boolean,
  presetMixSeed: number,
): MarbleCoursePreparationInput {
  return { events, settings, width, presetMixEnabled, presetMixSeed };
}

function createCourseWorker() {
  return new Worker(new URL("../workers/marbleCourse.worker.ts", import.meta.url), { type: "module" });
}

export function usePreparedMarbleCourse(
  events: NoteEvent[],
  settings: StudioSettings,
  width: number,
  presetMixEnabled: boolean,
  presetMixSeed: number,
): PreparedMarbleCourse {
  const requestId = useRef(0);
  const [state, setState] = useState<PreparedMarbleCourse>({ platforms: [], isPreparing: true, progress: 0, error: null });

  useEffect(() => {
    const id = requestId.current + 1;
    requestId.current = id;
    if (!events.length) {
      setState({ platforms: [], isPreparing: false, progress: 1, error: null });
      return;
    }

    const worker = createCourseWorker();
    setState((current) => ({ ...current, isPreparing: true, progress: 0.02, error: null }));
    worker.onmessage = (message: MessageEvent<WorkerMessage>) => {
      if (message.data.id !== id) return;
      if (message.data.type === "progress") {
        setState((current) => ({ ...current, progress: Math.max(current.progress, message.data.progress) }));
        return;
      }
      if (message.data.type === "done") {
        setState({ platforms: message.data.platforms, isPreparing: false, progress: 1, error: null });
        worker.terminate();
        return;
      }
      setState((current) => ({ ...current, isPreparing: false, error: message.data.message }));
      worker.terminate();
    };
    worker.onerror = (event) => {
      setState((current) => ({ ...current, isPreparing: false, error: event.message || "Course worker failed" }));
      worker.terminate();
    };
    worker.postMessage({ id, input: preparationInput(events, settings, width, presetMixEnabled, presetMixSeed) });
    return () => worker.terminate();
  }, [events, presetMixEnabled, presetMixSeed, settings, width]);

  return state;
}
