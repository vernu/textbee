'use client'

import { Button } from '@/components/ui/button'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PageButton({
  page,
  isActive,
  onClick,
}: {
  page: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      variant={isActive ? 'default' : 'ghost'}
      size='icon'
      className={`h-8 w-8 rounded-full ${
        isActive
          ? 'bg-primary text-brand-foreground hover:bg-primary/90'
          : 'hover:bg-secondary'
      }`}
    >
      {page}
    </Button>
  )
}

// Numbered pagination with first/last anchors and ellipsis for long ranges.
export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Middle window: up to 6 pages between the pinned first and last buttons.
  const middlePages: number[] = []
  for (let i = 0; i < Math.min(6, totalPages - 2); i++) {
    let pageToShow: number
    if (totalPages <= 8) {
      pageToShow = i + 2
    } else if (page <= 4) {
      pageToShow = i + 2
    } else if (page >= totalPages - 3) {
      pageToShow = totalPages - 7 + i
    } else {
      pageToShow = page - 2 + i
    }
    if (pageToShow > 1 && pageToShow < totalPages) {
      middlePages.push(pageToShow)
    }
  }

  return (
    <div className='flex justify-center mt-6 space-x-2'>
      <Button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        variant={page === 1 ? 'ghost' : 'default'}
      >
        Previous
      </Button>

      <div className='flex flex-wrap items-center gap-2 justify-center sm:justify-start'>
        <PageButton
          page={1}
          isActive={page === 1}
          onClick={() => onPageChange(1)}
        />

        {page > 4 && totalPages > 7 && <span className='px-1'>...</span>}

        {middlePages.map((p) => (
          <PageButton
            key={p}
            page={p}
            isActive={page === p}
            onClick={() => onPageChange(p)}
          />
        ))}

        {page < totalPages - 3 && totalPages > 7 && (
          <span className='px-1'>...</span>
        )}

        <PageButton
          page={totalPages}
          isActive={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        />
      </div>

      <Button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        variant={page === totalPages ? 'ghost' : 'default'}
      >
        Next
      </Button>
    </div>
  )
}
