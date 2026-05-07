"use client";

interface SettingsUsersLoadingStateProps {
  label: string;
}

interface SettingsUsersErrorStateProps {
  label: string;
  retryLabel: string;
  onRetry: () => void;
}

export function SettingsUsersLoadingState({ label }: SettingsUsersLoadingStateProps) {
  return (
    <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
      <p className="text-sm text-muted-foreground">{label}</p>
    </section>
  );
}

export function SettingsUsersErrorState({
  label,
  retryLabel,
  onRetry,
}: SettingsUsersErrorStateProps) {
  return (
    <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
      <p className="text-sm text-destructive">{label}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
      >
        {retryLabel}
      </button>
    </section>
  );
}
