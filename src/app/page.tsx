import Link from 'next/link';
import { UploadForm } from '@/components/upload-form';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Nilai resume-mu sebelum dikirim.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Dapatkan skor 0–100, rincian per kategori, dan saran perbaikan yang konkret.
          Tambahkan posisi target atau job description untuk penilaian yang lebih spesifik.
        </p>
        <p className="text-sm">
          <Link href="/history" className="underline underline-offset-4">
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
