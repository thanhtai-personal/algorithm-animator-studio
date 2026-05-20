import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthProfile, getCurrentProfile } from "@/lib/auth";
import { readSystemLang } from "@/lib/i18n";
import { CenterPanel } from "./studio/CenterPanel";
import { RightPanel } from "./studio/RightPanel";
import { useAlgorithmStudio } from "./studio/useAlgorithmStudio";
import { WorldSetupPanel } from "./algorithm-world/WorldSetupPanel";

const MazePathfinding = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const initialLang = readSystemLang("en");
  const isAuthenticated = profile !== null;

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function requireExportAccess() {
    if (isAuthenticated) return true;
    navigate("/auth", { replace: false, state: { from: "/maze-pathfinding" } });
    return false;
  }

  const studio = useAlgorithmStudio({
    requireConfigAccess: () => true,
    requireExportAccess,
    exportLocked: !isAuthenticated,
    initialAlgorithmId: "astar",
    initialTitle: initialLang === "vi" ? "Tìm đường ra mê cung" : "Maze Pathfinding Visualized",
    initialSubtitle: initialLang === "vi" ? "Từ lối vào đến lối ra qua mê cung động" : "Entrance to exit through dynamic mazes",
    initialPlatformId: "shorts",
    initialShowCode: false,
    initialWorldVideoMode: "short",
    initialWorldCompareEnabled: false,
    initialWorldProblemType: "fastest",
    initialWorldMazeId: "astar_labyrinth",
    initialWorldPrimaryAlgorithm: "astar",
    initialWorldSecondaryAlgorithm: "dijkstra",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[340px_1fr_360px]">
        <WorldSetupPanel studio={studio} />
        <CenterPanel studio={studio} />
        <RightPanel studio={studio} />
      </div>
    </div>
  );
};

export default MazePathfinding;
