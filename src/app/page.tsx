import Link from "next/link";
import { ArrowRight, FileText, Gauge, Sparkles } from "lucide-react";
import { SiteName } from "@/components/site-name";
import { UploadForm } from "@/components/upload-form";

const FEATURES = [
  {
    icon: Gauge,
    title: "Skor 0–100 yang jujur",
    description:
      "Tujuh kategori ATS dengan bobot tetap. Skor dihitung di server, jadi setiap versi resume dinilai dengan aturan yang sama.",
  },
  {
    icon: FileText,
    title: "Rincian & bukti",
    description:
      "Setiap skor disertai alasan dan kutipan dari resume. Rekomendasi perbaikan datang dengan prioritas dan contoh.",
  },
  {
    icon: Sparkles,
    title: "Sesuaikan dengan lowongan",
    description:
      "Tempel posisi target atau job description untuk melihat keyword yang sudah cocok dan yang masih hilang.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <SiteName />
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Nilai resume-mu sebelum dikirim.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Lihat skor ATS 0–100, alasan di balik setiap nilai, dan perbaikan
          prioritas untuk resume-mu. Tambahkan posisi target kalau ingin
          penilaian yang lebih spesifik.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#unggah"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cek resume saya
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Link
            href="/privacy"
            className="inline-flex h-10 items-center rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Pemberitahuan privasi
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Tanpa login. Analisis bisa kamu hapus kapan saja.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Setelah unggah
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Skor, bukti, dan perbaikan
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-6"
            >
              <feature.icon
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="unggah" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Unggah resume, lihat skornya
          </h2>
          <p className="text-sm text-muted-foreground">
            PDF, DOCX, atau DOC, maksimal 10 MB. Sekali unggah, kamu dapat skor
            ATS, bukti dari resume sendiri, dan perbaikan prioritas.
          </p>
        </div>
        <UploadForm />
      </section>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Jangan unggah dokumen dengan data sensitif yang tidak perlu, seperti
        nomor identitas atau rekening. <br />
        <strong>
          Hasil analisis adalah saran perbaikan, bukan jaminan lolos seleksi.
        </strong>
      </p>
    </main>
  );
}
