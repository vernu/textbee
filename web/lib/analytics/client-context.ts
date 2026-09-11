// Registration is proxied through this Next server, so by the time the request
// reaches the API its user agent and address belong to the server, not the
// visitor. These read the real values from the inbound browser request so they
// can be forwarded explicitly.

const MAX_USER_AGENT = 512

type HeaderBag = Record<string, string | string[] | undefined> | undefined

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function clientIpFromHeaders(headers: HeaderBag): string | undefined {
  if (!headers) return undefined

  // x-forwarded-for is a chain, client first, proxies after.
  const forwarded = first(headers['x-forwarded-for'])
  const candidate =
    forwarded?.split(',')[0]?.trim() ||
    first(headers['x-real-ip'])?.trim() ||
    undefined

  return candidate || undefined
}

export function clientContextFromHeaders(headers: HeaderBag) {
  const userAgent = first(headers?.['user-agent'])?.slice(0, MAX_USER_AGENT)
  const ip = clientIpFromHeaders(headers)

  if (!userAgent && !ip) return undefined
  return {
    ...(userAgent && { userAgent }),
    ...(ip && { ip }),
  }
}
