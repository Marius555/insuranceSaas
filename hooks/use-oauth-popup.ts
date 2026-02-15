"use client";

import { useCallback, useEffect, useRef } from "react";

interface OAuthPopupOptions {
  theme?: string;
  onSuccess: (data: { userId: string; name: string; email: string }) => void;
  onError: (error: string) => void;
  onPopupBlocked: () => void;
  onPopupClosed: () => void;
}

export function useOAuthPopup({
  theme,
  onSuccess,
  onError,
  onPopupBlocked,
  onPopupClosed,
}: OAuthPopupOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, []);

  // Listen for postMessage from the popup
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Verify origin matches our app
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "oauth-success") {
        cleanup();
        onSuccess({
          userId: data.userId,
          name: data.name,
          email: data.email,
        });
      } else if (data.type === "oauth-error") {
        cleanup();
        onError(data.error || "Authentication failed");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const openPopup = useCallback(() => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`;

    const popup = window.open(
      `/api/auth/google/redirect?mode=popup&theme=${theme || ""}`,
      "google-oauth",
      features
    );

    if (!popup || popup.closed) {
      onPopupBlocked();
      return;
    }

    popupRef.current = popup;

    // Poll to detect if popup was closed without completing auth
    pollTimerRef.current = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        cleanup();
        onPopupClosed();
      }
    }, 500);
  }, [theme, onPopupBlocked, onPopupClosed, cleanup]);

  return { openPopup, cleanup };
}
