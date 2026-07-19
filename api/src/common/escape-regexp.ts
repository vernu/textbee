/**
 * Escape every regular-expression metacharacter in a string so it can be
 * embedded in a RegExp as a literal.
 *
 * Search terms come straight from user input. Without this, "(" alone throws
 * a SyntaxError and fails the request, "." matches any character instead of a
 * dot, and a nested quantifier is a ReDoS vector.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
