import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export enum SupportCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING_AND_PAYMENTS = 'billing-and-payments',
  ACCOUNT_DELETION = 'account-deletion',
  OTHER = 'other',
}

export class CreateSupportMessageDto {
  @IsOptional()
  @IsString()
  user?: string

  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsNotEmpty()
  @IsEnum(SupportCategory)
  category: SupportCategory

  @IsNotEmpty()
  @IsString()
  message: string

  @IsOptional()
  @IsString()
  ip?: string

  @IsOptional()
  @IsString()
  userAgent?: string
}
