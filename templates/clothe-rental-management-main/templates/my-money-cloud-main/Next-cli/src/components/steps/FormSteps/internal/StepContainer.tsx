"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import type { StepRenderContext } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  header: React.ReactNode[];
  footer: React.ReactNode[];
  body?: (ctx: StepRenderContext) => React.ReactNode;
  bodyContext?: StepRenderContext;
};

export function StepContainer({ open, onClose, header, footer, body, bodyContext }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md rounded-2xl">
        <DialogHeader>{header}</DialogHeader>
        <div className="py-6">{body ? body(bodyContext as StepRenderContext) : null}</div>
        {footer}
      </DialogContent>
    </Dialog>
  );
}
