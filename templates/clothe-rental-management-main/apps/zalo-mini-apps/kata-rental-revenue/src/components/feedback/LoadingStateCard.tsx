import { LoaderCircle } from "lucide-react";

export function LoadingStateCard({
  message,
}: {
  message: string;
}) {
  return (
    <section className="zalo-card loading-state-card" role="status" aria-live="polite">
      <LoaderCircle className="loading-state-spinner" aria-hidden="true" />
      <p className="muted">{message}</p>
    </section>
  );
}
