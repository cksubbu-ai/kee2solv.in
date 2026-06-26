/**
 * Google Analytics Utilities for Kee2Solv
 * Handles client-side tracking dynamically and safely.
 */

const GA_ID = (import.meta as any).env?.VITE_GA_ID || "";

// Initialize GA script tag dynamically
export function initAnalytics() {
  if (typeof window === "undefined" || !GA_ID) {
    return;
  }

  try {
    // Check if script is already added
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (existingScript) return;

    // Create script tag
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    (window as any).dataLayer = (window as any).dataLayer || [];
    const gtag = function (...args: any[]) {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag = gtag;

    (window as any).gtag("js", new Date());
    (window as any).gtag("config", GA_ID, {
      page_path: window.location.pathname + window.location.search,
      send_page_view: true,
    });
  } catch (error) {
    console.warn("Failed to initialize Google Analytics:", error);
  }
}

/**
 * Tracks a page/tab change in the SPA
 * @param pathName The simulated path or page name (e.g., "/pdf-merger")
 * @param title The page or tool title
 */
export function trackPageView(pathName: string, title: string) {
  if (typeof window !== "undefined" && (window as any).gtag && GA_ID) {
    (window as any).gtag("config", GA_ID, {
      page_path: pathName,
      page_title: title,
    });
  }
}

/**
 * Tracks a custom event in the application
 * @param action Event action (e.g., "click", "submit")
 * @param category Event category (e.g., "PDF Tools", "Image Converter")
 * @param label Event label (e.g., "Merge Success", "Background Removed")
 * @param value Optional numeric value
 */
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && (window as any).gtag && GA_ID) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
