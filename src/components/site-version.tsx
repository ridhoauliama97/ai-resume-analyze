'use client';

import { useSiteSettings } from '@/components/site-settings-provider';

export function SiteVersion() {
  const { settings } = useSiteSettings();

  return <>v{settings.appVersion}</>;
}
