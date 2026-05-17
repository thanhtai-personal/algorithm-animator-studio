import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const AiSortShortsPage = lazy(() =>
  import("../components/shorts/AiSortShortsPage").then((module) => ({ default: module.AiSortShortsPage }))
);

export default function ShortsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AiSortShortsPage />
    </Suspense>
  );
}
