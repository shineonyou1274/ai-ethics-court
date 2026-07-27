// confirm 대체 — 법정 승인 모달 (기획안 §7.5)

import { create } from 'zustand';
import { AnimatePresence, motion } from 'motion/react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((v: boolean) => void) | null;
  show: (opts: ConfirmOptions, resolve: (v: boolean) => void) => void;
  close: (result: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: { title: '', message: '' },
  resolve: null,
  show: (options, resolve) => set({ open: true, options, resolve }),
  close: (result) => {
    get().resolve?.(result);
    set({ open: false, resolve: null });
  },
}));

/** 커스텀 confirm — Promise<boolean> 반환 */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().show(opts, resolve);
  });
}

export function ConfirmHost() {
  const { open, options, close } = useConfirmStore();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4"
          onClick={() => close(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md border-2 border-ink/70 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-bold text-ink">{options.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{options.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="border border-line bg-paper px-4 py-2 text-sm text-ink hover:bg-line/40"
              >
                {options.cancelText ?? '취소'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`px-4 py-2 text-sm font-bold text-white ${
                  options.danger ? 'bg-seal hover:bg-seal/90' : 'bg-ink hover:bg-ink/90'
                }`}
              >
                {options.confirmText ?? '확인'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
