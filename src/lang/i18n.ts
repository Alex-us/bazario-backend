import i18n from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

import { Language } from './constants';

export const initTranslations = async () => {
  await i18n.use(Backend).init({
    fallbackLng: Language.UA,
    preload: [Language.UA, Language.RU],
    backend: {
      loadPath: path.resolve(__dirname, './translations/{{lng}}.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
