/// <reference lib="webworker" />

import {
  prepareMarbleCourse,
  type MarbleCoursePreparationInput,
  type MarbleCoursePreparationResult,
} from "../engine/marbleCoursePreparation";

interface PrepareRequest {
  id: number;
  input: MarbleCoursePreparationInput;
}

type PrepareResponse =
  | { id: number; type: "progress"; progress: number }
  | { id: number; type: "done"; result: MarbleCoursePreparationResult }
  | { id: number; type: "error"; message: string };

function post(response: PrepareResponse) {
  self.postMessage(response);
}

self.onmessage = (event: MessageEvent<PrepareRequest>) => {
  const { id, input } = event.data;
  try {
    const result = prepareMarbleCourse(input, (progress) => post({ id, type: "progress", progress }));
    post({ id, type: "done", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ id, type: "error", message });
  }
};
