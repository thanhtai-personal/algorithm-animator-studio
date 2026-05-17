import { lazy, Suspense } from "react";
import { PageLoading } from "../components/PageLoading";

const TermsOfServicePage = lazy(() =>
  import("../components/legal/LegalPages").then((module) => ({ default: module.TermsOfServicePage }))
);

export function meta() {
  return [
    { title: "Terms of Service | Kata YouTuber Studio" },
    {
      name: "description",
      content: "Terms of Service for Kata YouTuber Studio.",
    },
  ];
}

export default function TermRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TermsOfServicePage />
    </Suspense>
  );
}
