import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateMiniAppSessionDto {
  @IsString()
  @MinLength(1)
  zaloUserId!: string;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  consentScopes?: string[];

  @IsOptional()
  @IsString()
  zaloAccessToken?: string | null;
}
