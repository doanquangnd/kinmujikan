import { useEffect, RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => (el as HTMLElement & { offsetParent?: Element }).offsetParent !== null && !el.hasAttribute('disabled')
  );
}

/**
 * Giữ focus trong container khi mở (Tab/Shift+Tab vòng trong container), focus phần tử đầu khi mở.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isActive: boolean): void {
  useEffect(() => {
    if (!isActive || !containerRef?.current) return;
    const el = containerRef.current;
    const focusables = getFocusables(el);
    if (focusables.length === 0) return;

    const focusFirst = () => {
      focusables[0]?.focus();
    };
    const t = requestAnimationFrame(focusFirst);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(t);
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, containerRef]);
}
