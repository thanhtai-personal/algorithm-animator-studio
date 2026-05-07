"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * useOAuthMessageListener - Listens for OAuth completion messages from Supabase
 * 
 * Responsibilities:
 * - Listen for OAuth message events
 * - Handle OAuth completion errors
 * - Clean up event listeners
 */
export function useOAuthMessageListener() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; error?: string | null } | null;
      if (!payload || payload.type !== "supabase-auth-complete") return;
      if (payload.error) {
        toast.error(payload.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
}
