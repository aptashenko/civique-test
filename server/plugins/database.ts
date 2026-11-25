import { closeDatabase } from '../modules/infrastructure/database'

export default defineNitroPlugin(nitro => {
  nitro.hooks.hook('close', closeDatabase)
})
