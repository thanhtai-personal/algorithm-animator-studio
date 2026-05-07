"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/className";
import { ProductCard, type ProductCardProps } from "@/components/products/ProductCard";

interface ProductGridProps {
  items: ProductCardProps[];
  emptyState?: ReactNode;
  className?: string;
}

export function ProductGrid({ items, emptyState, className }: ProductGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyState ?? "No products"}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((item) => (
        <ProductCard key={item.id} {...item} />
      ))}
    </div>
  );
}
