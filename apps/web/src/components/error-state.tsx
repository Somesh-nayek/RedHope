import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" />
      <p className="mt-3 font-medium text-destructive">Unable to load this page</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
