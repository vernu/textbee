'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TemplateItemProps {
  template: {
    name: string
    content: string
  }
  onRemove: () => void
}

export function TemplateItem({ template, onRemove }: TemplateItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTextClipped, setIsTextClipped] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkTextClipping = () => {
      if (textRef.current && !isExpanded) {
        const element = textRef.current
        const isClipped = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth
        setIsTextClipped(isClipped)
      }
    }

    checkTextClipping()

    // Check again when the window resizes
    window.addEventListener('resize', checkTextClipping)
    return () => window.removeEventListener('resize', checkTextClipping)
  }, [template.content, isExpanded])

  return (
    <div className='bg-gray-200 rounded p-2 border'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          <div className='text-xs font-medium mb-1'>{template.name}</div>
          <div className='flex items-start gap-1'>
            <div
              ref={textRef}
              className={`text-xs text-muted-foreground transition-all duration-200 flex-1 ${
                isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
              }`}
              style={{ maxHeight: isExpanded ? '200px' : '20px', overflow: isExpanded ? 'visible' : 'hidden' }}
            >
              {template.content}
            </div>
            {(isTextClipped || isExpanded) && (
              <Button
                variant='ghost'
                size='sm'
                className='p-0 h-4 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0'
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='p-0.5 h-5 w-5 text-muted-foreground hover:text-foreground'
          onClick={onRemove}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>
    </div>
  )
}