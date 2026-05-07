import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
        <label className="text-sm font-medium" htmlFor="resetEmail">
          {labels.email}
        </label>
        <Input
          id="resetEmail"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>
      {resetSent ? <p className="text-xs text-muted-foreground">{text.resetEmailSent}</p> : null}
      <Button type="button" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {buttons.loading}
          </>
        ) : (
          buttons.sendResetLink
        )}
      </Button>
      <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={onBack}>
        {buttons.back}
      </Button>
    </div>
  );
}
