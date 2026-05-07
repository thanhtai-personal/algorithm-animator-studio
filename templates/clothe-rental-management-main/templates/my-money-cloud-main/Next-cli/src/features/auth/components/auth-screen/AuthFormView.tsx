import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type AuthFormViewProps = {
  isSignIn: boolean;
  hideSignUp?: boolean;
  loading: boolean;
  showGuestOption: boolean;
  fields: {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    phone: string;
  };
  copy: {
    labels: {
      email: string;
      password: string;
      displayName: string;
      phone: string;
      confirmPassword: string;
    };
    links: {
      forgotPassword: string;
      haveAccount: string;
      noAccount: string;
    };
    buttons: {
      signIn: string;
      signUp: string;
      loading: string;
      continueWithGoogle: string;
      skipLogin: string;
    };
    text: {
      or: string;
      skipLoginHint: string;
    };
  };
  onFieldChange: (field: keyof AuthFormViewProps["fields"], value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onToggleMode: () => void;
  onGoogleSignIn: () => void;
  onGuestSignIn: () => void;
};

export function AuthFormView({
  isSignIn,
  hideSignUp = false,
  loading,
  showGuestOption,
  fields,
  copy,
  onFieldChange,
  onSubmit,
  onForgotPassword,
  onToggleMode,
  onGoogleSignIn,
  onGuestSignIn,
}: AuthFormViewProps) {
  return (
    <>
      <form className="space-y-4" onSubmit={onSubmit} aria-busy={loading}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            {copy.labels.email}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={fields.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            {copy.labels.password}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            required
            disabled={loading}
            value={fields.password}
            onChange={(event) => onFieldChange("password", event.target.value)}
          />
        </div>
        {isSignIn ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={onForgotPassword}
            >
              {copy.links.forgotPassword}
            </button>
          </div>
        ) : null}
        {!isSignIn ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="displayName">
                {copy.labels.displayName}
              </label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                disabled={loading}
                value={fields.displayName}
                onChange={(event) => onFieldChange("displayName", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="phone">
                {copy.labels.phone}
              </label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                disabled={loading}
                value={fields.phone}
                onChange={(event) => onFieldChange("phone", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                {copy.labels.confirmPassword}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={fields.confirmPassword}
                onChange={(event) => onFieldChange("confirmPassword", event.target.value)}
              />
            </div>
          </>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.buttons.loading}
            </>
          ) : isSignIn || hideSignUp ? (
            copy.buttons.signIn
          ) : (
            copy.buttons.signUp
          )}
        </Button>
      </form>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{copy.text.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full" disabled={loading} onClick={onGoogleSignIn}>
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
          <svg width="14" height="14" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.7 1.37 9.19 3.6l6.84-6.84C35.9 2.23 30.3 0 24 0 14.6 0 6.5 5.38 2.56 13.22l7.98 6.2C12.4 13.12 17.7 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.64-.15-3.21-.43-4.73H24v9h12.7c-.55 2.95-2.2 5.45-4.7 7.14l7.56 5.86c4.42-4.08 7.94-10.1 7.94-17.27z"
            />
            <path
              fill="#FBBC05"
              d="M10.54 28.08a14.5 14.5 0 0 1 0-8.16l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.77.9 7.34 2.56 10.28l7.98-6.2z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.3 0 11.6-2.08 15.47-5.63l-7.56-5.86c-2.1 1.4-4.8 2.23-7.91 2.23-6.3 0-11.6-3.62-13.46-8.92l-7.98 6.2C6.5 42.62 14.6 48 24 48z"
            />
          </svg>
        </span>
        {copy.buttons.continueWithGoogle}
      </Button>
      {!hideSignUp ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {isSignIn ? copy.links.noAccount : copy.links.haveAccount}
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={onToggleMode}
            className="font-semibold text-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSignIn ? copy.buttons.signUp : copy.buttons.signIn}
          </button>
        </div>
      ) : null}
      {showGuestOption ? (
        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground">{copy.text.skipLoginHint}</p>
          <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={onGuestSignIn}>
            {copy.buttons.skipLogin}
          </Button>
        </div>
      ) : null}
    </>
  );
}
