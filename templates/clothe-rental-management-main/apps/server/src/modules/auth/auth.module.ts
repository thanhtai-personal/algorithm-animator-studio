import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDataAccess } from './infrastructure/auth.data-access';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthDataAccess],
  exports: [AuthService],
})
export class AuthModule {}
