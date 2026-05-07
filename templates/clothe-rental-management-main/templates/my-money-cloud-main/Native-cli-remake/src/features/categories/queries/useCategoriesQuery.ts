
import { useQuery } from "@tanstack/react-query";
import { categoryQueryKeys } from "@/features/categories/queries/keys";
import { categoryService } from "@/features/categories/services/categoryService";
import { categoryStore } from "@/store/categoryStore";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: async () => {
      const data = await categoryService.list();
      categoryStore.write(data);
      return data;
    },
  });
}
