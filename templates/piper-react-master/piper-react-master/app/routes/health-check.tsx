import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const HealthCheckToolsPage = lazy(() =>
  import("../components/health/HealthCheckToolsPage").then((module) => ({ default: module.HealthCheckToolsPage })),
);

export default function HealthCheckToolsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HealthCheckToolsPage />
    </Suspense>
  );
}
