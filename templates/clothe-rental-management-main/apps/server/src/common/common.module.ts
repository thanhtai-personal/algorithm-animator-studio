import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import { SupabaseService } from './supabase/supabase.service';

@Global()
@Module({
  providers: [AppConfigService, SupabaseService],
  exports: [AppConfigService, SupabaseService],
})
export class CommonModule {}
