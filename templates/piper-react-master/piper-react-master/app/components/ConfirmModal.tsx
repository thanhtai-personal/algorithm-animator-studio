export function ConfirmModal({
  cancelLabel,
  confirmLabel,
  description,
  open,
  title,
  tone = "danger",
  onCancel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  description: React.ReactNode;
  open: boolean;
  title: string;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalOverlay" role="presentation" onMouseDown={onCancel}>
      <section
        aria-modal="true"
        className="modalPanel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold">{title}</h2>
        <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</div>
        <div className="modalActions">
          <button className="btn-ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={tone === "danger" ? "button dangerSolidButton" : "button"} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
