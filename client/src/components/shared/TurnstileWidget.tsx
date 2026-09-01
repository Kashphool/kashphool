import { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  action: "enquiry";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileFailure = "expired" | "error";

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void;
  onFailure?: (reason: TurnstileFailure) => void;
  onResetReady?: (reset: (() => void) | null) => void;
}

let scriptPromise: Promise<TurnstileApi> | null = null;

const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  const pending = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_URL}"]`
    );
    const script = existing ?? document.createElement("script");

    const rejectLoad = (message: string) => {
      script.remove();
      reject(new Error(message));
    };

    const handleLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else rejectLoad("Turnstile did not initialise");
    };
    const handleError = () => rejectLoad("Turnstile failed to load");

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
  });
  scriptPromise = pending.catch(error => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

export default function TurnstileWidget({
  onTokenChange,
  onFailure,
  onResetReady,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) {
      setLoadFailed(true);
      onTokenChange(null);
      return;
    }

    let active = true;
    let api: TurnstileApi | null = null;
    let widgetId: string | null = null;

    void loadTurnstile()
      .then(loadedApi => {
        if (!active) return;
        api = loadedApi;
        widgetId = api.render(container, {
          sitekey: siteKey,
          action: "enquiry",
          callback: token => onTokenChange(token),
          "expired-callback": () => {
            onTokenChange(null);
            onFailure?.("expired");
          },
          "error-callback": () => {
            onTokenChange(null);
            onFailure?.("error");
          },
        });
        onResetReady?.(() => {
          if (api && widgetId) api.reset(widgetId);
          onTokenChange(null);
        });
      })
      .catch(() => {
        if (!active) return;
        setLoadFailed(true);
        onTokenChange(null);
        onFailure?.("error");
      });

    return () => {
      active = false;
      onResetReady?.(null);
      if (api && widgetId) api.remove(widgetId);
    };
  }, [onFailure, onResetReady, onTokenChange, siteKey]);

  return (
    <div>
      <div ref={containerRef} />
      {loadFailed && (
        <p role="status" aria-live="polite" className="text-sm text-red-400">
          Verification is unavailable. Please try again later.
        </p>
      )}
    </div>
  );
}
