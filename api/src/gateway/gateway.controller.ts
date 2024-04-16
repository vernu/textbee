import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../auth/guards/auth.guard'
import {
  ReceivedSMSDTO,
  RegisterDeviceInputDTO,
  SendSMSInputDTO,
} from './gateway.dto'
import { GatewayService } from './gateway.service'
import { CanModifyDevice } from './guards/can-modify-device.guard'

@ApiTags('gateway')
@ApiBearerAuth()
@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @UseGuards(AuthGuard)
  @Get('/stats')
  async getStats(@Request() req) {
    const data = await this.gatewayService.getStatsForUser(req.user)
    return { data }
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Register device' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @Post('/devices')
  async registerDevice(@Body() input: RegisterDeviceInputDTO, @Request() req) {
    const data = await this.gatewayService.registerDevice(input, req.user)
    return { data }
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List of registered devices' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @Get('/devices')
  async getDevices(@Request() req) {
    const data = await this.gatewayService.getDevicesForUser(req.user)
    return { data }
  }

  @ApiOperation({ summary: 'Update device' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Patch('/devices/:id')
  async updateDevice(
    @Param('id') deviceId: string,
    @Body() input: RegisterDeviceInputDTO,
  ) {
    const data = await this.gatewayService.updateDevice(deviceId, input)
    return { data }
  }

  @ApiOperation({ summary: 'Delete device' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Delete('/devices/:id')
  async deleteDevice(@Param('id') deviceId: string) {
    const data = await this.gatewayService.deleteDevice(deviceId)
    return { data }
  }

  @ApiOperation({ summary: 'Send SMS to a device' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Post('/devices/:id/sendSMS')
  async sendSMS(
    @Param('id') deviceId: string,
    @Body() smsData: SendSMSInputDTO,
  ) {
    const data = await this.gatewayService.sendSMS(deviceId, smsData)
    return { data }
  }

  @ApiOperation({ summary: 'Received SMS from a device' })
  @ApiQuery({
    name: 'apiKey',
    required: false,
    description: 'Required if jwt bearer token not provided',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/devices/:id/receivedSMS')
  @UseGuards(AuthGuard, CanModifyDevice)
  async receivedSMS(
    @Param('id') deviceId: string,
    @Body() dto: ReceivedSMSDTO,
  ) {
    const data = await this.gatewayService.receivedSMS(deviceId, dto)
    return { data }
  }
}
