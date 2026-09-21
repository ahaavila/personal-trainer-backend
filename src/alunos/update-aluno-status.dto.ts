import { IsEnum, IsNotEmpty } from 'class-validator';
import { AlunoStatus } from '@prisma/client';

export class UpdateAlunoStatusDto {
  @IsNotEmpty()
  @IsEnum(AlunoStatus, {
    message: 'Status deve ser "ativo" ou "inativo"',
  })
  status!: AlunoStatus;
}
