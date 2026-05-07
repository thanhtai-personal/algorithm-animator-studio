import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UtilizationCategoryRowDto,
  UtilizationProductRowDto,
  UtilizationReportQuery,
  UtilizationReportResponse,
} from '../../types/reports-module.type';
import { buildCsv } from './reports-csv.data-access.utils';
import {
  ReportsContext,
  computeRate,
  sanitizeText,
} from './reports-common.data-access.utils';
import { formatDateInTimeZone } from './reports-date-range.data-access.utils';
import {
  ensureExportPermission,
  resolveReportsContext,
} from './reports-context.data-access';
import {
  fetchCategoriesByIds,
  fetchProductsByIds,
} from './reports-reference.data-access';

interface UtilizationItemRow {
  id: string;
  status: string;
  product_id: string;
}

interface UtilizationProductAggregate {
  productId: string;
  productName: string;
  productCategoryId: string | null;
  categoryName: string | null;
  totalActiveItems: number;
  onRentItems: number;
}

interface UtilizationCategoryAggregate {
  productCategoryId: string | null;
  categoryName: string;
  totalActiveItems: number;
  onRentItems: number;
}

async function fetchUtilizationItems(
  supabase: SupabaseClient,
  branchId: string,
): Promise<UtilizationItemRow[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, status, product_id')
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .neq('status', 'RETIRED')
    .neq('status', 'SOLD')
    .returns<UtilizationItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function buildUtilizationReport(
  supabase: SupabaseClient,
  options: {
    context: ReportsContext;
    query: UtilizationReportQuery;
  },
): Promise<UtilizationReportResponse> {
  const activeItems = await fetchUtilizationItems(
    supabase,
    options.context.branchId,
  );

  const productIds = Array.from(
    new Set(
      activeItems
        .map((row) => row.product_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const productById = await fetchProductsByIds(supabase, productIds, {
    branchId: options.context.branchId,
  });

  const productCategoryIds = Array.from(
    new Set(
      Array.from(productById.values())
        .map((row) => row.category_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const categoryById = await fetchCategoriesByIds(
    supabase,
    productCategoryIds,
    {
      branchId: options.context.branchId,
    },
  );

  const productAggregate = new Map<string, UtilizationProductAggregate>();
  const categoryAggregate = new Map<string, UtilizationCategoryAggregate>();

  for (const item of activeItems) {
    const productId = item.product_id ?? 'unknown-product';

    const product = productById.get(productId);
    const productCategoryId = product?.category_id ?? null;
    const categoryName = productCategoryId
      ? (sanitizeText(categoryById.get(productCategoryId)?.name) ??
        'Uncategorized')
      : 'Uncategorized';

    const productEntry = productAggregate.get(productId) ?? {
      productId,
      productName: sanitizeText(product?.name) ?? 'Unknown product',
      productCategoryId,
      categoryName: productCategoryId ? categoryName : null,
      totalActiveItems: 0,
      onRentItems: 0,
    };

    productEntry.totalActiveItems += 1;
    if (item.status.trim().toUpperCase() === 'ON_RENT') {
      productEntry.onRentItems += 1;
    }

    productAggregate.set(productId, productEntry);

    const categoryKey = productCategoryId ?? 'uncategorized';
    const categoryEntry = categoryAggregate.get(categoryKey) ?? {
      productCategoryId,
      categoryName,
      totalActiveItems: 0,
      onRentItems: 0,
    };

    categoryEntry.totalActiveItems += 1;
    if (item.status.trim().toUpperCase() === 'ON_RENT') {
      categoryEntry.onRentItems += 1;
    }

    categoryAggregate.set(categoryKey, categoryEntry);
  }

  const byProduct: UtilizationProductRowDto[] = Array.from(
    productAggregate.values(),
  )
    .map((row) => ({
      productId: row.productId,
      productName: row.productName,
      productCategoryId: row.productCategoryId,
      categoryName: row.categoryName,
      totalActiveItems: row.totalActiveItems,
      onRentItems: row.onRentItems,
      utilizationRate: computeRate(row.onRentItems, row.totalActiveItems),
    }))
    .sort((a, b) => {
      if (a.utilizationRate !== b.utilizationRate) {
        return b.utilizationRate - a.utilizationRate;
      }

      if (a.onRentItems !== b.onRentItems) {
        return b.onRentItems - a.onRentItems;
      }

      if (a.totalActiveItems !== b.totalActiveItems) {
        return b.totalActiveItems - a.totalActiveItems;
      }

      return a.productName.localeCompare(b.productName);
    });

  const byCategory: UtilizationCategoryRowDto[] = Array.from(
    categoryAggregate.values(),
  )
    .map((row) => ({
      productCategoryId: row.productCategoryId,
      categoryName: row.categoryName,
      totalActiveItems: row.totalActiveItems,
      onRentItems: row.onRentItems,
      utilizationRate: computeRate(row.onRentItems, row.totalActiveItems),
    }))
    .sort((a, b) => {
      if (a.utilizationRate !== b.utilizationRate) {
        return b.utilizationRate - a.utilizationRate;
      }

      if (a.onRentItems !== b.onRentItems) {
        return b.onRentItems - a.onRentItems;
      }

      return a.categoryName.localeCompare(b.categoryName);
    });

  const onRentItems = activeItems.reduce((count, row) => {
    return row.status.trim().toUpperCase() === 'ON_RENT' ? count + 1 : count;
  }, 0);

  return {
    branchId: options.context.branchId,
    timezone: options.context.timezone,
    currencyCode: options.context.currencyCode,
    asOfDate: formatDateInTimeZone(new Date(), options.context.timezone),
    kpi: {
      totalActiveItems: activeItems.length,
      onRentItems,
      utilizationRate: computeRate(onRentItems, activeItems.length),
    },
    byCategory,
    byProduct,
  };
}

function utilizationReportToCsvRows(
  report: UtilizationReportResponse,
): Array<Array<string | number | null>> {
  const rows: Array<Array<string | number | null>> = [];

  rows.push([
    'SUMMARY',
    report.asOfDate,
    null,
    null,
    report.kpi.totalActiveItems,
    report.kpi.onRentItems,
    report.kpi.utilizationRate,
  ]);

  for (const row of report.byCategory) {
    rows.push([
      'CATEGORY',
      report.asOfDate,
      row.categoryName,
      null,
      row.totalActiveItems,
      row.onRentItems,
      row.utilizationRate,
    ]);
  }

  for (const row of report.byProduct) {
    rows.push([
      'PRODUCT',
      report.asOfDate,
      row.categoryName,
      row.productName,
      row.totalActiveItems,
      row.onRentItems,
      row.utilizationRate,
    ]);
  }

  return rows;
}

export async function getUtilizationReportForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: UtilizationReportQuery;
  },
): Promise<UtilizationReportResponse> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  return buildUtilizationReport(supabase, {
    context,
    query: options.query,
  });
}

export async function exportUtilizationCsvForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: UtilizationReportQuery;
  },
): Promise<string> {
  const context = await resolveReportsContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  ensureExportPermission(context);

  const report = await buildUtilizationReport(supabase, {
    context,
    query: options.query,
  });

  return buildCsv(
    [
      'row_type',
      'as_of_date',
      'category_name',
      'product_name',
      'total_active_items',
      'on_rent_items',
      'utilization_rate_percent',
    ],
    utilizationReportToCsvRows(report),
  );
}
