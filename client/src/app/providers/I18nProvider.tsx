import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState
} from 'react';
import { en } from '../../i18n/en';
import { ru } from '../../i18n/ru';
import * as React from 'react';

type Locale = 'en' | 'ru';
type Dictionary = typeof en;

type I18nContextValue = {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  t: Dictionary | typeof ru;
};

const dictionaries = { en, ru };

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>('en');

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
