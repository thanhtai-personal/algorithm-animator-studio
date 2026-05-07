-- Allow duplicated product_code values for both branch and global products.
-- This removes DB-level uniqueness so import/create can insert duplicate codes
-- even when previous records are active or soft-deleted.

DROP INDEX IF EXISTS products_global_product_code_unique;
DROP INDEX IF EXISTS products_branch_product_code_unique;

-- Keep lookup performance for product_code searches without enforcing uniqueness.
CREATE INDEX IF NOT EXISTS products_global_product_code_lookup_idx
  ON public.products (lower(product_code))
  WHERE branch_id IS NULL
    AND is_delete = false;

CREATE INDEX IF NOT EXISTS products_branch_product_code_lookup_idx
  ON public.products (branch_id, lower(product_code))
  WHERE branch_id IS NOT NULL
    AND is_delete = false;
