/**
 * Toast hook for showing notifications
 *
 * This is a simplified version for the knowledge base components.
 * Replace with actual toast implementation from shadcn/ui.
 */

import { useState, useCallback } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Toast) => {
    console.log('[Toast]', toast);
    // In a real implementation, this would show a UI toast
    // For now, just log it
    setToasts(prev => [...prev, toast]);
  }, []);

  return { toast, toasts };
}
