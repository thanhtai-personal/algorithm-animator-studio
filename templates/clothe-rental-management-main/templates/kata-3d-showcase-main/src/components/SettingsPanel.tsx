import { Sun, Moon, Globe, Palette, X } from "lucide-react";
import { useTheme, type Palette as PaletteType } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const palettes: { id: PaletteType; label: string; color: string }[] = [
  { id: "gold", label: "Gold", color: "hsl(40, 55%, 58%)" },
  { id: "rose", label: "Rose", color: "hsl(340, 65%, 58%)" },
  { id: "ocean", label: "Ocean", color: "hsl(200, 80%, 50%)" },
  { id: "emerald", label: "Emerald", color: "hsl(155, 65%, 42%)" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ open, onClose }: Props) => {
  const { mode, palette, setMode, setPalette } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 z-[60] glass shadow-2xl transition-transform duration-500 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-6 space-y-8 h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-lg">⚙️ Settings</h3>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Theme Mode */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
            {mode === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            {t("settings.theme")}
          </label>
          <div className="flex border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("dark")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === "dark"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon size={14} />
              {t("settings.dark")}
            </button>
            <button
              onClick={() => setMode("light")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === "light"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun size={14} />
              {t("settings.light")}
            </button>
          </div>
        </div>

        {/* Palette */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
            <Palette size={12} />
            {t("settings.palette")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {palettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${
                  palette === p.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full shrink-0 transition-all ${
                    palette === p.id ? "ring-2 ring-offset-2 ring-offset-card" : ""
                  }`}
                  style={{ backgroundColor: p.color, ...(palette === p.id ? { "--tw-ring-color": p.color } as React.CSSProperties : {}) }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
            <Globe size={12} />
            {t("settings.language")}
          </label>
          <div className="flex border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setLang("vi")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                lang === "vi"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => setLang("en")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                lang === "en"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
