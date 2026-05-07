import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../common/config/app-config.service';
import { getAccessTokenFromRequest } from '../../common/supabase/request-token.util';
import { RefreshDto } from './dto/refresh.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthDataAccess } from './infrastructure/auth.data-access';

const INVALID_SIGN_IN_MESSAGE = 'Invalid credentials';
const EMAIL_SENDER_DISABLED_MESSAGE =
  'Email sender is disabled by configuration.';
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

@Injectable()
export class AuthService {
  constructor(
    private readonly config: AppConfigService,
    private readonly authDataAccess: AuthDataAccess,
  ) {}

  async signIn(payload: SignInDto): Promise<unknown> {
    const email = this.sanitizeText(payload.email)?.toLowerCase() ?? null;
    const phone = this.sanitizeText(payload.phone);
    const password = payload.password;

    if (!password || (!email && !phone)) {
      throw new BadRequestException({
        error: 'Email or phone and password are required',
      });
    }

    let signInEmail = email;
    if (!signInEmail && phone) {
      signInEmail = await this.authDataAccess.resolveEmailForPhoneSignIn(phone);
      if (!signInEmail) {
        throw new UnauthorizedException({ error: INVALID_SIGN_IN_MESSAGE });
      }
    }

    if (!signInEmail) {
      throw new UnauthorizedException({ error: INVALID_SIGN_IN_MESSAGE });
    }

    const { data, error } = await this.authDataAccess.signInWithPassword(
      signInEmail,
      password,
    );

    if (error || !data.session) {
      throw new UnauthorizedException({ error: INVALID_SIGN_IN_MESSAGE });
    }

    return { session: data.session, user: data.user };
  }

  async signUp(payload: SignUpDto, request: Request): Promise<unknown> {
    if (!this.isEmailSenderEnabled()) {
      throw new ServiceUnavailableException({
        error: EMAIL_SENDER_DISABLED_MESSAGE,
      });
    }

    const email = this.sanitizeText(payload.email);
    const password = this.sanitizeText(payload.password);
    if (!email || !password) {
      throw new BadRequestException({
        error: 'Email and password are required',
      });
    }

    const redirectTo = this.buildRedirectUrl(
      this.sanitizeText(request.headers.origin),
    );

    const { data, error } = await this.authDataAccess.signUpWithPassword(
      email,
      password,
      redirectTo,
    );

    if (error) {
      throw new BadRequestException({ error: error.message });
    }

    return { session: data.session ?? null, user: data.user ?? null };
  }

  async refresh(payload: RefreshDto): Promise<unknown> {
    const refreshToken = this.sanitizeText(payload.refresh_token);
    if (!refreshToken) {
      throw new BadRequestException({ error: 'Refresh token is required' });
    }

    const { data, error } =
      await this.authDataAccess.refreshSession(refreshToken);
    if (error || !data.session) {
      throw new UnauthorizedException({
        error: error?.message ?? 'Refresh failed',
      });
    }

    return { session: data.session, user: data.user ?? null };
  }

  async signOut(request: Request): Promise<{ success: boolean }> {
    const token = getAccessTokenFromRequest(request, this.config.supabaseUrl);
    if (!token) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }

    const { error } = await this.authDataAccess.signOut(token);
    if (error) {
      throw new BadRequestException({ error: error.message });
    }

    return { success: true };
  }

  async deleteAccount(request: Request): Promise<{ success: boolean }> {
    const token = getAccessTokenFromRequest(request, this.config.supabaseUrl);
    if (!token) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }

    const { data: authUser, error: authError } =
      await this.authDataAccess.getAuthUserByToken(token);

    if (authError || !authUser.user) {
      throw new UnauthorizedException({
        error: authError?.message ?? 'Unauthorized',
      });
    }

    const userId = authUser.user.id;

    await this.authDataAccess.deleteTransactionsByUserId(userId);
    await this.authDataAccess.deleteCategoriesByUserId(userId);
    await this.authDataAccess.deleteAuthUserById(userId);

    return { success: true };
  }

  async getUserContext(request: Request): Promise<unknown> {
    const token = getAccessTokenFromRequest(request, this.config.supabaseUrl);
    if (!token) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }

    try {
      const context = await this.authDataAccess.getUserContextByToken(token);
      return {
        user: context.user,
        profile: context.profile,
        branch_access: context.branchAccess,
        warning: context.warning,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
        throw new UnauthorizedException({ error: 'Unauthorized' });
      }
      throw error;
    }
  }

  async resolveAuthUserFromRequest(request: Request): Promise<{
    userId: string;
    email: string | null;
    fullName: string | null;
  } | null> {
    const token = getAccessTokenFromRequest(request, this.config.supabaseUrl);
    if (!token) return null;

    return this.authDataAccess.resolveAuthUserFromToken(token);
  }

  private sanitizeText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseBooleanFlag(value: string | null | undefined): boolean | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (TRUE_VALUES.has(normalized)) return true;
    if (FALSE_VALUES.has(normalized)) return false;
    return null;
  }

  private isEmailSenderEnabled(): boolean {
    const privateFlag = this.parseBooleanFlag(
      this.sanitizeText(process.env.ENABLED_EMAIL_SENDER),
    );
    if (privateFlag !== null) return privateFlag;

    return (
      this.parseBooleanFlag(
        this.sanitizeText(process.env.NEXT_PUBLIC_ENABLED_EMAIL_SENDER),
      ) ?? false
    );
  }

  private buildRedirectUrl(origin: string | null): string | undefined {
    const fallback = this.sanitizeText(process.env.NEXT_PUBLIC_SITE_URL);
    return fallback ?? origin ?? undefined;
  }
}
