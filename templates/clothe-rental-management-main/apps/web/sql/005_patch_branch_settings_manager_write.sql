-- Allow manager to write branch-level policy settings for accessible branches.
-- Keep delete restricted to owner_admin.

drop policy if exists branch_settings_insert on public.branch_settings;
create policy branch_settings_insert
  on public.branch_settings for insert
  with check (
    (public.is_owner_admin() or public.current_profile_role() = 'manager')
    and public.can_access_branch(branch_id)
  );

drop policy if exists branch_settings_update on public.branch_settings;
create policy branch_settings_update
  on public.branch_settings for update
  using (
    (public.is_owner_admin() or public.current_profile_role() = 'manager')
    and public.can_access_branch(branch_id)
  )
  with check (
    (public.is_owner_admin() or public.current_profile_role() = 'manager')
    and public.can_access_branch(branch_id)
  );

