"use client";

import type { SalesProductEntryPageModel } from "./types";

interface SalesProductEntryBusinessSectionProps {
  model: SalesProductEntryPageModel;
}

export function SalesProductEntryBusinessSection({ model }: SalesProductEntryBusinessSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formGroups.business}
      </h3>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={model.draft.isActive}
            onChange={(event) => model.setDraftField("isActive", event.target.checked)}
          />
          {model.copy.fields.active}
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={model.draft.isRentable}
            onChange={(event) => model.setDraftField("isRentable", event.target.checked)}
          />
          {model.copy.fields.isRentable}
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={model.draft.isSaleable}
            onChange={(event) => model.setDraftField("isSaleable", event.target.checked)}
          />
          {model.copy.fields.isSaleable}
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.tags}
        </p>
        <div className="flex flex-wrap gap-2">
          {model.tags.length > 0 ? (
            model.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => model.toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  model.draft.tagIds.includes(tag.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {tag.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">-</p>
          )}
        </div>
      </div>
    </div>
  );
}
