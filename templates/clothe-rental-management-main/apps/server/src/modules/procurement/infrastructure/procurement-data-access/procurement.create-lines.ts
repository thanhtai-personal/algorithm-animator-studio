import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductGender } from '../../../products/types/products-catalog.type';
import type { CreateProcurementReceiptPayload } from '../../types/procurement-module.type';
import { DEFAULT_IMPORT_SHEET_NAME } from './procurement.constants';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  parseOptionalNumeric,
  roundMoney,
  sanitizeText,
} from './procurement.common';
import {
  fetchCategoryByCodeMap,
  fetchProductsByCodes,
  fetchProductsByIds,
  generateUniqueProductCode,
} from './procurement.product-repo';
import type {
  NormalizedProcurementLineInput,
  ProcurementActorContext,
  ProcurementProductRow,
  ResolvedProcurementLine,
} from './procurement.internal-types';

function normalizeLineGender(value: unknown): ProductGender | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'female' ||
    normalized === 'male' ||
    normalized === 'unisex' ||
    normalized === 'other'
  ) {
    return normalized;
  }
  return null;
}

function normalizeLineBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  return null;
}

export function normalizeProcurementLineInput(
  line: CreateProcurementReceiptPayload['lines'][number],
  index: number,
): NormalizedProcurementLineInput {
  const quantity = Math.floor(Number(line.quantity));
  const unitCostAmount = roundMoney(Number(line.unitCostAmount));
  const rentPricePerDay = parseOptionalNumeric(line.rentPricePerDay);
  const quickRentPrice = parseOptionalNumeric(line.quickRentPrice);
  const purchasePrice = parseOptionalNumeric(line.purchasePrice);
  const salePrice = parseOptionalNumeric(line.salePrice);

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitCostAmount) ||
    unitCostAmount < 0
  ) {
    throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
      line,
      rowNumber: index + 1,
    });
  }

  if (
    rentPricePerDay === null ||
    purchasePrice === null ||
    salePrice === null
  ) {
    throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
      line,
      rowNumber: index + 1,
      reason: 'missing-required-prices',
    });
  }

  return {
    sheetName: DEFAULT_IMPORT_SHEET_NAME,
    rowNumber: index + 1,
    productId: sanitizeText(line.productId),
    productCode: sanitizeText(line.productCode),
    name: sanitizeText(line.name),
    categoryCode: sanitizeText(line.categoryCode),
    rentPricePerDay,
    quickRentPrice,
    purchasePrice,
    salePrice,
    isRentable: normalizeLineBoolean(line.isRentable),
    isSaleable: normalizeLineBoolean(line.isSaleable),
    material: sanitizeText(line.material),
    gender: normalizeLineGender(line.gender),
    description: sanitizeText(line.description),
    coverImageUrl: sanitizeText(line.coverImageUrl),
    quantity,
    unitCostAmount,
    itemSize: sanitizeText(line.itemSize),
    note: sanitizeText(line.note),
  };
}

