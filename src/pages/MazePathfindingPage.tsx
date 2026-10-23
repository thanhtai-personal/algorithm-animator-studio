import { Map } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import AlgorithmWorld from "./AlgorithmWorld";

export default function MazePathfindingPage() {
  const lang = useSystemLang();
  return (
    <main className="w-full space-y-4 px-4 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Map className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.28em]">
            {lang === "vi" ? "Thuật toán" : "Algorithms"}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{lang === "vi" ? "Tìm đường mê cung" : "Maze Pathfinding"}</h1>
      </header>
      <AlgorithmWorld />
    </main>
  );
}
