'use client';

import { useSiteSettings } from '@/components/site-settings-provider';

export function SiteName() {
  const { settings } = useSiteSettings();

  return <>{settings.siteName}</>;
}
