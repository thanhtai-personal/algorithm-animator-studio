"use client";

import type { MakeupProductBookingModel } from "@/features/makeup/hooks/useMakeupProductBooking";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { cn } from "@/utils/className";

interface MakeupBookingConfirmFormProps {
  model: MakeupProductBookingModel;
  className?: string;
  showTitle?: boolean;
  onBookingSuccess?: () => void;
  absoluteFooter?: boolean;
}

function normalizeSurchargeInput(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.replace(/^0+(?=\d)/, "");
}

function formatSurchargeDisplay(rawValue: string, locale: "vi" | "en"): string {
  const normalized = normalizeSurchargeInput(rawValue);
  if (!normalized) return "";
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(parsed);
}

export function MakeupBookingConfirmForm({
  model,
  className,
  showTitle = true,
  onBookingSuccess,
  absoluteFooter = false,
}: MakeupBookingConfirmFormProps) {
  const voiceLanguage = model.locale === "vi" ? "vi-VN" : "en-US";
  const voiceFieldClassName =
    "space-y-1 [&>label]:text-xs [&>label]:font-normal [&>label]:normal-case [&>label]:tracking-normal [&_input]:h-10 [&_input]:rounded-xl [&_input]:border-border [&_input]:bg-background [&_input]:px-3 [&_input]:pr-12 [&_input]:text-sm";
  const voiceTextareaFieldClassName =
    "space-y-1 [&>label]:text-xs [&>label]:font-normal [&>label]:normal-case [&>label]:tracking-normal [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:pr-12 [&_textarea]:text-sm";
  const isSubmitting = model.createMutation.isPending;

  const submitAction = (
    <button
      type="button"
      onClick={async () => {
        const success = await model.onSubmitBooking();
        if (success) onBookingSuccess?.();
      }}
      disabled={isSubmitting || !model.canCreate}
      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {model.copy.saveAction}
    </button>
  );

  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-card p-5 shadow-sm",
        absoluteFooter ? "relative overflow-hidden" : "space-y-4",
        className
      )}
    >
      <div className={cn("space-y-4", absoluteFooter ? "pb-24" : "")}>
        {showTitle ? (
          <header>
            <h3 className="text-lg font-bold text-foreground">{model.copy.formTitle}</h3>
          </header>
        ) : null}

        {!model.hasCloudSession && !model.isPublicCreateMode ? (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
            {model.copy.noSessionHint}
          </p>
        ) : null}

        {model.hasCloudSession && !model.canCreate ? (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
            {model.copy.unsupportedRole}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.artistLabel}</span>
            <select
              value={model.selectedArtistProfileId}
              onChange={(event) => model.onFormChange("artistProfileId", event.target.value)}
              disabled={model.role === "makeup_artist" || isSubmitting}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">-</option>
              {model.artists.map((artist) => (
                <option key={artist.profileId} value={artist.profileId}>
                  {artist.fullName ?? artist.profileId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.guestCountLabel}</span>
            <input
              type="number"
              min={1}
              step={1}
              value={model.form.guestCount}
              onChange={(event) => model.onFormChange("guestCount", event.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.bookingDateLabel}</span>
            <input
              type="date"
              value={model.form.bookingDate}
              min={model.minBookingDate}
              onChange={(event) => model.onFormChange("bookingDate", event.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.startAtLabel}</span>
            <input
              type="time"
              value={model.form.startTime}
              onChange={(event) => model.onFormChange("startTime", event.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.endAtLabel}</span>
            <input
              type="datetime-local"
              value={model.form.endAtLocal}
              onChange={(event) => model.onFormChange("endAtLocal", event.target.value)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <VoiceDictationField
            locale={model.locale}
            className={voiceFieldClassName}
            fieldType="input"
            inputType="text"
            label={model.copy.surchargeLabel}
            value={formatSurchargeDisplay(model.form.surchargeAmount, model.locale)}
            onValueChange={(value) =>
              model.onFormChange("surchargeAmount", normalizeSurchargeInput(value))
            }
            language={voiceLanguage}
            disabled={isSubmitting}
          />

          <VoiceDictationField
            locale={model.locale}
            className={voiceFieldClassName}
            fieldType="input"
            label={model.copy.customerNameLabel}
            value={model.form.customerName}
            onValueChange={(value) => model.onFormChange("customerName", value)}
            language={voiceLanguage}
            disabled={isSubmitting}
          />

          <VoiceDictationField
            locale={model.locale}
            className={voiceFieldClassName}
            fieldType="input"
            inputType="tel"
            label={model.copy.customerPhoneLabel}
            value={model.form.customerPhone}
            onValueChange={(value) => model.onFormChange("customerPhone", value)}
            language={voiceLanguage}
            disabled={isSubmitting}
          />
        </div>

        <VoiceDictationField
          locale={model.locale}
          className={voiceTextareaFieldClassName}
          label={model.copy.noteLabel}
          value={model.form.note}
          onValueChange={(value) => model.onFormChange("note", value)}
          language={voiceLanguage}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {absoluteFooter ? (
        <div className="absolute inset-x-0 bottom-0 border-t border-border/70 bg-card/95 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
          <div className="flex justify-end">{submitAction}</div>
        </div>
      ) : (
        <div className="flex justify-end">{submitAction}</div>
      )}
    </section>
  );
}
