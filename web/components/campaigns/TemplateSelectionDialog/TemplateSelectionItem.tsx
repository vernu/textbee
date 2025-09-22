'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { MessageTemplate } from '@/components/campaigns/types/campaign.types'

interface TemplateSelectionItemProps {
  template: MessageTemplate
  isSelected: boolean
  onToggle: () => void
}

export function TemplateSelectionItem({
  template,
  isSelected,
  onToggle
}: TemplateSelectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className='border border-muted rounded p-2'>
      <div className='flex items-start space-x-2'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
        />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between'>
            <span className='font-medium text-sm truncate pr-2'>{template.name}</span>
            <div className='flex items-center space-x-2 shrink-0'>
              <Badge variant='secondary' className='text-xs'>
                {template.content.length} chars
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                className='p-1 h-6 w-6'
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className='h-3 w-3' />
              </Button>
            </div>
          </div>
          <div
            className={`text-xs text-muted-foreground mt-1 transition-all duration-200 ${
              isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
            }`}
            style={{ maxHeight: isExpanded ? '200px' : '20px', overflow: isExpanded ? 'auto' : 'hidden' }}
          >
            {template.content}
          </div>
        </div>
      </div>
    </div>
  )
}