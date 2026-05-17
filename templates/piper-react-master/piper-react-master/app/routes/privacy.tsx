import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const PrivacyPolicyPage = lazy(() =>
  import("../components/legal/LegalPages").then((module) => ({ default: module.PrivacyPolicyPage }))
);

export function meta() {
  return [
    { title: "Privacy Policy | Kata YouTuber Studio" },
    {
      name: "description",
      content: "Privacy Policy for Kata YouTuber Studio, including Google and YouTube connection details.",
    },
  ];
}

export default function PrivacyRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PrivacyPolicyPage />
    </Suspense>
  );
}
