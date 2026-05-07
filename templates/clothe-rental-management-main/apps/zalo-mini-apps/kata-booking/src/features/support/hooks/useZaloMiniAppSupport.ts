import { useState } from "react";
import { zaloMiniAppSupportService } from "@/features/support/services/zaloMiniAppSupportService";

export function useZaloMiniAppSupport() {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openOA = async () => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      await zaloMiniAppSupportService.openSupportWidget();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Khong mo duoc OA";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  };

  return {
    openOA,
    isPending,
    errorMessage,
  };
}
