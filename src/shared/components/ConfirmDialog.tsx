/**
 * ConfirmDialog
 * Diálogo de confirmación personalizado con el estilo de la aplicación
 * Reemplaza los confirm() nativos de JavaScript
 */

'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type DialogType = 'confirm' | 'alert' | 'success' | 'error' | 'warning';

interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface DialogContextType {
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  alert: (options: DialogOptions | string) => Promise<void>;
  success: (message: string, title?: string) => Promise<void>;
  error: (message: string, title?: string) => Promise<void>;
  warning: (message: string, title?: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions;
  resolve: ((value: boolean) => void) | null;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    options: { message: '' },
    resolve: null,
  });

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const confirm = useCallback((options: DialogOptions | string): Promise<boolean> => {
    const opts = typeof options === 'string'
      ? { message: options, type: 'confirm' as DialogType, showCancel: true }
      : { ...options, type: 'confirm' as DialogType, showCancel: true };
    return showDialog(opts);
  }, [showDialog]);

  const alert = useCallback((options: DialogOptions | string): Promise<void> => {
    const opts = typeof options === 'string'
      ? { message: options, type: 'alert' as DialogType, showCancel: false }
      : { ...options, type: 'alert' as DialogType, showCancel: false };
    return showDialog(opts).then(() => {});
  }, [showDialog]);

  const success = useCallback((message: string, title?: string): Promise<void> => {
    return showDialog({
      message,
      title: title || 'Éxito',
      type: 'success',
      showCancel: false,
      confirmText: 'Aceptar',
    }).then(() => {});
  }, [showDialog]);

  const error = useCallback((message: string, title?: string): Promise<void> => {
    return showDialog({
      message,
      title: title || 'Error',
      type: 'error',
      showCancel: false,
      confirmText: 'Aceptar',
    }).then(() => {});
  }, [showDialog]);

  const warning = useCallback((message: string, title?: string): Promise<void> => {
    return showDialog({
      message,
      title: title || 'Advertencia',
      type: 'warning',
      showCancel: false,
      confirmText: 'Aceptar',
    }).then(() => {});
  }, [showDialog]);

  const handleConfirm = useCallback(() => {
    dialog.resolve?.(true);
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, [dialog.resolve]);

  const handleCancel = useCallback(() => {
    dialog.resolve?.(false);
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, [dialog.resolve]);

  const getIcon = () => {
    switch (dialog.options.type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-amber-400" />;
      case 'confirm':
        return <AlertTriangle className="w-12 h-12 text-blue-400" />;
      default:
        return <Info className="w-12 h-12 text-blue-400" />;
    }
  };

  const getButtonColor = () => {
    switch (dialog.options.type) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, success, error, warning }}>
      {children}

      {/* Dialog Overlay */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dialog.options.showCancel ? handleCancel : undefined}
          />

          {/* Dialog */}
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {dialog.options.title || 'Confirmar'}
              </h3>
              {dialog.options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center">
              {getIcon()}
              <p className="mt-4 text-white/80 text-base leading-relaxed">
                {dialog.options.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-white/10 bg-white/5">
              {dialog.options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white/80 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {dialog.options.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors ${getButtonColor()}`}
              >
                {dialog.options.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
