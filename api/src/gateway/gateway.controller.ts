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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthGuard } from '../auth/guards/auth.guard'
import {
  ReceivedSMSDTO,
  RegisterDeviceInputDTO,
  RetrieveSMSResponseDTO,
  SendBulkSMSInputDTO,
  SendSMSInputDTO,
  UpdateSMSStatusDTO,
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
  @Post('/devices')
  async registerDevice(@Body() input: RegisterDeviceInputDTO, @Request() req) {
    const data = await this.gatewayService.registerDevice(input, req.user)
    return { data }
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List of registered devices' })
  @Get('/devices')
  async getDevices(@Request() req) {
    const data = await this.gatewayService.getDevicesForUser(req.user)
    return { data }
  }

  @ApiOperation({ summary: 'Update device' })
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
  @UseGuards(AuthGuard, CanModifyDevice)
  @Delete('/devices/:id')
  async deleteDevice(@Param('id') deviceId: string) {
    const data = await this.gatewayService.deleteDevice(deviceId)
    return { data }
  }

  @ApiOperation({ summary: 'Send SMS to a device' })
  @UseGuards(AuthGuard, CanModifyDevice)
  // deprecate sendSMS route in favor of send-sms, but allow both to prevent breaking changes
  @Post(['/devices/:id/sendSMS', '/devices/:id/send-sms'])
  async sendSMS(
    @Param('id') deviceId: string,
    @Body() smsData: SendSMSInputDTO,
  ) {
    const data = await this.gatewayService.sendSMS(deviceId, smsData)
    return { data }
  }

  @ApiOperation({ summary: 'Send Bulk SMS' })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Post(['/devices/:id/send-bulk-sms'])
  async sendBulkSMS(
    @Param('id') deviceId: string,
    @Body() body: SendBulkSMSInputDTO,
  ) {
    const data = await this.gatewayService.sendBulkSMS(deviceId, body)
    return { data }
  }


  @ApiOperation({ summary: 'Received SMS from a device' })
  @HttpCode(HttpStatus.OK)
  // deprecate receiveSMS route in favor of receive-sms
  @Post(['/devices/:id/receiveSMS', '/devices/:id/receive-sms'])
  @UseGuards(AuthGuard, CanModifyDevice)
  async receiveSMS(@Param('id') deviceId: string, @Body() dto: ReceivedSMSDTO) {
    const data = await this.gatewayService.receiveSMS(deviceId, dto)
    return { data }
  }

  @ApiOperation({ summary: 'Get received SMS from a device' })
  @ApiResponse({ status: 200, type: RetrieveSMSResponseDTO })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 50, max: 100)' })
  @UseGuards(AuthGuard, CanModifyDevice)
  // deprecate getReceivedSMS route in favor of get-received-sms
  @Get(['/devices/:id/getReceivedSMS', '/devices/:id/get-received-sms'])
  async getReceivedSMS(
    @Param('id') deviceId: string,
    @Request() req,
  ): Promise<RetrieveSMSResponseDTO> {
    // Extract page and limit from query params, with defaults and max values
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 100) : 50;
    
    const result = await this.gatewayService.getReceivedSMS(deviceId, page, limit)
    return result;
  }

  @ApiOperation({ summary: 'Get message history (sent and received) from a device' })
  @ApiResponse({ status: 200, type: RetrieveSMSResponseDTO })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 50, max: 100)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by message type: all, sent, or received (default: all)' })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Get('/devices/:id/messages')
  async getMessages(
    @Param('id') deviceId: string,
    @Request() req,
  ): Promise<RetrieveSMSResponseDTO> {
    // Extract page and limit from query params, with defaults and max values
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 100) : 50;
    const type = req.query.type || '';
    
    const result = await this.gatewayService.getMessages(deviceId, type, page, limit);
    return result;
  }

  @ApiOperation({ summary: 'Update SMS status' })
  @UseGuards(AuthGuard, CanModifyDevice)
  @HttpCode(HttpStatus.OK)
  @Patch('/devices/:id/sms-status')
  async updateSMSStatus(
    @Param('id') deviceId: string,
    @Body() dto: UpdateSMSStatusDTO,
  ) {
    const data = await this.gatewayService.updateSMSStatus(deviceId, dto);
    return { data };
  }

  @ApiOperation({ summary: 'Get a single SMS by ID' })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Get('/devices/:id/sms/:smsId')
  async getSMSById(
    @Param('id') deviceId: string,
    @Param('smsId') smsId: string,
  ) {
    const data = await this.gatewayService.getSMSById(deviceId, smsId);
    return { data };
  }

  @ApiOperation({ summary: 'Get an SMS batch by ID with all its SMS messages' })
  @UseGuards(AuthGuard, CanModifyDevice)
  @Get('/devices/:id/sms-batch/:smsBatchId')
  async getSmsBatchById(
    @Param('id') deviceId: string,
    @Param('smsBatchId') smsBatchId: string,
  ) {
    const data = await this.gatewayService.getSmsBatchById(deviceId, smsBatchId);
    return { data };
  }
}
