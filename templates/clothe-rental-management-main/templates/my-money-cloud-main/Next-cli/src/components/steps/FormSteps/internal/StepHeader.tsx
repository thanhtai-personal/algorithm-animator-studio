"use client";

import React from "react";
import { DialogTitle } from "@/components/ui/dialog";
import { useStepContext } from "./StepContext";
import type { HeaderProps } from "../types";

export const HeaderMarker = Symbol("FormStepHeader");

export const FormStepsHeader = ({ children }: HeaderProps) => {
  const ctx = useStepContext();
  if (typeof children === "function") {
    return <>{(children as any)(ctx)}</>;
  }
  return <DialogTitle className="text-center">{ctx.currentStep?.title}</DialogTitle>;
};

(FormStepsHeader as any).__marker = HeaderMarker;

export const DefaultHeader = FormStepsHeader;
