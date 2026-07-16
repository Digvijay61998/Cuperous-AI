import parser from 'ua-parser-js';

export const parseUserAgent = (userAgent: string) => {
  const parsed = new parser(userAgent);

  const { browser, os, device } = parsed.getResult();

  return {
    browser: browser?.name || 'unknown',
    os: os?.name || 'unknown',
    device: device?.type || 'unknown',
  };
};
