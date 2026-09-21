import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  brandLogoUrl?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'brandPrimaryColor deve ser uma cor hexadecimal válida (ex: #e6b94e ou #fff)',
  })
  brandPrimaryColor?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'brandBackgroundColor deve ser uma cor hexadecimal válida (ex: #0c0a08 ou #000)',
  })
  brandBackgroundColor?: string | null;

  // Optional aliases for frontend convenience
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'primaryColor deve ser uma cor hexadecimal válida (ex: #e6b94e ou #fff)',
  })
  primaryColor?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'backgroundColor deve ser uma cor hexadecimal válida (ex: #0c0a08 ou #000)',
  })
  backgroundColor?: string | null;
}

export interface BrandingResponseDto {
  brandLogoUrl: string | null;
  brandPrimaryColor: string | null;
  brandBackgroundColor: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
}
