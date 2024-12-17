import { UAParser } from 'ua-parser-js';

export const getUserAgentInfo = (userAgentString?: string) => {
  if (!userAgentString) {
    return {
      os: 'unknown',
      browser: 'unknown',
    };
  }
  const parser = new UAParser(userAgentString);
  const { name: browser, version: browserVersion } = parser.getBrowser();
  const { name: os } = parser.getOS();
  return { browser: `${browser} ${browserVersion}`, os };
};
