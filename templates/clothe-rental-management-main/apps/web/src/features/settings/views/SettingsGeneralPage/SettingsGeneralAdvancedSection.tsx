"use client";

import type { SettingsGeneralPageState } from "./types";

interface SettingsGeneralAdvancedSectionProps {
  copy: SettingsGeneralPageState["copy"];
  customerTags: SettingsGeneralPageState["customerTags"];
  onCustomerTagValueChange: SettingsGeneralPageState["setCustomerTagValue"];
}

export function SettingsGeneralAdvancedSection({
  copy,
  customerTags,
  onCustomerTagValueChange,
}: SettingsGeneralAdvancedSectionProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <h2 className="text-sm font-semibold text-foreground">{copy.advancedTitle}</h2>
      <p className="text-xs text-muted-foreground">{copy.advancedHint}</p>

      <article className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.customerTagsTitle}
        </h3>
        {customerTags.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
            {copy.noCustomerTags}
          </p>
        ) : (
          <div className="space-y-2">
            {customerTags.map((entry) => {
              const entryId = entry.id ?? entry.code;

              return (
                <div
                  key={entryId}
                  className="space-y-2 rounded-xl border border-border/70 bg-muted/10 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {entry.code}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={entry.isActive}
                        onChange={(event) =>
                          onCustomerTagValueChange(entryId, { isActive: event.target.checked })
                        }
                      />
                      <span>{copy.customerTagActive}</span>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.warnOnOrderCreate)}
                        onChange={(event) =>
                          onCustomerTagValueChange(entryId, {
                            warnOnOrderCreate: event.target.checked,
                          })
                        }
                      />
                      <span>{copy.customerTagWarn}</span>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.blockOrderCreate)}
                        onChange={(event) =>
                          onCustomerTagValueChange(entryId, {
                            blockOrderCreate: event.target.checked,
                          })
                        }
                      />
                      <span>{copy.customerTagBlock}</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
