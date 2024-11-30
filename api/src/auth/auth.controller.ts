import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import {
  LoginInputDTO,
  RegisterInputDTO,
  RequestResetPasswordInputDTO,
  ResetPasswordInputDTO,
} from './auth.dto'
import { AuthGuard } from './guards/auth.guard'
import { AuthService } from './auth.service'
import { CanModifyApiKey } from './guards/can-modify-api-key.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login' })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() input: LoginInputDTO) {
    const data = await this.authService.login(input)
    return { data }
  }

  @ApiOperation({ summary: 'Login With Google' })
  @HttpCode(HttpStatus.OK)
  @Post('/google-login')
  async googleLogin(@Body() input: any) {
    const data = await this.authService.loginWithGoogle(input.idToken)
    return { data }
  }

  @ApiOperation({ summary: 'Register' })
  @Post('/register')
  async register(@Body() input: RegisterInputDTO) {
    const data = await this.authService.register(input)
    return { data }
  }

  @ApiOperation({ summary: 'Get current logged in user' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/who-am-i')
  async whoAmI(@Request() req) {
    return { data: req.user }
  }

  @ApiOperation({ summary: 'Update Profile' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('/update-profile')
  async updateProfile(
    @Body() input: { name: string; phone: string },
    @Request() req,
  ) {
    return await this.authService.updateProfile(input, req.user)
  }

  @ApiOperation({ summary: 'Change Password' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('/change-password')
  async changePassword(
    @Body() input: { oldPassword: string; newPassword: string },
    @Request() req,
  ) {
    return await this.authService.changePassword(input, req.user)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generate Api Key' })
  @ApiBearerAuth()
  @Post('/api-keys')
  async generateApiKey(@Request() req) {
    const { apiKey, message } = await this.authService.generateApiKey(req.user)
    return { data: apiKey, message }
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get Api Key List (masked***)' })
  @ApiBearerAuth()
  @Get('/api-keys')
  async getApiKey(@Request() req) {
    const data = await this.authService.getUserApiKeys(req.user)
    return { data }
  }

  @UseGuards(AuthGuard, CanModifyApiKey)
  @ApiOperation({ summary: 'Delete Api Key' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Delete('/api-keys/:id')
  async deleteApiKey(@Param() params) {
    await this.authService.deleteApiKey(params.id)
    return { message: 'API Key Deleted' }
  }

  @UseGuards(AuthGuard, CanModifyApiKey)
  @ApiOperation({ summary: 'Revoke Api Key' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('/api-keys/:id/revoke')
  async revokeApiKey(@Param() params) {
    await this.authService.revokeApiKey(params.id)
    return { message: 'API Key Revoked' }
  }

  @UseGuards(AuthGuard, CanModifyApiKey)
  @ApiOperation({ summary: 'Rename Api Key' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Patch('/api-keys/:id/rename')
  async renameApiKey(@Param() params, @Body() input: { name: string }) {
    await this.authService.renameApiKey(params.id, input.name)
    return { message: 'API Key Renamed' }
  }

  @ApiOperation({ summary: 'Request Password Reset' })
  @HttpCode(HttpStatus.OK)
  @Post('/request-password-reset')
  async requestPasswordReset(@Body() input: RequestResetPasswordInputDTO) {
    return await this.authService.requestResetPassword(input)
  }

  @ApiOperation({ summary: 'Reset Password' })
  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  async resetPassword(@Body() input: ResetPasswordInputDTO) {
    return await this.authService.resetPassword(input)
  }
}
