'use client';

import { LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function UserDropdown() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (!user) return null;

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-40 truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-card p-2 shadow-lg">
        <div className="border-b px-3 py-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </details>
  );
}
