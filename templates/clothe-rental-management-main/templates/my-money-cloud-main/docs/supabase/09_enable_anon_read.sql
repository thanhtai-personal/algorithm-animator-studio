DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'anon_read_categories'
  ) THEN
    EXECUTE 'create policy anon_read_categories on public.categories
      for select using (auth.role() = ''anon'')';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'anon_read_transactions'
  ) THEN
    EXECUTE 'create policy anon_read_transactions on public.transactions
      for select using (auth.role() = ''anon'')';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_settings' AND policyname = 'anon_read_user_settings'
  ) THEN
    EXECUTE 'create policy anon_read_user_settings on public.user_settings
      for select using (auth.role() = ''anon'')';
  END IF;
END $$;
