'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { campaignsApi } from '@/lib/api/campaigns'
import {
  MessageTemplateGroup,
  MessageTemplate,
  NewTemplateGroup,
  NewTemplate
} from '@/components/campaigns/types/campaign.types'

// Utility function to extract variables from template content
function getVariables(content: string): string[] {
  const regex = /{[^}]+}/g
  const matches = content.match(regex)
  if (!matches) {
    return []
  }
  return Array.from(new Set(matches))
}

// Props interface for the ManageTemplatesDialog component
export interface ManageTemplatesDialogProps {
  // Dialog state
  open: boolean
  onOpenChange: (open: boolean) => void

  // Template groups data
  templateGroups: MessageTemplateGroup[]

  // Template group handlers
  onCreateTemplateGroup: (data: { name: string; description?: string }) => Promise<void>
  onDeleteTemplateGroup: (id: string) => Promise<void>
  onReorderTemplateGroups: (sourceIndex: number, destinationIndex: number) => Promise<void>

  // Template handlers
  onCreateTemplate: (data: { groupId: string; name: string; content: string }) => Promise<void>
  onUpdateTemplate: (id: string, data: { name: string; content: string }) => Promise<void>
  onDeleteTemplate: (id: string) => Promise<void>
}

export function ManageTemplatesDialog({
  open,
  onOpenChange,
  templateGroups,
  onCreateTemplateGroup,
  onDeleteTemplateGroup,
  onReorderTemplateGroups,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: ManageTemplatesDialogProps) {
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string | null>(null)
  const [createTemplateGroupOpen, setCreateTemplateGroupOpen] = useState(false)
  const [newTemplateGroup, setNewTemplateGroup] = useState<NewTemplateGroup>({
    name: '',
    description: ''
  })
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  })
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string
    groupId: string
    name: string
    content: string
  } | null>(null)
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)

  const { toast } = useToast()

  const handleCreateTemplateGroup = async () => {
    if (!newTemplateGroup.name.trim()) {
      toast({
        title: "Template group name required",
        description: "Please enter a name for the template group.",
        variant: "destructive"
      })
      return
    }

    try {
      await onCreateTemplateGroup({
        name: newTemplateGroup.name,
        description: newTemplateGroup.description || undefined,
      })

      setNewTemplateGroup({ name: '', description: '' })
      setCreateTemplateGroupOpen(false)

      toast({
        title: "Template group created",
        description: "New template group has been created successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error creating template group",
        description: error.response?.data?.message || "An error occurred while creating the template group.",
        variant: "destructive"
      })
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Template fields required",
        description: "Please enter both name and content for the template.",
        variant: "destructive"
      })
      return
    }

    if (!selectedTemplateGroup) {
      toast({
        title: "Select template group",
        description: "Please select a template group first.",
        variant: "destructive"
      })
      return
    }

    try {
      await onCreateTemplate({
        groupId: selectedTemplateGroup,
        name: newTemplate.name,
        content: newTemplate.content,
      })

      setNewTemplate({ name: '', content: '' })
      setCreateTemplateOpen(false)

      toast({
        title: "Template created",
        description: "New template has been created successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error creating template",
        description: error.response?.data?.message || "An error occurred while creating the template.",
        variant: "destructive"
      })
    }
  }

  const handleEditTemplate = (template: MessageTemplate, groupId: string) => {
    setEditingTemplate({
      id: template._id,
      groupId: groupId,
      name: template.name,
      content: template.content
    })
    setEditTemplateOpen(true)
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    if (!editingTemplate.name.trim() || !editingTemplate.content.trim()) {
      toast({
        title: "Template fields required",
        description: "Please enter both name and content for the template.",
        variant: "destructive"
      })
      return
    }

    try {
      await onUpdateTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        content: editingTemplate.content,
      })

      setEditingTemplate(null)
      setEditTemplateOpen(false)

      toast({
        title: "Template updated",
        description: "Template has been updated successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error updating template",
        description: error.response?.data?.message || "An error occurred while updating the template.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTemplateGroup = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will also delete all templates in this group. This action cannot be undone.`)) {
      try {
        await onDeleteTemplateGroup(id)
        setSelectedTemplateGroup(null)
        toast({
          title: "Template group deleted",
          description: "Template group deleted successfully. Links to contacts have been removed."
        })
      } catch (error: any) {
        toast({
          title: "Error deleting template group",
          description: error.response?.data?.message || "An error occurred while deleting the template group.",
          variant: "destructive"
        })
      }
    }
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await onDeleteTemplate(id)
        toast({
          title: "Template deleted",
          description: "Template has been deleted successfully."
        })
      } catch (error: any) {
        toast({
          title: "Error deleting template",
          description: error.response?.data?.message || "An error occurred while deleting the template.",
          variant: "destructive"
        })
      }
    }
  }

  const handleDragAndDrop = async (draggedIndex: number, targetIndex: number) => {
    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      try {
        await onReorderTemplateGroups(draggedIndex, targetIndex)
      } catch (error: any) {
        toast({
          title: "Error reordering template groups",
          description: error.response?.data?.message || "An error occurred while reordering template groups.",
          variant: "destructive"
        })
      }
    }

    setDraggedGroupId(null)
    setDragOverGroupId(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedTemplateGroup(null)
  }

  return (
    <>
      {/* Main Manage Templates Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-3xl h-[90vh] flex flex-col overflow-hidden'>
          <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
            <DialogTitle>Manage Templates</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 p-4 flex-1 min-h-0 flex flex-col'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0'>
              {/* Template Groups List */}
              <div className='border-r pr-4 h-full flex flex-col'>
                <div className='flex items-center justify-between flex-shrink-0 mb-4'>
                  <h3 className='text-base font-semibold'>Template Groups</h3>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={() => setCreateTemplateGroupOpen(true)}
                  >
                    <Plus className='h-4 w-4' />
                    New template group
                  </Button>
                </div>
                <div className='space-y-2 overflow-y-auto flex-1'>
                  {templateGroups.length === 0 ? (
                    <div className='text-center text-muted-foreground py-8'>
                      <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>No template groups yet</p>
                      <p className='text-xs'>Create your first template group to get started</p>
                    </div>
                  ) : (
                    templateGroups.map((group, index) => (
                      <div
                        key={group._id}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          setDragOverGroupId(group._id)
                        }}
                        onDragLeave={() => {
                          setDragOverGroupId(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()

                          const draggedIndex = templateGroups.findIndex(g => g._id === draggedGroupId)
                          const targetIndex = index

                          handleDragAndDrop(draggedIndex, targetIndex)
                        }}
                        className={cn(
                          'relative transition-all duration-200',
                          dragOverGroupId === group._id && draggedGroupId !== group._id ? 'transform translate-y-1' : ''
                        )}
                      >
                        <div
                          draggable
                          onDragStart={(e) => {
                            setDraggedGroupId(group._id)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', group._id)
                            e.currentTarget.style.opacity = '0.5'
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1'
                            setDraggedGroupId(null)
                            setDragOverGroupId(null)
                          }}
                          onClick={() => setSelectedTemplateGroup(group._id)}
                          className={cn(
                            'cursor-grab active:cursor-grabbing select-none group',
                            'w-full p-3 rounded-md border transition-colors',
                            selectedTemplateGroup === group._id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-accent hover:text-accent-foreground border-input'
                          )}
                        >
                          <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-2'>
                              <GripVertical className='h-4 w-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity' />
                              <span className='font-medium'>{group.name}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Badge variant={selectedTemplateGroup === group._id ? 'secondary' : 'outline'}>
                                {group.templates.length}
                              </Badge>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='p-1 h-6 w-6 text-muted-foreground hover:text-destructive'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTemplateGroup(group._id, group.name)
                                }}
                              >
                                <Trash2 className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {dragOverGroupId === group._id && draggedGroupId !== group._id && (
                          <div className='absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded' />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Templates in Selected Group */}
              <div className='pl-4 flex flex-col h-full min-h-0'>
                {selectedTemplateGroup && (
                  <>
                    <div className='flex justify-end mb-4 flex-shrink-0'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='gap-2'
                        onClick={() => setCreateTemplateOpen(true)}
                      >
                        <Plus className='h-4 w-4' />
                        New template
                      </Button>
                    </div>
                    <div className='space-y-2 overflow-y-auto flex-1 min-h-0 bg-muted rounded-lg p-4'>
                      {(() => {
                        const selectedGroup = templateGroups.find(g => g._id === selectedTemplateGroup)
                        const templates = selectedGroup?.templates || []

                        if (templates.length === 0) {
                          return (
                            <div className='flex items-center justify-center h-full text-center text-muted-foreground'>
                              <div>
                                <MessageSquare className='h-8 w-8 mx-auto mb-2 opacity-50' />
                                <p className='text-sm'>No templates in this group</p>
                                <p className='text-xs'>Add templates to see them here</p>
                              </div>
                            </div>
                          )
                        }

                        return templates.map(template => (
                          <div key={template._id} className='bg-white border rounded-lg p-3 space-y-2 shadow-sm group'>
                            <div className='flex items-center justify-between'>
                              <h5 className='font-medium text-sm'>{template.name}</h5>
                              <div className='flex items-center gap-1'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleEditTemplate(template, selectedTemplateGroup)}
                                >
                                  <Edit className='h-3 w-3' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  className='text-muted-foreground hover:text-destructive'
                                  onClick={() => handleDeleteTemplate(template._id, template.name)}
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                            <p className='text-xs text-muted-foreground bg-muted/50 p-2 rounded'>
                              {template.content}
                            </p>
                            <div className='text-xs text-muted-foreground'>
                              {(() => {
                                const variables = getVariables(template.content)
                                return variables.length > 0
                                  ? `Variables: ${variables.join(', ')}`
                                  : 'No variables used'
                              })()}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </>
                )}
                {!selectedTemplateGroup && (
                  <div className='text-center text-muted-foreground py-8 flex-1 flex items-center justify-center'>
                    <div>
                      Select a template group to view templates
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className='flex-shrink-0'>
            <Button
              variant='outline'
              onClick={handleClose}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Group Dialog */}
      <Dialog open={createTemplateGroupOpen} onOpenChange={setCreateTemplateGroupOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Create New Template Group</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='group-name' className='text-sm font-medium'>
                Group Name<span className='text-red-500'>*</span>
              </Label>
              <Input
                id='group-name'
                value={newTemplateGroup.name}
                onChange={(e) => setNewTemplateGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder='Enter group name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='group-description' className='text-sm font-medium'>
                Description
              </Label>
              <Textarea
                id='group-description'
                value={newTemplateGroup.description}
                onChange={(e) => setNewTemplateGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder='Enter group description (optional)'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateTemplateGroupOpen(false)
                setNewTemplateGroup({ name: '', description: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplateGroup}
              disabled={!newTemplateGroup.name.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='template-name' className='text-sm font-medium'>
                Template Name<span className='text-red-500'>*</span>
              </Label>
              <Input
                id='template-name'
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder='Enter template name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='template-content' className='text-sm font-medium'>
                Message Content<span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='template-content'
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder='Enter message content (use {firstName}, {lastName}, {phone} for variables)'
                rows={4}
              />
            </div>
            <div className='text-xs text-muted-foreground'>
              Available variables: {'{firstName}'}, {'{lastName}'}, {'{phone}'}, {'{email}'}, {'{propertyAddress}'}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateTemplateOpen(false)
                setNewTemplate({ name: '', content: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name.trim() || !newTemplate.content.trim()}
            >
              Add Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-template-name' className='text-sm font-medium'>
                Template Name<span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-template-name'
                value={editingTemplate?.name || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder='Enter template name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-template-content' className='text-sm font-medium'>
                Message Content<span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='edit-template-content'
                value={editingTemplate?.content || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder='Enter message content (use {firstName}, {lastName}, {phone} for variables)'
                rows={4}
              />
            </div>
            <div className='text-xs text-muted-foreground'>
              Available variables: {'{firstName}'}, {'{lastName}'}, {'{phone}'}, {'{email}'}, {'{propertyAddress}'}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditTemplateOpen(false)
                setEditingTemplate(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              disabled={!editingTemplate?.name.trim() || !editingTemplate?.content.trim()}
            >
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}