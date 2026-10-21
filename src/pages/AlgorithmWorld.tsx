import { readSystemLang } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { CenterPanel } from "./studio/CenterPanel";
import { RightPanel } from "./studio/RightPanel";
import { ShortMusicPanel } from "./studio/ShortMusicPanel";
import { useAlgorithmStudio } from "./studio/useAlgorithmStudio";
import { WorldSetupPanel } from "./algorithm-world/WorldSetupPanel";

const MazePathfinding = () => {
  const initialLang = readSystemLang("en");

  const studio = useAlgorithmStudio({
    requireConfigAccess: () => true,
    requireExportAccess: () => true,
    exportLocked: false,
    initialAlgorithmId: "astar",
    initialTitle: initialLang === "vi" ? "Tìm đường ra mê cung" : "Maze Pathfinding Visualized",
    initialSubtitle: initialLang === "vi" ? "Từ lối vào đến lối ra qua mê cung động" : "Entrance to exit through dynamic mazes",
    initialPlatformId: "shorts",
    initialShowCode: false,
    initialWorldVideoMode: "short",
    initialWorldCompareEnabled: false,
    initialWorldPresentationMode: "vehicle_race",
    initialWorldProblemType: "escape",
    initialWorldMazeId: "astar_labyrinth",
    initialWorldPrimaryAlgorithm: "astar",
    initialWorldSecondaryAlgorithm: "dijkstra",
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="grid min-w-0 grid-cols-1 gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <WorldSetupPanel studio={studio} />
        </div>
        <div className="min-w-0">
          <CenterPanel studio={studio} />
          <Card className="mt-4 p-4">
            <ShortMusicPanel studio={studio} standalone />
          </Card>
        </div>
        <div className="min-w-0 space-y-4 xl:col-start-2 2xl:col-start-auto">
          <RightPanel studio={studio} showMusicPanel={false} />
        </div>
      </div>
    </div>
  );
};

export default MazePathfinding;
