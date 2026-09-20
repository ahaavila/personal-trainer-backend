import { AlunoLevel, AlunoObjective } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'não informado' || value === '' || value === null) return undefined;
    return value;
  })
  @IsEnum(AlunoObjective)
  objective?: AlunoObjective;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'não informado' || value === '' || value === null) return undefined;
    return value;
  })
  @IsEnum(AlunoLevel)
  level?: AlunoLevel;
}
