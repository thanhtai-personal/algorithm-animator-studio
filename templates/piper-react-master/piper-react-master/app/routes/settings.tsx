import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const SettingsPage = lazy(() =>
  import("../components/settings/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);

export default function SettingsRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SettingsPage />
    </Suspense>
  );
}
