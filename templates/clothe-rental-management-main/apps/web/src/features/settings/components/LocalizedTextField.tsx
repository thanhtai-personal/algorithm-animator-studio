"use client";

import type { LocalizedText } from "@/features/product-landing/config/productLandingThemeModern";

interface LocalizedTextFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (locale: "vi" | "en", value: string) => void;
  multiline?: boolean;
  rows?: number;
}

export function LocalizedTextField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: LocalizedTextFieldProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(["vi", "en"] as const).map((localeKey) => (
        <label key={localeKey} className="space-y-1 text-xs text-muted-foreground">
          <span>
            {localeKey.toUpperCase()} - {label}
          </span>
          {multiline ? (
            <textarea
              rows={rows}
              value={value[localeKey]}
              onChange={(event) => onChange(localeKey, event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          ) : (
            <input
              type="text"
              value={value[localeKey]}
              onChange={(event) => onChange(localeKey, event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          )}
        </label>
      ))}
    </div>
  );
}
