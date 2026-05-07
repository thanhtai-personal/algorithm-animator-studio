import type { AuthCopy, AuthMode, AuthView } from "@/features/auth/types/authScreen";

export const buildHeaderTitle = (params: { isSuccess: boolean; isResetRequest: boolean; isResetConfirm: boolean; t: (key: string) => string }) => {
  const { isSuccess, isResetRequest, isResetConfirm, t } = params;
  if (isSuccess) return t("auth.signUpSuccessTitle");
  if (isResetRequest) return t("auth.resetPasswordTitle");
  if (isResetConfirm) return t("auth.resetPasswordNewTitle");
  return t("auth.title");
};

export const buildHeaderSubtitle = (params: {
  isSuccess: boolean;
  isResetRequest: boolean;
  isResetConfirm: boolean;
  t: (key: string) => string;
}) => {
  const { isSuccess, isResetRequest, isResetConfirm, t } = params;
  if (isSuccess) return t("auth.signUpSuccessSubtitle");
  if (isResetRequest) return t("auth.resetPasswordSubtitle");
  if (isResetConfirm) return t("auth.resetPasswordNewSubtitle");
  return t("auth.subtitle");
};

export const buildAuthCopy = (params: {
  headerTitle: string;
  headerSubtitle: string;
  t: (key: string) => string;
}): AuthCopy => {
  const { headerSubtitle, headerTitle, t } = params;
  return {
    headerTitle,
    headerSubtitle,
    signInHint: t("auth.signInHint"),
    labels: {
      signInMethod: t("auth.signInMethod"),
      signInWithEmail: t("auth.signInWithEmail"),
      signInWithPhone: t("auth.signInWithPhone"),
      email: t("auth.email"),
      password: t("auth.password"),
      displayName: t("auth.displayName"),
      phone: t("auth.phone"),
      confirmPassword: t("auth.confirmPassword"),
      newPassword: t("auth.newPassword"),
    },
    links: {
      forgotPassword: t("auth.forgotPassword"),
      haveAccount: t("auth.haveAccount"),
      noAccount: t("auth.noAccount"),
    },
    buttons: {
      signIn: t("auth.signIn"),
      signUp: t("auth.signUp"),
      loading: t("auth.loading"),
      sendResetLink: t("auth.sendResetLink"),
      updatePassword: t("auth.updatePassword"),
      continueWithGoogle: t("auth.continueWithGoogle"),
      done: t("common.done"),
      back: t("common.back"),
      skipLogin: t("auth.skipLogin"),
    },
    text: {
      or: t("auth.or"),
      resetEmailSent: t("auth.resetEmailSent"),
      skipLoginHint: t("auth.skipLoginHint"),
    },
  };
};

export const isSignInMode = (mode: AuthMode) => mode === "signIn";
export const isResetRequestView = (view: AuthView) => view === "resetRequest";
export const isResetConfirmView = (view: AuthView) => view === "resetConfirm";
export const isSuccessView = (view: AuthView) => view === "signupSuccess";
export const showGuestOption = (view: AuthView) => view === "form";
