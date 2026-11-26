import { defineEventHandler, getRequestURL } from 'h3'
import { authorizeAnalyticsAdmin } from '../modules/analytics/admin-auth'

export default defineEventHandler(event => {
  if (/^\/admin\/analytics\/?$/i.test(getRequestURL(event).pathname)) authorizeAnalyticsAdmin(event)
})
