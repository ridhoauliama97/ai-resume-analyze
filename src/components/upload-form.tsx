'use client';

import { useRouter } from 'next/navigation';
import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(pdf|docx|doc)$/i;

type AnalyzeResponse = {
  id?: string;
  error?: { message?: string };
};

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [attachmentState, setAttachmentState] = useState<AttachmentState>('idle');
  const [targetPosition, setTargetPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [datasetConsent, setDatasetConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setAttachmentState(selected ? 'done' : 'idle');
    setError(null);
  }

  function clearFile() {
    setFile(null);
    setAttachmentState('idle');
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function fail(message: string) {
    setError(message);
    setAttachmentState('error');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consent) {
      setError('Persetujuan diperlukan sebelum analisis.');
      return;
    }

    if (!file) {
      setError('Pilih berkas resume terlebih dahulu.');
      return;
    }

    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      fail('Format berkas harus PDF, DOCX, atau DOC.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      fail('Ukuran berkas maksimal 10 MB.');
      return;
    }

    const form = new FormData();
    form.set('file', file);
    form.set('consent', 'true');
    form.set('datasetConsent', datasetConsent ? 'true' : 'false');

    if (targetPosition.trim()) {
      form.set('targetPosition', targetPosition.trim());
    }
    if (jobDescription.trim()) {
      form.set('jobDescription', jobDescription.trim());
    }

    setPending(true);
    setAttachmentState('uploading');

    const processingTimer = window.setTimeout(() => {
      setAttachmentState('processing');
    }, 700);

    try {
      const data = await toast.promise(
        (async () => {
          const response = await fetch('/api/analyze', { method: 'POST', body: form });
          const payload = (await response.json().catch(() => null)) as AnalyzeResponse | null;

          if (!response.ok) {
            throw new Error(payload?.error?.message ?? 'Analisis gagal. Coba lagi.');
          }

          if (!payload?.id) {
            throw new Error('Respons analisis tidak valid. Coba lagi.');
          }

          return payload as { id: string };
        })(),
        {
          loading: 'Menganalisis resume...',
          success: 'Analisis selesai. Membuka report...',
          error: (cause) =>
            cause instanceof Error ? cause.message : 'Analisis gagal. Coba lagi.',
        },
      );

      setAttachmentState('done');
      router.push(`/analysis/${data.id}`);
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : 'Analisis gagal. Coba lagi.');
    } finally {
      window.clearTimeout(processingTimer);
      setPending(false);
    }
  }

  const attachmentDescription =
    attachmentState === 'error'
      ? 'Berkas gagal diproses. Periksa detail di bawah.'
      : attachmentState === 'uploading'
        ? 'Mengunggah berkas ke penyimpanan...'
        : attachmentState === 'processing'
          ? 'Menilai struktur, pengalaman, dan keyword resume...'
          : file
            ? `${formatFileSize(file.size)} · ${file.name.split('.').pop()?.toUpperCase() ?? 'Dokumen'}`
            : 'PDF, DOCX, atau DOC — maksimal 10 MB.';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis resume</CardTitle>
        <CardDescription>
          Unggah PDF/DOCX/DOC maksimal 10 MB. Tambahkan posisi target atau job description
          untuk penilaian yang lebih spesifik.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="resume-file" className="text-sm font-medium">
              Berkas resume
            </label>
            <Input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onFileChange}
              className="sr-only"
            />

            <Attachment state={attachmentState} className="w-full">
              <AttachmentTrigger
                render={<label htmlFor="resume-file" />}
                aria-label="Pilih berkas"
              />
              <AttachmentMedia>
                {pending ? <Spinner /> : file ? <FileText /> : <Upload />}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>
                  {file
                    ? file.name
                    : attachmentState === 'error'
                      ? 'Berkas gagal diproses'
                      : 'Belum ada berkas dipilih'}
                </AttachmentTitle>
                <AttachmentDescription aria-live="polite">
                  {attachmentDescription}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions className="gap-1">
                {file ? (
                  <>
                    <AttachmentAction
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Ganti berkas"
                    >
                      Ganti
                    </AttachmentAction>
                    <AttachmentAction
                      type="button"
                      onClick={clearFile}
                      aria-label="Hapus berkas"
                    >
                      <X aria-hidden="true" />
                    </AttachmentAction>
                  </>
                ) : (
                  <AttachmentAction
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Pilih berkas"
                  >
                    Pilih
                  </AttachmentAction>
                )}
              </AttachmentActions>
            </Attachment>

            <p className="text-xs text-muted-foreground">
              PDF, DOCX, atau DOC — maksimal 10 MB.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="target-position" className="text-sm font-medium">
              Posisi target (opsional)
            </label>
            <Input
              id="target-position"
              value={targetPosition}
              onChange={(event) => setTargetPosition(event.target.value)}
              placeholder="Contoh: Frontend Engineer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="job-description" className="text-sm font-medium">
              Job description (opsional)
            </label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Tempel job description di sini agar penilaian lebih spesifik."
              rows={5}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <Checkbox
                aria-label="Persetujuan pemrosesan dan penyimpanan"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <span>
                Saya menyetujui resume diproses oleh layanan AI dan report analisis
                disimpan agar bisa saya buka kembali. Lihat{' '}
                <a
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  pemberitahuan privasi
                </a>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <Checkbox
                aria-label="Izin penggunaan dataset"
                checked={datasetConsent}
                onCheckedChange={(checked) => setDatasetConsent(checked === true)}
                className="mt-0.5"
              />
              <span>
                Saya memberi izin analisis ini dipakai untuk peningkatan kualitas penilaian
                dan dataset training model (opsional).
              </span>
            </label>
          </div>

          {pending ? (
            <Progress value={null} className="w-full">
              <ProgressLabel className="text-sm text-muted-foreground">
                {attachmentState === 'uploading'
                  ? 'Mengunggah berkas...'
                  : 'Menganalisis resume...'}
              </ProgressLabel>
            </Progress>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="mt-4 justify-end">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Menganalisis...' : 'Analisis Resume'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
