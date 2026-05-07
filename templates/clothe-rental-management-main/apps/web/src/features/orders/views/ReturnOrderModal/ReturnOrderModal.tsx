"use client";

import { observer } from "mobx-react-lite";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { Stepper } from "@/components/forms/Stepper";
import { useReturnOrderModal } from "@/features/orders/hooks/useReturnOrderModal";
import { ReturnOrderSettlementStep } from "./ReturnOrderSettlementStep";
import { ReturnOrderSourceStep } from "./ReturnOrderSourceStep";
import { ReturnOrderWorkflowStep } from "./ReturnOrderWorkflowStep";
import type { ReturnOrderModalProps } from "./types";

export const ReturnOrderModal = observer(function ReturnOrderModal({
  locale,
  open,
  onOpenChange,
}: ReturnOrderModalProps) {
  const model = useReturnOrderModal({
    locale,
    open,
    onOpenChange,
  });
  const processingLabel = locale === "vi" ? "Đang xử lý..." : "Processing...";

  return (
    <DrawerFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={model.copy.title}
      description={model.copy.description}
      widthClassName="max-w-[1200px]"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={model.onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
          >
            {model.copy.actions.close}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={model.goPreviousStep}
              disabled={model.stepIndex <= 0 || model.isBusy}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              {model.copy.actions.back}
            </button>
            <button
              type="button"
              onClick={model.goNextStep}
              disabled={model.stepIndex >= 2 || !model.canMoveNext || model.isBusy}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {model.copy.actions.next}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Stepper
          steps={[
            { key: "source", label: model.copy.steps.source },
            { key: "settlement", label: model.copy.steps.settlement },
            { key: "workflow", label: model.copy.steps.workflow },
          ]}
          currentStepIndex={model.stepIndex}
          onStepChange={(index) => model.setStepIndex(index)}
        />

        {model.stepIndex === 0 ? <ReturnOrderSourceStep locale={locale} model={model} /> : null}
        {model.stepIndex === 1 ? <ReturnOrderSettlementStep locale={locale} model={model} /> : null}
        {model.stepIndex === 2 ? (
          <ReturnOrderWorkflowStep model={model} processingLabel={processingLabel} />
        ) : null}

        {model.submitError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {model.submitError}
          </p>
        ) : null}
      </div>
    </DrawerFormShell>
  );
});
