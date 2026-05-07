import { IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;
}