export async function resolveProcurementLinesWithProductUpsert(
  supabase: SupabaseClient,
  options: {
    context: ProcurementActorContext;
    lines: NormalizedProcurementLineInput[];
    matchExistingByProductCode?: boolean;
  },
): Promise<ResolvedProcurementLine[]> {
  const shouldMatchByProductCode = options.matchExistingByProductCode !== false;
  const productIdCandidates = options.lines
    .map((line) => line.productId)
    .filter((value): value is string => Boolean(value));
  const productCodeCandidates = shouldMatchByProductCode
    ? options.lines
        .map((line) => line.productCode)
        .filter((value): value is string => Boolean(value))
    : [];
  const categoryCodeCandidates = options.lines
    .map((line) => line.categoryCode)
    .filter((value): value is string => Boolean(value));

  const [productsById, productsByCodeLower, categoriesByCodeLower] =
    await Promise.all([
      fetchProductsByIds(supabase, Array.from(new Set(productIdCandidates))),
      shouldMatchByProductCode
        ? fetchProductsByCodes(supabase, {
            branchId: options.context.branchId,
            productCodes: Array.from(new Set(productCodeCandidates)),
          })
        : Promise.resolve(new Map<string, ProcurementProductRow>()),
      fetchCategoryByCodeMap(supabase, {
        branchId: options.context.branchId,
        categoryCodes: Array.from(new Set(categoryCodeCandidates)),
      }),
    ]);

  const resolvedLines: ResolvedProcurementLine[] = [];

  for (const line of options.lines) {
    if (
      line.rentPricePerDay === null ||
      line.purchasePrice === null ||
      line.salePrice === null
    ) {
      throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
        rowNumber: line.rowNumber,
        reason: 'missing-required-prices',
      });
    }

    let product: ProcurementProductRow | null = null;
    if (line.productId) {
      product = productsById.get(line.productId) ?? null;
    }
    if (!product && shouldMatchByProductCode && line.productCode) {
      product = productsByCodeLower.get(line.productCode.toLowerCase()) ?? null;
    }

    if (product) {
      const productBranchId = sanitizeText(product.branch_id);
      if (productBranchId && productBranchId !== options.context.branchId) {
        throw new ProcurementDomainError('FORBIDDEN_BRANCH_SCOPE', {
          rowNumber: line.rowNumber,
          productId: product.id,
          productBranchId,
          branchId: options.context.branchId,
        });
      }

      const updatePayload: Record<string, unknown> = {
        updated_by: options.context.actor.id,
      };
      if (!product.is_active) {
        updatePayload.is_active = true;
      }
      if (product.is_archived) {
        updatePayload.is_archived = false;
      }
      if (line.name) updatePayload.name = line.name;
      if (line.categoryCode) {
        const category =
          categoriesByCodeLower.get(line.categoryCode.toLowerCase()) ?? null;
        if (!category) {
          throw new ProcurementDomainError('CATEGORY_NOT_FOUND', {
            categoryCode: line.categoryCode,
            rowNumber: line.rowNumber,
          });
        }
        updatePayload.category_id = category.id;
      }
      if (line.rentPricePerDay !== null) {
        updatePayload.rent_price_per_day = line.rentPricePerDay;
      }
      if (line.purchasePrice !== null) {
        updatePayload.purchase_price = line.purchasePrice;
      }
      if (line.salePrice !== null) {
        updatePayload.sale_price = line.salePrice;
      }
      if (line.isRentable !== null) {
        updatePayload.is_rentable = line.isRentable;
      }
      if (line.isSaleable !== null) {
        updatePayload.is_saleable = line.isSaleable;
      }
      if (line.material) updatePayload.material = line.material;
      if (line.gender) updatePayload.gender = line.gender;
      if (line.description) updatePayload.description = line.description;
      if (line.coverImageUrl)
        updatePayload.cover_image_path = line.coverImageUrl;

      const patchKeys = Object.keys(updatePayload).filter(
        (key) => key !== 'updated_by',
      );
      if (patchKeys.length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', product.id)
          .eq('is_delete', false);
        if (updateError) throw updateError;
      }

      resolvedLines.push({
        sheetName: line.sheetName,
        rowNumber: line.rowNumber,
        resolvedAction: 'UPDATE_EXISTING',
        generatedProductCode: null,
        productId: product.id,
        productCodeSnapshot: product.product_code,
        productNameSnapshot: line.name ?? product.name,
        quantity: line.quantity,
        unitCostAmount: line.unitCostAmount,
        lineTotalAmount: roundMoney(line.quantity * line.unitCostAmount),
        rentPricePerDay: line.rentPricePerDay,
        quickRentPrice: line.quickRentPrice,
        purchasePrice: line.purchasePrice,
        salePrice: line.salePrice,
        itemSize: line.itemSize,
        note: line.note,
      });
      continue;
    }

    if (!line.name) {
      throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
        rowNumber: line.rowNumber,
        reason: 'missing-name-for-new-product',
      });
    }

    const nextProductCode =
      line.productCode ??
      (await generateUniqueProductCode(supabase, options.context.branchId));
    const categoryId =
      line.categoryCode &&
      categoriesByCodeLower.has(line.categoryCode.toLowerCase())
        ? (categoriesByCodeLower.get(line.categoryCode.toLowerCase())?.id ??
          null)
        : null;

    if (line.categoryCode && !categoryId) {
      throw new ProcurementDomainError('CATEGORY_NOT_FOUND', {
        categoryCode: line.categoryCode,
        rowNumber: line.rowNumber,
      });
    }

    const insertPayload = {
      branch_id: options.context.branchId,
      product_code: nextProductCode,
      name: line.name,
      category_id: categoryId,
      cover_image_path: line.coverImageUrl,
      gender: line.gender,
      material: line.material,
      description: line.description,
      rent_price_per_day: line.rentPricePerDay,
      sale_price: line.salePrice,
      purchase_price: line.purchasePrice,
      is_rentable: line.isRentable ?? true,
      is_saleable: line.isSaleable ?? false,
      is_active: true,
      is_archived: false,
      is_delete: false,
      created_by: options.context.actor.id,
      updated_by: options.context.actor.id,
    };

    const { data: createdProduct, error: createError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select(
        'id, branch_id, product_code, name, category_id, gender, material, description, rent_price_per_day, sale_price, purchase_price, is_rentable, is_saleable, is_active, is_archived',
      )
      .maybeSingle<ProcurementProductRow>();

    if (createError) throw createError;
    if (!createdProduct) {
      throw new ProcurementDomainError('INVALID_LINE_PAYLOAD', {
        rowNumber: line.rowNumber,
        reason: 'cannot-create-product',
      });
    }

    productsById.set(createdProduct.id, createdProduct);

    resolvedLines.push({
      sheetName: line.sheetName,
      rowNumber: line.rowNumber,
      resolvedAction: 'CREATE_NEW',
      generatedProductCode: line.productCode
        ? null
        : createdProduct.product_code,
      productId: createdProduct.id,
      productCodeSnapshot: createdProduct.product_code,
      productNameSnapshot: createdProduct.name,
      quantity: line.quantity,
      unitCostAmount: line.unitCostAmount,
      lineTotalAmount: roundMoney(line.quantity * line.unitCostAmount),
      rentPricePerDay: line.rentPricePerDay,
      quickRentPrice: line.quickRentPrice,
      purchasePrice: line.purchasePrice,
      salePrice: line.salePrice,
      itemSize: line.itemSize,
      note: line.note,
    });
  }

  return resolvedLines;
}
