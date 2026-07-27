// alert 대체 토스트 (기획안 R11 — alert/confirm/prompt 전면 금지)

import { create } from 'zustand';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error' | 'warn';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, type: ToastType) => void;
  remove: (id: number) => void;
}

let seq = 0;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = 'info'): void {
  useToastStore.getState().push(message, type);
}

const ICONS: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warn: AlertTriangle,
};

const COLORS: Record<ToastType, string> = {
  info: 'border-ink/30 text-ink',
  success: 'border-approve text-approve',
  error: 'border-seal text-seal',
  warn: 'border-amber-600 text-amber-700',
};

export function ToastHost() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => remove(t.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`flex items-start gap-2 rounded border bg-card px-4 py-3 text-left text-sm shadow-md ${COLORS[t.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span className="text-ink">{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
