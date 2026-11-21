'use client';

import { FileText } from 'lucide-react';
import { useSiteSettings } from '@/components/site-settings-provider';

export function SiteBrand() {
  const { settings } = useSiteSettings();

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {settings.logoUrl ? (
        <span
          aria-hidden="true"
          className="size-6 shrink-0 rounded-md bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.logoUrl})` }}
        />
      ) : (
        <FileText aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate text-sm font-semibold tracking-tight">
        {settings.siteName}
      </span>
    </span>
  );
}
