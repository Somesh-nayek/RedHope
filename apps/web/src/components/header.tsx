import { UserDropdown } from './user-dropdown';

export function Header({ section }: { section: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 px-5 backdrop-blur sm:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Red Hope</p>
        <p className="text-sm font-semibold">{section}</p>
      </div>
      <UserDropdown />
    </header>
  );
}
