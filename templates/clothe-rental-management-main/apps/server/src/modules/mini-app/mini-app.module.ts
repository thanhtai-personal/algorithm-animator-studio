import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MiniAppAuthController } from './mini-app-auth.controller';
import { MiniAppMediaController } from './mini-app-media.controller';
import { MiniAppOrdersController } from './mini-app-orders.controller';
import { MiniAppPaymentsController } from './mini-app-payments.controller';
import { MiniAppReportsController } from './mini-app-reports.controller';
import { MiniAppSettingsController } from './mini-app-settings.controller';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';
import { MiniAppService } from './mini-app.service';

@Module({
  imports: [AuthModule],
  controllers: [
    MiniAppSettingsController,
    MiniAppAuthController,
    MiniAppOrdersController,
    MiniAppPaymentsController,
    MiniAppReportsController,
    MiniAppMediaController,
  ],
  providers: [MiniAppService, MiniAppExtensionsService],
})
export class MiniAppModule {}
