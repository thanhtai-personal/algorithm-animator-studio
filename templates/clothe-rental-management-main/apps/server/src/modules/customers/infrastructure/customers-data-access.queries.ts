import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CustomerOrderRow,
  CustomerRow,
  CustomerTagAssignmentRow,
  CustomerTagRow,
  IncidentRow,
} from '../types/customers-data-access.type';
import { CustomersDomainError } from '../types/customers-data-access.type';
import type { CustomerTagDto } from '../types/customers-crm.type';
import {
  buildCustomerAccountEmail,
  buildTemporaryPassword,
  mapCustomerTagRow,
  uniqueStringValues,
} from '../utils/customers-data-access.utils';

export async function ensureUniquePhonePerBranch(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    phoneNormalized: string;
    excludeCustomerId?: string;
  },
): Promise<void> {
  let query = supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .eq('phone_normalized', options.phoneNormalized)
    .limit(1);

  if (options.excludeCustomerId) {
    query = query.neq('id', options.excludeCustomerId);
  }

  const { data, error } = await query.maybeSingle<{
    id: string;
    full_name: string;
    phone: string | null;
  }>();

  if (error) throw error;
  if (data) {
    throw new CustomersDomainError('DUPLICATE_PHONE', {
      existingCustomerId: data.id,
      existingCustomerName: data.full_name,
      existingCustomerPhone: data.phone,
    });
  }
}

export async function createCustomerAccount(options: {
  serviceRoleClient: SupabaseClient;
  branchId: string;
  fullName: string;
  phone: string;
  phoneNormalized: string;
}): Promise<{ profileId: string }> {
  const accountEmail = buildCustomerAccountEmail({
    branchId: options.branchId,
    phoneNormalized: options.phoneNormalized,
  });
  const accountPassword = buildTemporaryPassword();

  const { data: authUserData, error: authCreateError } =
    await options.serviceRoleClient.auth.admin.createUser({
      email: accountEmail,
      password: accountPassword,
      email_confirm: true,
      app_metadata: { role: 'customer' },
      user_metadata: {
        full_name: options.fullName,
        phone: options.phone,
        locale: 'vi',
        source: 'customers_crm_create',
      },
    });

  if (authCreateError || !authUserData.user?.id) {
    throw new CustomersDomainError('CUSTOMER_ACCOUNT_CREATE_FAILED', {
      accountError: authCreateError?.message ?? 'missing-auth-user-id',
    });
  }

  const customerProfileId = authUserData.user.id;

  try {
    const { error: profileUpsertError } = await options.serviceRoleClient
      .from('profiles')
      .upsert(
        {
          id: customerProfileId,
          full_name: options.fullName,
          email: accountEmail,
          phone: options.phone,
          role: 'customer',
          default_branch_id: options.branchId,
          locale: 'vi',
          is_active: true,
          disabled_at: null,
          disabled_by: null,
        },
        { onConflict: 'id' },
      );

    if (profileUpsertError) throw profileUpsertError;

    const { data: existingBranchAccessRows, error: existingBranchAccessError } =
      await options.serviceRoleClient
        .from('profile_branch_access')
        .select('id')
        .eq('profile_id', customerProfileId)
        .eq('branch_id', options.branchId)
        .order('is_delete', { ascending: true })
        .limit(1)
        .returns<Array<{ id: string }>>();

    if (existingBranchAccessError) throw existingBranchAccessError;

    const existingBranchAccessId = existingBranchAccessRows?.[0]?.id ?? null;

    if (existingBranchAccessId) {
      const { error: branchAccessUpdateError } = await options.serviceRoleClient
        .from('profile_branch_access')
        .update({
          is_default: true,
          is_delete: false,
        })
        .eq('id', existingBranchAccessId);

      if (branchAccessUpdateError) throw branchAccessUpdateError;
    } else {
      const { error: branchAccessInsertError } = await options.serviceRoleClient
        .from('profile_branch_access')
        .insert({
          profile_id: customerProfileId,
          branch_id: options.branchId,
          is_default: true,
          is_delete: false,
        });

      if (branchAccessInsertError) throw branchAccessInsertError;
    }

    return { profileId: customerProfileId };
  } catch (error) {
    try {
      await options.serviceRoleClient.auth.admin.deleteUser(customerProfileId);
    } catch {
      // best effort cleanup
    }
    const reason =
      error instanceof Error ? error.message : 'profile-sync-failed';
    throw new CustomersDomainError('CUSTOMER_ACCOUNT_CREATE_FAILED', {
      accountError: reason,
    });
  }
}

export async function fetchCustomerIdsByTagId(
  supabase: SupabaseClient,
  tagId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('customer_tag_assignments')
    .select('customer_id')
    .eq('tag_id', tagId)
    .eq('is_delete', false)
    .returns<Array<{ customer_id: string }>>();

  if (error) throw error;
  return uniqueStringValues((data ?? []).map((entry) => entry.customer_id));
}

export async function fetchCustomersPage(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    search: string | null;
    customerIds?: string[] | null;
    page: number;
    pageSize: number;
  },
): Promise<{ items: CustomerRow[]; total: number }> {
  if (options.customerIds && options.customerIds.length === 0) {
    return { items: [], total: 0 };
  }

  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('customers')
    .select(
      'id, branch_id, profile_id, customer_code, full_name, phone, phone_normalized, social_link, address, note, is_active, updated_at',
      { count: 'exact' },
    )
    .eq('is_delete', false)
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (options.branchId) {
    query = query.eq('branch_id', options.branchId);
  }
  if (options.search) {
    query = query.or(
      `full_name.ilike.%${options.search}%,phone.ilike.%${options.search}%,phone_normalized.ilike.%${options.search}%`,
    );
  }
  if (options.customerIds && options.customerIds.length > 0) {
    query = query.in('id', options.customerIds);
  }

  const { data, error, count } = await query.returns<CustomerRow[]>();
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}

