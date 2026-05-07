import { Module } from '@nestjs/common';
import { MakeupService } from './application/makeup.service';
import { MakeupController } from './presentation/makeup.controller';

@Module({
  controllers: [MakeupController],
  providers: [MakeupService],
})
export class MakeupModule {}
