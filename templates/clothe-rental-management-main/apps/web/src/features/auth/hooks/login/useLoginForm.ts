"use client";

import { useCallback, useState } from "react";
import type { FormState } from "@/features/auth/types/authScreen";

/**
 * useLoginForm - Manages form state and basic field updates
 * 
 * Responsibilities:
 * - Form state management
 * - Field updates
 * - Form reset
 */
export function useLoginForm() {
  const [form, setForm] = useState<FormState>({
    email: "",
    displayName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    resetPassword: "",
    resetConfirmPassword: "",
  });

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFormField = useCallback((...fields: (keyof FormState)[]) => {
    setForm((prev) => {
      const updated = { ...prev };
      fields.forEach((field) => {
        updated[field] = "";
      });
      return updated;
    });
  }, []);

  return {
    form,
    updateField,
    resetFormField,
  };
}
