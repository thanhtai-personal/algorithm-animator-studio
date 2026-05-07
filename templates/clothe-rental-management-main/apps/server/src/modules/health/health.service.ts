import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../common/config/app-config.service';

type HealthStatus = 'ok' | 'degraded';

@Injectable()
export class HealthService {
  constructor(private readonly config: AppConfigService) {}

  getLiveness(): {
    status: 'ok';
    service: 'apps/server';
    timestamp: string;
  } {
    return {
      status: 'ok',
      service: 'apps/server',
      timestamp: new Date().toISOString(),
    };
  }

  getReadiness(): {
    status: HealthStatus;
    service: 'apps/server';
    checks: {
      supabaseEnv: boolean;
      apiBaseUrl: boolean;
      corsPolicy: boolean;
    };
    timestamp: string;
  } {
    const checks = {
      supabaseEnv: Boolean(
        this.config.supabaseUrl &&
        this.config.supabaseAnonKey &&
        this.config.supabaseServiceRoleKey,
      ),
      apiBaseUrl: Boolean(this.config.nestApiBaseUrl),
      corsPolicy:
        !this.config.isProduction || this.config.corsAllowedOrigins.length > 0,
    };

    return {
      status:
        checks.supabaseEnv && checks.apiBaseUrl && checks.corsPolicy
          ? 'ok'
          : 'degraded',
      service: 'apps/server',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
