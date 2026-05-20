import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthProfile, getCurrentProfile, isSuperAdminProfile } from "@/lib/auth";
import { CenterPanel } from "./studio/CenterPanel";
import { RightPanel } from "./studio/RightPanel";
import { useAlgorithmStudio } from "./studio/useAlgorithmStudio";
import { WorldSetupPanel } from "./algorithm-world/WorldSetupPanel";

const AlgorithmWorld = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const canConfigure = isSuperAdminProfile(profile);

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((nextProfile) => {
        if (!cancelled) setProfile(isSuperAdminProfile(nextProfile) ? nextProfile : null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function requireConfigAccess() {
    if (canConfigure) return true;
    navigate("/auth", { replace: false, state: { from: "/algorithm-world" } });
    return false;
  }

  const studio = useAlgorithmStudio({
    requireConfigAccess,
    initialAlgorithmId: "astar",
    initialTitle: "A* Pathfinding Visualized",
    initialSubtitle: "Shifting maze + real-time obstacles",
    initialPlatformId: "shorts",
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

export default AlgorithmWorld;
