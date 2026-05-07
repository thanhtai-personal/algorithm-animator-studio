"use client";

import React from "react";
import type { StepsProps } from "../types";

export const StepsMarker = Symbol("FormStepSteps");

export const FormStepsSteps = ({ children }: StepsProps) => <>{children}</>;

(FormStepsSteps as any).__marker = StepsMarker;