export async function fetchCustomerById(
  supabase: SupabaseClient,
  customerId: string,
): Promise<CustomerRow | null> {
  const { data, error } = await supabase
    .from('customers')
    .select(
      'id, branch_id, profile_id, customer_code, full_name, phone, phone_normalized, social_link, address, note, is_active, updated_at',
    )
    .eq('id', customerId)
    .eq('is_delete', false)
    .maybeSingle<CustomerRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchCustomerTags(
  supabase: SupabaseClient,
  branchId: string | null,
): Promise<CustomerTagDto[]> {
  let query = supabase
    .from('customer_tags')
    .select(
      'id, branch_id, code, name, color, is_system, warn_on_order_create, block_order_create, is_active',
    )
    .eq('is_delete', false)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query.returns<CustomerTagRow[]>();
  if (error) throw error;
  return (data ?? []).map(mapCustomerTagRow);
}

export async function fetchTagsByIds(
  supabase: SupabaseClient,
  tagIds: string[],
): Promise<CustomerTagDto[]> {
  if (tagIds.length === 0) return [];

  const { data, error } = await supabase
    .from('customer_tags')
    .select(
      'id, branch_id, code, name, color, is_system, warn_on_order_create, block_order_create, is_active',
    )
    .eq('is_delete', false)
    .in('id', tagIds)
    .returns<CustomerTagRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapCustomerTagRow);
}

export async function fetchCustomerTagAssignments(
  supabase: SupabaseClient,
  customerIds: string[],
): Promise<CustomerTagAssignmentRow[]> {
  if (customerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('customer_tag_assignments')
    .select('customer_id, tag_id')
    .in('customer_id', customerIds)
    .eq('is_delete', false)
    .returns<CustomerTagAssignmentRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchOrdersByCustomerIds(
  supabase: SupabaseClient,
  customerIds: string[],
): Promise<CustomerOrderRow[]> {
  if (customerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('rental_orders')
    .select(
      'id, customer_id, order_code, status, start_date, end_date, total_amount, deposit_amount, created_at',
    )
    .in('customer_id', customerIds)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<CustomerOrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchIncidentsByCustomerIds(
  supabase: SupabaseClient,
  customerIds: string[],
): Promise<IncidentRow[]> {
  if (customerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('incidents')
    .select('customer_id, type, status, amount')
    .in('customer_id', customerIds)
    .eq('is_delete', false)
    .returns<IncidentRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function replaceCustomerTagAssignments(
  supabase: SupabaseClient,
  options: {
    customerId: string;
    branchId: string;
    profileId: string;
    requestedTagIds: string[];
  },
): Promise<void> {
  const uniqueRequestedTagIds = uniqueStringValues(options.requestedTagIds);

  let validTagIds: string[] = [];
  if (uniqueRequestedTagIds.length > 0) {
    const { data: validRows, error: validRowsError } = await supabase
      .from('customer_tags')
      .select('id')
      .eq('branch_id', options.branchId)
      .eq('is_delete', false)
      .eq('is_active', true)
      .in('id', uniqueRequestedTagIds)
      .returns<Array<{ id: string }>>();

    if (validRowsError) throw validRowsError;
    validTagIds = (validRows ?? []).map((entry) => entry.id);
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('customer_tag_assignments')
    .select('tag_id, is_delete')
    .eq('customer_id', options.customerId)
    .returns<Array<{ tag_id: string; is_delete: boolean }>>();

  if (existingError) throw existingError;

  const existingActiveIds = new Set(
    (existingRows ?? [])
      .filter((entry) => !entry.is_delete)
      .map((entry) => entry.tag_id),
  );
  const existingDeletedIds = new Set(
    (existingRows ?? [])
      .filter((entry) => entry.is_delete)
      .map((entry) => entry.tag_id),
  );
  const existingAllIds = new Set(
    (existingRows ?? []).map((entry) => entry.tag_id),
  );
  const nextIds = new Set(validTagIds);
  const toDelete = Array.from(existingActiveIds).filter(
    (id) => !nextIds.has(id),
  );
  const toReactivate = Array.from(nextIds).filter((id) =>
    existingDeletedIds.has(id),
  );
  const toInsert = Array.from(nextIds).filter((id) => !existingAllIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('customer_tag_assignments')
      .update({
        is_delete: true,
      })
      .eq('customer_id', options.customerId)
      .eq('is_delete', false)
      .in('tag_id', toDelete);
    if (deleteError) throw deleteError;
  }

  if (toReactivate.length > 0) {
    const { error: reactivateError } = await supabase
      .from('customer_tag_assignments')
      .update({
        is_delete: false,
        created_by: options.profileId,
      })
      .eq('customer_id', options.customerId)
      .eq('is_delete', true)
      .in('tag_id', toReactivate);
    if (reactivateError) throw reactivateError;
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('customer_tag_assignments')
      .insert(
        toInsert.map((tagId) => ({
          customer_id: options.customerId,
          tag_id: tagId,
          created_by: options.profileId,
          is_delete: false,
        })),
      );
    if (insertError) throw insertError;
  }
}
