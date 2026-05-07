import type { SupabaseClient } from '@supabase/supabase-js';
import { CustomersDomainError } from '../types/customers-data-access.type';
import type {
  CreateCustomerPayload,
  CustomerDetailDto,
  CustomerOrderHistoryRowDto,
  CustomersListResponse,
  CustomersTypeaheadResponse,
  UpdateCustomerPayload,
} from '../types/customers-crm.type';
import {
  buildCustomerTagsMap,
  buildIncidentsSummary,
  buildOrderStatsByCustomerId,
  buildPhonePersistence,
  mapCustomerSummary,
  normalizeOrderStatus,
  parseNumeric,
  sanitizeSearchTerm,
  sanitizeText,
  scoreTypeaheadRow,
  uniqueStringValues,
} from '../utils/customers-data-access.utils';
import {
  createCustomerAccount,
  ensureUniquePhonePerBranch,
  fetchCustomerById,
  fetchCustomerIdsByTagId,
  fetchCustomerTagAssignments,
  fetchCustomerTags,
  fetchCustomersPage,
  fetchIncidentsByCustomerIds,
  fetchOrdersByCustomerIds,
  fetchTagsByIds,
  replaceCustomerTagAssignments,
} from './customers-data-access.queries';

export { CustomersDomainError };

export async function listCustomersForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    search: string | null;
    tagId: string | null;
    page: number;
    pageSize: number;
  },
): Promise<CustomersListResponse> {
  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize));
  const search = sanitizeSearchTerm(options.search);
  const customerIdsByTag = options.tagId
    ? await fetchCustomerIdsByTagId(supabase, options.tagId)
    : null;

  const [availableTags, customersPage] = await Promise.all([
    fetchCustomerTags(supabase, options.branchId),
    fetchCustomersPage(supabase, {
      branchId: options.branchId,
      search,
      customerIds: customerIdsByTag,
      page,
      pageSize,
    }),
  ]);

  const pagedCustomers = customersPage.items;
  const pagedIds = pagedCustomers.map((entry) => entry.id);

  const [assignments, orders] = await Promise.all([
    fetchCustomerTagAssignments(supabase, pagedIds),
    fetchOrdersByCustomerIds(supabase, pagedIds),
  ]);

  const tagIds = uniqueStringValues(assignments.map((entry) => entry.tag_id));
  const tags = await fetchTagsByIds(supabase, tagIds);

  const tagById = new Map(tags.map((entry) => [entry.id, entry]));
  const tagsByCustomerId = buildCustomerTagsMap(assignments, tagById);
  const orderStatsByCustomerId = buildOrderStatsByCustomerId(orders);

  return {
    items: pagedCustomers.map((row) =>
      mapCustomerSummary({
        row,
        tags: tagsByCustomerId.get(row.id) ?? [],
        stats: orderStatsByCustomerId.get(row.id) ?? null,
      }),
    ),
    total: customersPage.total,
    page,
    pageSize,
    tags: availableTags,
  };
}

export async function getCustomerDetailForAdmin(
  supabase: SupabaseClient,
  customerId: string,
): Promise<CustomerDetailDto | null> {
  const customer = await fetchCustomerById(supabase, customerId);
  if (!customer) return null;

  const [availableTags, assignments, orders, incidents] = await Promise.all([
    fetchCustomerTags(supabase, customer.branch_id),
    fetchCustomerTagAssignments(supabase, [customer.id]),
    fetchOrdersByCustomerIds(supabase, [customer.id]),
    fetchIncidentsByCustomerIds(supabase, [customer.id]),
  ]);

  const tagIds = uniqueStringValues(assignments.map((entry) => entry.tag_id));
  const tags = await fetchTagsByIds(supabase, tagIds);
  const tagsByCustomerId = buildCustomerTagsMap(
    assignments,
    new Map(tags.map((entry) => [entry.id, entry])),
  );

  const orderStatsByCustomerId = buildOrderStatsByCustomerId(orders);
  const customerSummary = mapCustomerSummary({
    row: customer,
    tags: tagsByCustomerId.get(customer.id) ?? [],
    stats: orderStatsByCustomerId.get(customer.id) ?? null,
  });

  const ordersHistory: CustomerOrderHistoryRowDto[] = orders.map((order) => ({
    orderId: order.id,
    orderCode: order.order_code,
    status: normalizeOrderStatus(order.status),
    startDate: order.start_date,
    endDate: order.end_date,
    totalAmount: parseNumeric(order.total_amount),
    depositAmount: parseNumeric(order.deposit_amount),
    createdAt: order.created_at,
  }));

  return {
    customer: customerSummary,
    availableTags,
    ordersHistory,
    incidentsSummary: buildIncidentsSummary(incidents),
  };
}

