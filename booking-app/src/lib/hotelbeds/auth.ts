import crypto from 'crypto';

/**
 * Generate HotelBeds X-Signature for API authentication
 * SHA256(ApiKey + Secret + Unix timestamp in seconds)
 */
export function generateHotelBedsSignature(
  apiKey: string,
  secret: string,
  timestamp?: number
): { signature: string; timestamp: number } {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signatureString = apiKey + secret + ts;
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

  return { signature, timestamp: ts };
}

/**
 * Get HotelBeds API credentials from environment
 */
export function getHotelBedsCredentials() {
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;

  if (!apiKey || !secret) {
    throw new Error('HOTELBEDS_API_KEY and HOTELBEDS_SECRET must be set in environment variables');
  }

  return { apiKey, secret };
}

/**
 * Generate headers for HotelBeds API requests
 */
export function getHotelBedsHeaders() {
  const { apiKey, secret } = getHotelBedsCredentials();
  const { signature, timestamp } = generateHotelBedsSignature(apiKey, secret);

  return {
    'Api-key': apiKey,
    'X-Signature': signature,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * HotelBeds API endpoints
 */
export const HOTELBEDS_ENDPOINTS = {
  TEST: 'https://api.test.hotelbeds.com',
  PRODUCTION: 'https://api.hotelbeds.com',
};

/**
 * Get base URL for HotelBeds API (test or production)
 */
export function getHotelBedsBaseUrl(useProduction = false) {
  return useProduction ? HOTELBEDS_ENDPOINTS.PRODUCTION : HOTELBEDS_ENDPOINTS.TEST;
}
