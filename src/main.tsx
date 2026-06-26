import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './utils/analytics.ts';
import { initAdSense } from './utils/adsense.ts';

// Initialize Google Analytics and Google AdSense safely
initAnalytics();
initAdSense();

// Suppress trivial unhandled iframe errors or resize noise safely
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    // Prevent standard cross-origin script messages and ResizeObserver logs from crashing the container
    if (
      e.message === "Script error." ||
      e.message.toLowerCase().includes("resizeobserver")
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (e.reason && e.reason.message && e.reason.message.toLowerCase().includes("resizeobserver")) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

