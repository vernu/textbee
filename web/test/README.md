# Testing

The web app has two test layers. **Both run against mocked API data. Tests must never point at a real backend.**

## Unit / component tests (Vitest + React Testing Library + MSW)

- Runner: [Vitest](https://vitest.dev) with jsdom.
- API mocking: [MSW](https://mswjs.io) node server (`test/msw/server.ts`) with handlers in `test/msw/handlers.ts`. Unhandled requests **throw** (`onUnhandledRequest: 'error'`), so a test can never silently reach a live backend.
- Render helper: `test/render.tsx` exposes `renderWithProviders` / `render`, which wrap components in the app providers (react-query with retries off, a mock `SessionProvider`). Import `render`, `screen`, `userEvent` from `@/test/render`.
- Fixtures: `test/fixtures.ts` is the single source of truth for mocked API data, shared with the e2e layer.

Commands:

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
pnpm coverage      # with coverage report
```

Place tests next to the code as `*.test.tsx` or under `__tests__/`.

## End-to-end tests (Playwright)

- Runner: [Playwright](https://playwright.dev), specs in `e2e/`.
- The real Next dev server boots on port 3100 with a fixed `NEXTAUTH_SECRET` and a backend URL (`localhost:3999`) that nothing listens on.
- `e2e/mock-api.ts` intercepts **every** `/api/v1/**` request and serves the shared fixtures, so no request can reach a real backend.
- `e2e/session.ts` mints a valid NextAuth session cookie so tests run authenticated without the real login flow.

Commands:

```bash
pnpm test:e2e      # headless
pnpm test:e2e:ui   # interactive UI
```

First-time setup downloads the browser: `pnpm exec playwright install chromium`.

## The rule

If a new screen calls a new endpoint, add a handler in `test/msw/handlers.ts` and a branch in `e2e/mock-api.ts`, both backed by a fixture in `test/fixtures.ts`. Never let a test hit the network.
