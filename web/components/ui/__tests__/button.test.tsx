import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { render, screen, userEvent } from '@/test/render'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Send SMS</Button>)
    expect(screen.getByRole('button', { name: 'Send SMS' })).toBeInTheDocument()
  })

  it('applies the destructive variant classes', () => {
    render(<Button variant='destructive'>Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-destructive'
    )
  })

  it('fires onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
