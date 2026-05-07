import type { Dispatch, SetStateAction } from "react";
import type { useAppModal } from "@/components/feedback/AppModalProvider";
import type { useProductsListPage } from "@/features/products/hooks/useProductsListPage";

export type ProductsListPageState = ReturnType<typeof useProductsListPage>;
export type ProductsListItem = ProductsListPageState["listItems"][number];
export type ProductSelectionState = Dispatch<SetStateAction<Set<string>>>;
export type AppModalConfirm = ReturnType<typeof useAppModal>["confirm"];
