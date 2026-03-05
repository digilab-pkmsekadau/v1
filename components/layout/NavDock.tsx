'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Syringe, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'input', label: 'Input Data', icon: Syringe, href: '/input' },
  { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/settings' },
];

export default function NavDock() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
      style={{ width: 'min(90%, 400px)' }}
    >
      <div
        className="flex items-center justify-around px-3 py-2.5 rounded-[28px] border border-white/70"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <button
              key={id}
              onClick={() => router.push(href)}
              className={cn(
                'relative flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-300 cursor-pointer',
                isActive
                  ? 'text-teal-700'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(20,184,166,0.08))',
                    border: '1px solid rgba(13,148,136,0.15)',
                  }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  'relative z-10 transition-all duration-200',
                  isActive
                    ? 'text-teal-600 drop-shadow-[0_2px_6px_rgba(13,148,136,0.4)]'
                    : 'text-slate-400 group-hover:scale-110'
                )}
                style={{ transform: isActive ? 'scale(1.05)' : undefined }}
              />
              <span className={cn(
                'relative z-10 text-[11px] font-semibold tracking-wide transition-colors duration-200',
                isActive ? 'text-teal-700' : 'text-slate-400'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
