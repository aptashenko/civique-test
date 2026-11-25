<script setup lang="ts">
import '~/assets/css/civique-tokens.css'
import NewsletterSignup from '~/modules/newsletter/presentation/NewsletterSignup.vue'
import CiviqueLocale from '~/shared/ui/civique/CiviqueLocale.vue'
import CiviqueMark from '~/shared/ui/civique/CiviqueMark.vue'

const route = useRoute()
const designShowcase = computed(() => route.name === 'design-system')
const examInProgress = computed(() => route.path.startsWith('/exam/') && typeof route.params.sessionId === 'string')
const destinations = [
  { to: '/quiz', label: 'training' },
  { to: '/exam', label: 'exam' },
  { to: '/review', label: 'history' },
  { to: '/progress', label: 'progress' },
  { to: '/account', label: 'account' },
] as const
const { locale, t } = useLocale()
useHead({ htmlAttrs: { lang: locale } })
</script>

<template>
  <div class="civique-theme min-h-screen">
    <NuxtRouteAnnouncer />
    <a class="cv-skip sr-only focus:not-sr-only" href="#main">{{ t('skipToContent') }}</a>
    <header v-if="!designShowcase" class="site-header">
      <div class="cv-shell site-header-inner">
        <NuxtLink to="/" class="site-brand">
          <CiviqueMark />
          Civique Prep
        </NuxtLink>
        <nav v-if="!examInProgress" :aria-label="t('mainNavigation')" class="site-nav">
          <NuxtLink v-for="item in destinations" :key="item.to" :to="item.to" active-class="site-nav-active">{{ t(item.label) }}</NuxtLink>
        </nav>
        <div class="site-tools">
          <NewsletterSignup v-if="!examInProgress" />
          <CiviqueLocale />
        </div>
      </div>
    </header>
    <main id="main" tabindex="-1" :class="designShowcase ? undefined : 'cv-shell cv-main'">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.site-header {
  border-bottom: var(--cv-stroke) solid var(--cv-rule);
  background: var(--cv-surface);
}
.site-header-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--cv-step-1) var(--cv-step-6);
  padding-block: var(--cv-step-2);
}
.site-brand, .site-nav a {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--cv-target);
  font-weight: var(--cv-label-weight);
  text-decoration: none;
}
.site-brand { gap: var(--cv-step-2); font-size: 1.25rem; font-weight: var(--cv-heading-weight); }
.site-nav { display: flex; margin-inline-start: auto; flex-wrap: wrap; gap: 0 var(--cv-step-2); font-size: var(--cv-label-size); }
.site-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cv-step-2); }
@media (max-width: 62rem) { .site-nav { order: 1; flex-basis: 100%; margin-inline-start: 0; } }
.site-nav a { padding-inline: .45rem; border-radius: var(--cv-radius-control); }
.site-nav a:hover { text-decoration: underline; }
.site-nav-active { background: var(--cv-bleu-light); color: var(--cv-primary-pressed); }
.cv-skip:focus { position: fixed; z-index: 10; inset: var(--cv-step-3) auto auto var(--cv-step-3); padding: var(--cv-step-3); background: var(--cv-surface); color: var(--cv-text); }
</style>
