import { Children, isValidElement } from "react";
import type { FooterProps, StepConfig, StepProps } from "../types";
import { FooterMarker } from "./StepFooter";
import { StepMarker } from "./Step";
import { StepsMarker } from "./Steps";

function isMarker(node: unknown, marker: symbol) {
  return isValidElement(node) && (node.type as { __marker?: symbol } | undefined)?.__marker === marker;
}

function normalizeStep(node: React.ReactElement<StepProps>): StepConfig {
  return {
    step: node.props.step,
    label: node.props.label,
    disabled: node.props.disabled === true,
    render: (ctx) =>
      typeof node.props.children === "function"
        ? node.props.children(ctx)
        : node.props.children,
  };
}

export function extractSlots(children: React.ReactNode) {
  const nodes = Children.toArray(children);
  const steps: StepConfig[] = [];
  const footers: Array<React.ReactElement<FooterProps>> = [];

  nodes.forEach((node) => {
    if (!isValidElement(node)) return;

    if (isMarker(node, StepsMarker)) {
      Children.forEach(node.props.children, (child) => {
        if (isMarker(child, StepMarker)) {
          steps.push(normalizeStep(child as React.ReactElement<StepProps>));
        }
      });
      return;
    }

    if (isMarker(node, StepMarker)) {
      steps.push(normalizeStep(node as React.ReactElement<StepProps>));
      return;
    }

    if (isMarker(node, FooterMarker)) {
      footers.push(node as React.ReactElement<FooterProps>);
    }
  });

  return { steps, footers };
}
