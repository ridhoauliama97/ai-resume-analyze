# Analisis Resume AI

Aplikasi web untuk menilai resume PDF/DOCX/DOC terhadap standar ATS, dengan lapis
job-specific opsional bila pengguna mengisi posisi target atau job description.
Hasil berisi skor 0–100, rincian per kategori, rekomendasi perbaikan, dan feedback
yang tersimpan di PostgreSQL untuk peningkatan kualitas penilaian.

## Fitur

- Unggah PDF, DOCX, atau DOC (maksimal 10 MB).
- Skor global ATS dengan tujuh kategori berbobot; skor job-specific dengan lima
  kategori bila posisi target atau job description diisi.
- Skor total: `round(0.6 × global + 0.4 × job)` bila skor job tersedia, selain itu
  skor global.
- Band merah (<50), kuning (50–69), dan hijau (≥70), selalu disertai label teks.
- Rekomendasi perbaikan dengan prioritas, bukti, dan contoh; vote thumbs up/down
  per rekomendasi dan komentar keseluruhan.
- Riwayat anonim per browser (cookie), tanpa login. Non-admin tidak melihat daftar
  riwayat; admin dapat melihat seluruh riwayat di `/admin` (login `/auth/admin`).
- Report memiliki tombol unduh (cetak/save as PDF) dan salin prompt perbaikan resume.
- Halaman privasi yang menjelaskan pemrosesan Gemini/Tavily, retensi, izin dataset
  opsional, dan cara menghapus data.

## Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS 4 + komponen Base UI/shadcn
- PostgreSQL 16 + Drizzle ORM
- Gemini melalui `@google/genai`; Tavily untuk konteks pasar (opsional)
- Vitest + Testing Library untuk unit/integrasi, Playwright untuk E2E

## Prasyarat

- Node.js 20+ (dikembangkan dengan Node 26)
- Docker Desktop (atau PostgreSQL 16 yang bisa diakses)
- Gemini API key
- Tavily API key (opsional; tanpa key, analisis tetap berjalan tanpa konteks pasar)

## Setup

```bash
npm install
docker compose up -d
cp .env.example .env.local
```

Isi `.env.local`:

- `DATABASE_URL` dan `TEST_DATABASE_URL` (database test harus berakhiran `_test`).
- `GEMINI_API_KEY` dan `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).
- `TAVILY_API_KEY` bila ingin konteks pasar.
- `CLIENT_TOKEN_PEPPER` dengan string acak panjang.
- `ADMIN_USERNAME` dan `ADMIN_PASSWORD` untuk dashboard admin di `/admin`.
- `AI_MOCK=0` untuk pemakaian normal. Jangan pernah memakai `AI_MOCK=1` di
  production.

Jalankan migrasi dan server pengembangan:

```bash
npm run db:migrate
npm run dev
```

Buka `http://localhost:3000`.

## Script

| Script | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan Next.js |
| `npm run build` | Build production |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm test` | Unit + integrasi Vitest |
| `npm run test:e2e` | Playwright E2E (Chromium, AI mock, port 3100) |
| `npm run db:generate` | Generate migrasi Drizzle dari schema |
| `npm run db:migrate` | Terapkan migrasi ke database dev |
| `npm run db:migrate:test` | Terapkan migrasi ke database test |
| `npm run fixtures` | Regenerasi fixture PDF/DOCX di `tests/fixtures` |

## Testing

Test integrasi memakai `TEST_DATABASE_URL` dan mengosongkan tabel di antara test.
File test dijalankan serial (`fileParallelism: false`) karena berbagi satu database
test. Pastikan container Postgres aktif dan migrasi test sudah diterapkan
(`npm run db:migrate:test`).

Untuk E2E, secara default Playwright memakai Google Chrome yang sudah terpasang di
mesin (channel `chrome`). Alternatifnya, pasang Chromium bawaan Playwright lalu
set `PLAYWRIGHT_CHANNEL=chromium`:

```bash
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
```

Jalankan E2E dengan Chrome:

```bash
npm run test:e2e
```

Playwright menjalankan migrasi test, menyalakan Next.js di port 3100 dengan
`AI_MOCK=1`, lalu menguji alur unggah → report → vote → riwayat → hapus, serta
guard consent, peringatan scan, dan halaman privasi. Mock hanya aktif di luar
production dan menghasilkan skor total 79/100.

## Privasi dan data

- Tidak ada login. Riwayat dikaitkan dengan cookie `ra_client` berisi token acak;
  database hanya menyimpan HMAC-SHA256 token tersebut.
- Analisis hanya dijalankan setelah pengguna menyetujui pemrosesan AI dan
  penyimpanan riwayat. Versi dan waktu persetujuan dicatat.
- Izin dataset untuk peningkatan kualitas/training bersifat opsional, default
  tidak dicentang, dan disimpan per analisis.
- Teks resume dikirim ke Gemini API. Bila posisi target diisi, posisi tersebut
  dikirim ke Tavily; job description tidak dikirim ke Tavily.
- Data disimpan sampai pengguna menghapus analisis. Tidak ada auto-purge.
  Menghapus analisis juga menghapus rekomendasi dan feedback terkait (cascade).
- Kegagalan parsing atau AI tidak menyimpan row maupun teks resume.

## Ekspor dataset training

Hanya analisis dengan izin dataset yang boleh diekspor:

```sql
SELECT
  a.id,
  a.file_name,
  a.target_position,
  a.job_description,
  a.resume_text,
  a.global_score,
  a.job_score,
  a.overall_score,
  a.band,
  a.job_layer_status,
  a.prompt_version,
  a.model,
  a.result_json,
  a.created_at
