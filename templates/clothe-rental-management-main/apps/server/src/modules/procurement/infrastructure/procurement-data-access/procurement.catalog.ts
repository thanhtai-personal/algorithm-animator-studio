import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementCategoriesQuery,
  ProcurementCategoriesResponse,
  ProcurementProductsQuery,
  ProcurementProductsResponse,
} from '../../types/procurement-module.type';
import {
  buildPostgrestInFilter,
  mapCategoryRowToOption,
  normalizePage,
  normalizePageSize,
  parseNumeric,
  roundMoney,
  sanitizeSearchTerm,
  sanitizeText,
} from './procurement.common';
import { resolveProcurementActorContext } from './procurement.actor-context';
import { fetchProductStockCounts } from './procurement.product-repo';
import type {
  ProcurementProductRow,
  ProductCategoryRow,
} from './procurement.internal-types';

export async function listProcurementProductsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementProductsQuery;
  },
): Promise<ProcurementProductsResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);
  const search = sanitizeSearchTerm(options.query.search ?? null);

  let query = supabase
    .from('products')
    .select(
      'id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived',
      { count: 'exact' },
    )
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .eq('is_archived', false)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (search) {
    query = query.or(`product_code.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .returns<ProcurementProductRow[]>();
  if (error) throw error;

  const rows = data ?? [];
  const productIds = rows.map((row) => row.id);
  const stockCountsByProductId = await fetchProductStockCounts(
    supabase,
    productIds,
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      productCode: row.product_code,
      name: row.name,
      rentPricePerDay:
        row.rent_price_per_day === null
          ? null
          : roundMoney(parseNumeric(row.rent_price_per_day)),
      salePrice:
        row.sale_price === null
          ? null
          : roundMoney(parseNumeric(row.sale_price)),
      purchasePrice:
        row.purchase_price === null
          ? null
          : roundMoney(parseNumeric(row.purchase_price)),
      stockTotal: stockCountsByProductId.get(row.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listProcurementCategoriesForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementCategoriesQuery;
  },
): Promise<ProcurementCategoriesResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);
  const search = sanitizeSearchTerm(options.query.search ?? null);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let branchPageQuery = supabase
    .from('product_categories')
    .select('id, branch_id, code, name, sort_order, is_active', {
      count: 'exact',
    })
    .eq('is_active', true)
    .eq('is_delete', false)
    .eq('branch_id', context.branchId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (search) {
    branchPageQuery = branchPageQuery.or(
      `code.ilike.%${search}%,name.ilike.%${search}%`,
    );
  }

  const {
    data: branchRowsData,
    error: branchRowsError,
    count: branchCount,
  } = await branchPageQuery.range(from, to).returns<ProductCategoryRow[]>();
  if (branchRowsError) throw branchRowsError;

  let branchCodeQuery = supabase
    .from('product_categories')
    .select('code')
    .eq('is_active', true)
    .eq('is_delete', false)
    .eq('branch_id', context.branchId);
  if (search) {
    branchCodeQuery = branchCodeQuery.or(
      `code.ilike.%${search}%,name.ilike.%${search}%`,
    );
  }

  const { data: branchCodeRows, error: branchCodeError } =
    await branchCodeQuery.returns<Array<{ code: string }>>();
  if (branchCodeError) throw branchCodeError;

  const excludedCodesFilter = buildPostgrestInFilter(
    Array.from(new Set((branchCodeRows ?? []).map((row) => row.code))),
  );

  let globalCountQuery = supabase
    .from('product_categories')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_delete', false)
    .is('branch_id', null);
  if (search) {
    globalCountQuery = globalCountQuery.or(
      `code.ilike.%${search}%,name.ilike.%${search}%`,
    );
  }
  if (excludedCodesFilter) {
    globalCountQuery = globalCountQuery.not('code', 'in', excludedCodesFilter);
  }

  const { count: globalCount, error: globalCountError } =
    await globalCountQuery;
  if (globalCountError) throw globalCountError;

  const branchRows = branchRowsData ?? [];
  const branchTotal = branchCount ?? 0;
  const remainingSlots = Math.max(0, pageSize - branchRows.length);
  const globalOffset = Math.max(0, from - branchTotal);
  let globalRows: ProductCategoryRow[] = [];

  if (remainingSlots > 0) {
    let globalRowsQuery = supabase
      .from('product_categories')
      .select('id, branch_id, code, name, sort_order, is_active')
      .eq('is_active', true)
      .eq('is_delete', false)
      .is('branch_id', null)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (search) {
      globalRowsQuery = globalRowsQuery.or(
        `code.ilike.%${search}%,name.ilike.%${search}%`,
      );
    }
    if (excludedCodesFilter) {
      globalRowsQuery = globalRowsQuery.not('code', 'in', excludedCodesFilter);
    }

    const globalTo = globalOffset + remainingSlots - 1;
    const { data: globalRowsData, error: globalRowsError } =
      await globalRowsQuery
        .range(globalOffset, globalTo)
        .returns<ProductCategoryRow[]>();
    if (globalRowsError) throw globalRowsError;
    globalRows = globalRowsData ?? [];
  }

  const rows = [...branchRows, ...globalRows];

  return {
    items: rows.map((row) => mapCategoryRowToOption(row)),
    total: branchTotal + (globalCount ?? 0),
    page,
    pageSize,
  };
}
