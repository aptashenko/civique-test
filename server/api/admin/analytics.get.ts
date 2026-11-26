import { defineEventHandler } from 'h3'
import { IsNull, Not } from 'typeorm'
import { activeProfiles } from '../../modules/analytics/active-profiles'
import { authorizeAnalyticsAdmin } from '../../modules/analytics/admin-auth'
import { database } from '../../modules/infrastructure/database'
import { Owner } from '../../modules/infrastructure/entities'

export default defineEventHandler(async event => {
  if (!authorizeAnalyticsAdmin(event)) return

  const db = await database()
  const [registeredAccounts, activity] = await Promise.all([
    db.manager.countBy(Owner, { email: Not(IsNull()) }),
    activeProfiles(),
  ])

  return { registeredAccounts, activity }
})
