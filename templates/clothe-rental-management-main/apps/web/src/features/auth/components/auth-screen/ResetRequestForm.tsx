type ResetRequestFormProps = {
  email: string;
  loading: boolean;
  resetSent: boolean;
  labels: {
    email: string;
  };
  buttons: {
    sendResetLink: string;
    loading: string;
    back: string;
  };
  text: {
    resetEmailSent: string;
  };
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ResetRequestForm({
  email,
  loading,
  resetSent,
  labels,
  buttons,
  text,
  onEmailChange,
  onSubmit,
  onBack,
}: ResetRequestFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="resetEmail">
          {labels.email}
        </label>
        <input
          id="resetEmail"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {resetSent ? <p className="text-xs text-muted-foreground">{text.resetEmailSent}</p> : null}

      <button
        type="button"
        disabled={loading}
        onClick={onSubmit}
        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? buttons.loading : buttons.sendResetLink}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={onBack}
        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttons.back}
      </button>
    </div>
  );
}
