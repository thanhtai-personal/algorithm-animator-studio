import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const YoutubeUploadPage = lazy(() =>
  import("../components/YoutubeUploadPage").then((module) => ({ default: module.YoutubeUploadPage }))
);

export default function YoutubeCalendarRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <YoutubeUploadPage view="calendar" />
    </Suspense>
  );
}
