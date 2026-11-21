'use client';

import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Smart Resume Analyze',
  logoUrl: null,
};

export function SiteBrand() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;

    fetch('/api/settings')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { settings?: SiteSettings } | null) => {
        if (active && data?.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

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
