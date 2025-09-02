'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AlertOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmOptions extends AlertOptions {
  onConfirm: () => void;
  onCancel?: () => void;
}

interface CustomAlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

interface CustomAlertProviderProps {
  children: ReactNode;
}

export function CustomAlertProvider({ children }: CustomAlertProviderProps) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions | null;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    options: null,
    type: 'alert'
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      isOpen: true,
      options,
      type: 'alert'
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

  return (
    <CustomAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      <AlertDialog open={alertState.isOpen} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertState.options?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertState.options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertState.type === 'confirm' && (
              <AlertDialogCancel onClick={handleCancel}>
                {alertState.options?.cancelText || 'Cancel'}
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={alertState.type === 'confirm' ? handleConfirm : handleClose}
              className={alertState.options?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {alertState.options?.confirmText || (alertState.type === 'confirm' ? 'Confirm' : 'OK')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (context === undefined) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
}