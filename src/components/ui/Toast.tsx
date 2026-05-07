/**
 * Toast — lightweight notification component that auto-dismisses after 3 seconds.
 *
 * Usage (imperative via the `useToast` hook):
 *   const { showToast } = useToast();
 *   showToast('Added to cart!');
 *   showToast('Something went wrong', 'error');
 *
 * The ToastContainer must be rendered once in the layout (or page) to display
 * toasts. It is positioned fixed at the bottom-right and stacks multiple toasts.
 *
 * Requirements: 5.6, 11.7
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

// ─── Container ────────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

const typeStyles: Record<ToastType, string> = {
  success: 'bg-surface border-theme-accent text-foreground',
  error:   'bg-surface border-red-500 text-foreground',
  info:    'bg-surface border-muted text-foreground',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

const typeIconColors: Record<ToastType, string> = {
  success: 'text-theme-accent',
  error:   'text-red-400',
  info:    'text-muted',
};

interface ToastItemProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger enter animation on mount
  useEffect(() => {
    // Defer to next frame so the CSS transition fires
    const raf = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 3 seconds (Req: auto-dismisses after 3 seconds)
    timerRef.current = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation before removing from DOM
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      role="status"
      aria-label={toast.message}
      className={[
        // Layout
        'pointer-events-auto flex items-center gap-3',
        'min-w-[280px] max-w-sm px-4 py-3',
        // Appearance
        'rounded-xl border shadow-lg',
        typeStyles[toast.type],
        // Enter / exit transition
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4',
      ].join(' ')}
    >
      {/* Type icon */}
      <span
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${typeIconColors[toast.type]}`}
        aria-hidden="true"
      >
        {typeIcons[toast.type]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>

      {/* Dismiss button — keyboard accessible (Req 11.7) */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className={[
          'flex-shrink-0 w-6 h-6 flex items-center justify-center',
          'rounded-md text-muted hover:text-foreground',
          'hover:bg-surface-muted transition-colors duration-150',
          // Focus ring handled by globals.css :focus-visible rule
        ].join(' ')}
      >
        <span aria-hidden="true" className="text-xs leading-none">✕</span>
      </button>
    </div>
  );
}
