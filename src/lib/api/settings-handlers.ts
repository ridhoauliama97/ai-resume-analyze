import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { Db } from '@/lib/db/client';
import { getSiteSettings, updateSiteSettings } from '@/lib/db/queries';
import { isAdminRequest } from './admin-handlers';
import type { ResumeStorage } from '@/lib/storage/types';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const VERSION_PATTERN = /^\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?$/;
const LOGO_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function normalizeAppVersion(value: string): string | null {
  const normalized = value.trim().replace(/^v/i, '');

  if (
    normalized.length === 0 ||
    normalized.length > 32 ||
    !VERSION_PATTERN.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

export type SettingsHandlerDeps = {
  db: Db;
  storage: ResumeStorage;
  publicUrl: (key: string) => string;
};

export async function handleGetSettings(db: Db): Promise<NextResponse> {
  return NextResponse.json({ settings: await getSiteSettings(db) });
}

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function keyFromLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) {
    return null;
  }

  const marker = '/site-assets/';
  const index = logoUrl.indexOf(marker);
  return index >= 0 ? logoUrl.slice(index + marker.length) : null;
}

export async function handleUpdateSettings(
  request: Request,
  deps: SettingsHandlerDeps,
): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return errorResponse(401, 'unauthorized', 'Akses admin diperlukan.');
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, 'invalid_body', 'Permintaan pengaturan tidak valid.');
  }

  const siteName = String(form.get('siteName') ?? '').trim();
  if (siteName.length === 0 || siteName.length > 80) {
    return errorResponse(400, 'invalid_site_name', 'Nama website harus 1–80 karakter.');
  }

  const current = await getSiteSettings(deps.db);
  const appVersionInput = form.get('appVersion');
  const appVersion =
    appVersionInput === null
      ? current.appVersion
      : normalizeAppVersion(String(appVersionInput));

  if (!appVersion) {
    return errorResponse(
      400,
      'invalid_app_version',
      'Versi sistem harus berupa angka, misalnya 0.1.0.',
    );
  }

  const logo = form.get('logo');
  const removeLogo = form.get('removeLogo') === 'true';
  let logoUrl = removeLogo ? null : current.logoUrl;
  let uploadedKey: string | null = null;

  if (logo instanceof File && logo.size > 0) {
    const extension = LOGO_MIME[logo.type];
    if (!extension) {
      return errorResponse(400, 'invalid_logo', 'Logo harus berupa PNG, JPG, atau WEBP.');
    }

    if (logo.size > MAX_LOGO_BYTES) {
      return errorResponse(400, 'logo_too_large', 'Ukuran logo maksimal 2 MB.');
    }

    uploadedKey = `branding/${randomUUID()}.${extension}`;

    try {
      await deps.storage.upload({
        key: uploadedKey,
        body: new Uint8Array(await logo.arrayBuffer()),
        contentType: logo.type,
      });
      logoUrl = deps.publicUrl(uploadedKey);
    } catch {
      return errorResponse(502, 'storage_unavailable', 'Gagal mengunggah logo. Coba lagi.');
    }
  }

  try {
    const settings = await updateSiteSettings(deps.db, {
      siteName,
      logoUrl,
      appVersion,
    });

    const previousKey = keyFromLogoUrl(current.logoUrl);
    if (previousKey && previousKey !== uploadedKey) {
      await deps.storage.remove(previousKey).catch(() => undefined);
    }

    return NextResponse.json({ settings });
  } catch {
    if (uploadedKey) {
      await deps.storage.remove(uploadedKey).catch(() => undefined);
    }

    return errorResponse(500, 'internal_error', 'Gagal menyimpan pengaturan. Coba lagi.');
  }
}
