"use client";

import type { ReturnOrderModalModel } from "./types";

interface ReturnOrderSettlementFieldsProps {
  model: ReturnOrderModalModel;
}

export function ReturnOrderSettlementFields({ model }: ReturnOrderSettlementFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">{model.copy.settlement.actualReturnDate}</span>
        <input
          type="date"
          value={model.actualReturnDate}
          onChange={(event) => model.setActualReturnDate(event.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
      </label>

      <NumberField
        label={model.copy.settlement.customFees}
        value={model.customFeesAmount}
        onChange={model.setCustomFeesAmount}
      />
      <NumberField
        label={model.copy.settlement.additionalCollectedAmount}
        value={model.additionalCollectedAmount}
        onChange={model.setAdditionalCollectedAmount}
      />

      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">
          {model.copy.settlement.additionalCollectionMethod}
        </span>
        <select
          value={model.additionalCollectionMethod}
          onChange={(event) =>
            model.setAdditionalCollectionMethod(
              event.target.value as typeof model.additionalCollectionMethod
            )
          }
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {model.refundMethodOptions.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </label>

      <NumberField
        label={model.copy.settlement.refundAmount}
        value={model.refundAmount}
        onChange={model.setRefundAmount}
      />

      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">{model.copy.settlement.refundMethod}</span>
        <select
          value={model.refundMethod}
          onChange={(event) => model.setRefundMethod(event.target.value as typeof model.refundMethod)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {model.refundMethodOptions.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </label>

      <TextField
        label={model.copy.settlement.additionalCollectionNote}
        value={model.additionalCollectionNote}
        onChange={model.setAdditionalCollectionNote}
      />
      <TextField
        label={model.copy.settlement.refundReason}
        value={model.refundReason}
        onChange={model.setRefundReason}
      />

      <label className="space-y-1 md:col-span-2">
        <span className="text-xs text-muted-foreground">{model.copy.settlement.refundNote}</span>
        <textarea
          rows={2}
          value={model.refundNote}
          onChange={(event) => model.setRefundNote(event.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 md:col-span-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
    </label>
  );
}
