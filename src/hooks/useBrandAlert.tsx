'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import BrandModal from '@/components/BrandModal';
import { BrandButton } from '@/components/ui/brandButton';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onClose?: () => void;
}

interface ConfirmOptions extends AlertOptions {
  onConfirm: () => void;
  onCancel?: () => void;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface BrandAlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const BrandAlertContext = createContext<BrandAlertContextType | undefined>(undefined);

interface BrandAlertProviderProps {
  children: ReactNode;
}

const getIconAndColors = (type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        titleColor: 'text-green-800',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'error':
      return {
        icon: <XCircle className="w-6 h-6 text-red-600" />,
        titleColor: 'text-red-800',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
        titleColor: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    case 'info':
    default:
      return {
        icon: <Info className="w-6 h-6 text-blue-600" />,
        titleColor: 'text-blue-800',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
  }
};

export function BrandAlertProvider({ children }: BrandAlertProviderProps) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions | ConfirmOptions | null;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
  }>({
    isOpen: false,
    options: null,
    type: 'alert'
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      isOpen: true,
      options,
      type: 'alert',
      onClose: options.onClose
    });
  };

  const showConfirm = (options: ConfirmOptions) => {
    setAlertState({
      isOpen: true,
      options,
      type: 'confirm',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel
    });
  };

  const handleClose = () => {
    if (alertState.onClose) {
      alertState.onClose();
    }
    setAlertState({
      isOpen: false,
      options: null,
      type: 'alert'
    });
  };

  const handleConfirm = () => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    handleClose();
  };

  const renderContent = () => {
    if (!alertState.options) return null;

    const { icon, titleColor, bgColor, borderColor } = getIconAndColors(alertState.options.type);
    const isConfirm = alertState.type === 'confirm';
    const confirmOptions = isConfirm ? alertState.options as ConfirmOptions : null;

    return (
      <div className="p-6">
        {/* Icon and Title */}
        <div className={`flex items-center gap-3 p-4 rounded-lg ${bgColor} ${borderColor} border mb-4`}>
          {icon}
          <div className="flex-1">
            {alertState.options.title && (
              <h2 className={`text-lg font-semibold ${titleColor} mb-1`}>
                {alertState.options.title}
              </h2>
            )}
            <p className="text-gray-700 text-sm">
              {alertState.options.message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {isConfirm && (
            <BrandButton
              variant="outline"
              onClick={handleCancel}
              className="px-4"
            >
              {confirmOptions?.cancelText || 'Cancel'}
            </BrandButton>
          )}
          <BrandButton
            onClick={isConfirm ? handleConfirm : handleClose}
            variant={confirmOptions?.variant === 'destructive' ? 'destructive' : 'default'}
            className="px-4"
          >
            {alertState.options.confirmText || (isConfirm ? 'Confirm' : 'OK')}
          </BrandButton>
        </div>
      </div>
    );
  };

  return (
    <BrandAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      <BrandModal
        isOpen={alertState.isOpen}
        onOpenChange={handleClose}
        className="max-w-md"
      >
        {renderContent()}
      </BrandModal>
    </BrandAlertContext.Provider>
  );
}

export function useBrandAlert() {
  const context = useContext(BrandAlertContext);
  if (context === undefined) {
    throw new Error('useBrandAlert must be used within a BrandAlertProvider');
  }
  return context;
}

// Convenience functions to match native alert/confirm behavior
export function createBrandAlert(showAlert: BrandAlertContextType['showAlert']) {
  return (message: string, type: AlertOptions['type'] = 'info', title?: string, onClose?: () => void) => {
    showAlert({ message, type, title, onClose });
  };
}

export function createBrandConfirm(showConfirm: BrandAlertContextType['showConfirm']) {
  return (message: string, onConfirm: () => void, options?: Partial<ConfirmOptions>) => {
    showConfirm({
      message,
      onConfirm,
      type: options?.type || 'warning',
      title: options?.title,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      variant: options?.variant,
      onCancel: options?.onCancel
    });
  };
}