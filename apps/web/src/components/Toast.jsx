/**
 * Phase 209: Global toast notification system using Zustand.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, duration: 4000, ...toast }] }));
    return id;
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message) => useToastStore.getState().addToast({ type: 'success', message }),
  error: (message) => useToastStore.getState().addToast({ type: 'error', message }),
  info: (message) => useToastStore.getState().addToast({ type: 'info', message }),
  warning: (message) => useToastStore.getState().addToast({ type: 'warning', message }),
};

const TYPE_STYLES = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white',
};

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, t.duration || 4000);
    return () => clearTimeout(timer);
  }, [t.duration, onRemove]);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-slide-in ${TYPE_STYLES[t.type] || TYPE_STYLES.info}`}
    >
      <span className="flex-1">{t.message}</span>
      <button onClick={onRemove} className="opacity-70 hover:opacity-100 text-xs font-bold ml-2">
        X
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
