'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';

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
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: 'bg-teal-100 text-teal-600',
      button: 'bg-teal-600 hover:bg-teal-700 text-white',
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
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              style={{ position: 'relative', float: 'right', marginBottom: -8 }}
            >
              <X size={14} className="text-slate-500" />
            </button>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${styles.icon}`}>
              <IconComponent size={22} />
            </div>

            {/* Title */}
            <h3 className="text-base font-extrabold text-slate-800 mb-1.5 text-center">
              {dialog.title}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed text-center">
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
                  className="w-full text-center font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  autoFocus
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {dialog.cancelLabel ?? 'Batal'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isVerified}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 ${styles.button}`}
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
