import { authStore } from "@/store/authStore";

export function useAnonymousMode() {
  return { isAnonymous: Boolean(authStore.anonId) && !authStore.userId };
}
