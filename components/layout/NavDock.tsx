'use client';

import { Home, Syringe, Settings, Users, ClipboardList, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home,          href: '/dashboard' },
  { id: 'input',     label: 'Input',     icon: Syringe,       href: '/input' },
  { id: 'pasien',    label: 'Pasien',    icon: Users,         href: '/pasien' },
  { id: 'riwayat',   label: 'Riwayat',   icon: ClipboardList, href: '/riwayat' },
  { id: 'statistik', label: 'Statistik', icon: BarChart3,      href: '/statistik' },
  { id: 'settings',  label: 'Setting',   icon: Settings,      href: '/settings' },
];

export default function NavDock() {
  const pathname = usePathname();

  return (
    <nav className="nav-dock-glass fixed bottom-0 left-0 right-0 z-50">
      <div
        className="grid grid-cols-6 items-end gap-0 px-1 pt-1.5"
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
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 cursor-pointer transition-all duration-150 sm:px-2 sm:py-2',
                'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                isActive
                  ? 'bg-orange-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                  : 'border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-gray-100 dark:hover:bg-zinc-800'
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  'transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'
                )}
              />
              <span className={cn(
                'w-full truncate text-center text-[7px] font-bold uppercase tracking-normal transition-colors min-[400px]:text-[8px] sm:text-[10px] sm:tracking-wide',
                isActive
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
