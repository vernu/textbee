import { UserSchema } from './user.schema'

describe('User schema', () => {
  it('never selects the password hash by default', () => {
    expect(UserSchema.path('password').options.select).toBe(false)
  })

  it.each(['email', 'name', 'role', 'emailVerifiedAt'])(
    'still returns %s by default',
    (field) => {
      expect(UserSchema.path(field).options.select).toBeUndefined()
    }
  )
})
