import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Load script Turnstile chỉ khi có SITE_KEY (tránh lỗi CSP/110200 khi dev không dùng).
 */
function loadTurnstileScript() {
  if (typeof window === 'undefined' || window.turnstile) return Promise.resolve();
  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
  if (existing) return new Promise((resolve) => (existing.onload ? resolve() : existing.addEventListener('load', resolve)));
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
 * @param {string} widgetId - Id trả về từ onReady của TurnstileWidget
 * @returns {string}
 */
export function getTurnstileResponse(widgetId) {
  if (typeof window === 'undefined' || !window.turnstile || widgetId == null) return '';
  return window.turnstile.getResponse(widgetId) || '';
}

/**
 * Reset widget (sau khi token hết hạn hoặc lỗi).
 */
export function resetTurnstile(widgetId) {
  if (typeof window !== 'undefined' && window.turnstile && widgetId != null) {
    window.turnstile.reset(widgetId);
  }
}

export default function TurnstileWidget({ onReady, theme = 'light', size = 'normal' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || typeof window.turnstile === 'undefined') return;
        if (widgetIdRef.current != null) return;
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme,
            size,
            language: 'auto',
            'error-callback': (errorCode) => {
              console.warn('[Turnstile] error:', errorCode);
              setScriptError(true);
              return true;
            },
          });
          widgetIdRef.current = id;
          onReady?.(id);
        } catch (_) {}
      })
      .catch(() => setScriptError(true));

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
      widgetIdRef.current = null;
    };
  }, [SITE_KEY, theme, size]);

  if (!SITE_KEY) return null;
  if (scriptError) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
