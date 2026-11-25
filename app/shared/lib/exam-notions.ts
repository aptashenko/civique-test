import type { MessageKey, Translator } from '~/shared/i18n/messages'

const notionLabels = new Map<string, MessageKey>([
  ['motto_and_symbols', 'mottoAndSymbols'],
  ['secularism', 'secularism'],
  ['democracy_and_voting', 'democracyAndVoting'],
  ['french_republic', 'frenchRepublic'],
  ['european_institutions', 'europeanInstitutions'],
  ['fundamental_rights', 'fundamentalRights'],
  ['resident_duties', 'residentDuties'],
  ['history_periods_and_figures', 'historyPeriodsAndFigures'],
  ['territories_and_geography', 'territoriesAndGeography'],
  ['french_heritage', 'frenchHeritage'],
  ['settlement_and_residence', 'settlementAndResidence'],
  ['healthcare_access', 'healthcareAccess'],
  ['working_in_france', 'workingInFrance'],
  ['parental_authority_and_education', 'parentalAuthorityAndEducation'],
])

export function examNotionLabel(id: string, t: Translator) {
  const label = notionLabels.get(id)
  return label ? t(label) : id
}
