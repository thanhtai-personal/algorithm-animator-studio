import type { FormEvent } from "react";

export type AuthMode = "signIn" | "signUp";
export type AuthView = "form" | "signupSuccess" | "resetRequest" | "resetConfirm";
export type SignInMethod = "email" | "phone";

export type FormState = {
  email: string;
  displayName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  resetPassword: string;
  resetConfirmPassword: string;
};

export type AuthCopy = {
  headerTitle: string;
  headerSubtitle: string;
  signInHint: string;
  labels: {
    signInMethod: string;
    signInWithEmail: string;
    signInWithPhone: string;
    email: string;
    password: string;
    displayName: string;
    phone: string;
    confirmPassword: string;
    newPassword: string;
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
    sendResetLink: string;
    updatePassword: string;
    continueWithGoogle: string;
    done: string;
    back: string;
    skipLogin: string;
  };
  text: {
    or: string;
    resetEmailSent: string;
    skipLoginHint: string;
  };
};

export type AuthScreenState = {
  mode: AuthMode;
  view: AuthView;
  signInMethod: SignInMethod;
  resetSent: boolean;
  loading: boolean;
  form: FormState;
};

export type AuthScreenDerived = {
  isSignIn: boolean;
  isResetRequest: boolean;
  isResetConfirm: boolean;
  isSuccess: boolean;
  showGuestOption: boolean;
};

export type AuthScreenHandlers = {
  updateField: (field: keyof FormState, value: string) => void;
  setSignInMethod: (method: SignInMethod) => void;
  goToResetRequest: () => void;
  returnToForm: () => void;
  toggleMode: () => void;
  completeSignUpSuccess: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleResetRequest: () => Promise<void>;
  handleResetConfirm: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
  handleGuestSignIn: () => Promise<void>;
};
