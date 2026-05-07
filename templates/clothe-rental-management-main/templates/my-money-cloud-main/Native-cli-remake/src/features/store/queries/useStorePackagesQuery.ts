import { useQuery } from "@tanstack/react-query";
import { fetchAdPackages, fetchAiPackages } from "../services/storeService";
import { storePageStore } from "../stores/storePageStore";

export function useStorePackagesQuery() {
  // Ad Packages
  useQuery({
    queryKey: ["adPackages"],
    queryFn: async () => {
      const adPackages = (await fetchAdPackages()) ?? [];
      storePageStore.setAdPackages(adPackages);
      return adPackages;
    },
    initialData: [],
  });

  // AI Packages
  useQuery({
    queryKey: ["aiPackages"],
    queryFn: async () => {
      const aiPackages = (await fetchAiPackages()) ?? [];
      storePageStore.setAiPackages(aiPackages);
      return aiPackages;
    },
    initialData: [],
  });
}
