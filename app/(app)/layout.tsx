'use client';

import TopHeader from '@/components/layout/TopHeader';
import NavDock from '@/components/layout/NavDock';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { useInactivity } from '@/hooks/useInactivity';

function AppContent({ children }: { children: React.ReactNode }) {
  // Auto-logout setelah 30 menit tidak aktif
  useInactivity();

  return (
    <>
      <TopHeader />
      <main className="pt-16 pb-28 max-w-2xl mx-auto min-h-screen">
        {children}
      </main>
      <NavDock />
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <AppContent>{children}</AppContent>
    </ConfirmProvider>
  );
}
