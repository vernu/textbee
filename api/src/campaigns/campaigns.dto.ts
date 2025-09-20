import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsNotEmpty, IsMongoId, IsArray } from 'class-validator'

export class CreateMessageTemplateGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string
}

export class UpdateMessageTemplateGroupDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string
}

export class CreateMessageTemplateDto {
  @ApiProperty()
  @IsMongoId()
  groupId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string
}

export class UpdateMessageTemplateDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string
}

export class ReorderTemplateGroupsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  templateGroupIds: string[]
}

export class MessageTemplateResponseDto {
  @ApiProperty()
  _id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  groupId: string

  @ApiProperty()
  name: string

  @ApiProperty()
  content: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}

export class MessageTemplateGroupResponseDto {
  @ApiProperty()
  _id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  name: string

  @ApiProperty({ required: false })
  description?: string

  @ApiProperty()
  order: number

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty({ type: [MessageTemplateResponseDto] })
  templates: MessageTemplateResponseDto[]
}