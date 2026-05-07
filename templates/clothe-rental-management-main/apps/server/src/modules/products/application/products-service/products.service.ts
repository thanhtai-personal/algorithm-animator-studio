import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../../../common/config/app-config.service';
import { SupabaseService } from '../../../../common/supabase/supabase.service';
import { AuthService } from '../../../auth/auth.service';
import {
  addProductItemsForAdmin,
  createProductForAdmin,
  deleteProductForAdmin,
  deleteProductItemForAdmin,
  fetchProfileRole,
  getShowroomProductDetail,
  getProductDetailForAdmin,
  listProductsForAdmin,
  listProductsForShowroom,
  updateProductItemForAdmin,
  updateProductOverviewForAdmin,
  updateProductPricingForAdmin,
} from '../../infrastructure/products.data-access';
import type {
  CreateProductPayload,
  ShowroomProductDetailQuery,
  ShowroomProductsQuery,
} from '../../types/products-catalog.type';
import {
  DEFAULT_PAGE_SIZE,
  MANUAL_VARIANT_MUTATION_DISABLED_CODE,
  MAX_PAGE_SIZE,
  parseBoolean,
  parseCommaSeparatedIds,
  parseGender,
  parseGenderList,
  parseInteger,
  parseNonNegativeNumber,
  parseOptionalBoolean,
  parseOverviewPayload,
  parsePricingPayload,
  parseProductCategoryIdFromRecord,
  parseProductCategoryIdFromSearchParams,
  parseProductItemsPayload,
  parseString,
  parseStringArray,
  parseTagIds,
  parseUpdateProductItemPayload,
  PRICING_EDITOR_ROLE_SET,
  PRODUCT_DELETE_ROLE_SET,
} from './helpers';
import { getSearchParams } from './errors';
import {
  canAccessSensitiveProductOverviewForUser,
  getAuthenticatedClientForProducts,
  throwKnownProductsServiceError,
  throwManualVariantMutationDisabled,
} from './runtime-helpers';
@Injectable()
export class ProductsService {
  constructor(
    private readonly config: AppConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getProducts(request: Request): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const searchParams = getSearchParams(request);
      const page = parseInteger(searchParams.get('page'), 1);
      const pageSize = Math.min(
        parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
        MAX_PAGE_SIZE,
      );

      return await listProductsForAdmin(supabase, {
        branchId: parseString(searchParams.get('branchId')),
        search: parseString(searchParams.get('search')),
        productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
        tagId: parseString(searchParams.get('tagId')),
        hasReadyItems: parseBoolean(searchParams.get('hasReadyItems')),
        page,
        pageSize,
        allowSensitivePricing,
      });
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async getShowroomProducts(request: Request): Promise<unknown> {
    try {
      const searchParams = getSearchParams(request);
      const query: ShowroomProductsQuery = {
        showroomSlug: parseString(searchParams.get('showroomSlug')),
        branchId: parseString(searchParams.get('branchId')),
        branchSlug: parseString(searchParams.get('branchSlug')),
        shopDomain: parseString(searchParams.get('shopDomain')),
        search: parseString(searchParams.get('search')) ?? undefined,
        productCategoryId: parseProductCategoryIdFromSearchParams(searchParams),
        productCategoryIds: parseCommaSeparatedIds(
          searchParams.get('productCategoryIds') ??
            searchParams.get('categoryIds'),
        ),
        tagId: parseString(searchParams.get('tagId')),
        gender: parseGender(searchParams.get('gender')) ?? null,
        genders: parseGenderList(searchParams.get('genders')),
        size: parseString(searchParams.get('size')),
        sizes: parseCommaSeparatedIds(searchParams.get('sizes')),
        color: parseString(searchParams.get('color')),
        productIds: parseCommaSeparatedIds(searchParams.get('productIds')),
        preferRecentIntake: parseBoolean(
          searchParams.get('preferRecentIntake'),
        ),
        page: parseInteger(searchParams.get('page'), 1),
        pageSize: Math.min(
          parseInteger(searchParams.get('pageSize'), 18),
          MAX_PAGE_SIZE,
        ),
      };

      const supabase = this.supabaseService.createServiceRoleClient();
      return await listProductsForShowroom(supabase, { query });
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async getShowroomProductDetail(
    request: Request,
    productId: string,
  ): Promise<unknown> {
    try {
      const searchParams = getSearchParams(request);
      const query: ShowroomProductDetailQuery = {
        showroomSlug: parseString(searchParams.get('showroomSlug')),
        branchId: parseString(searchParams.get('branchId')),
        branchSlug: parseString(searchParams.get('branchSlug')),
        shopDomain: parseString(searchParams.get('shopDomain')),
      };

      const supabase = this.supabaseService.createServiceRoleClient();
      const payload = await getShowroomProductDetail(supabase, {
        productId,
        query,
      });

      if (!payload) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return payload;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async createProduct(
    request: Request,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const productCode = parseString(body.productCode);
      const name = parseString(body.name);
      if (!productCode || !name) {
        throw new BadRequestException({
          error: 'productCode and name are required',
        });
      }

      const rentPricePerDay = parseNonNegativeNumber(body.rentPricePerDay);
      const quickRentPrice = parseNonNegativeNumber(body.quickRentPrice);
      const rentDepositAmount = parseNonNegativeNumber(body.rentDepositAmount);
      const salePrice = parseNonNegativeNumber(body.salePrice);
      const purchasePrice = parseNonNegativeNumber(body.purchasePrice);
      const isRentable = parseOptionalBoolean(body.isRentable);
      const isSaleable = parseOptionalBoolean(body.isSaleable);

      if (
        (Object.prototype.hasOwnProperty.call(body, 'rentPricePerDay') &&
          rentPricePerDay === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'quickRentPrice') &&
          quickRentPrice === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'rentDepositAmount') &&
          rentDepositAmount === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'salePrice') &&
          salePrice === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'purchasePrice') &&
          purchasePrice === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'isRentable') &&
          isRentable === undefined) ||
        (Object.prototype.hasOwnProperty.call(body, 'isSaleable') &&
          isSaleable === undefined)
      ) {
        throw new BadRequestException({
          error: 'Invalid product overview payload',
        });
      }

      if (
        Object.prototype.hasOwnProperty.call(body, 'purchasePrice') &&
        purchasePrice !== null &&
        !allowSensitivePricing
      ) {
        throw new ForbiddenException({ error: 'Forbidden' });
      }

      const hasItemsField = Object.prototype.hasOwnProperty.call(body, 'items');
      const parsedItemsPayload = hasItemsField
        ? parseProductItemsPayload(body)
        : null;
      if (hasItemsField && !parsedItemsPayload) {
        throw new BadRequestException({
          error: 'Invalid product items payload',
        });
      }

      const payload: CreateProductPayload = {
        branchId: parseString(body.branchId),
        productCode,
        name,
        productCategoryId: parseProductCategoryIdFromRecord(body),
        gender: parseGender(body.gender) ?? null,
        material: parseString(body.material),
        description: parseString(body.description),
        coverImagePath: parseString(body.coverImagePath),
        galleryImagePaths: parseStringArray(body.galleryImagePaths) ?? [],
        videoUrls: parseStringArray(body.videoUrls) ?? [],
        rentPricePerDay: rentPricePerDay ?? null,
        quickRentPrice: quickRentPrice ?? null,
        rentDepositAmount: rentDepositAmount ?? null,
        salePrice: salePrice ?? null,
        purchasePrice: allowSensitivePricing ? (purchasePrice ?? null) : null,
        isRentable: isRentable ?? true,
        isSaleable: isSaleable ?? false,
        tagIds: parseTagIds(body.tagIds) ?? [],
        isActive: parseOptionalBoolean(body.isActive) ?? true,
        items: parsedItemsPayload?.items ?? [],
      };

      return await createProductForAdmin(supabase, userId, payload, {
        allowSensitivePricing,
      });
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async getProductDetail(
    request: Request,
    productId: string,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const detail = await getProductDetailForAdmin(supabase, productId, {
        allowSensitivePricing,
      });
      if (!detail) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async updateProductOverview(
    request: Request,
    productId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const parsed = parseOverviewPayload(body);
      if (!parsed) {
        throw new BadRequestException({
          error: 'Invalid product overview payload',
        });
      }

      if (parsed.hasPurchasePriceField && !allowSensitivePricing) {
        throw new ForbiddenException({ error: 'Forbidden' });
      }

      const detail = await updateProductOverviewForAdmin(
        supabase,
        userId,
        productId,
        parsed.payload,
        {
          allowSensitivePricing,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async addProductItems(
    request: Request,
    productId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const payload = parseProductItemsPayload(body);
      if (!payload) {
        throw new BadRequestException({
          error: 'Invalid product items payload',
        });
      }

      const detail = await addProductItemsForAdmin(
        supabase,
        userId,
        productId,
        payload,
        {
          allowSensitivePricing,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async updateProductItem(
    request: Request,
    productId: string,
    itemId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const payload = parseUpdateProductItemPayload(body);
      if (!payload) {
        throw new BadRequestException({
          error: 'Invalid product item payload',
        });
      }

      const detail = await updateProductItemForAdmin(
        supabase,
        userId,
        productId,
        itemId,
        payload,
        {
          allowSensitivePricing,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Item not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async deleteProductItem(
    request: Request,
    productId: string,
    itemId: string,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const allowSensitivePricing =
        await this.canAccessSensitiveProductOverview({
          supabase,
          userId,
        });

      const detail = await deleteProductItemForAdmin(
        supabase,
        userId,
        productId,
        itemId,
        {
          allowSensitivePricing,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Item not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  createProductVariant(request: Request, productId: string): unknown {
    void request;
    void productId;
    throwManualVariantMutationDisabled(MANUAL_VARIANT_MUTATION_DISABLED_CODE);
  }

  updateProductVariant(
    request: Request,
    productId: string,
    variantId: string,
  ): unknown {
    void request;
    void productId;
    void variantId;
    throwManualVariantMutationDisabled(MANUAL_VARIANT_MUTATION_DISABLED_CODE);
  }

  deleteProductVariant(
    request: Request,
    productId: string,
    variantId: string,
  ): unknown {
    void request;
    void productId;
    void variantId;
    throwManualVariantMutationDisabled(MANUAL_VARIANT_MUTATION_DISABLED_CODE);
  }

  async deleteProduct(request: Request, productId: string): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const role = await fetchProfileRole(supabase, userId);
      const normalizedRole = role?.trim().toLowerCase() ?? null;

      if (!normalizedRole || !PRODUCT_DELETE_ROLE_SET.has(normalizedRole)) {
        throw new ForbiddenException({ error: 'Forbidden' });
      }

      const isDeleted = await deleteProductForAdmin(
        supabase,
        userId,
        productId,
      );
      if (!isDeleted) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return { success: true };
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }

  async updateProductPricing(
    request: Request,
    productId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const { userId, supabase } = await this.getAuthenticatedClient(request);
      const role = await fetchProfileRole(supabase, userId);
      const normalizedRole = role?.trim().toLowerCase() ?? null;

      if (!normalizedRole || !PRICING_EDITOR_ROLE_SET.has(normalizedRole)) {
        throw new ForbiddenException({ error: 'Forbidden' });
      }

      const payload = parsePricingPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid pricing payload' });
      }

      const detail = await updateProductPricingForAdmin(
        supabase,
        userId,
        productId,
        payload,
        {
          allowSensitivePricing: true,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'Product not found' });
      }

      return detail;
    } catch (error) {
      throwKnownProductsServiceError(error);
    }
  }
  private getAuthenticatedClient(request: Request) {
    return getAuthenticatedClientForProducts({
      request,
      config: this.config,
      authService: this.authService,
      supabaseService: this.supabaseService,
    });
  }

  private canAccessSensitiveProductOverview(
    options: Parameters<typeof canAccessSensitiveProductOverviewForUser>[0],
  ): Promise<boolean> {
    return canAccessSensitiveProductOverviewForUser(options);
  }
}
