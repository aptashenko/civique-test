import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@pinia/nuxt'],
  css: ['@fontsource-variable/nunito', '~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: { public: { newsletterPrivacyUrl: '' } },
  routeRules: {
    '/admin/analytics': { prerender: false, headers: { 'cache-control': 'private, no-store' } },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Civique Prep',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  nitro: {
    ignore: ['modules/**'],
    experimental: { tasks: true },
    scheduledTasks: {
      '* * * * *': 'finalize-exams',
      '0 3 * * *': 'cleanup-data',
    },
  },
})
