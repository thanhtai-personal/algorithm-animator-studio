import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { ITEM_STATUS_VALUES } from '../../shared/domain/domain-primitives.constants';
import { AppConfigService } from '../../../common/config/app-config.service';
import { getAccessTokenFromRequest } from '../../../common/supabase/request-token.util';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuthService } from '../../auth/auth.service';
import type { ItemStatus } from '../../shared/domain/types/domain-primitives.type';
import {
  bulkUpdateInventoryItemStatusForAdmin,
  findInventoryItemByCode,
  getInventoryItemDetailForAdmin,
  listInventoryItemsForAdmin,
  listInventoryProductsForAdmin,
  updateInventoryItemStatusForAdmin,
} from '../infrastructure/inventory.data-access';
import type {
  BulkUpdateInventoryItemStatusPayload,
  UpdateInventoryItemStatusPayload,
} from '../types/inventory-items.type';

const ITEM_STATUS_SET = new Set<string>(ITEM_STATUS_VALUES);
const INVENTORY_VIEW_MODE_SET = new Set<string>(['items', 'products']);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;
const MAX_BULK_ITEM_IDS = 500;

function parseString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseItemStatus(value: string | null | undefined): ItemStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ITEM_STATUS_SET.has(normalized)) {
    return normalized as ItemStatus;
  }
  return null;
}

function parseBoolean(value: string | null | undefined): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
}

function parseViewMode(value: string | null | undefined): 'items' | 'products' {
  if (!value) return 'items';
  const normalized = value.trim().toLowerCase();
  if (INVENTORY_VIEW_MODE_SET.has(normalized)) {
    return normalized as 'items' | 'products';
  }
  return 'items';
}

function parseProductCategoryIdFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  const current = parseString(searchParams.get('productCategoryId'));
  if (current) return current;
  return parseString(searchParams.get('categoryId'));
}

function parseStatusPayload(
  body: Record<string, unknown>,
): UpdateInventoryItemStatusPayload | null {
  const toStatus = parseItemStatus(
    typeof body.toStatus === 'string' ? body.toStatus : null,
  );
  if (!toStatus) return null;

  return {
    toStatus,
    reasonCode: parseString(
      typeof body.reasonCode === 'string' ? body.reasonCode : null,
    ),
    reasonNote: parseString(
      typeof body.reasonNote === 'string' ? body.reasonNote : null,
    ),
    orderId: parseString(
      typeof body.orderId === 'string' ? body.orderId : null,
    ),
  };
}

function parseBulkStatusPayload(
  body: Record<string, unknown>,
): BulkUpdateInventoryItemStatusPayload | null {
  const statusPayload = parseStatusPayload(body);
  if (!statusPayload) return null;

  if (!Array.isArray(body.itemIds)) return null;

  const itemIds = Array.from(
    new Set(
      body.itemIds
        .filter((itemId): itemId is string => typeof itemId === 'string')
        .map((itemId) => itemId.trim())
        .filter((itemId) => itemId.length > 0),
    ),
  );

  if (itemIds.length === 0 || itemIds.length > MAX_BULK_ITEM_IDS) {
    return null;
  }

  return {
    ...statusPayload,
    itemIds,
  };
}

function getSearchParams(request: Request): URLSearchParams {
  const url = request.originalUrl ?? request.url ?? '/';
  return new URL(url, 'http://localhost').searchParams;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly config: AppConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getInventoryItems(request: Request): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const searchParams = getSearchParams(request);
      const viewMode = parseViewMode(searchParams.get('viewMode'));

      const page = parseInteger(searchParams.get('page'), 1);
      const pageSize = Math.min(
        parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      );

      const queryOptions = {
        branchId: parseString(searchParams.get('branchId')),
        status: parseItemStatus(searchParams.get('status')),
        excludeSold: parseBoolean(searchParams.get('excludeSold')),
        productId: parseString(searchParams.get('productId')),
        productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
        size: parseString(searchParams.get('size')),
        search: parseString(searchParams.get('search')),
        page,
        pageSize,
      };

      return viewMode === 'products'
        ? await listInventoryProductsForAdmin(supabase, queryOptions)
        : await listInventoryItemsForAdmin(supabase, queryOptions);
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async getInventoryItemDetail(
    request: Request,
    itemId: string,
  ): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const detail = await getInventoryItemDetailForAdmin(supabase, itemId);

      if (!detail) {
        throw new NotFoundException({ error: 'Item not found' });
      }

      return detail;
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async patchInventoryItemStatus(
    request: Request,
    itemId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseStatusPayload(body);

      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const detail = await updateInventoryItemStatusForAdmin(
        supabase,
        profileId,
        itemId,
        payload,
      );

      if (!detail) {
        throw new NotFoundException({ error: 'Item not found' });
      }

      return detail;
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async patchInventoryItemsBulkStatus(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseBulkStatusPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await bulkUpdateInventoryItemStatusForAdmin(
        supabase,
        profileId,
        payload,
      );
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async scanInventoryItem(request: Request): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const searchParams = getSearchParams(request);

      const code = parseString(searchParams.get('code'));
      if (!code) {
        throw new BadRequestException({ error: 'code is required' });
      }

      const result = await findInventoryItemByCode(supabase, {
        code,
        branchId: parseString(searchParams.get('branchId')),
      });

      if (!result) {
        throw new NotFoundException({ error: 'Item not found' });
      }

      return result;
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  private async getAuthedClient(request: Request): Promise<{
    supabase: SupabaseClient;
    profileId: string;
  }> {
    const token = getAccessTokenFromRequest(request, this.config.supabaseUrl);
    if (!token) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }

    const authUser = await this.authService.resolveAuthUserFromRequest(request);
    if (!authUser) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }

    return {
      supabase: this.supabaseService.createClientWithToken(token),
      profileId: authUser.userId,
    };
  }

  private throwKnownError(error: unknown): never {
    if (error instanceof UnauthorizedException) throw error;
    if (error instanceof BadRequestException) throw error;
    if (error instanceof NotFoundException) throw error;
    if (error instanceof ForbiddenException) throw error;

    if (error instanceof Error) {
      if (error.message === 'INVALID_STATUS_TRANSITION') {
        throw new BadRequestException({
          error: 'Invalid item status transition',
        });
      }

      if (error.message === 'READY_BLOCKED_BY_ACTIVE_RESERVATION') {
        throw new ConflictException({
          error:
            'Item cannot be marked READY while active reservation windows exist',
        });
      }

      if (error.message === 'FORBIDDEN_MANAGER_ONLY_STATUS') {
        throw new ForbiddenException({
          error: 'Only manager or admin can set this status',
        });
      }

      if (error.message === 'INVALID_TARGET_STATUS') {
        throw new BadRequestException({ error: 'Invalid target status' });
      }
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    throw new InternalServerErrorException({ error: message });
  }
}
