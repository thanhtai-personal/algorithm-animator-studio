-- Add icon column to categories and backfill with icon keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.categories
      ADD COLUMN icon text DEFAULT 'MoreHorizontal';
  END IF;
END$$;

-- Backfill missing/empty icons using type-based defaults
UPDATE public.categories
SET icon = CASE
  WHEN type = 'income' THEN 'Wallet'
  ELSE 'MoreHorizontal'
END
WHERE (icon IS NULL OR icon = '');

-- Enforce default and not-null (remove SET NOT NULL if you prefer nullable)
ALTER TABLE public.categories ALTER COLUMN icon SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN icon SET DEFAULT 'MoreHorizontal';

-- (Optional) icon reference table. Uncomment if you want to track allowed icons.
-- CREATE TABLE IF NOT EXISTS public.category_icons (
--   icon_key text PRIMARY KEY,
--   label text
-- );
-- INSERT INTO public.category_icons(icon_key, label) VALUES
--   ('MoreHorizontal','Other'),
--   ('Wallet','Wallet'),
--   ('UtensilsCrossed','Food'),
--   ('Car','Transport'),
--   ('ShoppingBag','Shopping'),
--   ('Gamepad2','Entertainment'),
--   ('Heart','Health'),
--   ('Receipt','Bills'),
--   ('GraduationCap','Education'),
--   ('Gift','Bonus'),
--   ('TrendingUp','Investment'),
--   ('Plus','OtherIncome'),
--   ('Plane','Travel'),
--   ('Home','Home'),
--   ('PiggyBank','Savings'),
--   ('Coffee','Coffee'),
--   ('Briefcase','Work'),
--   ('Sparkles','Sparkles'),
--   ('Music4','Music'),
--   ('Activity','Activity'),
--   ('Coins','Coins')
-- ON CONFLICT (icon_key) DO NOTHING;
