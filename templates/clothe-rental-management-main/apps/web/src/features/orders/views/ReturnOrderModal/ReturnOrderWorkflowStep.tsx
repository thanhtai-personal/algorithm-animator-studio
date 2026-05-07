"use client";

import { Loader2 } from "lucide-react";
import type { ReturnOrderModalModel } from "./types";
import { STATUS_BADGE_CLASS } from "./statusBadge";

interface ReturnOrderWorkflowStepProps {
  model: ReturnOrderModalModel;
  processingLabel: string;
}

export function ReturnOrderWorkflowStep({ model, processingLabel }: ReturnOrderWorkflowStepProps) {
  return (
    <section className="space-y-3">
      <article className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
        <p className="text-muted-foreground">
          {model.copy.workflow.returnOrderStatus}:{" "}
          <StatusBadge
            classNameKey={model.activeReturnOrder?.summary.status ?? "DRAFT"}
            label={model.resolveReturnOrderStatusLabel(model.activeReturnOrder?.summary.status)}
          />
        </p>
        <p className="mt-2 text-muted-foreground">
          {model.copy.workflow.depositRefundStatus}:{" "}
          <StatusBadge
            classNameKey={model.activeReturnOrder?.summary.depositRefundStatus ?? "PENDING"}
            label={model.resolveDepositRefundStatusLabel(
              model.activeReturnOrder?.summary.depositRefundStatus
            )}
          />
        </p>
        <p className="mt-2 text-muted-foreground">
          {model.copy.workflow.sourceOrderStatus}:{" "}
          <span className="ml-1 font-semibold text-foreground">
            {model.resolveSourceOrderStatusLabel(
              model.activeReturnOrder?.summary.sourceRentalOrderStatus ??
                model.sourceDetail?.summary.status
            )}
          </span>
        </p>
      </article>

      <div className="flex flex-wrap gap-2">
        {!model.activeReturnOrder ? (
          <>
            <WorkflowButton
              onClick={() => void model.handleCreate("DRAFT")}
              disabled={model.isBusy || !model.selectedSourceOrderId || !model.actualReturnDate}
              busy={model.isBusy}
              label={model.copy.workflow.saveDraft}
              processingLabel={processingLabel}
              variant="secondary"
            />
            <WorkflowButton
              onClick={() => void model.handleCreate("CREATED")}
              disabled={model.isBusy || !model.selectedSourceOrderId || !model.actualReturnDate}
              busy={model.isBusy}
              label={model.copy.workflow.createOrder}
              processingLabel={processingLabel}
            />
          </>
        ) : null}

        {model.activeReturnStatus === "DRAFT" ? (
          <WorkflowButton
            onClick={() => void model.handleMarkCreated()}
            disabled={model.isBusy}
            busy={model.isBusy}
            label={model.copy.workflow.markCreated}
            processingLabel={processingLabel}
          />
        ) : null}
        {model.canSettle ? (
          <WorkflowButton
            onClick={() => void model.handleSettle()}
            disabled={model.isBusy}
            busy={model.isBusy}
            label={model.copy.workflow.settle}
            processingLabel={processingLabel}
          />
        ) : null}
        {model.canComplete ? (
          <WorkflowButton
            onClick={() => void model.handleComplete()}
            disabled={model.isBusy}
            busy={model.isBusy}
            label={model.copy.workflow.complete}
            processingLabel={processingLabel}
            variant="success"
          />
        ) : null}
        {model.canCancel ? (
          <WorkflowButton
            onClick={() => void model.handleCancel()}
            disabled={model.isBusy}
            busy={model.isBusy}
            label={model.copy.workflow.cancel}
            processingLabel={processingLabel}
            variant="danger"
          />
        ) : null}
      </div>
    </section>
  );
}

function StatusBadge({ classNameKey, label }: { classNameKey: string; label: string }) {
  return (
    <span
      className={`ml-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${
        STATUS_BADGE_CLASS[classNameKey] || STATUS_BADGE_CLASS.DRAFT
      }`}
    >
      {label}
    </span>
  );
}

function WorkflowButton({
  onClick,
  disabled,
  busy,
  label,
  processingLabel,
  variant = "primary",
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  label: string;
  processingLabel: string;
  variant?: "primary" | "secondary" | "success" | "danger";
}) {
  const className =
    variant === "secondary"
      ? "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
      : variant === "success"
        ? "inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground disabled:opacity-50"
        : variant === "danger"
          ? "inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50";

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      <span>{busy ? processingLabel : label}</span>
    </button>
  );
}
