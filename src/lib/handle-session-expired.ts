'use client';

import { toast } from '@/components/ui/use-toast';

export const SESSION_EXPIRED = 'SESSION_EXPIRED' as const;

export function isSessionExpired(result: Record<string, unknown>): boolean {
  return (result as { errorCode?: string }).errorCode === SESSION_EXPIRED;
}

export function handleSessionExpired(): void {
  toast({
    variant: 'destructive',
    title: 'Session expired',
    description: 'Refreshing your session...',
  });
  setTimeout(() => window.location.reload(), 1500);
}
