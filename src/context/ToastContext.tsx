import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: number;
  message: string;
  type?: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => number;
  removeToast: (id: number) => void;
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, { iconBg: string; iconStroke: string; border: string; bar: string }> = {
  success: {
    iconBg: 'bg-green-500',
    iconStroke: 'text-white',
    border: 'border-green-200',
    bar: 'bg-green-500',
  },
  info: {
    iconBg: 'bg-blue-500',
    iconStroke: 'text-white',
    border: 'border-blue-200',
    bar: 'bg-blue-500',
  },
  warning: {
    iconBg: 'bg-amber-500',
    iconStroke: 'text-white',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
  },
  error: {
    iconBg: 'bg-red-500',
    iconStroke: 'text-white',
    border: 'border-red-200',
    bar: 'bg-red-500',
  },
};

function IconSuccess({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconWarning({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconError({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.info;
  const iconClass = 'w-5 h-5 ' + style.iconStroke;
  const wrapperClass = 'flex shrink-0 w-8 h-8 rounded-full items-center justify-center ' + style.iconBg;
  const icons: Record<ToastType, React.ReactNode> = {
    success: <IconSuccess className={iconClass} />,
    info: <IconInfo className={iconClass} />,
    warning: <IconWarning className={iconClass} />,
    error: <IconError className={iconClass} />,
  };
  return <div className={wrapperClass} aria-hidden>{icons[type] ?? icons.info}</div>;
}

interface ToastItemProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

/**
 * Một toast: icon trái, nội dung, nút đóng, thanh tiến trình dưới. Tự đóng 3s, dừng khi hover.
 */
function ToastItem({ message, type, onClose }: ToastItemProps) {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.info;

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleAnimationEnd = () => {
    queueMicrotask(onClose);
  };

  return (
    <div
      role="alert"
      className={`border rounded-lg bg-white dark:bg-neutral-800 px-4 py-3.5 text-base text-neutral-800 dark:text-neutral-200 min-w-[20rem] max-w-md ${style.border}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-3">
        <ToastIcon type={type} />
        <p className="flex-1 min-w-0 font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 rounded text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/40 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          aria-label={t('toast.close')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div
        className="h-1 rounded-b-xl mt-3 -mx-4 -mb-3 overflow-hidden bg-neutral-100 dark:bg-neutral-700"
        aria-hidden
      >
        <div
          className={`h-full toast-progress-bar ${paused ? 'paused' : ''} ${style.bar}`}
          onAnimationEnd={handleAnimationEnd}
        />
      </div>
    </div>
  );
}

/**
 * Container cố định góc trên phải, render danh sách toast.
 */
export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, removeToast } = ctx;
  if (!toasts.length) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((item) => (
          <ToastItem
            key={item.id}
            message={item.message}
            type={item.type ?? 'info'}
            onClose={() => removeToast(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type?: ToastType) => {
      addToast(message, type ?? 'info');
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
