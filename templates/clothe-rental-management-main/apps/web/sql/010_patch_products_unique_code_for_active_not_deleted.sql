-- Bug 014: allow reusing product_code when previous product is inactive.
-- Keep uniqueness enforced only for active, non-deleted product records.

DROP INDEX IF EXISTS products_global_product_code_unique;
CREATE UNIQUE INDEX IF NOT EXISTS products_global_product_code_unique
  ON public.products (lower(product_code))
  WHERE branch_id IS NULL
    AND is_active = true
    AND is_delete = false;

DROP INDEX IF EXISTS products_branch_product_code_unique;
CREATE UNIQUE INDEX IF NOT EXISTS products_branch_product_code_unique
  ON public.products (branch_id, lower(product_code))
  WHERE branch_id IS NOT NULL
    AND is_active = true
    AND is_delete = false;
