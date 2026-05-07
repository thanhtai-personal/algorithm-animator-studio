import { Get, ServiceUnavailableException } from '@nestjs/common';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { HealthService } from './health.service';

@V1Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): { status: 'ok'; service: 'apps/server'; timestamp: string } {
    return this.healthService.getLiveness();
  }

  @Get('live')
  getLiveness(): { status: 'ok'; service: 'apps/server'; timestamp: string } {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  getReadiness(): {
    status: 'ok' | 'degraded';
    service: 'apps/server';
    checks: { supabaseEnv: boolean; apiBaseUrl: boolean; corsPolicy: boolean };
    timestamp: string;
  } {
    const readiness = this.healthService.getReadiness();
    if (readiness.status !== 'ok') {
      throw new ServiceUnavailableException({
        error: 'SERVICE_NOT_READY',
        checks: readiness.checks,
      });
    }
    return readiness;
  }
}
