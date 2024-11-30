import { ApiProperty } from '@nestjs/swagger'

export class RegisterInputDTO {
  @ApiProperty({ type: String, required: true })
  name: string

  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String })
  phone?: string

  @ApiProperty({ type: String, required: true })
  password: string
}

export class LoginInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String, required: true })
  password: string
}

export class RequestResetPasswordInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string
}

export class ResetPasswordInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String, required: true })
  otp: string

  @ApiProperty({ type: String, required: true })
  newPassword: string
}
