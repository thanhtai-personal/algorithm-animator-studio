import { Module } from '@nestjs/common';
import { PaymentsService } from './application/payments.service';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
