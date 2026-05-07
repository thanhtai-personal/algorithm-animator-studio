import type { FormEvent } from "react";

type ResetConfirmFormProps = {
  resetPassword: string;
  resetConfirmPassword: string;
  loading: boolean;
  labels: {
    newPassword: string;
    confirmPassword: string;
  };
  buttons: {
    updatePassword: string;
    loading: string;
    back: string;
  };
  onResetPasswordChange: (value: string) => void;
  onResetConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export function ResetConfirmForm({
  resetPassword,
  resetConfirmPassword,
  loading,
  labels,
  buttons,
  onResetPasswordChange,
  onResetConfirmPasswordChange,
  onSubmit,
  onBack,
}: ResetConfirmFormProps) {
  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={onSubmit} aria-busy={loading}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="resetPassword">
            {labels.newPassword}
          </label>
          <input
            id="resetPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={resetPassword}
            onChange={(event) => onResetPasswordChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="resetConfirmPassword">
            {labels.confirmPassword}
          </label>
          <input
            id="resetConfirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={resetConfirmPassword}
            onChange={(event) => onResetConfirmPasswordChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? buttons.loading : buttons.updatePassword}
        </button>
      </form>

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
