/**
 * User agent strings for mobile device testing
 */
export const USER_AGENTS = {
  IPHONE_13: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  PIXEL_6: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.85 Mobile Safari/537.36',
  IPAD_PRO: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  SAMSUNG_GALAXY: 'Mozilla/5.0 (Linux; Android 12; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.85 Mobile Safari/537.36',
};

/**
 * Sets a mobile user agent in the browser context
 */
export async function setMobileUserAgent(page, userAgent = USER_AGENTS.IPHONE_13) {
  await page.setExtraHTTPHeaders({
    'User-Agent': userAgent
  });
}