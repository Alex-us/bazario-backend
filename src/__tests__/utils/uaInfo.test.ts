import { getUserAgentInfo } from '../../utils/uaInfo';

describe('getUserAgentInfo', () => {
  it('should return unknown for os and browser if userAgentString is not provided', () => {
    const result = getUserAgentInfo();

    expect(result).toEqual({
      os: 'unknown',
      browser: 'unknown',
    });
  });

  it('should parse and return browser and os information for Chrome on Windows', () => {
    const userAgentString =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const result = getUserAgentInfo(userAgentString);

    expect(result).toEqual({
      os: 'Windows',
      browser: 'Chrome 91.0.4472.124',
    });
  });

  it('should parse and return browser and os information for Firefox on macOS', () => {
    const userAgentString =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:89.0) Gecko/20100101 Firefox/89.0';
    const result = getUserAgentInfo(userAgentString);

    expect(result).toEqual({
      os: 'macOS',
      browser: 'Firefox 89.0',
    });
  });

  it('should parse and return browser and os information for Safari on iOS', () => {
    const userAgentString =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
    const result = getUserAgentInfo(userAgentString);

    expect(result).toEqual({
      os: 'iOS',
      browser: 'Mobile Safari 14.0',
    });
  });

  it('should parse and return browser and os information for Edge on Windows', () => {
    const userAgentString =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
    const result = getUserAgentInfo(userAgentString);

    expect(result).toEqual({
      os: 'Windows',
      browser: 'Edge 91.0.864.59',
    });
  });

  it('should parse and return browser and os information for an unknown userAgent', () => {
    const userAgentString = 'UnknownUserAgent';
    const result = getUserAgentInfo(userAgentString);

    expect(result).toEqual({
      os: undefined,
      browser: 'undefined undefined',
    });
  });
});
