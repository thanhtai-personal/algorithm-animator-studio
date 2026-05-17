import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const VideoStudioPage = lazy(() =>
  import("../components/video/VideoStudioPage").then((module) => ({ default: module.VideoStudioPage }))
);

export default function VideoRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VideoStudioPage />
    </Suspense>
  );
}
