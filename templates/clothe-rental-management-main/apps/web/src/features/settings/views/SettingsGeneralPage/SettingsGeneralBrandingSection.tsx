"use client";

import type { SettingsGeneralPageState } from "./types";

interface SettingsGeneralBrandingSectionProps {
  copy: SettingsGeneralPageState["copy"];
  branchId: string | null;
  siteLogoUrl: string;
  siteLogoDarkUrl: string;
  chooseFromLibraryLabel: string;
  chooseFromLibraryBranchHint: string;
  onSiteLogoUrlChange: (value: string) => void;
  onSiteLogoDarkUrlChange: (value: string) => void;
  onOpenLogoPicker: (target: "light" | "dark") => void;
}

export function SettingsGeneralBrandingSection({
  copy,
  branchId,
  siteLogoUrl,
  siteLogoDarkUrl,
  chooseFromLibraryLabel,
  chooseFromLibraryBranchHint,
  onSiteLogoUrlChange,
  onSiteLogoDarkUrlChange,
  onOpenLogoPicker,
}: SettingsGeneralBrandingSectionProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{copy.brandingTitle}</h2>
        <p className="text-xs text-muted-foreground">{copy.brandingHint}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.siteLogoUrl}</span>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={siteLogoUrl}
              onChange={(event) => onSiteLogoUrlChange(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
            <button
              type="button"
              disabled={!branchId}
              onClick={() => onOpenLogoPicker("light")}
              title={!branchId ? chooseFromLibraryBranchHint : undefined}
              className="h-9 shrink-0 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chooseFromLibraryLabel}
            </button>
          </div>
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.siteLogoDarkUrl}</span>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={siteLogoDarkUrl}
              onChange={(event) => onSiteLogoDarkUrlChange(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
            <button
              type="button"
              disabled={!branchId}
              onClick={() => onOpenLogoPicker("dark")}
              title={!branchId ? chooseFromLibraryBranchHint : undefined}
              className="h-9 shrink-0 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chooseFromLibraryLabel}
            </button>
          </div>
        </label>
      </div>
    </section>
  );
}
