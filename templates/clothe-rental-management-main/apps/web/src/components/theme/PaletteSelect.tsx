"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useThemeVariant } from "@/lib/themeVariants";

export function PaletteSelect() {
  const { t } = useI18n();
  const { variant, setVariant, options } = useThemeVariant();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={t("theme.paletteAriaLabel")}
        title={t("theme.paletteAriaLabel")}
        onClick={() => setOpen((previous) => !previous)}
        className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Palette className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-xl border border-border bg-card p-2 shadow-lg">
          <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">{t("theme.paletteLabel")}</p>
          <div className="space-y-1">
            {options.map((option) => {
              const selected = option.id === variant;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setVariant(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                    style={{ background: option.preview.primary }}
                  />
                  <span>{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

