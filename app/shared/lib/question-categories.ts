import type { MessageKey, Translator } from '~/shared/i18n/messages'

export { civicThemes } from '#shared/civic-themes'

const categoryLabels = new Map<string, MessageKey>([
  ['republican_values', 'republicanValues'],
  ['political_system', 'politicalSystem'],
  ['rights_and_duties', 'rightsAndDuties'],
  ['history_geography_culture', 'historyGeography'],
  ['living_in_france', 'livingInFrance'],
  ['values', 'valuesLegacy'],
  ['symbols', 'symbolsLegacy'],
  ['general', 'generalLegacy'],
])

export function questionCategoryLabel(id: string, t: Translator) {
  const label = categoryLabels.get(id)
  return label ? t(label) : id
}