FROM analyses a
WHERE a.dataset_consent = true
ORDER BY a.created_at;
```

Gabungkan feedback bila diperlukan:

```sql
SELECT
  a.id AS analysis_id,
  r.title,
  r.priority,
  f.rating,
  f.comment
FROM analyses a
JOIN recommendations r ON r.analysis_id = a.id
LEFT JOIN feedback f
  ON f.analysis_id = a.id
 AND f.recommendation_id = r.id
WHERE a.dataset_consent = true
ORDER BY a.created_at, r.sort_order;
```

## Evaluasi kualitas manual (golden set)

Jalankan setelah perubahan prompt/model dengan API asli:

1. Siapkan 5 resume yang mencakup band merah, kuning, dan hijau, sebagian dengan
   job description dan sebagian tanpa.
2. Analisis setiap resume satu kali, catat band dan skor total.
3. Analisis ulang resume yang sama tanpa mengubah input.
4. Kriteria lulus:
   - Minimal 4 dari 5 band sesuai ekspektasi penilaian manusia.
   - Selisih skor total antara analisis pertama dan kedua ≤ 5 poin per resume.
   - Rekomendasi tidak memuat klaim yang tidak ada di resume.
5. Bila kriteria gagal, tinjau prompt/rubrik. Bila perlu, naikkan `GEMINI_MODEL`
   ke model yang lebih kuat dan ulangi evaluasi.

## Deploy ke Vercel + Supabase

1. Buat project Supabase, lalu buka **Connect → Transaction pooler**. Salin
   connection string IPv4 port `6543` (bukan direct connection yang IPv6-only).
2. Terapkan migrasi ke database Supabase:
   ```bash
   DATABASE_URL="<transaction-pooler-url>" npm run db:migrate
   ```
3. Import repo ke Vercel, lalu set environment variables berikut di
   **Project Settings → Environment Variables**:
   - `DATABASE_URL` — transaction pooler Supabase
   - `GEMINI_API_KEY`, `GEMINI_MODEL`, `TAVILY_API_KEY`
   - `CLIENT_TOKEN_PEPPER` — string acak panjang
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` — kredensial admin
   - `DB_MAX_CONNECTIONS=3`
   - `AI_MOCK=0`
4. Deploy. Buka `/auth/admin`, login, lalu cek `/admin`.

`postgres-js` dikonfigurasi dengan `prepare: false` agar kompatibel dengan
transaction pooling Supabase. Hanya admin yang memiliki akses ke dashboard
riwayat; tidak ada registrasi user biasa.

Web Analytics aktif di project Vercel dan dirender lewat `@vercel/analytics`
di root layout.

### CI/CD dengan GitHub Actions

`.github/workflows/ci.yml` menjalankan lint, typecheck, unit/integration test,
build, dan E2E Playwright pada setiap push dan pull request. Test memakai
service Postgres sementara dan `PLAYWRIGHT_CHANNEL=chromium`.

Deploy production dilakukan lewat Vercel Deploy Hook setelah CI sukses di
`main`. Buat hook sekali di **Vercel → Project → Settings → Git → Deploy Hooks**
(branch `main`), lalu simpan URL-nya sebagai secret GitHub:

```bash
gh secret set VERCEL_DEPLOY_HOOK
```

`vercel.json` mematikan auto-deploy Git khusus branch `main` agar deployment
tidak berjalan dua kali; preview deployment untuk branch lain tetap aktif.

## Catatan deployment

- `AI_MOCK=1` hanya untuk pengembangan/pengujian; `buildAnalyzeDeps` menolaknya di
  `NODE_ENV=production`.
- Cookie `ra_client` ditandai `Secure` hanya di production. Pastikan aplikasi
  berjalan di balik HTTPS.
- `CLIENT_TOKEN_PEPPER` harus berupa string acak panjang; hash token memakai
  HMAC-SHA256.
- Pembatasan laju per-IP mempercayai header `X-Forwarded-For`. Di balik proxy,
  pastikan proxy menimpa header tersebut (bukan meneruskannya mentah) agar klien
  tidak bisa memalsukan IP. `X-Real-IP` dipakai bila tersedia.
- Cookieless (permintaan pertama) tunduk pada pembatasan laju per-IP; setelah
  cookie terbit, pembatasan per-klien juga berlaku.

## Struktur singkat

```
src/app/                 Halaman dan route API
src/components/          Komponen UI dan report
src/lib/ai/              Prompt, schema, Gemini/Tavily, orkestrasi
src/lib/api/             Handler route (analyze, read, feedback)
src/lib/db/              Schema Drizzle dan query
src/lib/parsing/         Ekstraksi teks PDF/DOCX/DOC
tests/unit|integration   Vitest
tests/e2e                Playwright
docs/superpowers/        Design dan implementation plan
```

## Dokumen desain

- `docs/superpowers/specs/2026-11-14-ai-resume-analyzer-design.md`
- `docs/superpowers/plans/2026-11-14-ai-resume-analyzer.md`
