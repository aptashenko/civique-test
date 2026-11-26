<script setup lang="ts">
import { setResponseStatus } from '#app'
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'

const { locale, t } = useLocale()
const request = useRequestEvent()
useSeoMeta({ title: () => t('analyticsTitle'), robots: 'noindex, nofollow' })

definePageMeta({
  middleware: to => {
    if (import.meta.client && !useNuxtApp().isHydrating) return navigateTo(to.fullPath, { external: true })
  },
})

const { data, error, status } = await useFetch('/api/admin/analytics', { server: true })
if (request && error.value) setResponseStatus(request, error.value.statusCode ?? 500)

function retry() {
  reloadNuxtApp({ force: true })
}

const periods = [
  { key: 'last7Days', label: 'analyticsLast7' },
  { key: 'last30Days', label: 'analyticsLast30' },
] as const
const sessionMetrics = [
  { key: 'total', label: 'analyticsSessionsTotal', tone: 'blue' },
  { key: 'training', label: 'analyticsPracticeSessions', tone: 'paper' },
  { key: 'exam', label: 'analyticsMockExams', tone: 'paper' },
] as const
const numberFormat = computed(() => new Intl.NumberFormat(locale.value))
</script>

<template>
  <section class="mx-auto grid w-full max-w-4xl gap-6" aria-labelledby="analytics-title">
    <header class="cv-page-heading">
      <h1 id="analytics-title" class="cv-title">{{ t('analyticsTitle') }}</h1>
    </header>

    <p v-if="status === 'pending'" role="status">{{ t('loading') }}</p>
    <template v-else-if="error">
      <CiviqueNotice :title="t('analyticsUnavailable')" tone="error" role="alert" />
      <CiviqueButton class="justify-self-start" variant="secondary" @click="retry">{{ t('analyticsRetry') }}</CiviqueButton>
    </template>
    <template v-else-if="data">
      <section class="grid gap-4" aria-labelledby="analytics-started-today">
        <header class="grid gap-1">
          <h2 id="analytics-started-today" class="cv-heading">{{ t('analyticsStartedToday') }}</h2>
          <p class="cv-label cv-muted">{{ t('analyticsParisTime') }}</p>
        </header>
        <div class="grid gap-4 sm:grid-cols-3">
          <CiviqueCard v-for="metric in sessionMetrics" :key="metric.key" :tone="metric.tone">
            <dl class="grid gap-2">
              <dt class="cv-label">{{ t(metric.label) }}</dt>
              <dd class="cv-title tabular-nums">{{ numberFormat.format(data.startedToday[metric.key]) }}</dd>
            </dl>
          </CiviqueCard>
        </div>
      </section>

      <CiviqueCard tone="blue">
        <dl class="grid gap-2">
          <dt class="cv-heading">{{ t('analyticsAccounts') }}</dt>
          <dd class="cv-title tabular-nums">{{ numberFormat.format(data.registeredAccounts) }}</dd>
        </dl>
      </CiviqueCard>

      <section class="grid gap-4" aria-labelledby="analytics-activity">
        <header class="grid gap-1">
          <h2 id="analytics-activity" class="cv-heading">{{ t('analyticsActivity') }}</h2>
          <p class="cv-muted">{{ t('analyticsActivityDefinition') }}</p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2">
          <CiviqueCard v-for="period in periods" :key="period.key" class="grid gap-4">
            <h3 class="cv-heading">{{ t(period.label) }}</h3>
            <dl class="grid gap-2">
              <div class="flex items-baseline justify-between gap-3">
                <dt>{{ t('analyticsAccounts') }}</dt>
                <dd class="cv-heading tabular-nums">{{ numberFormat.format(data.activity[period.key].registered) }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3">
                <dt>{{ t('analyticsGuests') }}</dt>
                <dd class="cv-heading tabular-nums">{{ numberFormat.format(data.activity[period.key].guests) }}</dd>
              </div>
            </dl>
          </CiviqueCard>
        </div>
      </section>
    </template>
  </section>
</template>
