"use client";

import type { ReturnOrderModalModel } from "./types";

interface ReturnOrderItemsDraftListProps {
  model: ReturnOrderModalModel;
}

export function ReturnOrderItemsDraftList({ model }: ReturnOrderItemsDraftListProps) {
  if (!model.sourceDetail) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      {model.sourceDetail.items.map((item) => {
        const draft = model.returnItemsDraft[item.orderItemId];
        return (
          <article key={item.orderItemId} className="rounded-lg border border-border/70 p-2.5">
            <p className="text-xs font-semibold text-foreground">{item.itemCode ?? item.itemId}</p>

            <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {model.copy.settlement.itemCondition}
                </span>
                <select
                  value={draft?.condition ?? "OK"}
                  onChange={(event) => {
                    const condition = event.target.value as "OK" | "NEED_CLEAN" | "DAMAGE" | "LOST";
                    model.setReturnItemDraft(item.orderItemId, {
                      condition,
                      targetStatus:
                        condition === "LOST"
                          ? "LOST"
                          : condition === "DAMAGE"
                            ? "MAINTENANCE"
                            : "LAUNDRY",
                    });
                  }}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                >
                  {model.returnConditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {model.copy.settlement.itemTargetStatus}
                </span>
                <select
                  value={draft?.targetStatus ?? "LAUNDRY"}
                  onChange={(event) =>
                    model.setReturnItemDraft(item.orderItemId, {
                      targetStatus: event.target.value as
                        | "READY"
                        | "LAUNDRY"
                        | "MAINTENANCE"
                        | "DAMAGED"
                        | "LOST",
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                >
                  {model.returnTargetStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {model.copy.settlement.itemIncident}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft?.incidentAmount ?? "0"}
                  onChange={(event) =>
                    model.setReturnItemDraft(item.orderItemId, {
                      incidentAmount: event.target.value,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                />
              </label>

              <label className="flex items-center gap-2 self-end text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft?.applyToDeposit ?? true}
                  onChange={(event) =>
                    model.setReturnItemDraft(item.orderItemId, {
                      applyToDeposit: event.target.checked,
                    })
                  }
                />
                {model.copy.settlement.itemApplyDeposit}
              </label>
            </div>

            <label className="mt-2 block space-y-1">
              <span className="text-xs text-muted-foreground">{model.copy.settlement.itemNote}</span>
              <input
                type="text"
                value={draft?.note ?? ""}
                onChange={(event) =>
                  model.setReturnItemDraft(item.orderItemId, {
                    note: event.target.value,
                  })
                }
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
              />
            </label>
          </article>
        );
      })}
    </div>
  );
}
