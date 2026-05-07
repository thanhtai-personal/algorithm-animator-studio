import { Module } from '@nestjs/common';
import { ReturnsService } from './application/returns.service';
import { ReturnsController } from './presentation/returns.controller';

@Module({
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
