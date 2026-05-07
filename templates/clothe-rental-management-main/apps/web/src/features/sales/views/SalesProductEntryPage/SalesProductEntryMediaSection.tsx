"use client";

import type { SalesProductEntryPageModel } from "./types";

interface SalesProductEntryMediaSectionProps {
  model: SalesProductEntryPageModel;
  coverPreviewUrl: string | null;
}

export function SalesProductEntryMediaSection({
  model,
  coverPreviewUrl,
}: SalesProductEntryMediaSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formGroups.media}
      </h3>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.coverImage}
        </span>
        <input
          type="url"
          value={model.draft.coverImageUrl}
          onChange={(event) => model.setDraftField("coverImageUrl", event.target.value)}
          placeholder="https://..."
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.galleryImages}
        </span>
        <textarea
          rows={3}
          value={model.draft.galleryImageUrlsText}
          onChange={(event) => model.setDraftField("galleryImageUrlsText", event.target.value)}
          placeholder={model.copy.placeholders.mediaUrls}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.videos}
        </span>
        <textarea
          rows={3}
          value={model.draft.videoUrlsText}
          onChange={(event) => model.setDraftField("videoUrlsText", event.target.value)}
          placeholder={model.copy.placeholders.mediaUrls}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      {coverPreviewUrl ? (
        <div className="h-36 w-full overflow-hidden rounded-xl border border-border">
          <img
            src={coverPreviewUrl}
            alt="cover preview"
            width={960}
            height={360}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
