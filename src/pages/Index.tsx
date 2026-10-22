import { Card } from "@/components/ui/card";
import { CenterPanel } from "./studio/CenterPanel";
import { LeftPanel } from "./studio/LeftPanel";
import { RightPanel } from "./studio/RightPanel";
import { ShortMusicPanel } from "./studio/ShortMusicPanel";
import { useAlgorithmStudio } from "./studio/useAlgorithmStudio";

const Index = () => {
  const studio = useAlgorithmStudio({
    requireConfigAccess: () => true,
    initialAlgorithmId: "bubble",
    initialWorldTournamentEnabled: false,
    enableWorldTournamentIntegration: false,
    enableMazePathfinding: false,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_360px] gap-4 p-4">
        <LeftPanel studio={studio} />
        <div className="min-w-0">
          <CenterPanel studio={studio} />
          <Card className="mt-4 p-4">
            <ShortMusicPanel studio={studio} standalone />
          </Card>
        </div>
        <RightPanel studio={studio} showMusicPanel={false} />
      </div>
    </div>
  );
};

export default Index;
