/**
 * Overlay toàn màn hình với spinner và message (đang tải / đang lưu).
 */
export default function LoadingOverlay({ message }) {
  return (
    <div
      className="loading-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 px-8 py-6 flex flex-col items-center gap-4">
        <span
          className="inline-block w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-700 dark:border-t-neutral-400 rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{message}</p>
      </div>
    </div>
  );
}
