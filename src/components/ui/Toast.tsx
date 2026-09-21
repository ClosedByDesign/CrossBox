import { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ToastTone = 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') =>
    set((state) => ({ toasts: [...state.toasts, { id: `${Date.now()}-${Math.random()}`, message, tone }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, tone: ToastTone = 'success'): void {
  useToasts.getState().push(message, tone);
}

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

const tones: Record<ToastTone, string> = {
  success: 'border-success/50 text-success',
  info: 'border-info/50 text-info',
  warning: 'border-warning/50 text-warning',
};

function ToastItem({ toast: item }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 4200);
    return () => clearTimeout(timer);
  }, [item.id, dismiss]);

  const Icon = icons[item.tone];
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-surface px-3.5 py-3 text-sm shadow-pop animate-slide-up',
        tones[item.tone],
      )}
      role="status"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="text-ink">{item.message}</span>
      <button type="button" onClick={() => dismiss(item.id)} aria-label="Schließen" className="ml-1 text-muted hover:text-ink">
        <X size={15} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 sm:bottom-6">
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} />
      ))}
    </div>
  );
}
