"use client";

import type { ReactNode } from "react";

export type StepKey = string;

export type StepRenderContext = {
  currentKey: StepKey;
  goNext: () => void;
  goPrev: () => void;
  goTo: (key: StepKey) => void;
  setStepData: (key: StepKey, value: unknown) => void;
  getStepData: <T = unknown>(key: StepKey) => T | undefined;
};

export type StepConfig = {
  key: StepKey;
  title: string;
  render: (ctx: StepRenderContext) => ReactNode;
  validate?: () => boolean | Promise<boolean>;
};

export type StepFormHandle = {
  goNext: () => void;
  goPrev: () => void;
  goTo: (key: StepKey) => void;
  reset: () => void;
  getCurrentKey: () => StepKey;
  setStepData: (key: StepKey, value: unknown) => void;
  getStepData: <T = unknown>(key: StepKey) => T | undefined;
};
