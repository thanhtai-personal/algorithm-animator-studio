"use client";

import type { SettingsGeneralPageState } from "./types";

interface SettingsGeneralPosPasskeySectionProps {
  copy: SettingsGeneralPageState["copy"];
  posPasskeyPolicyQuery: SettingsGeneralPageState["posPasskeyPolicyQuery"];
  posPasskeyEnabled: boolean;
  posPasskeyInput: string;
  posPasskeyUpdatedAtLabel: string;
  onPosPasskeyEnabledChange: (value: boolean) => void;
  onPosPasskeyInputChange: (value: string) => void;
}

export function SettingsGeneralPosPasskeySection({
  copy,
  posPasskeyPolicyQuery,
  posPasskeyEnabled,
  posPasskeyInput,
  posPasskeyUpdatedAtLabel,
  onPosPasskeyEnabledChange,
  onPosPasskeyInputChange,
}: SettingsGeneralPosPasskeySectionProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{copy.posPasskeyTitle}</h2>
        <p className="text-xs text-muted-foreground">{copy.posPasskeyHint}</p>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>{copy.posPasskeyEnabled}</span>
        <input
          type="checkbox"
          checked={posPasskeyEnabled}
          onChange={(event) => onPosPasskeyEnabledChange(event.target.checked)}
          disabled={posPasskeyPolicyQuery.isLoading}
        />
      </label>

      <label className="space-y-1 text-xs text-muted-foreground">
        <span>{copy.posPasskeyInput}</span>
        <input
          type="password"
          value={posPasskeyInput}
          onChange={(event) => onPosPasskeyInputChange(event.target.value)}
          placeholder={copy.posPasskeyInputPlaceholder}
          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        />
        <p>{copy.posPasskeyUpdateHint}</p>
      </label>

      <p className="text-xs text-muted-foreground">
        {copy.posPasskeyUpdatedAt}:{" "}
        <span className="font-semibold">{posPasskeyUpdatedAtLabel}</span>
      </p>
    </section>
  );
}
