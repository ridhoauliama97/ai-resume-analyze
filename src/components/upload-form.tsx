'use client';

import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(pdf|docx|doc)$/i;

type AnalyzeResponse = {
  id?: string;
  error?: { message?: string };
};

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetPosition, setTargetPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [datasetConsent, setDatasetConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
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
      setError('Format berkas harus PDF, DOCX, atau DOC.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Ukuran berkas maksimal 10 MB.');
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

    try {
      const response = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = (await response.json().catch(() => null)) as AnalyzeResponse | null;

      if (!response.ok) {
        setError(data?.error?.message ?? 'Analisis gagal. Coba lagi.');
        return;
      }

      if (!data?.id) {
        setError('Respons analisis tidak valid. Coba lagi.');
        return;
      }

      router.push(`/analysis/${data.id}`);
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
    } finally {
      setPending(false);
    }
  }

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
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onFileChange}
            />
            <p className="text-xs text-muted-foreground">
              {file ? file.name : 'PDF, DOCX, atau DOC — maksimal 10 MB.'}
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
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                aria-label="Persetujuan pemrosesan dan penyimpanan"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <span>
                Saya menyetujui resume diproses oleh layanan AI dan disimpan di riwayat
                analisis saya. Lihat{' '}
                <a href="/privacy" className="underline underline-offset-4">
                  pemberitahuan privasi
                </a>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
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
