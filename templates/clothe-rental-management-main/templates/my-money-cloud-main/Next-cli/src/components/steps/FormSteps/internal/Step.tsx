"use client";

import React from "react";
import type { StepProps } from "../types";

export const StepMarker = Symbol("FormStep");

export const FormStepsStep = (props: StepProps) => {
  return <>{props.children}</>;
};

(FormStepsStep as any).__marker = StepMarker;
