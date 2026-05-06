import { Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lang } from "@/lib/i18n";
import { CenterPanel } from "./studio/CenterPanel";
import { LeftPanel } from "./studio/LeftPanel";
import { RightPanel } from "./studio/RightPanel";
import { useAlgorithmStudio } from "./studio/useAlgorithmStudio";

const Index = () => {
  const studio = useAlgorithmStudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-5 flex items-center gap-3 border-b border-border/40">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{studio.tr("appTitle")}</h1>
          <p className="text-xs text-muted-foreground">{studio.tr("tagline")}</p>
        </div>
        <Select value={studio.lang} onValueChange={(v) => studio.setLang(v as Lang)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="vi">Tiếng Việt</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_360px] gap-4 p-4">
        <LeftPanel studio={studio} />
        <CenterPanel studio={studio} />
        <RightPanel studio={studio} />
      </div>
    </div>
  );
};

export default Index;
