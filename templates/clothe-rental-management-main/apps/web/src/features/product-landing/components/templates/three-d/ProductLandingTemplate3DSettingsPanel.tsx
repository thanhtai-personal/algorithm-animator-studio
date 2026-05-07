"use client";

import { Globe, Moon, Palette, Sun, X } from "lucide-react";
import { PALETTES, type PaletteMode, type TemplateCopy, type TemplateLang, type ThemeMode } from "./productLandingTemplate3D.config";

interface ProductLandingTemplate3DSettingsPanelProps {
  copy: TemplateCopy;
  lang: TemplateLang;
  mode: ThemeMode;
  open: boolean;
  palette: PaletteMode;
  onSelectLanguage: (lang: TemplateLang) => void;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: PaletteMode) => void;
  onClose: () => void;
}

export function ProductLandingTemplate3DSettingsPanel({
  copy,
  lang,
  mode,
  open,
  palette,
  onSelectLanguage,
  setMode,
  setPalette,
  onClose,
}: ProductLandingTemplate3DSettingsPanelProps) {
  return (
    <div
      className={`kata3d-glass fixed right-0 top-0 z-[60] h-full w-80 shadow-2xl transition-transform duration-500 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full space-y-8 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[hsl(var(--kata-foreground))]">
            <span className="mr-2">⚙️</span>
            {copy.settingsTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[hsl(var(--kata-muted-foreground))] transition-colors hover:text-[hsl(var(--kata-foreground))]"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[hsl(var(--kata-muted-foreground))]">
            {mode === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            {copy.settingsTheme}
          </label>
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--kata-border)/0.5)]">
            <button
              type="button"
              onClick={() => setMode("dark")}
              className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm transition-all ${
                mode === "dark"
                  ? "bg-[hsl(var(--kata-primary)/0.1)] text-[hsl(var(--kata-primary))]"
                  : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
              }`}
            >
              <Moon size={14} />
              {copy.settingsDark}
            </button>
            <button
              type="button"
              onClick={() => setMode("light")}
              className={`flex w-full items-center justify-center gap-2 border-t border-[hsl(var(--kata-border)/0.5)] px-4 py-2.5 text-sm transition-all ${
                mode === "light"
                  ? "bg-[hsl(var(--kata-primary)/0.1)] text-[hsl(var(--kata-primary))]"
                  : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
              }`}
            >
              <Sun size={14} />
              {copy.settingsLight}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[hsl(var(--kata-muted-foreground))]">
            <Palette size={12} />
            {copy.settingsPalette}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PALETTES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPalette(entry.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                  palette === entry.id
                    ? "border-[hsl(var(--kata-primary))] bg-[hsl(var(--kata-primary)/0.1)] text-[hsl(var(--kata-foreground))]"
                    : "border-[hsl(var(--kata-border)/0.5)] text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
                }`}
              >
                <span
                  className={`h-5 w-5 shrink-0 rounded-full ${palette === entry.id ? "ring-2 ring-white/40" : ""}`}
                  style={{ backgroundColor: entry.color }}
                />
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[hsl(var(--kata-muted-foreground))]">
            <Globe size={12} />
            {copy.settingsLanguage}
          </label>
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--kata-border)/0.5)]">
            <button
              type="button"
              onClick={() => onSelectLanguage("vi")}
              className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm transition-all ${
                lang === "vi"
                  ? "bg-[hsl(var(--kata-primary)/0.1)] text-[hsl(var(--kata-primary))]"
                  : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
              }`}
            >
              <span>🇻🇳</span>
              {copy.languageVietnamese}
            </button>
            <button
              type="button"
              onClick={() => onSelectLanguage("en")}
              className={`flex w-full items-center justify-center gap-2 border-t border-[hsl(var(--kata-border)/0.5)] px-4 py-2.5 text-sm transition-all ${
                lang === "en"
                  ? "bg-[hsl(var(--kata-primary)/0.1)] text-[hsl(var(--kata-primary))]"
                  : "text-[hsl(var(--kata-muted-foreground))] hover:text-[hsl(var(--kata-foreground))]"
              }`}
            >
              <span>🇬🇧</span>
              {copy.languageEnglish}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
