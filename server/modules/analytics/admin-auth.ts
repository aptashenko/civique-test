import { createHash, timingSafeEqual } from 'node:crypto'
import { getRequestHeader, sendNoContent, setResponseHeader, type H3Event } from 'h3'

function digest(value: string | Buffer) {
  return createHash('sha256').update(value).digest()
}

export function authorizeAnalyticsAdmin(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { ANALYTICS_ADMIN_USERNAME: username, ANALYTICS_ADMIN_PASSWORD: password } = process.env
  if (!username || !password || username.includes(':')) {
    sendNoContent(event, 403)
    return false
  }

  const authorization = getRequestHeader(event, 'authorization') ?? ''
  const token = /^Basic +([A-Za-z0-9+/]+={0,2})$/i.exec(authorization)?.[1]
  if (token && timingSafeEqual(digest(Buffer.from(token, 'base64')), digest(`${username}:${password}`))) return true

  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Civique Prep Analytics", charset="UTF-8"')
  sendNoContent(event, 401)
  return false
}
