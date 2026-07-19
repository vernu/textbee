import { escapeRegExp } from './escape-regexp'

describe('escapeRegExp', () => {
  it('leaves plain text untouched', () => {
    expect(escapeRegExp('hello world')).toBe('hello world')
    expect(escapeRegExp('+14155550101')).toBe('\\+14155550101')
  })

  it('makes an unbalanced paren safe to compile', () => {
    // Unescaped, `new RegExp('(')` throws and would fail the whole request.
    expect(() => new RegExp(escapeRegExp('('))).not.toThrow()
    expect(() => new RegExp(escapeRegExp('a)b['))).not.toThrow()
  })

  it('treats wildcards as literal characters', () => {
    const pattern = new RegExp(escapeRegExp('.*'), 'i')
    // A literal ".*" must not match arbitrary text.
    expect(pattern.test('anything at all')).toBe(false)
    expect(pattern.test('literally .* here')).toBe(true)
  })

  it('treats a dot as a dot, not "any character"', () => {
    const pattern = new RegExp(escapeRegExp('a.c'), 'i')
    expect(pattern.test('abc')).toBe(false)
    expect(pattern.test('a.c')).toBe(true)
  })

  it('defuses a nested quantifier (ReDoS shape)', () => {
    const pattern = new RegExp(escapeRegExp('(a+)+$'), 'i')
    const start = Date.now()
    pattern.test('a'.repeat(2000) + 'b')
    // As a literal it is a plain substring scan, not catastrophic backtracking.
    expect(Date.now() - start).toBeLessThan(100)
  })
})
