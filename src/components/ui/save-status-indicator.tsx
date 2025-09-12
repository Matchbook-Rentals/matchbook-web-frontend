import React, { useEffect, useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useApplicationStore } from '@/stores/application-store';

export const SaveStatusIndicator: React.FC = () => {
  const { isSaving, lastSaveTime, saveError } = useApplicationStore();
  const [showSaved, setShowSaved] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isSaving && lastSaveTime && !saveError) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), isDevelopment ? 3000 : 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaveTime, saveError, isDevelopment]);

  // In development, make the indicator more prominent
  const baseClasses = isDevelopment 
    ? "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border-2"
    : "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-md border";

  if (isSaving) {
    return (
      <div className={`${baseClasses} bg-blue-50 border-blue-300`}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          {isDevelopment ? 'Auto-saving to database...' : 'Saving...'}
        </span>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className={`${baseClasses} bg-red-50 border-red-300`}>
        <AlertCircle className="w-4 h-4 text-red-600" />
        <div>
          <span className="text-sm font-medium text-red-700">Failed to save</span>
          {isDevelopment && saveError && (
            <p className="text-xs text-red-600 mt-1">{saveError}</p>
          )}
        </div>
      </div>
    );
  }

  if (showSaved) {
    return (
      <div className={`${baseClasses} bg-green-50 border-green-300`}>
        <Check className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          {isDevelopment ? 'Successfully saved to database' : 'Saved'}
        </span>
      </div>
    );
  }

  // In development, show a status message when idle
  if (isDevelopment && lastSaveTime) {
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
        Last saved: {lastSaveTime.toLocaleTimeString()}
      </div>
    );
  }

  return null;
};