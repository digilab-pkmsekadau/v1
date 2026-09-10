'use client';

import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: 'trash' | 'logout' | 'warning';
  verificationText?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [verifyInput, setVerifyInput] = useState('');

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setVerifyInput('');
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const variantStyles = {
    danger: {
      icon: 'bg-rose-400 border-2 border-black text-black',
      button: 'bg-rose-500 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    },
    warning: {
      icon: 'bg-amber-400 border-2 border-black text-black',
      button: 'bg-amber-500 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    },
    info: {
      icon: 'bg-orange-400 border-2 border-black text-black',
      button: 'bg-orange-500 border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    },
  };

  const IconComponent = dialog?.icon === 'trash'
    ? Trash2
    : dialog?.icon === 'logout'
      ? LogOut
      : AlertTriangle;

  const variant = dialog?.variant ?? 'danger';
  const styles = variantStyles[variant];

  const requiresVerification = !!dialog?.verificationText;
  const isVerified = !requiresVerification || verifyInput === dialog?.verificationText;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Backdrop + Dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={handleCancel}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] w-full max-w-sm p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg border-2 border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              style={{ position: 'relative', float: 'right', marginBottom: -8 }}
            >
              <X size={14} className="text-slate-500" />
            </button>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${styles.icon}`}>
              <IconComponent size={22} />
            </div>

            {/* Title */}
            <h3 className="text-base font-black text-black dark:text-white mb-1.5 text-center uppercase">
              {dialog.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-center font-medium">
              {dialog.message}
            </p>

            {/* Verification Block */}
            {dialog.verificationText && (
              <div className="mb-6 flex flex-col gap-1.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">
                  Ketik <span className="text-red-600 font-black px-1.5 py-0.5 bg-red-50 rounded select-all">{dialog.verificationText}</span> untuk konfirmasi
                </label>
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  placeholder={`Ketik ${dialog.verificationText}`}
                  className="w-full text-center font-bold px-3 py-2.5 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-zinc-800 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all"
                  autoFocus
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border-2 border-black dark:border-white text-sm font-black uppercase text-black dark:text-white bg-white dark:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {dialog.cancelLabel ?? 'Batal'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isVerified}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase transition-all disabled:opacity-50 ${styles.button}`}
              >
                {dialog.confirmLabel ?? 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

