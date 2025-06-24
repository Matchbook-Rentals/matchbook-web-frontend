'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EmbeddedComponentSettings {
  theme: 'light' | 'dark';
  locale: string;
  overlay: 'dialog' | 'drawer';
  enableBorder: boolean;
}

interface EmbeddedComponentContextType {
  settings: EmbeddedComponentSettings;
  updateSettings: (newSettings: Partial<EmbeddedComponentSettings>) => void;
}

const EmbeddedComponentContext = createContext<EmbeddedComponentContextType | undefined>(undefined);

export const useEmbeddedComponentSettings = () => {
  const context = useContext(EmbeddedComponentContext);
  if (context === undefined) {
    throw new Error('useEmbeddedComponentSettings must be used within an EmbeddedComponentProvider');
  }
  return context;
};

interface EmbeddedComponentProviderProps {
  children: ReactNode;
  initialSettings?: Partial<EmbeddedComponentSettings>;
}

export const EmbeddedComponentProvider: React.FC<EmbeddedComponentProviderProps> = ({
  children,
  initialSettings = {},
}) => {
  const [settings, setSettings] = useState<EmbeddedComponentSettings>({
    theme: 'light',
    locale: 'en-US',
    overlay: 'dialog',
    enableBorder: false,
    ...initialSettings,
  });

  const updateSettings = (newSettings: Partial<EmbeddedComponentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <EmbeddedComponentContext.Provider value={{ settings, updateSettings }}>
      {children}
    </EmbeddedComponentContext.Provider>
  );
};

export default EmbeddedComponentProvider;