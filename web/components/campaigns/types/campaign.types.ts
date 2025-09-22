// Campaign-related TypeScript interfaces and types
// This file contains all the type definitions used in the campaigns functionality

// ===== Core Campaign Types =====

export interface Campaign {
  _id: string
  id: string
  name: string
  status: 'active' | 'draft' | 'inactive' | 'completed'
  contacts: number
  groups: number
  dateCreated: string
  lastSent?: string
  description?: string
}

// ===== Campaign Creation Types =====

export type CampaignStatus = 'active' | 'draft' | 'inactive' | 'completed'

export type ScheduleType = 'now' | 'later' | 'windows' | 'weekday'

export interface SendingWindow {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

export interface WeekdayWindow {
  startTime: string
  endTime: string
}

export interface WeekdayWindows {
  monday: WeekdayWindow[]
  tuesday: WeekdayWindow[]
  wednesday: WeekdayWindow[]
  thursday: WeekdayWindow[]
  friday: WeekdayWindow[]
  saturday: WeekdayWindow[]
  sunday: WeekdayWindow[]
}

export interface WeekdayEnabled {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export interface CreateCampaignData {
  name: string
  description: string
  status: CampaignStatus
  selectedContacts: string[]
  selectedTemplates: string[]
  sendDevices: string[]
  scheduleType: ScheduleType
  scheduledDate: string
  scheduledTime: string
  campaignStartDate: string
  campaignEndDate: string
  sendingWindows: SendingWindow[]
  weekdayWindows: WeekdayWindows
  weekdayEnabled: WeekdayEnabled
}

// ===== Calendar Types =====

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  display?: 'background' | 'auto'
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  className?: string
}

// ===== Sorting and Filtering Types =====

export type CampaignMode = 'campaigns' | 'active' | 'draft' | 'inactive' | 'completed'

export type CampaignSortBy = 'name' | 'status' | 'contacts' | 'groups' | 'dateCreated' | 'lastSent'

export type SortOrder = 'asc' | 'desc'

export type GeneralSortBy = 'newest' | 'oldest' | 'a-z' | 'z-a'

// ===== Date Validation Types =====

export interface DateValidationErrors {
  startDateError: string
  endDateError: string
}

// ===== Template Management Types =====

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

// ===== API Response Types =====

export interface CreateTemplateGroupDto {
  name: string
  description?: string
}

export interface UpdateTemplateGroupDto {
  name?: string
  description?: string
}

export interface ReorderTemplateGroupsDto {
  templateGroupIds: string[]
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

// ===== Contact Integration Types =====

export interface ContactSpreadsheet {
  id: string
  originalFileName: string
  validContactsCount?: number
  contactCount: number
  uploadDate: string
}

// ===== UI State Types =====

export interface NewTemplateGroup {
  name: string
  description: string
}

export interface NewTemplate {
  groupId: string
  name: string
  content: string
}

// ===== Helper Types =====

export type WeekdayKey = keyof WeekdayWindows
export type WeekdayEnabledKey = keyof WeekdayEnabled

// ===== Status Configuration Types =====

export interface StatusConfig {
  dot: string
  text: string
}

export type StatusConfigMap = Record<CampaignStatus, StatusConfig>

// ===== Component Props Types =====

export interface SendingScheduleCalendarProps {
  campaignData: CreateCampaignData
}

// ===== Default Values =====

export const DEFAULT_WEEKDAY_ENABLED: WeekdayEnabled = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false
}

export const DEFAULT_WEEKDAY_WINDOWS: WeekdayWindows = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
}

export const DEFAULT_CREATE_CAMPAIGN_DATA: Omit<CreateCampaignData, 'campaignStartDate' | 'campaignEndDate'> = {
  name: '',
  description: '',
  status: 'draft',
  selectedContacts: [],
  selectedTemplates: [],
  sendDevices: [],
  scheduleType: 'now',
  scheduledDate: '',
  scheduledTime: '',
  sendingWindows: [],
  weekdayWindows: DEFAULT_WEEKDAY_WINDOWS,
  weekdayEnabled: DEFAULT_WEEKDAY_ENABLED
}

// ===== Utility Types =====

export type CampaignField = keyof Campaign
export type CreateCampaignField = keyof CreateCampaignData