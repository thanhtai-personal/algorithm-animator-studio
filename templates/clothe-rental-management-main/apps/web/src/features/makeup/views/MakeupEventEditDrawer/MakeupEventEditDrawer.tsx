"use client";

import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import type { MakeupEventConflictDto } from "@/types/makeupModule";
import type { MakeupCalendarPageModel } from "@/features/makeup/hooks/useMakeupCalendarPage";

interface MakeupEventEditDrawerProps {
  model: MakeupCalendarPageModel;
}

function conflictReasonLabel(conflict: MakeupEventConflictDto): string {
  return conflict.reason;
}

export function MakeupEventEditDrawer({ model }: MakeupEventEditDrawerProps) {
  const draft = model.editDraft;
  const isBusy = model.updateMutation.isPending;

  if (!draft) return null;

  return (
    <DrawerFormShell
      open={model.editDrawerOpen}
      onOpenChange={(open) => {
        if (!open) model.onCloseEditDrawer();
      }}
      title={model.copy.editDrawerTitle}
      description={model.copy.editDrawerDescription}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={model.onCloseEditDrawer}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
          >
            {model.copy.editCloseAction}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              await model.onSaveEdit();
            }}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {model.copy.editSaveAction}
          </button>
        </div>
      }
      widthClassName="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.eventDate}</span>
            <input
              type="date"
              value={draft.eventDate}
              min={model.todayIso}
              onChange={(event) => model.onEditDraftChange("eventDate", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.sessionSlot}</span>
            <select
              value={draft.sessionSlot}
              onChange={(event) => model.onEditDraftChange("sessionSlot", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            >
              <option value="MORNING">MORNING</option>
              <option value="AFTERNOON">AFTERNOON</option>
              <option value="EVENING">EVENING</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.startAt}</span>
            <input
              type="datetime-local"
              value={draft.startAtLocal}
              min={model.minBookingDateTime}
              onChange={(event) => model.onEditDraftChange("startAtLocal", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.endAt}</span>
            <input
              type="datetime-local"
              value={draft.endAtLocal}
              min={model.minBookingDateTime}
              onChange={(event) => model.onEditDraftChange("endAtLocal", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.artist}</span>
            <select
              value={draft.artistProfileId}
              onChange={(event) => model.onEditDraftChange("artistProfileId", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            >
              <option value="">-</option>
              {(model.artistsQuery.data?.items ?? []).map((artist) => (
                <option key={artist.profileId} value={artist.profileId}>
                  {artist.fullName ?? artist.profileId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.customerId}</span>
            <input
              type="text"
              value={draft.customerId}
              onChange={(event) => model.onEditDraftChange("customerId", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.package}</span>
            <select
              value={draft.packageId}
              onChange={(event) => model.onEditDraftChange("packageId", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            >
              <option value="">{model.copy.noPackage}</option>
              {(model.packagesQuery.data?.items ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.code} - {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.surchargeAmount}</span>
            <input
              type="number"
              min={0}
              step="1000"
              value={draft.surchargeAmount}
              onChange={(event) => model.onEditDraftChange("surchargeAmount", event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
            <span>{model.copy.note}</span>
            <textarea
              rows={2}
              value={draft.note}
              onChange={(event) => model.onEditDraftChange("note", event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              disabled={isBusy}
            />
          </label>
        </div>

        {model.editPendingConflict ? (
          <div className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            <p className="font-semibold">{model.copy.conflictsTitle}</p>
            <p className="text-muted-foreground">{model.copy.conflictHint}</p>
            <ul className="space-y-1">
              {model.editPendingConflict.conflicts.map((entry) => (
                <li key={`${entry.eventId}-${entry.reason}`} className="font-mono text-[11px]">
                  {entry.eventDate} {entry.sessionSlot} [{conflictReasonLabel(entry)}]
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await model.onConfirmEditOverride();
                }}
                disabled={isBusy}
                className="rounded-lg border border-warning/40 bg-background px-3 py-1.5 font-semibold"
              >
                {model.copy.confirmConflictAction}
              </button>
              <button
                type="button"
                onClick={model.onCloseEditDrawer}
                className="rounded-lg border border-border bg-background px-3 py-1.5"
              >
                {model.copy.editCloseAction}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DrawerFormShell>
  );
}
