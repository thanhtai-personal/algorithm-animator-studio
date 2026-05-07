import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../../common/config/app-config.service';
import { getAccessTokenFromRequest } from '../../../common/supabase/request-token.util';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuthService } from '../../auth/auth.service';
import { RequestBodyToCreateCustomerPayloadMapper } from '../mappers/RequestBodyToCreateCustomerPayload.mapper';
import { RequestBodyToUpdateCustomerPayloadMapper } from '../mappers/RequestBodyToUpdateCustomerPayload.mapper';
import {
  createCustomerForAdmin,
  CustomersDomainError,
  getCustomerDetailForAdmin,
  listCustomersForAdmin,
  searchCustomersTypeaheadForAdmin,
  updateCustomerForAdmin,
} from '../infrastructure/customers.data-access';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 80;
const DEFAULT_TYPEAHEAD_LIMIT = 8;
const MAX_TYPEAHEAD_LIMIT = 20;
const createCustomerPayloadMapper =
  new RequestBodyToCreateCustomerPayloadMapper();
const updateCustomerPayloadMapper =
  new RequestBodyToUpdateCustomerPayloadMapper();

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getSearchParams(request: Request): URLSearchParams {
  const url = request.originalUrl ?? request.url ?? '/';
  return new URL(url, 'http://localhost').searchParams;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly config: AppConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getCustomers(request: Request): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const searchParams = getSearchParams(request);

      const page = parseInteger(searchParams.get('page'), 1);
      const pageSize = Math.min(
        parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      );

      return await listCustomersForAdmin(supabase, {
        branchId: parseString(searchParams.get('branchId')),
        search: parseString(searchParams.get('search')),
        tagId: parseString(searchParams.get('tagId')),
        page,
        pageSize,
      });
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async createCustomer(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = createCustomerPayloadMapper.map(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const serviceRoleClient = this.supabaseService.createServiceRoleClient();
      return await createCustomerForAdmin(
        supabase,
        profileId,
        payload,
        serviceRoleClient,
      );
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async getCustomerDetail(
    request: Request,
    customerId: string,
  ): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const detail = await getCustomerDetailForAdmin(supabase, customerId);
      if (!detail) {
        throw new NotFoundException({ error: 'Customer not found' });
      }

      return detail;
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async patchCustomer(
    request: Request,
    customerId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = updateCustomerPayloadMapper.map(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const detail = await updateCustomerForAdmin(
        supabase,
        profileId,
        customerId,
        payload,
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Customer not found' });
      }

      return detail;
    } catch (error) {
      this.throwKnownError(error);
    }
  }

  async getCustomersTypeahead(request: Request): Promise<unknown> {
    try {
      const { supabase } = await this.getAuthedClient(request);
      const searchParams = getSearchParams(request);

      const search = parseString(searchParams.get('search'));
      if (!search) {
        return { items: [] };
      }

      const limit = Math.min(
        parseInteger(searchParams.get('limit'), DEFAULT_TYPEAHEAD_LIMIT),
        MAX_TYPEAHEAD_LIMIT,
      );

      return await searchCustomersTypeaheadForAdmin(supabase, {
        branchId: parseString(searchParams.get('branchId')),
        search,
        limit,
      });
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
    if (error instanceof ConflictException) throw error;

    if (error instanceof CustomersDomainError) {
      if (error.code === 'INVALID_PHONE') {
        throw new BadRequestException({ error: 'Phone number is invalid' });
      }

      if (error.code === 'PHONE_REQUIRED') {
        throw new BadRequestException({ error: 'Phone number is required' });
      }

      if (error.code === 'CUSTOMER_NAME_REQUIRED') {
        throw new BadRequestException({
          error: 'Customer full name is required',
        });
      }

      if (error.code === 'BRANCH_REQUIRED') {
        throw new BadRequestException({ error: 'Branch is required' });
      }

      if (error.code === 'DUPLICATE_PHONE') {
        throw new ConflictException({
          error:
            'Phone number already exists for another customer in this branch',
          duplicateCustomer: {
            id: error.context.existingCustomerId ?? null,
            fullName: error.context.existingCustomerName ?? null,
            phone: error.context.existingCustomerPhone ?? null,
          },
        });
      }

      if (error.code === 'CUSTOMER_ACCOUNT_CREATE_FAILED') {
        throw new InternalServerErrorException({
          error: 'Failed to create customer account',
        });
      }
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    throw new InternalServerErrorException({ error: message });
  }
}
