import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SalesProductsDomainError } from '../../infrastructure/products.data-access';
export function mapSalesProductsDomainError(
  error: unknown,
): HttpException | null {
  if (!(error instanceof SalesProductsDomainError)) {
    return null;
  }

  const payload =
    Object.keys(error.context ?? {}).length > 0
      ? { error: error.code, context: error.context }
      : { error: error.code };

  if (
    error.code === 'FORBIDDEN_SALES_ACCESS' ||
    error.code === 'BRANCH_ACCESS_DENIED' ||
    error.code === 'FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF' ||
    error.code === 'FORBIDDEN_MANAGER_ONLY_ITEM_STATUS'
  ) {
    return new ForbiddenException(payload);
  }

  if (
    error.code === 'PRODUCT_NOT_FOUND' ||
    error.code === 'SHOWROOM_NOT_FOUND' ||
    error.code === 'BRANCH_NOT_FOUND'
  ) {
    return new NotFoundException(payload);
  }

  if (
    error.code === 'DUPLICATE_ITEM_CODE_IN_PAYLOAD' ||
    error.code === 'PRODUCT_DELETE_FORBIDDEN_FINANCIAL_LINKS' ||
    error.code === 'PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS'
  ) {
    return new ConflictException(payload);
  }

  if (
    error.code === 'MISSING_PROFILE_CONTEXT' ||
    error.code === 'MISSING_BRANCH_CONTEXT' ||
    error.code === 'INVALID_PRODUCT_ENTRY_STATUS' ||
    error.code === 'MISSING_REQUIRED_PRODUCT_PRICES'
  ) {
    return new BadRequestException(payload);
  }

  return new BadRequestException(payload);
}

export function mapProductItemsDomainError(
  error: unknown,
): HttpException | null {
  if (!(error instanceof Error)) return null;

  if (error.message === 'BRANCH_ID_REQUIRED_FOR_PRODUCT_ITEMS') {
    return new BadRequestException({ error: error.message });
  }

  if (error.message === 'ITEM_CODE_REQUIRED') {
    return new BadRequestException({ error: error.message });
  }

  return null;
}

export function mapConstraintError(error: unknown): HttpException | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';

  if (code !== '23505' && code !== '23503') {
    return null;
  }

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message ?? '')
      : '';
  const details =
    typeof error === 'object' && error !== null && 'details' in error
      ? String((error as { details?: string }).details ?? '')
      : '';

  const haystack = `${message} ${details}`.toLowerCase();

  if (
    haystack.includes('products_global_product_code_unique') ||
    haystack.includes('products_branch_product_code_unique')
  ) {
    return new ConflictException({ error: 'DUPLICATE_PRODUCT_CODE' });
  }

  if (haystack.includes('items_branch_item_code_unique')) {
    return new ConflictException({ error: 'DUPLICATE_ITEM_CODE' });
  }

  if (
    code === '23503' &&
    (haystack.includes('rental_order_items_item_id_fkey') ||
      haystack.includes('reservation_windows_item_id_fkey') ||
      haystack.includes('maintenance_tasks_item_id_fkey') ||
      haystack.includes('incidents_item_id_fkey') ||
      haystack.includes('item_status_logs_item_id_fkey'))
  ) {
    return new ConflictException({ error: 'ITEM_IN_USE_CANNOT_DELETE' });
  }

  if (code === '23505') {
    return new ConflictException({ error: 'DUPLICATE_RESOURCE' });
  }

  return null;
}

export function getSearchParams(request: Request): URLSearchParams {
  const url = request.originalUrl ?? request.url ?? '/';
  return new URL(url, 'http://localhost').searchParams;
}
