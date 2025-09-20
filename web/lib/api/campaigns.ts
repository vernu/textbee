import httpBrowserClient from '../httpBrowserClient'
import { ApiEndpoints } from '@/config/api'

export interface MessageTemplate {
  _id: string
  userId: string
  groupId: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface MessageTemplateGroup {
  _id: string
  userId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  templates: MessageTemplate[]
}

export interface CreateTemplateGroupDto {
  name: string
  description?: string
}

export interface UpdateTemplateGroupDto {
  name?: string
  description?: string
}

export interface CreateTemplateDto {
  groupId: string
  name: string
  content: string
}

export interface UpdateTemplateDto {
  name?: string
  content?: string
}

export const campaignsApi = {
  // Template Groups
  async createTemplateGroup(data: CreateTemplateGroupDto): Promise<MessageTemplateGroup> {
    const response = await httpBrowserClient.post(ApiEndpoints.campaigns.templateGroups(), data)
    return response.data
  },

  async getTemplateGroups(): Promise<MessageTemplateGroup[]> {
    const response = await httpBrowserClient.get(ApiEndpoints.campaigns.templateGroups())
    return response.data
  },

  async getTemplateGroup(id: string): Promise<MessageTemplateGroup> {
    const response = await httpBrowserClient.get(ApiEndpoints.campaigns.templateGroup(id))
    return response.data
  },

  async updateTemplateGroup(id: string, data: UpdateTemplateGroupDto): Promise<MessageTemplateGroup> {
    const response = await httpBrowserClient.put(ApiEndpoints.campaigns.templateGroup(id), data)
    return response.data
  },

  async deleteTemplateGroup(id: string): Promise<void> {
    await httpBrowserClient.delete(ApiEndpoints.campaigns.templateGroup(id))
  },

  // Templates
  async createTemplate(data: CreateTemplateDto): Promise<MessageTemplate> {
    const response = await httpBrowserClient.post(ApiEndpoints.campaigns.templates(), data)
    return response.data
  },

  async getTemplates(groupId?: string): Promise<MessageTemplate[]> {
    const params = groupId ? { groupId } : {}
    const response = await httpBrowserClient.get(ApiEndpoints.campaigns.templates(), { params })
    return response.data
  },

  async getTemplate(id: string): Promise<MessageTemplate> {
    const response = await httpBrowserClient.get(ApiEndpoints.campaigns.template(id))
    return response.data
  },

  async updateTemplate(id: string, data: UpdateTemplateDto): Promise<MessageTemplate> {
    const response = await httpBrowserClient.put(ApiEndpoints.campaigns.template(id), data)
    return response.data
  },

  async deleteTemplate(id: string): Promise<void> {
    await httpBrowserClient.delete(ApiEndpoints.campaigns.template(id))
  },
}