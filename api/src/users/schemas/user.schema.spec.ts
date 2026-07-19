import { UserSchema } from './user.schema'

// The hash used to reach the browser via /auth/who-am-i and the login response.
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
