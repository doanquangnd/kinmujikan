/**
 * Overlay toàn màn hình với spinner và message (đang tải / đang lưu).
 */
export default function LoadingOverlay({ message }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="border border-neutral-200 rounded-lg bg-white px-8 py-6 flex flex-col items-center gap-4">
        <span
          className="inline-block w-10 h-10 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-neutral-700">{message}</p>
      </div>
    </div>
  );
}
