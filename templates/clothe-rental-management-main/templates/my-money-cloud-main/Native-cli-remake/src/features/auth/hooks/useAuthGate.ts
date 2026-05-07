import { useAuthRouting } from "@/features/auth/hooks/routing/useAuthRouting";

export function useAuthGate() {
  return useAuthRouting();
}
