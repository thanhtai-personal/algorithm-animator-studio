import { BadRequestException, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { AppConfigService } from '../../../common/config/app-config.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuthService } from '../../auth/auth.service';
import {
  createBranchForAdmin,
  createProductCategoryForAdmin,
  createSettingsUserForAdmin,
  createShowroomForAdmin,
  checkBranchShopDomainForAdmin,
  getPosPasskeyPolicyForActor,
  deleteProductCategoryForAdmin,
  deleteShowroomForAdmin,
  getPublicBranchContext,
  listPublicBranchMapItems,
  getPublicSiteBranding,
  getPublishedShowroomPageConfig,
  getSettingsGeneralForAdmin,
  getShowroomPagesSettingsForAdmin,
  listBranchesForAdmin,
  listProductCategoriesForAdmin,
  listSettingsUsersForAdmin,
  listShowroomsForAdmin,
  triggerUserPasswordResetForAdmin,
  updateBranchForAdmin,
  updateProductCategoryForAdmin,
  updateSettingsGeneralForAdmin,
  updateSettingsUserForAdmin,
  updateShowroomForAdmin,
  updateShowroomPagesSettingsForAdmin,
  updatePosPasskeyForAdmin,
  verifyPosPasskeyForActor,
} from '../infrastructure/settings.data-access';
import {
  parseSettingLocale,
  parseShowroomPageScope,
  parseString,
  parseSettingsGeneralUpdatePayload,
} from './helpers';
import {
  parseCreateBranchPayload,
  parseCreateProductCategoryPayload,
  parseCreateShowroomPayload,
  parseCreateUserPayload,
  parseResetUserPasswordPayload,
  parseShowroomPagesUpdatePayload,
  parseUpdateBranchPayload,
  parseUpdateProductCategoryPayload,
  parseUpdateShowroomPayload,
  parseUpdateUserPayload,
  searchParamsFromRequest,
} from './helpers-mutations';
import type {
  PosPasskeyUpdatePayload,
  PosPasskeyVerifyPayload,
  SettingsBranchShopDomainCheckQuery,
  SettingsProductCategoriesQuery,
} from '../types/settings-module.type';
import {
  getAuthedClientForSettings,
  getAuthedProfileIdForSettings,
  throwKnownSettingsHttpError,
} from './runtime-helpers';

function parsePosPasskeyVerifyPayload(
  body: Record<string, unknown>,
): PosPasskeyVerifyPayload | null {
  const passkey = parseString(body.passkey);
  if (!passkey) return null;
  return { passkey };
}

function parsePosPasskeyUpdatePayload(
  body: Record<string, unknown>,
): PosPasskeyUpdatePayload | null {
  const payload: PosPasskeyUpdatePayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'enabled')) {
    if (typeof body.enabled !== 'boolean') return null;
    payload.enabled = body.enabled;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'newPasskey')) {
    const newPasskey = parseString(body.newPasskey);
    if (!newPasskey) return null;
    payload.newPasskey = newPasskey;
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
}
@Injectable()
export class SettingsService {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}
  private getAuthedClient(request: Request) {
    return getAuthedClientForSettings({
      request,
      config: this.config,
      authService: this.authService,
      supabaseService: this.supabaseService,
    });
  }
  private getAuthedProfileId(request: Request): Promise<string> {
    const { config, authService } = this;
    return getAuthedProfileIdForSettings({ request, config, authService });
  }
  async getSettingsGeneral(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const searchParams = searchParamsFromRequest(request);

      return await getSettingsGeneralForAdmin(supabase, {
        actorProfileId: profileId,
        query: { branchId: parseString(searchParams.get('branchId')) },
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsGeneral(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseSettingsGeneralUpdatePayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updateSettingsGeneralForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getPosPasskeyPolicy(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      return await getPosPasskeyPolicyForActor(supabase, {
        actorProfileId: profileId,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postPosPasskeyVerify(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parsePosPasskeyVerifyPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await verifyPosPasskeyForActor(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchPosPasskey(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parsePosPasskeyUpdatePayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updatePosPasskeyForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsShowroomPages(request: Request): Promise<unknown> {
    try {
      const profileId = await this.getAuthedProfileId(request);
      const supabase = this.supabaseService.createServiceRoleClient();
      const searchParams = searchParamsFromRequest(request);
      const localeRaw = searchParams.get('locale');
      const locale = localeRaw ? parseSettingLocale(localeRaw) : null;
      if (localeRaw && !locale) {
        throw new BadRequestException({ error: 'Invalid locale' });
      }
      const scopeRaw = searchParams.get('scope');
      const scope = scopeRaw ? parseShowroomPageScope(scopeRaw) : null;
      if (scopeRaw && !scope) {
        throw new BadRequestException({ error: 'Invalid scope' });
      }

      return await getShowroomPagesSettingsForAdmin(supabase, {
        actorProfileId: profileId,
        query: {
          branchId: parseString(searchParams.get('branchId')),
          locale,
          scope,
        },
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getPublicShowroomConfig(request: Request): Promise<unknown> {
    try {
      const searchParams = searchParamsFromRequest(request);
      const localeRaw = searchParams.get('locale');
      const locale = localeRaw ? parseSettingLocale(localeRaw) : 'vi';
      if (!locale) {
        throw new BadRequestException({ error: 'Invalid locale' });
      }
      const scopeRaw = searchParams.get('scope');
      const scope = scopeRaw ? parseShowroomPageScope(scopeRaw) : null;
      if (scopeRaw && !scope) {
        throw new BadRequestException({ error: 'Invalid scope' });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      return await getPublishedShowroomPageConfig(supabase, {
        query: {
          showroomSlug: parseString(searchParams.get('showroomSlug')),
          branchId: parseString(searchParams.get('branchId')),
          branchSlug: parseString(searchParams.get('branchSlug')),
          shopDomain: parseString(searchParams.get('shopDomain')),
          locale,
          scope,
        },
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getPublicBranchContext(request: Request): Promise<unknown> {
    try {
      const searchParams = searchParamsFromRequest(request);
      const supabase = this.supabaseService.createServiceRoleClient();

      return await getPublicBranchContext(supabase, {
        query: {
          showroomSlug: parseString(searchParams.get('showroomSlug')),
          branchId: parseString(searchParams.get('branchId')),
          branchSlug: parseString(searchParams.get('branchSlug')),
          shopDomain: parseString(searchParams.get('shopDomain')),
        },
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getPublicBranchMap(): Promise<unknown> {
    try {
      const supabase = this.supabaseService.createServiceRoleClient();
      return await listPublicBranchMapItems(supabase);
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getPublicSiteBranding(): Promise<unknown> {
    try {
      const supabase = this.supabaseService.createServiceRoleClient();
      return await getPublicSiteBranding(supabase);
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsShowroomPages(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const profileId = await this.getAuthedProfileId(request);
      const supabase = this.supabaseService.createServiceRoleClient();
      const payload = parseShowroomPagesUpdatePayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updateShowroomPagesSettingsForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsUsers(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const searchParams = searchParamsFromRequest(request);
      let serviceRoleClient: SupabaseClient | undefined;
      try {
        serviceRoleClient = this.supabaseService.createServiceRoleClient();
      } catch {
        serviceRoleClient = undefined;
      }

      return await listSettingsUsersForAdmin(supabase, {
        actorProfileId: profileId,
        query: { branchId: parseString(searchParams.get('branchId')) },
        serviceRoleClient,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postSettingsUser(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseCreateUserPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const serviceRoleClient = this.supabaseService.createServiceRoleClient();
      return await createSettingsUserForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
        serviceRoleClient,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsUser(
    request: Request,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseUpdateUserPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const serviceRoleClient = this.supabaseService.createServiceRoleClient();
      return await updateSettingsUserForAdmin(supabase, {
        actorProfileId: profileId,
        userId,
        payload,
        serviceRoleClient,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postSettingsUserResetPassword(
    request: Request,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseResetUserPasswordPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const serviceRoleClient = this.supabaseService.createServiceRoleClient();
      return await triggerUserPasswordResetForAdmin(supabase, {
        actorProfileId: profileId,
        userId,
        payload,
        serviceRoleClient,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsBranches(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      return await listBranchesForAdmin(supabase, {
        actorProfileId: profileId,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsBranchShopDomainCheck(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const searchParams = searchParamsFromRequest(request);

      const query: SettingsBranchShopDomainCheckQuery = {
        branchId: parseString(searchParams.get('branchId')) ?? '',
        shopDomain: parseString(searchParams.get('shopDomain')) ?? '',
      };

      if (!query.branchId || !query.shopDomain) {
        throw new BadRequestException({
          error: 'Invalid branchId/shopDomain query',
        });
      }

      return await checkBranchShopDomainForAdmin(supabase, {
        actorProfileId: profileId,
        query,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postSettingsBranch(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseCreateBranchPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await createBranchForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsBranch(
    request: Request,
    branchId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const profileId = await this.getAuthedProfileId(request);
      const supabase = this.supabaseService.createServiceRoleClient();
      const payload = parseUpdateBranchPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updateBranchForAdmin(supabase, {
        actorProfileId: profileId,
        branchId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsProductCategories(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const searchParams = searchParamsFromRequest(request);

      const query: SettingsProductCategoriesQuery = {
        branchId: parseString(searchParams.get('branchId')),
      };

      return await listProductCategoriesForAdmin(supabase, {
        actorProfileId: profileId,
        query,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postSettingsProductCategory(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseCreateProductCategoryPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await createProductCategoryForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsProductCategory(
    request: Request,
    productCategoryId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseUpdateProductCategoryPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updateProductCategoryForAdmin(supabase, {
        actorProfileId: profileId,
        productCategoryId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async deleteSettingsProductCategory(
    request: Request,
    productCategoryId: string,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      return await deleteProductCategoryForAdmin(supabase, {
        actorProfileId: profileId,
        productCategoryId,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async getSettingsShowrooms(request: Request): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      return await listShowroomsForAdmin(supabase, {
        actorProfileId: profileId,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async postSettingsShowroom(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseCreateShowroomPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await createShowroomForAdmin(supabase, {
        actorProfileId: profileId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async patchSettingsShowroom(
    request: Request,
    showroomId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      const payload = parseUpdateShowroomPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      return await updateShowroomForAdmin(supabase, {
        actorProfileId: profileId,
        showroomId,
        payload,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }

  async deleteSettingsShowroom(
    request: Request,
    showroomId: string,
  ): Promise<unknown> {
    try {
      const { supabase, profileId } = await this.getAuthedClient(request);
      return await deleteShowroomForAdmin(supabase, {
        actorProfileId: profileId,
        showroomId,
      });
    } catch (error) {
      throwKnownSettingsHttpError(error);
    }
  }
}
