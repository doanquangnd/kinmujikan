import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

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

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    function render() {
      if (typeof window.turnstile === 'undefined') {
        requestAnimationFrame(render);
        return;
      }
      if (widgetIdRef.current != null) return;
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          size,
        });
        widgetIdRef.current = id;
        onReady?.(id);
      } catch (_) {}
    }
    render();

    return () => {
      if (widgetIdRef.current != null && typeof window.turnstile !== 'undefined') {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
      widgetIdRef.current = null;
    };
  }, [SITE_KEY, theme, size]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
