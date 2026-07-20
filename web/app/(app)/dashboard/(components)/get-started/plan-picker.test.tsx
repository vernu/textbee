import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlanPicker from './plan-picker'

const useSubscription = vi.fn()

vi.mock('@/lib/api', () => ({
  useSubscription: () => useSubscription(),
}))

beforeEach(() => {
  useSubscription.mockReturnValue({ data: { plan: { name: 'Free' } } })
})

describe('PlanPicker', () => {
  const renderPicker = (
    props?: Partial<React.ComponentProps<typeof PlanPicker>>
  ) =>
    render(
      <PlanPicker isLoading={false} isSaving={false} onSkip={() => {}} {...props} />
    )

  // The picker hardcoded Free and Pro inline, so Scale was invisible here no
  // matter what the pricing page offered.
  it('offers every self-serve tier, including Scale', () => {
    renderPicker()

    // By heading, since "Free" is also the Free tier's price.
    expect(
      screen.getAllByRole('heading').map((h) => h.textContent)
    ).toEqual(['Free', 'Pro', 'Scale'])
  })

  // The headline figure is the yearly per-month equivalent, so both it and the
  // month-to-month price are pinned. A customer must never see a price we do
  // not charge.
  it('leads with the yearly per-month price', () => {
    renderPicker()

    expect(screen.getByText('$8.33')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
  })

  it('still shows what the monthly option costs', () => {
    renderPicker()

    expect(
      screen.getByText('billed yearly at $99.99, or $9.99 monthly')
    ).toBeInTheDocument()
    expect(
      screen.getByText('billed yearly at $299.99, or $29.99 monthly')
    ).toBeInTheDocument()
  })

  it('quotes the yearly saving on each paid tier', () => {
    renderPicker()

    expect(screen.getAllByText('Save 17% yearly')).toHaveLength(2)
  })

  it('links each paid tier at its own checkout route', () => {
    renderPicker()

    expect(screen.getByRole('link', { name: /Upgrade to Pro/ })).toHaveAttribute(
      'href',
      '/checkout/pro'
    )
    expect(
      screen.getByRole('link', { name: /Upgrade to Scale/ })
    ).toHaveAttribute('href', '/checkout/scale')
  })

  it('marks the subscribed tier as current and does not sell it again', () => {
    useSubscription.mockReturnValue({ data: { plan: { name: 'Pro' } } })
    renderPicker()

    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Upgrade to Pro/ })
    ).not.toBeInTheDocument()
    // Other tiers stay available.
    expect(
      screen.getByRole('link', { name: /Upgrade to Scale/ })
    ).toBeInTheDocument()
  })

  it('matches the current plan regardless of casing or padding', () => {
    useSubscription.mockReturnValue({ data: { plan: { name: '  SCALE ' } } })
    renderPicker()

    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Upgrade to Scale/ })
    ).not.toBeInTheDocument()
  })

  it('renders without a subscription rather than blanking the step', () => {
    useSubscription.mockReturnValue({ data: undefined })
    renderPicker()

    expect(screen.getByRole('heading', { name: 'Scale' })).toBeInTheDocument()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
  })

  it('hides Skip once the step is done', () => {
    renderPicker({ isDone: true })
    expect(screen.queryByText(/Skip for now/)).not.toBeInTheDocument()
  })

  it('offers Skip while the step is unfinished', () => {
    renderPicker({ isDone: false })
    expect(screen.getByText(/Skip for now/)).toBeInTheDocument()
  })
})
