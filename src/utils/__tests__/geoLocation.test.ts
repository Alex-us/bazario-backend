import { getIpLocation } from '../geoLocation';

describe('getIpLocation', () => {
  it('should return location data for a valid IP address', () => {
    const ip = '8.8.8.8'; // Google Public DNS IP
    const result = getIpLocation(ip);

    expect(result).toEqual(
      expect.objectContaining({
        country: 'US',
        region: expect.any(String),
        city: expect.any(String),
        ll: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      })
    );
  });

  it('should return location data for another valid IP address', () => {
    const ip = '208.67.222.222'; // Cloudflare Public DNS IP
    const result = getIpLocation(ip);

    expect(result).toEqual(
      expect.objectContaining({
        country: expect.any(String),
        region: expect.any(String), // Например, 'QLD'
        city: expect.any(String), // Например, 'South Brisbane'
        ll: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
      })
    );
  });

  it('should return undefined for an invalid IP address', () => {
    const ip = '999.999.999.999'; // Некорректный IP
    const result = getIpLocation(ip);

    expect(result).toBeNull();
  });

  it('should return undefined when IP address is not provided', () => {
    const result = getIpLocation();

    expect(result).toBeUndefined();
  });
});