export async function createCustomerForAdmin(
  supabase: SupabaseClient,
  profileId: string,
  payload: CreateCustomerPayload,
  serviceRoleClient: SupabaseClient,
): Promise<CustomerDetailDto> {
  const branchId = sanitizeText(payload.branchId);
  if (!branchId) {
    throw new CustomersDomainError('BRANCH_REQUIRED');
  }

  const fullName = sanitizeText(payload.fullName);
  if (!fullName) {
    throw new CustomersDomainError('CUSTOMER_NAME_REQUIRED');
  }

  const phoneRaw = sanitizeText(payload.phone);
  if (!phoneRaw) {
    throw new CustomersDomainError('PHONE_REQUIRED');
  }

  const phone = buildPhonePersistence(phoneRaw);

  await ensureUniquePhonePerBranch(supabase, {
    branchId,
    phoneNormalized: phone.phoneNormalized,
  });

  const account = await createCustomerAccount({
    serviceRoleClient,
    branchId,
    fullName,
    phone: phone.phone,
    phoneNormalized: phone.phoneNormalized,
  });

  const { data, error } = await supabase
    .from('customers')
    .insert({
      branch_id: branchId,
      profile_id: account.profileId,
      full_name: fullName,
      phone: phone.phone,
      phone_normalized: phone.phoneNormalized,
      social_link: sanitizeText(payload.socialLink),
      address: sanitizeText(payload.address),
      note: sanitizeText(payload.note),
      is_active: payload.isActive ?? true,
      is_delete: false,
      created_by: profileId,
      updated_by: profileId,
    })
    .select('id')
    .maybeSingle<{ id: string }>();

  if (error) {
    try {
      await serviceRoleClient.auth.admin.deleteUser(account.profileId);
    } catch {
      // best effort cleanup
    }
    throw error;
  }

  const createdCustomerId = data?.id;
  if (!createdCustomerId) {
    throw new Error('CUSTOMER_CREATE_FAILED');
  }

  await replaceCustomerTagAssignments(supabase, {
    customerId: createdCustomerId,
    branchId,
    profileId,
    requestedTagIds: payload.tagIds ?? [],
  });

  const detail = await getCustomerDetailForAdmin(supabase, createdCustomerId);
  if (!detail) {
    throw new Error('CUSTOMER_CREATE_FAILED');
  }

  return detail;
}

export async function updateCustomerForAdmin(
  supabase: SupabaseClient,
  profileId: string,
  customerId: string,
  payload: UpdateCustomerPayload,
): Promise<CustomerDetailDto | null> {
  const existing = await fetchCustomerById(supabase, customerId);
  if (!existing) return null;

  const patch: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'fullName')) {
    const fullName = sanitizeText(payload.fullName);
    if (!fullName) {
      throw new CustomersDomainError('CUSTOMER_NAME_REQUIRED');
    }
    patch.full_name = fullName;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'phone')) {
    const phoneRaw = sanitizeText(payload.phone);
    if (!phoneRaw) {
      throw new CustomersDomainError('PHONE_REQUIRED');
    }

    const phone = buildPhonePersistence(phoneRaw);
    await ensureUniquePhonePerBranch(supabase, {
      branchId: existing.branch_id,
      phoneNormalized: phone.phoneNormalized,
      excludeCustomerId: existing.id,
    });

    patch.phone = phone.phone;
    patch.phone_normalized = phone.phoneNormalized;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'socialLink')) {
    patch.social_link = sanitizeText(payload.socialLink);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'address')) {
    patch.address = sanitizeText(payload.address);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'note')) {
    patch.note = sanitizeText(payload.note);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    patch.is_active = payload.isActive;
  }

  if (Object.keys(patch).length > 0) {
    patch.updated_by = profileId;
    const { error } = await supabase
      .from('customers')
      .update(patch)
      .eq('id', existing.id)
      .eq('is_delete', false);

    if (error) throw error;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'tagIds')) {
    await replaceCustomerTagAssignments(supabase, {
      customerId: existing.id,
      branchId: existing.branch_id,
      profileId,
      requestedTagIds: payload.tagIds ?? [],
    });
  }

  return getCustomerDetailForAdmin(supabase, existing.id);
}

export async function searchCustomersTypeaheadForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    search: string;
    limit: number;
  },
): Promise<CustomersTypeaheadResponse> {
  const search = sanitizeSearchTerm(options.search);
  if (!search) return { items: [] };

  let query = supabase
    .from('customers')
    .select(
      'id, branch_id, profile_id, customer_code, full_name, phone, phone_normalized, social_link, address, note, is_active, updated_at',
    )
    .eq('is_delete', false)
    .eq('is_active', true)
    .or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,phone_normalized.ilike.%${search}%`,
    )
    .order('updated_at', { ascending: false })
    .limit(Math.min(50, Math.max(options.limit * 3, options.limit)));

  if (options.branchId) {
    query = query.eq('branch_id', options.branchId);
  }

  const { data, error } = await query.returns<
    Array<{
      id: string;
      branch_id: string;
      profile_id: string | null;
      customer_code: string | null;
      full_name: string;
      phone: string | null;
      phone_normalized: string | null;
      social_link: string | null;
      address: string | null;
      note: string | null;
      is_active: boolean;
      updated_at: string;
    }>
  >();
  if (error) throw error;

  const rankedRows = (data ?? [])
    .map((row) => ({ row, score: scoreTypeaheadRow(row, search) }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.row.updated_at.localeCompare(a.row.updated_at);
    })
    .slice(0, options.limit)
    .map((entry) => entry.row);

  const assignments = await fetchCustomerTagAssignments(
    supabase,
    rankedRows.map((entry) => entry.id),
  );

  const tags = await fetchTagsByIds(
    supabase,
    uniqueStringValues(assignments.map((entry) => entry.tag_id)),
  );

  const tagsByCustomerId = buildCustomerTagsMap(
    assignments,
    new Map(tags.map((entry) => [entry.id, entry])),
  );

  return {
    items: rankedRows.map((row) => {
      const rowTags = tagsByCustomerId.get(row.id) ?? [];
      const normalizedTagCodes = new Set(
        rowTags.map((tag) => tag.code.toLowerCase()),
      );

      return {
        id: row.id,
        branchId: row.branch_id,
        fullName: row.full_name,
        phone: row.phone,
        phoneNormalized: row.phone_normalized,
        isActive: row.is_active,
        tags: rowTags,
        warnOnOrderCreate: rowTags.some((tag) => tag.warnOnOrderCreate),
        blockOrderCreate: rowTags.some((tag) => tag.blockOrderCreate),
        isVip: normalizedTagCodes.has('vip'),
        isBlacklist: normalizedTagCodes.has('blacklist'),
      };
    }),
  };
}
