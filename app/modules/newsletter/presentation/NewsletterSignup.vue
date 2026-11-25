<script setup lang="ts">
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import type { MessageKey } from '~/shared/i18n/messages'

const { t, locale } = useLocale()
const privacyUrl = useRuntimeConfig().public.newsletterPrivacyUrl.trim()
const preview = import.meta.dev && !privacyUrl
const enabled = !!privacyUrl || preview
const dialog = ref<HTMLDialogElement | null>(null)
const dialogId = useId()
const headingId = useId()
const dialogReady = ref(false)
const email = ref('')
const consent = ref(false)
const subscribed = ref(false)
const busy = ref(false)
const error = ref<MessageKey | null>(null)

const storageKey = 'civique.newsletter'

function remember(state: 'seen' | 'subscribed') {
  try {
    localStorage.setItem(storageKey, state)
  } catch {
    // Keep the current UI usable when browser storage is unavailable.
  }
}

function open() {
  if (dialog.value && !dialog.value.open && !subscribed.value) dialog.value.showModal()
}

onMounted(() => {
  if (!enabled) return
  let state: string | null = null
  try {
    state = localStorage.getItem(storageKey)
  } catch {
    // The current visit can still display the form.
  }
  subscribed.value = state === 'subscribed'
  dialogReady.value = true
  if (!state) {
    open()
    remember('seen')
  }
})

function restoreFocus() {
  if (subscribed.value) document.getElementById('main')?.focus()
}

async function subscribe() {
  if (!privacyUrl || !consent.value || busy.value) return
  busy.value = true
  error.value = null
  try {
    await $fetch('/api/newsletter', { method: 'POST', body: { email: email.value, consent: consent.value, locale: locale.value } })
    subscribed.value = true
    remember('subscribed')
    email.value = ''
  } catch (failure) {
    const response = failure as { data?: { data?: { code?: string } } }
    error.value = response.data?.data?.code === 'INVALID_EMAIL' ? 'newsletterInvalidEmail' : 'newsletterError'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <CiviqueButton
    v-if="enabled && dialogReady && !subscribed"
    variant="secondary"
    aria-haspopup="dialog"
    :aria-controls="dialogId"
    @click="open"
  >{{ t('newsletterTitle') }}</CiviqueButton>
  <dialog
    v-if="enabled"
    :id="dialogId"
    ref="dialog"
    class="newsletter-dialog"
    :aria-labelledby="headingId"
    @close="restoreFocus"
  >
    <CiviqueCard tone="blue" class="grid gap-4">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <h2 :id="headingId" class="cv-heading self-center">{{ t('newsletterTitle') }}</h2>
        <CiviqueButton variant="secondary" autofocus @click="dialog?.close()">{{ t('newsletterClose') }}</CiviqueButton>
      </div>
      <p v-if="!subscribed" class="cv-muted">{{ t('newsletterIntro') }}</p>
      <CiviqueNotice v-if="subscribed" :title="t('newsletterSuccess')" tone="success" role="status" />
      <form v-else class="grid max-w-md gap-3" @submit.prevent="subscribe">
        <label class="grid gap-1 font-extrabold">
          {{ t('newsletterEmail') }}
          <input v-model.trim="email" class="cv-field" type="email" name="email" autocomplete="email" maxlength="254" required>
        </label>
        <label class="flex min-h-11 items-center gap-2">
          <input v-model="consent" class="size-5 shrink-0 accent-[var(--cv-primary)]" type="checkbox" name="consent" required>
          <span>{{ t('newsletterConsent') }}</span>
        </label>
        <a v-if="privacyUrl" :href="privacyUrl" class="cv-label justify-self-start underline underline-offset-4">{{ t('newsletterPrivacy') }}</a>
        <p v-else class="cv-label cv-muted">{{ t('newsletterPreview') }}</p>
        <CiviqueNotice v-if="error" :title="t(error)" tone="error" role="alert" />
        <CiviqueButton class="justify-self-start" type="submit" :disabled="busy || preview">
          {{ t(busy ? 'loading' : 'newsletterSubscribe') }}
        </CiviqueButton>
      </form>
    </CiviqueCard>
  </dialog>
</template>

<style scoped>
.newsletter-dialog {
  position: fixed;
  inset: 0;
  inline-size: min(30rem, calc(100% - 2rem));
  max-block-size: calc(100% - 2rem);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: var(--cv-radius-card);
  background: transparent;
  color: var(--cv-text);
}
.newsletter-dialog::backdrop { background: color-mix(in srgb, var(--cv-text) 55%, transparent); }
</style>
