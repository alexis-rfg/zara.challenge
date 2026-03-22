/** Supported application language codes. */
export type LanguageCode = 'en' | 'es';

/** Static metadata rendered for each language switcher option. */
export type LanguageOption = {
  /** Two-letter i18n language code. */
  code: LanguageCode;
  /** Short uppercase label shown in the trigger and option list. */
  label: string;
  /** Human-readable language name. */
  name: string;
};
