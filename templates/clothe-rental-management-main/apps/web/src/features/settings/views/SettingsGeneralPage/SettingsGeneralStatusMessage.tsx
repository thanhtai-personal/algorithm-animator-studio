"use client";

interface SettingsGeneralStatusMessageProps {
  message: string | null;
  tone: "error" | "success";
}

export function SettingsGeneralStatusMessage({ message, tone }: SettingsGeneralStatusMessageProps) {
  if (!message) return null;

  const className =
    tone === "error"
      ? "rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      : "rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700";

  return <p className={className}>{message}</p>;
}
