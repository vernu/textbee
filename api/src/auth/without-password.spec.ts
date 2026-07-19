import { withoutPassword } from './auth.service'
import type { UserDocument } from '../users/schemas/user.schema'

// Fake document: only toObject() matters to the helper.
const doc = (fields: Record<string, unknown>) =>
  ({ toObject: () => ({ ...fields }) }) as unknown as UserDocument

describe('withoutPassword', () => {
  it('removes the password hash', () => {
    const safe = withoutPassword(
      doc({ email: 'a@b.com', password: '$2a$10$hashedvalue' })
    )

    expect(safe).not.toHaveProperty('password')
  })

  it('keeps everything else the client needs', () => {
    const safe = withoutPassword(
      doc({
        _id: 'u1',
        email: 'a@b.com',
        name: 'Ada',
        role: 'regular',
        password: '$2a$10$hashedvalue',
      })
    )

    expect(safe).toEqual({
      _id: 'u1',
      email: 'a@b.com',
      name: 'Ada',
      role: 'regular',
    })
  })

  it('is harmless when the hash was never loaded', () => {
    const safe = withoutPassword(doc({ email: 'a@b.com' }))

    expect(safe).toEqual({ email: 'a@b.com' })
  })
})
