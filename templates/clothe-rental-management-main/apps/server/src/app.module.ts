import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MakeupModule } from './modules/makeup/makeup.module';
import { MediaModule } from './modules/media/media.module';
import { MiniAppModule } from './modules/mini-app/mini-app.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    CommonModule,
    HealthModule,
    AuthModule,
    MiniAppModule,
    SettingsModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    MakeupModule,
    ProcurementModule,
    MediaModule,
    OrdersModule,
    ReturnsModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
