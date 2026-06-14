import { LoaderCircle } from 'lucide-react';

export function LoadingState({
  label = 'Loading...',
  fullPage = false
}: {
  label?: string;
  fullPage?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center gap-3 text-muted-foreground ${fullPage ? 'min-h-screen' : 'min-h-48'}`}>
      <LoaderCircle className="size-5 animate-spin text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
