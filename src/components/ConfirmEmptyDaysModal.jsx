import { useRef, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

/**
 * Modal xác nhận vẫn lưu khi có ngày làm việc chưa nhập giờ.
 */
export default function ConfirmEmptyDaysModal({ days, onConfirm, onCancel }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-empty-days-title"
    >
      <div ref={modalRef} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 w-full max-w-md">
        <h2 id="confirm-empty-days-title" className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
          Cảnh báo
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Có {days.length} ngày làm chưa nhập giờ (ngày {days.join(', ')}). Vẫn lưu?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            Vẫn lưu
          </button>
        </div>
      </div>
    </div>
  );
}
