import { categoryStore } from "@/store/categoryStore";
import { FALLBACK_CATEGORY_ID } from "../categories/constants";
import { CategoryStat } from "../stats/types";
import { Transaction } from "../transactions/types";

export function buildCategoryStats({
  categories,
  categoryMap,
  transactions,
  totalExpense,
  fallbackName,
}: {
  categories: typeof categoryStore.categories;
  categoryMap: typeof categoryStore.categoryMap;
  transactions: Transaction[];
  totalExpense: number;
  fallbackName: string;
}): CategoryStat[] {
  const totalsByCategory = new Map<string, number>();
  let uncategorizedTotal = 0;

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    if (categoryMap[transaction.categoryId]) {
      totalsByCategory.set(
        transaction.categoryId,
        (totalsByCategory.get(transaction.categoryId) ?? 0) + transaction.amount
      );
    } else {
      uncategorizedTotal += transaction.amount;
    }
  });

  if (uncategorizedTotal > 0) {
    totalsByCategory.set(
      FALLBACK_CATEGORY_ID,
      (totalsByCategory.get(FALLBACK_CATEGORY_ID) ?? 0) + uncategorizedTotal
    );
  }

  const stats: CategoryStat[] = categories.map((category) => {
    const amount = totalsByCategory.get(category.id) ?? 0;
    return {
      categoryId: category.id,
      categoryName: category.name,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      color: category.color ?? "category-other",
    };
  });

  if (uncategorizedTotal > 0 && !categoryMap[FALLBACK_CATEGORY_ID]) {
    const amount = totalsByCategory.get(FALLBACK_CATEGORY_ID) ?? uncategorizedTotal;
    stats.push({
      categoryId: FALLBACK_CATEGORY_ID,
      categoryName: fallbackName,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      color: "category-other",
    });
  }

  return stats.sort((a, b) => b.amount - a.amount);
}