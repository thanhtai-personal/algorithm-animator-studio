import { Home } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import Index from "./Index";

export default function AlgorithmChannelPage() {
  const lang = useSystemLang();
  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Home className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Thuật toán" : "Algorithms"}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{lang === "vi" ? "Video thuật toán" : "Algorithm Video"}</h1>
      </header>
      <Index />
    </main>
  );
}
