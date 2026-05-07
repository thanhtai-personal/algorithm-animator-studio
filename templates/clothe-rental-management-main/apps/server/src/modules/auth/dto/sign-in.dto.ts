import { IsOptional, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
