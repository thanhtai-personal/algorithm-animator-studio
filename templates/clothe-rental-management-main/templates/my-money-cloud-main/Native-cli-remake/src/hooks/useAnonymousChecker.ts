import { authStore } from "@/store/authStore";

export function useAnonymousChecker() {
  return { isAnonymous: authStore.anonId != null };
}
