import { translate, type Locale, type Translator } from '~/shared/i18n/messages'

export function useLocale() {
  const locale = useState<Locale>('civique-interface-locale', () => {
    const preference = useCookie('civique_locale').value
    return preference === 'uk' || preference === 'en' ? preference : 'fr'
  })
  const t: Translator = (key, params) => translate(locale.value, key, params)
  return { locale, t }
}
