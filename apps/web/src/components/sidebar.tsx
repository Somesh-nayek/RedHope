'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { HeartPulse } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export function Sidebar({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HeartPulse className="size-5" />
        </div>
        <div>
          <p className="font-bold leading-none">Red Hope</p>
          <p className="mt-1 text-xs text-muted-foreground">Blood network</p>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const active =
            pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
