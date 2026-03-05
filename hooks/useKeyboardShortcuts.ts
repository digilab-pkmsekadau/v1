'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  onRefresh?: () => void;
}

export function useKeyboardShortcuts({ onRefresh }: ShortcutConfig = {}) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      if (e.key === 'Escape') return; // Let modals handle escape

      if (isEditing) return;

      switch (e.key.toLowerCase()) {
        case 'r':
          // R = refresh dashboard
          if (onRefresh) {
            e.preventDefault();
            onRefresh();
          }
          break;
        case 'n':
          // N = navigate to input
          e.preventDefault();
          router.push('/input');
          break;
        case 'd':
          // D = navigate to dashboard
          e.preventDefault();
          router.push('/dashboard');
          break;
        case '/':
          // / = focus search input if exists
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Cari"]');
          if (searchInput) searchInput.focus();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRefresh, router]);
}
