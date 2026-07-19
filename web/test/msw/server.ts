import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Single MSW server for all unit/component tests. Any request that is NOT
// matched by a handler throws, which enforces the rule that tests never reach
// a real backend.
export const server = setupServer(...handlers)
