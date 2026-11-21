import Link from "next/link";
import { ArrowRight, FileText, Gauge, Sparkles } from "lucide-react";
import { UploadForm } from "@/components/upload-form";

const FEATURES = [
  {
    icon: Gauge,
    title: "Skor 0–100 yang jujur",
    description:
      "Tujuh kategori ATS dengan bobot tetap, dihitung server-side. Band merah, kuning, hijau selalu disertai label teks.",
  },
  {
    icon: FileText,
    title: "Rincian & bukti",
    description:
      "Setiap kategori punya skor, alasan, dan kutipan dari resume. Rekomendasi prioritas dengan contoh konkret.",
  },
  {
    icon: Sparkles,
    title: "Job-specific opsional",
    description:
      "Tambahkan posisi target atau job description untuk penilaian relevansi, keyword gap, dan must-have yang hilang.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          Smart Resume Analyze
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Nilai resume-mu sebelum dikirim.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Dapatkan skor 0–100, rincian per kategori, dan saran perbaikan yang
          konkret. Tambahkan posisi target atau job description untuk penilaian
          yang lebih spesifik.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#unggah"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Mulai analisis
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Link
            href="/privacy"
            className="inline-flex h-10 items-center rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Pemberitahuan privasi
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-xl border bg-card p-6"
          >
            <feature.icon
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="text-base font-semibold">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <section id="unggah" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Unggah resume
          </h2>
          <p className="text-sm text-muted-foreground">
            PDF, DOCX, atau DOC — maksimal 10 MB. Hasil analisis bisa diunduh
            dan prompt perbaikannya bisa disalin.
          </p>
        </div>
        <UploadForm />
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Jangan unggah dokumen dengan data sensitif yang tidak perlu, seperti
        nomor identitas. <br />
        <strong>
          Hasil analisis bersifat saran, bukan jaminan lolos seleksi.
        </strong>
      </p>
    </main>
  );
}
