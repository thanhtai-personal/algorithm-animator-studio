"use client";

import { toast as sonnerToast } from "sonner";

// Minimal wrapper to keep existing import paths working while using Sonner underneath.
export function useToast() {
  return { toast: sonnerToast };
}

export const toast = sonnerToast;
