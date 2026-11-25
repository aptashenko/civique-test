<script setup lang="ts">
import type { Locale } from '~/shared/i18n/messages'

const { locale, t } = useLocale()
const preference = useCookie<Locale>('civique_locale', { sameSite: 'lax', maxAge: 365 * 24 * 60 * 60, path: '/' })
const languages = [
  { code: 'uk', label: 'Українська' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
] as const

function selectLanguage(value: Locale) {
  locale.value = value
  preference.value = value
}
</script>

<template>
  <div class="locale-control" role="group" :aria-label="t('language')">
    <button
      v-for="language in languages"
      :key="language.code"
      type="button"
      class="locale-button"
      :lang="language.code"
      :aria-label="language.label"
      :title="language.label"
      :aria-pressed="locale === language.code"
      @click="selectLanguage(language.code)"
    >
      <svg v-if="language.code === 'en'" class="locale-flag" data-language="en" viewBox="0 0 60 30" aria-hidden="true">
        <path fill="#012169" d="M0 0h60v30H0z" />
        <path fill="#fff" d="M0 0v3l54 27h6v-3L6 0zM60 0v3L6 30H0v-3L54 0z" />
        <path fill="#c8102e" d="M0 0v2l26 13h4zM60 0h-4L30 13v2zM60 30v-2L34 15h-4zM0 30h4l26-13v-2z" />
        <path fill="#fff" d="M25 0h10v30H25zM0 10h60v10H0z" />
        <path fill="#c8102e" d="M27 0h6v30h-6zM0 12h60v6H0z" />
      </svg>
      <span v-else class="locale-flag" :data-language="language.code" aria-hidden="true"></span>
    </button>
  </div>
</template>

<style scoped>
.locale-control { display: flex; gap: var(--cv-step-1); }
.locale-button {
  display: grid;
  place-items: center;
  min-inline-size: var(--cv-target);
  min-block-size: var(--cv-target);
  border: var(--cv-stroke) solid transparent;
  border-radius: var(--cv-radius-control);
  cursor: pointer;
}
.locale-button:hover { background: var(--cv-bleu-light); }
.locale-button[aria-pressed="true"] {
  border-color: var(--cv-focus);
  background: var(--cv-bleu-light);
}
.locale-flag {
  display: block;
  inline-size: 1.625rem;
  aspect-ratio: 3 / 2;
  border: 1px solid var(--cv-rule-strong);
  border-radius: 0.15rem;
}
.locale-flag[data-language="uk"] {
  background: linear-gradient(#0057b7 50%, #ffdd00 50%);
}
.locale-flag[data-language="fr"] {
  background: linear-gradient(to right, #000091 calc(100% / 3), #fff calc(100% / 3) calc(200% / 3), #e1000f calc(200% / 3));
}
.locale-flag[data-language="en"] {
  aspect-ratio: 2 / 1;
  overflow: hidden;
}
</style>
