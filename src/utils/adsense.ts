/**
 * Google AdSense Utilities for Kee2Solv
 * Handles dynamic client-side AdSense script injection securely.
 */

// Retrieve Google AdSense Publisher Client ID from environment variables
const ADSENSE_ID = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID || "";

/**
 * Initializes Google AdSense tag dynamically in the head of the document.
 */
export function initAdSense() {
  if (typeof window === "undefined" || !ADSENSE_ID) {
    return;
  }

  try {
    // Check if the script is already added to avoid duplicates
    const existingScript = document.querySelector(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`);
    if (existingScript) return;

    // Create the AdSense script tag
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    console.log(`[Google AdSense] Script initialized successfully with Client ID: ${ADSENSE_ID}`);
  } catch (error) {
    console.warn("[Google AdSense] Failed to initialize dynamic script:", error);
  }
}
