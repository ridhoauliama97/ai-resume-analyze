'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlusIcon, XIcon } from 'lucide-react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSiteSettings } from '@/components/site-settings-provider';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { SiteSettings } from '@/lib/db/queries';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsForm({
  initialSettings,
  currentModel,
}: {
  initialSettings: SiteSettings;
  currentModel: string;
}) {
  const router = useRouter();
  const { setSettings } = useSiteSettings();
  const [siteName, setSiteName] = useState(initialSettings.siteName);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);
  const [logoState, setLogoState] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'done'>(
    initialSettings.logoUrl ? 'done' : 'idle',
  );
  const [removeLogo, setRemoveLogo] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setPreviewFromFile(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setLogoPreview(objectUrl);
      return;
    }

    setLogoPreview(removeLogo ? null : logoUrl);
  }

  function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setLogoFile(file);
    setRemoveLogo(false);
    setPreviewFromFile(file);
    setLogoState(file ? 'done' : logoUrl ? 'done' : 'idle');
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const logoProcessingTimer = logoFile
      ? window.setTimeout(() => setLogoState('processing'), 700)
      : null;
    if (logoFile) {
      setLogoState('uploading');
    }

    const form = new FormData();
    form.set('siteName', siteName);
    form.set('removeLogo', removeLogo ? 'true' : 'false');
    if (logoFile) {
      form.set('logo', logoFile);
    }

    try {
      const settings = await toast.promise(
        (async () => {
          const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            body: form,
          });
          const payload = (await response.json().catch(() => null)) as
            | { settings?: SiteSettings; error?: { message?: string } }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error?.message ?? 'Gagal menyimpan pengaturan.');
          }

          if (!payload?.settings) {
            throw new Error('Respons pengaturan tidak valid.');
          }

          return payload.settings;
        })(),
        {
          loading: 'Menyimpan pengaturan...',
          success: 'Pengaturan tersimpan.',
          error: (cause) =>
            cause instanceof Error ? cause.message : 'Gagal menyimpan pengaturan.',
        },
      );

      setLogoUrl(settings.logoUrl);
      setLogoPreview(settings.logoUrl);
      setSettings(settings);
      setLogoState(settings.logoUrl ? 'done' : 'idle');
      setLogoFile(null);
      setRemoveLogo(false);
      router.refresh();
    } catch (cause) {
      if (logoFile) {
        setLogoState('error');
      }
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan pengaturan.');
    } finally {
      if (logoProcessingTimer) {
        window.clearTimeout(logoProcessingTimer);
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identitas website</CardTitle>
          <CardDescription>
            Nama dan logo ini dipakai di header publik dan sidebar admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="site-name" className="text-sm font-medium">
              Nama website
            </label>
            <Input
              id="site-name"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              maxLength={80}
              placeholder="Smart Resume Analyze"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="site-logo" className="text-sm font-medium">
              Logo / icon
            </label>
            <Input
              ref={logoInputRef}
              id="site-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onLogoChange}
              className="sr-only"
            />

            <Attachment
              state={logoState}
              aria-busy={logoState === 'uploading' || logoState === 'processing'}
              className="w-full"
            >
              <AttachmentTrigger
                render={<label htmlFor="site-logo" />}
                aria-label="Pilih logo"
              />
              <AttachmentMedia variant="image">
                {logoPreview ? (
                  <span
                    aria-hidden="true"
                    className="size-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${logoPreview})` }}
                  />
                ) : (
                  <ImagePlusIcon aria-hidden="true" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>
                  {logoFile
                    ? logoFile.name
                    : logoPreview
                      ? 'Logo saat ini'
                      : 'Belum ada logo'}
                </AttachmentTitle>
                <AttachmentDescription aria-live="polite">
                  {logoState === 'uploading'
                    ? 'Mengunggah logo...'
                    : logoState === 'processing'
                      ? 'Menyimpan pengaturan...'
                      : logoState === 'error'
                        ? 'Logo gagal disimpan. Periksa detail di bawah.'
                        : logoFile
                          ? `${formatFileSize(logoFile.size)} · ${logoFile.type}`
                          : 'PNG, JPG, atau WEBP — maksimal 2 MB.'}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions className="gap-1">
                {logoFile || logoPreview ? (
                  <AttachmentAction
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Ganti logo"
                  >
                    Ganti
                  </AttachmentAction>
                ) : (
                  <AttachmentAction
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Pilih logo"
                  >
                    Pilih
                  </AttachmentAction>
                )}
                {(logoFile || logoPreview) && !removeLogo ? (
                  <AttachmentAction
                    type="button"
                    onClick={() => {
                      setRemoveLogo(true);
                      setLogoFile(null);
                      setLogoPreview(null);
                      setLogoState('idle');
                    }}
                    aria-label="Hapus logo"
                    title="Hapus logo"
                  >
                    <XIcon aria-hidden="true" />
                  </AttachmentAction>
                ) : null}
              </AttachmentActions>
            </Attachment>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Menyimpan...' : 'Simpan pengaturan'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Pengaturan AI</CardTitle>
            <Badge variant="secondary">On-going</Badge>
          </div>
          <CardDescription>
            Opsi penyedia AI selain Google Gemini dan pemilihan model akan tersedia
            pada pembaruan berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="ai-provider" className="text-sm font-medium">
              Penyedia AI
            </label>
            <Input id="ai-provider" value="Google Gemini" disabled readOnly />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ai-model" className="text-sm font-medium">
              Model
            </label>
            <Input id="ai-model" value={currentModel} disabled readOnly />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
