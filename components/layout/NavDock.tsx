'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Syringe, Settings, Users, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home,          href: '/dashboard' },
  { id: 'input',     label: 'Input',     icon: Syringe,       href: '/input' },
  { id: 'pasien',    label: 'Pasien',    icon: Users,         href: '/pasien' },
  { id: 'riwayat',   label: 'Riwayat',   icon: ClipboardList, href: '/riwayat' },
  { id: 'settings',  label: 'Setting',   icon: Settings,      href: '/settings' },
];

export default function NavDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className={cn(
          'flex items-center justify-around px-1 pt-1.5',
          'border-t border-white/20 dark:border-white/5',
          'nav-dock-glass'
        )}
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={id}
              href={href}
              prefetch={true}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 group',
                'active:scale-90',
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {/* Animated pill background for active */}
              <span
                className={cn(
                  'absolute inset-0 rounded-2xl transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/50 scale-100 opacity-100'
                    : 'bg-transparent scale-75 opacity-0 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 group-hover:scale-100 group-hover:opacity-100'
                )}
              />

              <Icon
                size={21}
                strokeWidth={isActive ? 2.4 : 1.7}
                className={cn(
                  'relative z-10 transition-all duration-300',
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 -translate-y-0.5 drop-shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 group-hover:-translate-y-0.5'
                )}
              />
              <span className={cn(
                'relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-300',
                isActive
                  ? 'text-teal-700 dark:text-teal-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              )}>
                {label}
              </span>

              {/* Active glow dot */}
              <span
                className={cn(
                  'absolute -bottom-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-500',
                  isActive
                    ? 'w-5 h-1 bg-gradient-to-r from-teal-400 to-teal-500 dark:from-teal-400 dark:to-teal-300 scale-100 opacity-100 blur-[1px]'
                    : 'w-1 h-1 bg-transparent scale-0 opacity-0'
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
