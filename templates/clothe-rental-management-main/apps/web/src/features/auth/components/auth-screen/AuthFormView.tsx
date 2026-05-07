import type { FormEvent, ReactNode } from "react";
import type { SignInMethod } from "@/features/auth/types/authScreen";

type AuthFormViewProps = {
  isSignIn: boolean;
  hideSignUp?: boolean;
  signInMethod: SignInMethod;
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
      signInMethod: string;
      signInWithEmail: string;
      signInWithPhone: string;
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
  onSignInMethodChange: (method: SignInMethod) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onToggleMode: () => void;
  onGoogleSignIn: () => void;
  onGuestSignIn: () => void;
};

function InputField({
  id,
  label,
  type,
  autoComplete,
  value,
  required = false,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  required?: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function Button({
  type = "button",
  variant = "solid",
  disabled,
  onClick,
  children,
}: {
  type?: "button" | "submit";
  variant?: "solid" | "outline" | "ghost";
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  children: ReactNode;
}) {
  const base =
    "inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "solid"
      ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
      : variant === "outline"
        ? "border border-border bg-background text-foreground hover:bg-muted/60"
        : "text-foreground hover:bg-muted/60";

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function AuthFormView({
  isSignIn,
  hideSignUp = false,
  signInMethod,
  loading,
  showGuestOption,
  fields,
  copy,
  onFieldChange,
  onSignInMethodChange,
  onSubmit,
  onForgotPassword,
  onToggleMode,
  onGoogleSignIn,
  onGuestSignIn,
}: AuthFormViewProps) {
  const isPhoneSignIn = isSignIn && signInMethod === "phone";

  return (
    <>
      <form className="space-y-4" onSubmit={onSubmit} aria-busy={loading}>
        {isSignIn ? (
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">{copy.labels.signInMethod}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => onSignInMethodChange("email")}
                className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${
                  signInMethod === "email"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {copy.labels.signInWithEmail}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSignInMethodChange("phone")}
                className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${
                  signInMethod === "phone"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {copy.labels.signInWithPhone}
              </button>
            </div>
          </div>
        ) : null}
        <InputField
          id={isPhoneSignIn ? "phone-signin" : "email"}
          label={isPhoneSignIn ? copy.labels.phone : copy.labels.email}
          type={isPhoneSignIn ? "tel" : "email"}
          autoComplete={isPhoneSignIn ? "tel" : "email"}
          required
          disabled={loading}
          value={isPhoneSignIn ? fields.phone : fields.email}
          onChange={(value) => onFieldChange(isPhoneSignIn ? "phone" : "email", value)}
        />
        <InputField
          id="password"
          label={copy.labels.password}
          type="password"
          autoComplete={isSignIn ? "current-password" : "new-password"}
          required
          disabled={loading}
          value={fields.password}
          onChange={(value) => onFieldChange("password", value)}
        />

        {isSignIn ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={onForgotPassword}
            >
              {copy.links.forgotPassword}
            </button>
          </div>
        ) : (
          <>
            <InputField
              id="displayName"
              label={copy.labels.displayName}
              type="text"
              autoComplete="name"
              disabled={loading}
              value={fields.displayName}
              onChange={(value) => onFieldChange("displayName", value)}
            />
            <InputField
              id="phone"
              label={copy.labels.phone}
              type="tel"
              autoComplete="tel"
              disabled={loading}
              value={fields.phone}
              onChange={(value) => onFieldChange("phone", value)}
            />
            <InputField
              id="confirmPassword"
              label={copy.labels.confirmPassword}
              type="password"
              autoComplete="new-password"
              required
              disabled={loading}
              value={fields.confirmPassword}
              onChange={(value) => onFieldChange("confirmPassword", value)}
            />
          </>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? copy.buttons.loading : isSignIn || hideSignUp ? copy.buttons.signIn : copy.buttons.signUp}
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{copy.text.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 space-y-4">
        <Button variant="outline" disabled={loading} onClick={onGoogleSignIn}>
          {copy.buttons.continueWithGoogle}
        </Button>

        {!hideSignUp ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {isSignIn ? copy.links.noAccount : copy.links.haveAccount}
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={onToggleMode}
              className="font-semibold text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSignIn ? copy.buttons.signUp : copy.buttons.signIn}
            </button>
          </div>
        ) : null}

        {showGuestOption ? (
          <div className="space-y-2 text-center">
            <p className="text-xs text-muted-foreground">{copy.text.skipLoginHint}</p>
            <Button variant="outline" disabled={loading} onClick={onGuestSignIn}>
              {copy.buttons.skipLogin}
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
