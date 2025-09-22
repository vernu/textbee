'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { TemplateSelectionItem } from './TemplateSelectionItem'
import {
  MessageTemplateGroup,
  MessageTemplate,
  CreateCampaignData
} from '@/components/campaigns/types/campaign.types'

interface TemplateSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateGroups: MessageTemplateGroup[]
  campaignData: CreateCampaignData
  onCampaignDataChange: (data: CreateCampaignData | ((prev: CreateCampaignData) => CreateCampaignData)) => void
  expandedGroups: Set<string>
  onExpandedGroupsChange: (groups: Set<string>) => void
}

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  templateGroups,
  campaignData,
  onCampaignDataChange,
  expandedGroups,
  onExpandedGroupsChange
}: TemplateSelectionDialogProps) {
  // Auto-expand groups when templates are selected
  useEffect(() => {
    if (campaignData.selectedTemplates.length > 0) {
      const groupsWithSelectedTemplates = new Set<string>()

      campaignData.selectedTemplates.forEach(templateId => {
        for (const group of templateGroups) {
          const template = group.templates.find(t => t._id === templateId)
          if (template) {
            groupsWithSelectedTemplates.add(group._id)
            break
          }
        }
      })

      onExpandedGroupsChange(groupsWithSelectedTemplates)
    }
  }, [campaignData.selectedTemplates, templateGroups, onExpandedGroupsChange])

  const handleGroupToggle = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (expandedGroups.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    onExpandedGroupsChange(newExpanded)
  }

  const handleGroupSelectAll = (group: MessageTemplateGroup, checked: boolean) => {
    const groupTemplates = group.templates || []

    if (checked) {
      // Select all templates in group
      const newSelected = [...campaignData.selectedTemplates]
      groupTemplates.forEach(template => {
        if (!newSelected.includes(template._id)) {
          newSelected.push(template._id)
        }
      })
      onCampaignDataChange(prev => ({ ...prev, selectedTemplates: newSelected }))
    } else {
      // Deselect all templates in group
      const templateIds = groupTemplates.map(t => t._id)
      onCampaignDataChange(prev => ({
        ...prev,
        selectedTemplates: prev.selectedTemplates.filter(id => !templateIds.includes(id))
      }))
    }
  }

  const handleTemplateToggle = (templateId: string) => {
    const isSelected = campaignData.selectedTemplates.includes(templateId)

    if (isSelected) {
      onCampaignDataChange(prev => ({
        ...prev,
        selectedTemplates: prev.selectedTemplates.filter(id => id !== templateId)
      }))
    } else {
      onCampaignDataChange(prev => ({
        ...prev,
        selectedTemplates: [...prev.selectedTemplates, templateId]
      }))
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[700px] max-h-[90vh] max-w-none overflow-hidden flex flex-col'>
        <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
          <DialogTitle>Select Message Templates</DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-4 min-h-0'>
          {templateGroups.length === 0 ? (
            <div className='text-center text-muted-foreground py-8'>
              <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>No template groups available</p>
              <p className='text-xs'>Create template groups and templates first</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {templateGroups.map(group => {
                const isGroupExpanded = expandedGroups.has(group._id)
                const groupTemplates = group.templates || []
                const selectedInGroup = groupTemplates.filter(t => campaignData.selectedTemplates.includes(t._id))
                const allGroupSelected = groupTemplates.length > 0 && selectedInGroup.length === groupTemplates.length
                const someGroupSelected = selectedInGroup.length > 0 && selectedInGroup.length < groupTemplates.length

                return (
                  <div key={group._id} className='border rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='p-1 h-6 w-6'
                          onClick={() => handleGroupToggle(group._id)}
                        >
                          {isGroupExpanded ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                        </Button>
                        <Checkbox
                          checked={allGroupSelected}
                          indeterminate={someGroupSelected}
                          onCheckedChange={(checked) => handleGroupSelectAll(group, checked as boolean)}
                        />
                        <div className='flex-1'>
                          <div className='font-medium text-sm'>{group.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            {groupTemplates.length} template(s) • {selectedInGroup.length} selected
                          </div>
                        </div>
                      </div>
                    </div>

                    {isGroupExpanded && (
                      <div className='ml-6 space-y-2'>
                        {groupTemplates.map(template => (
                          <TemplateSelectionItem
                            key={template._id}
                            template={template}
                            isSelected={campaignData.selectedTemplates.includes(template._id)}
                            onToggle={() => handleTemplateToggle(template._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className='flex-shrink-0 border-t flex justify-between items-center p-4 pt-3'>
          <Button
            variant='outline'
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClose}
            disabled={campaignData.selectedTemplates.length === 0}
          >
            OK ({campaignData.selectedTemplates.length} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}