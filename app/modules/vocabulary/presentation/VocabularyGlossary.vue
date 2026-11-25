<script setup lang="ts">
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import CiviqueSymbol from '~/shared/ui/civique/CiviqueSymbol.vue'

const { data, error } = await useFetch('/api/vocabulary')
const failure = ref(false)
const favoritesOnly = ref(false)
const pending = ref(false)
const visible = computed(() => data.value?.filter(term => !favoritesOnly.value || term.favorite) ?? [])

async function toggle(id: string, current: boolean) {
  pending.value = true
  failure.value = false
  try {
    const result = await $fetch<{ favorite: boolean }>(`/api/vocabulary/${encodeURIComponent(id)}`, { method: 'PUT', body: { favorite: !current } })
    const term = data.value?.find(item => item.id === id)
    if (term) term.favorite = result.favorite
  } catch {
    failure.value = true
  } finally {
    pending.value = false
  }
}
const { t } = useLocale()
</script>

<template>
  <section class="cv-narrow grid gap-5">
    <header class="cv-page-heading">
      <CiviqueSymbol name="book" />
      <h1 class="cv-title">{{ t('glossaryTitle') }}</h1>
      <p class="cv-muted">{{ t('glossaryIntro') }}</p>
    </header>
    <label class="favorites-toggle">
      <input v-model="favoritesOnly" type="checkbox" class="size-5 shrink-0 accent-[var(--cv-primary)]">
      {{ t('favorites') }}
    </label>
    <CiviqueNotice v-if="error || failure" :title="t(failure ? 'favoritesUnavailable' : 'glossaryUnavailable')" tone="error" role="alert" />
    <CiviqueNotice v-else-if="favoritesOnly && !visible.length" :title="t('noFavorites')" />
    <ul class="grid gap-4" aria-label="Mots du lexique">
      <li v-for="word in visible" :key="word.id">
        <CiviqueCard class="grid gap-3" :tone="word.favorite ? 'yellow' : 'paper'">
          <h2 class="cv-heading" lang="fr">{{ word.term }}</h2>
          <p lang="fr">{{ word.definition }}</p>
          <p class="cv-muted" lang="fr">{{ word.example }}</p>
          <details>
            <summary class="translation-label">{{ t('glossaryTranslations') }}</summary>
            <dl class="grid gap-2 px-3 pb-3">
              <div><dt class="cv-label" lang="uk">Українська</dt><dd lang="uk">{{ word.translations.uk }}</dd></div>
              <div><dt class="cv-label" lang="ru">Русский</dt><dd lang="ru">{{ word.translations.ru }}</dd></div>
              <div><dt class="cv-label" lang="en">English</dt><dd lang="en">{{ word.translations.en }}</dd></div>
            </dl>
          </details>
          <CiviqueButton class="justify-self-start" :variant="word.favorite ? 'reward' : 'secondary'" :disabled="pending" :aria-pressed="word.favorite" @click="toggle(word.id, word.favorite)">{{ word.favorite ? t('removeFavorite') : t('addFavorite') }}</CiviqueButton>
        </CiviqueCard>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.favorites-toggle { display: flex; align-items: center; gap: var(--cv-step-2); width: fit-content; min-height: var(--cv-target); padding-inline: var(--cv-step-3); border: var(--cv-stroke) solid var(--cv-rule-strong); border-radius: var(--cv-radius-control); background: var(--cv-surface); font-weight: var(--cv-label-weight); cursor: pointer; }
.favorites-toggle:has(:checked) { border-color: var(--cv-focus); background: var(--cv-bleu-light); }
.translation-label { min-block-size: var(--cv-target); padding: var(--cv-step-2) var(--cv-step-3); font-weight: var(--cv-label-weight); }
details { border: 1px solid var(--cv-rule-strong); border-radius: var(--cv-radius-control); background: var(--cv-surface); }
</style>
