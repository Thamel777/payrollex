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

      // Suppress DOMException AbortError
      if (error instanceof DOMException && error.name === "AbortError") {
        event.preventDefault();
        return;
      }

      // Suppress generic "user aborted" error messages
      if (
        error instanceof Error &&
        (error.message === "The user aborted a request." ||
          error.message.includes("signal is aborted") ||
          error.message.includes("aborted"))
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
