/**
 * GDEX SDK Loader Utility
 * 
 * Centralized SDK loading to handle CommonJS/ESM interoperability.
 * Creates and manages a singleton SDK instance.
 */

import { config } from '../config/index.js';

// Dynamic import for CommonJS gdex.pro-sdk
let GDEXSDK: any = null;
let sdkInstance: any = null;

/**
 * Load the GDEX SDK class
 */
async function loadSDK() {
  if (!GDEXSDK) {
    const module = await import('gdex.pro-sdk');
    GDEXSDK = module.GDEXSDK;
  }
  return GDEXSDK;
}

/**
 * Get or create SDK instance (singleton)
 */
export async function getSDK(): Promise<any> {
  if (!sdkInstance) {
    const SDK = await loadSDK();
    sdkInstance = new SDK('https://trade-api.gemach.io/v1', {
      apiKey: config.gdex.apiKey || undefined,
      timeout: 10000,
    });
  }
  return sdkInstance;
}

/**
 * Reset SDK instance (useful for testing or config changes)
 */
export function resetSDK(): void {
  sdkInstance = null;
}

export default {
  getSDK,
  resetSDK,
};
