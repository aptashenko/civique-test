import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { deleteCookie, getCookie, getRequestHeader, getRequestURL, setCookie, type H3Event } from 'h3'
import { IsNull, LessThanOrEqual, MoreThan, Not } from 'typeorm'
import { database, lockOwner } from '../infrastructure/database'
import { Favorite, Identity, Owner, QuizAttempt } from '../infrastructure/entities'
import { QuizError } from '../quiz/domain/models'

const derive = promisify(scrypt)
const cookieName = 'civique_identity'
export const DAY = 86_400_000
const identityMs = 90 * DAY
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const cookieOptions = { path: '/', httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production' }

export function checkOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  if (getRequestHeader(event, 'sec-fetch-site') === 'cross-site' || (origin && origin !== getRequestURL(event).origin)) {
    throw new QuizError('ACCESS_DENIED', 403)
  }
}

export async function identity(event: H3Event, createGuest = false) {
  const token = getCookie(event, cookieName)
  const now = new Date()
  const record = token && await (await database()).manager.findOne(Identity, {
    where: { tokenHash: hashToken(token) },
    relations: { owner: true },
  })
  if (record && record.expiresAt > now && (!record.owner.expiresAt || record.owner.expiresAt > now)) {
    const expiresAt = new Date(now.getTime() + identityMs)
    if (+now - +record.owner.lastActivityAt > 60_000 || +expiresAt - +record.expiresAt > 60_000) {
      await (await database()).transaction(async tx => {
        await lockOwner(tx, record.ownerId)
        const active = await tx.update(Identity, record.tokenHash, { expiresAt })
        if (!active.affected) throw new QuizError('ACCESS_DENIED', 403)
        await tx.update(Owner, record.ownerId, { lastActivityAt: now, ...(record.owner.email ? {} : { expiresAt }) })
      })
    }
    setCookie(event, cookieName, token, { ...cookieOptions, expires: expiresAt })
    return record.owner
  }
  if (!createGuest) return null

  const guestToken = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + identityMs)
  const owner = { id: randomUUID(), email: null, passwordHash: null, lastActivityAt: now, expiresAt }
  await (await database()).transaction(async tx => {
    await tx.insert(Owner, owner)
    await tx.insert(Identity, { tokenHash: hashToken(guestToken), ownerId: owner.id, expiresAt })
  })
  setCookie(event, cookieName, guestToken, { ...cookieOptions, expires: expiresAt })
  return owner
}

export async function registerOrLogin(event: H3Event, action: 'register' | 'login', email: string, password: string) {
  const current = await identity(event)
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + identityMs)
  const db = await database()
  const existing = await db.manager.findOneBy(Owner, { email })

  if (action === 'register' && existing) throw new QuizError('EMAIL_UNAVAILABLE', 409)
  if (action === 'register' && current?.email) throw new QuizError('ALREADY_REGISTERED', 409)

  const salt = action === 'register' ? randomBytes(16).toString('hex') : existing?.passwordHash?.split(':')[0] ?? 'unregistered'
  const key = await derive(password, salt, 64) as Buffer
  if (action === 'login') {
    const expected = Buffer.from(existing?.passwordHash?.split(':')[1] ?? '00'.repeat(64), 'hex')
    if (!timingSafeEqual(key, expected) || !existing) throw new QuizError('INVALID_CREDENTIALS', 401)
  }

  await db.transaction(async tx => {
    if (action === 'register') {
      if (current) {
        await lockOwner(tx, current.id)
        const guest = await tx.existsBy(Owner, { id: current.id, email: IsNull(), expiresAt: MoreThan(now) })
        if (!guest) throw new QuizError('ACCESS_DENIED', 403)
        await tx.delete(Identity, { ownerId: current.id })
        await tx.createQueryBuilder().delete().from(QuizAttempt).where([
          { ownerId: current.id, mode: 'training', status: 'in_progress', lastActivityAt: LessThanOrEqual(new Date(+now - 30 * DAY)) },
          { ownerId: current.id, status: 'completed', finishedAt: LessThanOrEqual(new Date(+now - 90 * DAY)) },
          { ownerId: current.id, status: 'abandoned', abandonedAt: LessThanOrEqual(new Date(+now - 7 * DAY)) },
        ]).execute()
        await tx.delete(Favorite, { ownerId: current.id, lastActivityAt: LessThanOrEqual(new Date(+now - 90 * DAY)) })
      }
      const data = { email, passwordHash: `${salt}:${key.toString('hex')}`, expiresAt: null, lastActivityAt: now }
      const accountId = current?.id ?? randomUUID()
      if (current) await tx.update(Owner, accountId, data)
      else await tx.insert(Owner, { id: accountId, ...data })
      await tx.insert(Identity, { tokenHash, ownerId: accountId, expiresAt })
      return
    }

    const account = existing!
    await lockOwner(tx, account.id)
    await tx.insert(Identity, { tokenHash, ownerId: account.id, expiresAt })
    await tx.update(Owner, account.id, { lastActivityAt: now })
  })
  setCookie(event, cookieName, token, { ...cookieOptions, expires: expiresAt })
  return { email }
}

export async function clearIdentity(event: H3Event, operation: 'logout' | 'delete' | 'history') {
  const owner = await identity(event)
  const token = getCookie(event, cookieName)
  if (owner && token) {
    await (await database()).transaction(async tx => {
      await lockOwner(tx, owner.id)
      if (operation === 'delete') await tx.delete(Owner, owner.id)
      else if (operation === 'history') await tx.delete(QuizAttempt, { ownerId: owner.id, status: Not('in_progress') })
      else await tx.delete(Identity, { ownerId: owner.id, tokenHash: hashToken(token) })
    })
  }
  if (operation !== 'history') deleteCookie(event, cookieName, cookieOptions)
}
