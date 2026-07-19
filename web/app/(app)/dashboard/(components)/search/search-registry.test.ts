import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { searchEntries, searchGroupOrder } from './search-registry'

const DASHBOARD_DIR = join(process.cwd(), 'app', '(app)', 'dashboard')

// Routes that exist only to redirect elsewhere. They have no content of their
// own, so the destination is what belongs in search.
const REDIRECT_ONLY = new Set([
  '/dashboard/account',
  '/dashboard/account/change-password',
  '/dashboard/account/edit-profile',
  '/dashboard/account/get-support',
  '/dashboard/account/delete-account',
])

// Walk the App Router tree and derive the route for every page.tsx, skipping
// (group) segments the way Next does.
function collectRoutes(dir: string, route = '/dashboard'): string[] {
  const routes: string[] = []

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)

    if (statSync(full).isDirectory()) {
      // Route groups like (components) do not contribute a path segment, and
      // (components) holds implementation files rather than routes.
      const isGroup = entry.startsWith('(') && entry.endsWith(')')
      routes.push(...collectRoutes(full, isGroup ? route : `${route}/${entry}`))
      continue
    }

    if (entry === 'page.tsx') routes.push(route)
  }

  return routes
}

function isRedirectOnly(route: string): boolean {
  return REDIRECT_ONLY.has(route)
}

describe('search registry', () => {
  const hrefs = new Set(searchEntries.map((e) => e.href))

  it('covers every dashboard page that is not a pure redirect', () => {
    const routes = collectRoutes(DASHBOARD_DIR).filter((r) => !isRedirectOnly(r))
    const missing = routes.filter((r) => !hrefs.has(r))

    expect(
      missing,
      `these routes exist but are not searchable, add them to search-registry.ts: ${missing.join(', ')}`
    ).toEqual([])
  })

  it('does not list redirect-only routes', () => {
    const listedRedirects = [...hrefs].filter(isRedirectOnly)
    expect(listedRedirects).toEqual([])
  })

  it('has unique hrefs', () => {
    expect(hrefs.size).toBe(searchEntries.length)
  })

  it('gives every entry enough keywords to be findable', () => {
    for (const entry of searchEntries) {
      expect(
        entry.keywords.length,
        `${entry.label} needs at least 3 keywords`
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it('only uses groups that the palette renders', () => {
    for (const entry of searchEntries) {
      expect(searchGroupOrder).toContain(entry.group)
    }
  })

  it('marks off-site destinations as external', () => {
    for (const entry of searchEntries) {
      const isAbsolute = entry.href.startsWith('http')
      expect(
        Boolean(entry.external),
        `${entry.label} href is ${entry.href}`
      ).toBe(isAbsolute)
    }
  })

  it('finds bulk send by the words a user would actually type', () => {
    const bulk = searchEntries.find(
      (e) => e.href === '/dashboard/messaging/bulk'
    )
    expect(bulk).toBeDefined()
    for (const term of ['csv', 'import', 'campaign', 'spreadsheet']) {
      expect(bulk!.keywords).toContain(term)
    }
  })

  it('finds billing by invoice and quota wording', () => {
    const billing = searchEntries.find(
      (e) => e.href === '/dashboard/account/billing'
    )
    expect(billing).toBeDefined()
    for (const term of ['invoice', 'quota', 'upgrade', 'cancel']) {
      expect(billing!.keywords).toContain(term)
    }
  })
})

describe('search registry source', () => {
  it('is referenced by the command palette', () => {
    const palette = readFileSync(
      join(__dirname, 'command-menu.tsx'),
      'utf8'
    )
    expect(palette).toContain('search-registry')
  })
})
