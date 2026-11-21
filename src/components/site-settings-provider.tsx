'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SiteSettings } from '@/lib/db/queries';

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Smart Resume Analyze',
  logoUrl: null,
};

type SiteSettingsContextValue = {
  settings: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;

    fetch('/api/settings', { cache: 'no-store' })
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

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }

  return context;
}
