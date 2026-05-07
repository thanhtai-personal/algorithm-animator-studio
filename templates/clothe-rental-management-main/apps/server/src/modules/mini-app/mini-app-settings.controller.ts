import { Get } from '@nestjs/common';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { MiniAppService } from './mini-app.service';

@V1Controller('settings')
export class MiniAppSettingsController {
  constructor(private readonly miniAppService: MiniAppService) {}

  @Get('public/mini-app-config')
  async getMiniAppConfig(): Promise<{ enabled: boolean }> {
    return this.miniAppService.getConfig();
  }
}
