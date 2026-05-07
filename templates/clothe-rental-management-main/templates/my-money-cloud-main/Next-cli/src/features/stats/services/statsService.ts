import type { StatsSummary } from "@/types/stats";

export async function fetchStatsSummary(): Promise<StatsSummary> {
  const response = await fetch("/api/stats/summary", { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as Partial<StatsSummary> & { error?: string };

  if (!response.ok) {
    throw new Error(body?.error || "Failed to fetch stats summary");
  }

  if (!body?.current || !body?.previous) {
    throw new Error("Invalid stats summary response");
  }

  return {
    current: body.current,
    previous: body.previous,
  };
}
