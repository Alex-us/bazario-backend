import geoip from 'geoip-lite';

export const getIpLocation = (ip?: string) => {
  return ip && geoip.lookup(ip);
};
