/**
 * Entry point: load preamble (React Fast Refresh) trước khi load main.
 * Cần cho vercel dev - HTML có thể không qua Vite transformIndexHtml.
 */
if (import.meta.env.DEV) {
  try {
    const m = await import('/@react-refresh');
    m.injectIntoGlobalHook(window);
    (window as unknown as { $RefreshReg$: () => void }).$RefreshReg$ = () => {};
    (window as unknown as { $RefreshSig$: (type: unknown) => unknown }).$RefreshSig$ = (type: unknown) => type;
  } catch {
    /* production hoặc lỗi - bỏ qua */
  }
}
await import('./main');
