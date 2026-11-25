<script setup lang="ts">
import CiviqueButton from '~/shared/ui/civique/CiviqueButton.vue'
import CiviqueCard from '~/shared/ui/civique/CiviqueCard.vue'
import CiviqueNotice from '~/shared/ui/civique/CiviqueNotice.vue'
import { errorMessageKey, quizError } from '~/modules/quiz/presentation/stores/quiz'

const { data, refresh } = await useFetch('/api/identity')
const email = ref('')
const password = ref('')
const mode = ref<'login' | 'register'>('login')
const message = ref(false)
const failure = ref('')
const busy = ref(false)

async function act(action: 'login' | 'register' | 'logout' | 'delete' | 'history') {
  if (action === 'delete' && !window.confirm(t('deletePrompt'))) return
  if (action === 'history' && !window.confirm(t('eraseHistoryPrompt'))) return
  busy.value = true
  message.value = false
  failure.value = ''
  try {
    await $fetch('/api/identity', {
      method: 'POST',
      body: action === 'login' || action === 'register' ? { action, email: email.value.trim(), password: password.value } : { action },
    })
    password.value = ''
    await refresh()
    if (action === 'history' || action === 'delete') message.value = true
  } catch (error) {
    failure.value = quizError(error).code
  } finally {
    busy.value = false
  }
}
const { t } = useLocale()
</script>

<template>
  <section class="cv-narrow grid gap-5">
    <header class="cv-page-heading">
      <h1 class="cv-title">{{ t('myAccount') }}</h1>
    </header>
    <CiviqueNotice v-if="failure" :title="t(errorMessageKey(failure))" tone="error" role="alert" />
    <CiviqueNotice v-if="message" :title="t('dataDeleted')" tone="success" role="status" />
    <CiviqueCard class="grid gap-3">
      <h2 class="cv-heading">{{ t('myData') }}</h2>
      <div class="flex flex-wrap gap-2">
        <CiviqueButton v-if="data?.email" variant="danger" :disabled="busy" @click="act('history')">{{ t('eraseHistory') }}</CiviqueButton>
        <CiviqueButton variant="danger" :disabled="busy" @click="act('delete')">{{ data?.email ? t('deleteAccount') : t('deleteGuestData') }}</CiviqueButton>
      </div>
    </CiviqueCard>
  </section>
</template>
