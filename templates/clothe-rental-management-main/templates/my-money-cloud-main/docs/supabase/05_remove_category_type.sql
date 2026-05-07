-- Migration: 05_remove_category_type.sql
-- Purpose: Remove type column from categories table
-- Categories will no longer be restricted to income or expense types
-- A single category can contain both income and expense transactions

-- Step 1: Remove the type column from categories table
ALTER TABLE public.categories DROP COLUMN IF EXISTS type;

-- Step 2: Allow NULL user_id for default categories
ALTER TABLE public.categories ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Insert default categories (shared across all users)
-- INSERT INTO public.categories (id, user_id, name, icon, color, created_at)
-- VALUES
--   -- Expense categories
--   ('330d5fff-a87e-45d6-8e57-8a6019b1d454', NULL, 'Food', 'UtensilsCrossed', 'category-food', now()),
--   ('e0b5f9fd-a681-49b7-a782-2347cc902673', NULL, 'Transport', 'Car', 'category-transport', now()),
--   ('2b5f555c-b02e-4a01-866d-434b04264517', NULL, 'Shopping', 'ShoppingBag', 'category-shopping', now()),
--   ('bb70d0bb-99b9-494e-a437-1fc0be383de6', NULL, 'Entertainment', 'Gamepad2', 'category-entertainment', now()),
--   ('07db0546-9a89-4e9c-8fac-30aad3bf0434', NULL, 'Health', 'Heart', 'category-health', now()),
--   ('75df7198-880d-4061-a7a0-c3f902c3349b', NULL, 'Bills', 'Receipt', 'category-bills', now()),
--   ('7fb80c47-faa7-4c07-a09e-0ebbab1d4d59', NULL, 'Education', 'GraduationCap', 'category-education', now()),
--   ('8d435365-dc18-41d2-91fc-b0ceb6f9d750', NULL, 'Other', 'MoreHorizontal', 'category-other', now()),
--   -- Income categories
--   ('6a7f776c-d07a-46ab-90e0-bddfeb669e0c', NULL, 'Salary', 'Wallet', 'category-health', now()),
--   ('2251b9fd-2159-4331-93bf-b87aa33b3a28', NULL, 'Bonus', 'Gift', 'category-entertainment', now()),
--   ('acbfc993-0feb-4d00-9e82-80a2d03a741a', NULL, 'Investment', 'TrendingUp', 'category-education', now()),
-- ON CONFLICT (id) DO UPDATE SET
--   name = EXCLUDED.name,
--   icon = EXCLUDED.icon,
--   color = EXCLUDED.color;

-- Step 4: Update RLS policies to allow reading default categories
DROP POLICY IF EXISTS "Users can view their categories" ON public.categories;
CREATE POLICY "Users can view their categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can only insert their own categories (not default ones)
DROP POLICY IF EXISTS "Users can insert their categories" ON public.categories;
CREATE POLICY "Users can insert their categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Users can only update their own categories (not default ones)
DROP POLICY IF EXISTS "Users can update their categories" ON public.categories;
CREATE POLICY "Users can update their categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Users can only delete their own categories (not default ones)
DROP POLICY IF EXISTS "Users can delete their categories" ON public.categories;
CREATE POLICY "Users can delete their categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Step 5: Update the sync_guest_data function to remove type handling
CREATE OR REPLACE FUNCTION public.sync_guest_data(user_uuid uuid, payload jsonb)
RETURNS TABLE(result jsonb) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cats jsonb;
  trans jsonb;
BEGIN
  IF payload IS NULL THEN
    RAISE EXCEPTION 'payload is null';
  END IF;
  cats := COALESCE(payload->'categories', '[]'::jsonb);
  trans := COALESCE(payload->'transactions', '[]'::jsonb);

  PERFORM pg_advisory_xact_lock(42); -- simple advisory lock to avoid concurrent RPC conflicts

  -- Upsert categories (without type column, only user categories)
  IF jsonb_array_length(cats) > 0 THEN
    INSERT INTO public.categories (id, user_id, name, icon, color, created_at)
    SELECT
      (elem->>'id')::uuid,
      user_uuid,
      elem->>'name',
      (elem->>'icon')::text,
      (elem->>'color')::text,
      (CASE WHEN (elem->>'createdAt') IS NOT NULL THEN (elem->>'createdAt')::timestamptz ELSE now() END)
    FROM jsonb_array_elements(cats) AS elems(elem)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color
    ;
  END IF;

  -- Upsert transactions (unchanged)
  IF jsonb_array_length(trans) > 0 THEN
    INSERT INTO public.transactions (id, user_id, amount, description, category_id, type, date, created_at)
    SELECT
      (elem->>'id')::uuid,
      user_uuid,
      (elem->>'amount')::numeric,
      NULLIF(elem->>'description',''),
      (elem->>'categoryId')::uuid,
      (elem->>'type')::text,
      (CASE WHEN (elem->>'date') IS NOT NULL THEN (elem->>'date')::timestamptz ELSE now() END),
      (CASE WHEN (elem->>'createdAt') IS NOT NULL THEN (elem->>'createdAt')::timestamptz ELSE now() END)
    FROM jsonb_array_elements(trans) AS elems(elem)
    ON CONFLICT (id) DO UPDATE SET
      amount = EXCLUDED.amount,
      description = EXCLUDED.description,
      category_id = EXCLUDED.category_id,
      type = EXCLUDED.type,
      date = EXCLUDED.date
    ;
  END IF;

  RETURN QUERY SELECT jsonb_build_object('success', true, 'categories', jsonb_array_length(cats), 'transactions', jsonb_array_length(trans));
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.sync_guest_data(uuid, jsonb) TO authenticated;

-- End of migration
