import Link from 'next/link';
import { UploadForm } from '@/components/upload-form';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">AI Resume Analyzer</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Nilai resume-mu sebelum dikirim.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Dapatkan skor 0–100, rincian per kategori, dan saran perbaikan yang konkret.
          Tambahkan posisi target atau job description untuk penilaian yang lebih spesifik.
        </p>
        <p className="text-sm">
          <Link href="/history" className="underline underline-offset-4 hover:text-foreground">
            Lihat riwayat analisis
          </Link>
        </p>
      </header>

      <UploadForm />

      <p className="text-xs text-muted-foreground">
        Jangan unggah dokumen dengan data sensitif yang tidak perlu, seperti nomor identitas.
      </p>
    </main>
  );
}
