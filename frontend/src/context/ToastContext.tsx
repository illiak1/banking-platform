// frontend/src/context/ToastContext.tsx
//
// A minimal toast system: no extra dependency, just context + a fixed-position
// stack. Pages call useToast() and never touch the rendering themselves.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from '../styles/Toast.module.css';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // A ref, not state: the id only needs to be unique, never to trigger a render.
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const success = useCallback((message: string) => push('success', message), [push]);
  const error = useCallback((message: string) => push('error', message), [push]);
  const info = useCallback((message: string) => push('info', message), [push]);

  // Memoized so the context value's identity is stable across re-renders
  // (e.g. when a toast is added or auto-dismissed) — without this, every
  // consumer that depends on `toast` in a hook dependency array would
  // re-run its effect on every toast, unrelated to anything it does.
  const value = useMemo<ToastContextValue>(
    () => ({ success, error, info }),
    [success, error, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.kind]}`}>
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/** Throws outside ToastProvider on purpose — a silent no-op would hide a missing provider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
