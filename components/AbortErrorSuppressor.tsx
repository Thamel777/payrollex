"use client";

import { useEffect } from "react";

/**
 * Suppresses benign AbortError / "The user aborted a request" errors
 * that Next.js App Router + Turbopack fires internally during route
 * transitions, prefetch cancellations, and React Suspense boundary resets.
 *
 * These errors are harmless — they simply mean a fetch was cancelled
 * because the user navigated away before it completed.
 */
export default function AbortErrorSuppressor() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (!error) return;

      const name = typeof error === "object" && error !== null && "name" in error ? String((error as any).name) : "";
      const message = typeof error === "object" && error !== null && "message" in error ? String((error as any).message) : "";
      const errorStr = String(error);

      // Check if it is an AbortError or cancelled request
      const isAbort =
        name === "AbortError" ||
        message === "The user aborted a request." ||
        message.includes("signal is aborted") ||
        message.includes("aborted") ||
        errorStr.includes("AbortError") ||
        errorStr.includes("aborted");

      if (isAbort) {
        try {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        } catch (e) {
          // Ignore if event methods aren't available
        }
      }
    };

    // Register in the capturing phase (useCapture = true) to run before Turbopack dev clients
    window.addEventListener("unhandledrejection", handler, true);
    return () => window.removeEventListener("unhandledrejection", handler, true);
  }, []);

  return null;
}
