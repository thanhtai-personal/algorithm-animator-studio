import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const ResourcePage = lazy(() =>
  import("../components/resources/ResourcePage").then((module) => ({ default: module.ResourcePage }))
);

export default function ResourcesRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResourcePage />
    </Suspense>
  );
}
