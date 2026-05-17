import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const InstructionsPage = lazy(() =>
  import("../components/instructions/InstructionsPage").then((module) => ({ default: module.InstructionsPage }))
);

export default function InstructionsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <InstructionsPage />
    </Suspense>
  );
}
