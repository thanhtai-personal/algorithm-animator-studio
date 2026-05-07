"use client";

import React, { Children, isValidElement } from "react";
import type { StepConfig, StepKey } from "../../types";
import type { StepProps } from "../types";
import { FooterMarker } from "./StepFooter";
import { HeaderMarker } from "./StepHeader";
import { StepMarker } from "./Step";
import { StepsMarker } from "./Steps";

export function isMarker(child: any, marker: symbol) {
  return isValidElement(child) && (child.type as any)?.__marker === marker;
}

export function extractSlots(children: React.ReactNode) {
  const nodes = Children.toArray(children);
  const headers: React.ReactNode[] = [];
  const footers: React.ReactNode[] = [];
  const steps: StepConfig[] = [];

  nodes.forEach((node) => {
    if (!isValidElement(node)) return;
    if (isMarker(node, HeaderMarker)) {
      headers.push(node);
      return;
    }
    if (isMarker(node, FooterMarker)) {
      footers.push(node);
      return;
    }
    if (isMarker(node, StepsMarker)) {
      const stepsContainer = node as React.ReactElement<any>;
      Children.forEach(stepsContainer.props?.children, (child) => {
        if (isMarker(child, StepMarker)) {
          steps.push(normalizeStep(child as React.ReactElement<StepProps>));
        }
      });
      return;
    }
    if (isMarker(node, StepMarker)) {
      steps.push(normalizeStep(node as React.ReactElement<StepProps>));
    }
  });

  return { headers, footers, steps };
}

export function normalizeStep(node: React.ReactElement<StepProps>): StepConfig {
  return {
    key: node.props.stepKey,
    title: node.props.title,
    validate: node.props.validate,
    render: (ctx) =>
      typeof node.props.children === "function"
        ? (node.props.children as (ctx: any) => React.ReactNode)(ctx)
        : node.props.children,
  };
}

export function buildLinkedMap(stepConfigs: StepConfig[]) {
  const map: Record<StepKey, { next?: StepKey; prev?: StepKey }> = {};
  stepConfigs.forEach((step, idx) => {
    const prev = stepConfigs[idx - 1]?.key;
    const next = stepConfigs[idx + 1]?.key;
    map[step.key] = { prev, next };
  });
  return map;
}

export function buildStepMap(stepConfigs: StepConfig[]) {
  const m: Record<StepKey, StepConfig> = {};
  stepConfigs.forEach((s) => {
    m[s.key] = s;
  });
  return m;
}
