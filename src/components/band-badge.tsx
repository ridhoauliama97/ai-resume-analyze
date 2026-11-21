import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { formatBand } from '@/lib/format';
import type { Band } from '@/lib/types';

function bandClass(band: Band): string {
  if (band === 'green') {
    return 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300';
  }
  if (band === 'yellow') {
    return 'bg-amber-500/10 text-amber-800 dark:text-amber-300';
  }
  return 'bg-red-600/10 text-red-800 dark:text-red-300';
}

export function BandBadge({ band, className }: { band: Band; className?: string }) {
  return (
    <Badge className={cn(bandClass(band), className)}>{formatBand(band)}</Badge>
  );
}
