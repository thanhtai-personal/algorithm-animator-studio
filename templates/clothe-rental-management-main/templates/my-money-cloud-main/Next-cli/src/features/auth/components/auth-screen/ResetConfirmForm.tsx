import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
          <label className="text-sm font-medium" htmlFor="resetPassword">
            {labels.newPassword}
          </label>
          <Input
            id="resetPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={resetPassword}
            onChange={(event) => onResetPasswordChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="resetConfirmPassword">
            {labels.confirmPassword}
          </label>
          <Input
            id="resetConfirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={resetConfirmPassword}
            onChange={(event) => onResetConfirmPasswordChange(event.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {buttons.loading}
            </>
          ) : (
            buttons.updatePassword
          )}
        </Button>
      </form>
      <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={onBack}>
        {buttons.back}
      </Button>
    </div>
  );
}
