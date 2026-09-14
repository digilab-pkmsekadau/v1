'use client';

import NavDock from '@/components/layout/NavDock';
import TopHeader from '@/components/layout/TopHeader';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { useInactivity } from '@/hooks/useInactivity';

function AppContent({ children }: { children: React.ReactNode }) {
  // Auto-logout setelah 30 menit tidak aktif
  useInactivity();

  return (
    <>
      <TopHeader />
      <main className="mx-auto min-h-dvh w-full max-w-2xl pt-16 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-24">
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
