"use client";

import { AuthFormView } from "@/features/auth/components/auth-screen/AuthFormView";
import { AuthLayout } from "@/features/auth/components/auth-screen/AuthLayout";
import { ResetConfirmForm } from "@/features/auth/components/auth-screen/ResetConfirmForm";
import { ResetRequestForm } from "@/features/auth/components/auth-screen/ResetRequestForm";
import { useLoginScreen } from "@/features/auth/hooks/login/useLoginScreen";

export function LoginScreen() {
  const { state, derived, copy, handlers } = useLoginScreen();
  const headerHint = state.view === "form" ? copy.signInHint : null;

  return (
    <AuthLayout title={copy.headerTitle} subtitle={copy.headerSubtitle} hint={headerHint}>
      {derived.isResetRequest ? (
        <ResetRequestForm
          email={state.form.email}
          loading={state.loading}
          resetSent={state.resetSent}
          labels={{ email: copy.labels.email }}
          buttons={{
            sendResetLink: copy.buttons.sendResetLink,
            loading: copy.buttons.loading,
            back: copy.buttons.back,
          }}
          text={{ resetEmailSent: copy.text.resetEmailSent }}
          onEmailChange={(value) => handlers.updateField("email", value)}
          onSubmit={handlers.handleResetRequest}
          onBack={handlers.returnToForm}
        />
      ) : derived.isResetConfirm ? (
        <ResetConfirmForm
          resetPassword={state.form.resetPassword}
          resetConfirmPassword={state.form.resetConfirmPassword}
          loading={state.loading}
          labels={{
            newPassword: copy.labels.newPassword,
            confirmPassword: copy.labels.confirmPassword,
          }}
          buttons={{
            updatePassword: copy.buttons.updatePassword,
            loading: copy.buttons.loading,
            back: copy.buttons.back,
          }}
          onResetPasswordChange={(value) => handlers.updateField("resetPassword", value)}
          onResetConfirmPasswordChange={(value) => handlers.updateField("resetConfirmPassword", value)}
          onSubmit={handlers.handleResetConfirm}
          onBack={handlers.returnToForm}
        />
      ) : (
        <AuthFormView
          isSignIn
          hideSignUp
          signInMethod={state.signInMethod}
          loading={state.loading}
          showGuestOption={derived.showGuestOption}
          fields={{
            email: state.form.email,
            password: state.form.password,
            confirmPassword: state.form.confirmPassword,
            displayName: state.form.displayName,
            phone: state.form.phone,
          }}
          copy={{
            labels: {
              signInMethod: copy.labels.signInMethod,
              signInWithEmail: copy.labels.signInWithEmail,
              signInWithPhone: copy.labels.signInWithPhone,
              email: copy.labels.email,
              password: copy.labels.password,
              displayName: copy.labels.displayName,
              phone: copy.labels.phone,
              confirmPassword: copy.labels.confirmPassword,
            },
            links: copy.links,
            buttons: {
              signIn: copy.buttons.signIn,
              signUp: copy.buttons.signUp,
              loading: copy.buttons.loading,
              continueWithGoogle: copy.buttons.continueWithGoogle,
              skipLogin: copy.buttons.skipLogin,
            },
            text: { or: copy.text.or, skipLoginHint: copy.text.skipLoginHint },
          }}
          onFieldChange={handlers.updateField}
          onSignInMethodChange={handlers.setSignInMethod}
          onSubmit={handlers.handleSubmit}
          onForgotPassword={handlers.goToResetRequest}
          onToggleMode={() => undefined}
          onGoogleSignIn={handlers.handleGoogleSignIn}
          onGuestSignIn={handlers.handleGuestSignIn}
        />
      )}
    </AuthLayout>
  );
}
