import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TEST_LOCAL = import.meta.env.VITE_TURNSTILE_TEST_LOCAL === 'true';

const IS_LOCALHOST = typeof window !== 'undefined' &&
  (/^localhost(:\d+)?$/i.test(window.location.host) || /^127\.0\.0\.1(:\d+)?$/i.test(window.location.host));

/** Trên localhost: mặc định bỏ qua widget. Set VITE_TURNSTILE_TEST_LOCAL=true để thử load. */
const SKIP_WIDGET_ON_LOCAL = IS_LOCALHOST && !TEST_LOCAL;

/**
 * Load script Turnstile chỉ khi có SITE_KEY (tránh lỗi CSP/110200 khi dev không dùng).
 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined' || window.turnstile) return Promise.resolve();
  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
  if (existing)
    return new Promise((resolve) =>
      (existing as HTMLScriptElement).onload ? resolve() : existing.addEventListener('load', () => resolve())
    );
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(s);
  });
}

/**
 * Lấy token hiện tại từ widget (gọi trước khi submit form).
 */
export function getTurnstileResponse(widgetId: string | null | undefined): string {
  if (typeof window === 'undefined' || !window.turnstile || widgetId == null) return '';
  return window.turnstile.getResponse(widgetId) || '';
}

/**
 * Reset widget (sau khi token hết hạn hoặc lỗi).
 */
export function resetTurnstile(widgetId: string | null | undefined): void {
  if (typeof window !== 'undefined' && window.turnstile && widgetId != null) {
    window.turnstile.reset(widgetId);
  }
}

interface TurnstileWidgetProps {
  onReady?: (widgetId: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export default function TurnstileWidget({
  onReady,
  theme = 'light',
  size = 'normal',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current || SKIP_WIDGET_ON_LOCAL) return;

    let cancelled = false;
    const container = containerRef.current;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || typeof window.turnstile === 'undefined') return;
        if (widgetIdRef.current != null) return;
        if (!container.isConnected) return;
        try {
          const id = window.turnstile.render(container, {
            sitekey: SITE_KEY,
            theme,
            size,
            language: 'auto',
            'error-callback': () => {
              setScriptError(true);
              return true;
            },
          });
          widgetIdRef.current = id;
          onReady?.(id);
        } catch {
          setScriptError(true);
        }
      })
      .catch(() => setScriptError(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
    };
  }, [SITE_KEY, theme, size, onReady]);

  if (!SITE_KEY) return null;
  if (SKIP_WIDGET_ON_LOCAL) {
    return (
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Trên localhost Turnstile được bỏ qua. Để test: VITE_TURNSTILE_TEST_LOCAL=true
      </p>
    );
  }
  if (scriptError) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Turnstile không tải được. Thử trình duyệt khác hoặc tắt extension.
      </p>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
