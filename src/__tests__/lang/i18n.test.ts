import i18n from 'i18next';
import Backend from 'i18next-fs-backend';

import { Language } from '../../constants';
import { initTranslations } from '../../lang/i18n';

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockResolvedValue(true),
}));

jest.mock('i18next-fs-backend');

describe('initTranslations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes i18n with correct configuration', async () => {
    await initTranslations();

    expect(i18n.use).toHaveBeenCalledWith(Backend);
    expect(i18n.init).toHaveBeenCalledWith({
      fallbackLng: Language.UA,
      preload: [Language.UA, Language.RU],
      backend: {
        loadPath: expect.stringContaining('/translations/{{lng}}.json'),
      },
      interpolation: {
        escapeValue: false,
      },
    });
  });

  it('handles initialization failure', async () => {
    (i18n.init as jest.Mock).mockRejectedValue(new Error('Initialization failed'));

    await expect(initTranslations()).rejects.toThrow('Initialization failed');
  });
});
