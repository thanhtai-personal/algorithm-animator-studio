import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const TtsPage = lazy(() =>
  import("../components/TtsPage").then((module) => ({ default: module.TtsPage }))
);

export default function HomeRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TtsPage />
    </Suspense>
  );
}
