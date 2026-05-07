"use client";

import { useMutation } from "@tanstack/react-query";
import { authBrowserService } from "@/features/auth/services/authBrowserService";

export function useAuthMutations() {
  const getCurrentSessionMutation = useMutation({
    mutationFn: authBrowserService.getCurrentSession,
  });

  const getCurrentAuthContextMutation = useMutation({
    mutationFn: authBrowserService.getCurrentAuthContext,
  });

  const signInMutation = useMutation({
    mutationFn: authBrowserService.signInWithPassword,
  });

  const signUpMutation = useMutation({
    mutationFn: authBrowserService.signUpWithPassword,
  });

  const signInWithGoogleMutation = useMutation({
    mutationFn: authBrowserService.signInWithGoogle,
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: authBrowserService.requestPasswordReset,
  });

  const confirmPasswordResetMutation = useMutation({
    mutationFn: authBrowserService.confirmPasswordReset,
  });

  const signOutMutation = useMutation({
    mutationFn: authBrowserService.signOut,
  });

  const exchangeCodeForSessionMutation = useMutation({
    mutationFn: authBrowserService.exchangeCodeForSession,
  });

  const setSessionFromTokensMutation = useMutation({
    mutationFn: authBrowserService.setSessionFromTokens,
  });

  return {
    getCurrentSessionMutation,
    getCurrentAuthContextMutation,
    signInMutation,
    signUpMutation,
    signInWithGoogleMutation,
    requestPasswordResetMutation,
    confirmPasswordResetMutation,
    signOutMutation,
    exchangeCodeForSessionMutation,
    setSessionFromTokensMutation,
  };
}
