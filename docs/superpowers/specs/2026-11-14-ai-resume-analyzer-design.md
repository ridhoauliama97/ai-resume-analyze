# AI Resume Analyzer — Design Document

Tanggal: 14 November 2026
Status: menunggu persetujuan
Bentuk: web app

## 1. Intent dan alasan

Membuat web app yang membantu pencari kerja menilai kualitas resume mereka sebelum
dikirim ke perusahaan. User mengunggah resume (PDF/DOCX), opsional menempelkan job
description atau posisi target, lalu mendapat skor 0–100 dengan diagram berwarna,
rincian per kategori, dan anjuran perbaikan yang konkret.

Penilaian memakai dua lapis:

1. **Global** — selalu dihitung, berbasis praktik standar internasional penilaian
   resume (ATS compatibility, struktur, dampak terukur, keyword, bahasa).
2. **Job-specific** — hanya jika user mengisi job description atau posisi target;
   mengukur kecocokan resume dengan lowongan tersebut.

Hasil analisis dan feedback disimpan di PostgreSQL. Selain menjadi riwayat user,
data ini adalah fondasi dataset untuk proyek terpisah di masa depan: melatih model
penilaian sendiri.

## 2. Keputusan yang sudah disepakati

| Topik | Keputusan |
| --- | --- |
| Bentuk | Web app di browser |
| Stack | Next.js full-stack (App Router, TypeScript) + PostgreSQL (Drizzle ORM) |
| Mesin AI | Gemini API, dipanggil dari server |
| Enrichment | Tavily untuk konteks pasar kerja (opsional, hanya untuk lapis job-specific) |
| Input | 1 file resume PDF/DOCX/DOC, maksimal 10 MB; job description/posisi target opsional |
| Output | Skor total 0–100 + skor global + skor job-specific, diagram warna, anjuran perbaikan |
| Warna | < 50 merah, 50–69 kuning, ≥ 70 hijau |
| Riwayat | Tanpa login; terikat ke browser lewat cookie anonim |
| Database | PostgreSQL 16 via Docker Compose saat development |
| Feedback | Thumbs up/down per anjuran + komentar keseluruhan |
| Persetujuan | Wajib untuk pemrosesan + riwayat; opsional terpisah untuk dataset training |
| Retensi | Sampai user menghapus analisis; tanpa auto-purge pada fase ini |
| Bahasa | UI dan isi report Bahasa Indonesia; resume/JD boleh Bahasa Indonesia atau Inggris |

## 3. Goals

1. Upload resume dan dapat report dalam satu alur, tanpa login.
2. Skor global yang konsisten dan dapat dijelaskan: setiap kategori punya bobot,
   alasan, dan bukti dari teks resume.
3. Penilaian job-specific yang berguna ketika user menyertakan lowongan: keyword
   cocok/hilang, relevansi pengalaman, dan gap utama.
4. Anjuran perbaikan yang spesifik, diprioritaskan, dan merujuk bukti di resume —
   bukan saran generik.
5. Riwayat analisis tersimpan per browser dan bisa dibuka lagi atau dihapus.
6. Feedback tersimpan rapi; analisis yang user izinkan bisa diekspor sebagai
   dataset training nanti.
7. Kunci API tidak pernah sampai ke browser.

## 4. Non-goals

- Login/akun, sinkronisasi lintas perangkat, atau multi-user workspace.
- OCR untuk PDF hasil scan/gambar.
- Editor resume atau penulisan ulang resume otomatis.
- Auto-apply lowongan, integrasi job board, atau scraping lowongan.
- Pelatihan/fine-tuning model di dalam aplikasi ini.
- Dashboard admin, pembayaran, atau fitur tim.
- Deployment produksi otomatis (app disiapkan agar mudah dideploy, tapi belum
  di-deploy pada fase ini).
- Dukungan lebih dari satu file per analisis.

## 5. Anti-goals

Hal-hal yang membuat proyek ini gagal meskipun secara teknis "jalan":

- **Skor palsu atau tidak stabil.** Angka harus berasal dari rubrik dan dihitung
  ulang di server, bukan dipercaya mentah dari model. Resume yang sama tidak boleh
  melompat jauh antar-analisis tanpa alasan.
- **Halusinasi.** Anjuran tidak boleh mengarang pengalaman, angka, atau bagian yang
  tidak ada di resume. Setiap temuan wajib punya bukti dari teks.
- **Kebocoran rahasia.** API key di bundle client, log berisi teks resume, atau
  riwayat user lain bisa diakses.
- **Data pribadi tanpa izin.** Resume disimpan hanya setelah user menyetujui notice.
- **Alur rapuh.** File rusak, PDF scan, atau timeout Gemini harus menghasilkan pesan
  yang jelas, bukan halaman error mentah.
- **UI yang mengandalkan warna saja.** Status merah/kuning/hijau harus disertai
  label dan ikon.

## 6. Constraints dan asumsi

- Gemini API key tersedia dan valid; model dapat dikonfigurasi lewat env.
- Tavily API key tersedia; bila gagal, analisis tetap berjalan tanpa enrichment.
- Node.js 26 dan Docker tersedia di mesin development.
- Fokus fase ini: nyaman dipakai lokal (`npm run dev` + Postgres Docker).
- Tidak ada autentikasi; identitas = cookie anonim yang dibuat server.
- Teks resume yang dikirim ke Gemini dibatasi ±30.000 karakter (dipotong dengan
  penanda bila lebih).
- Analisis berjalan sinkron dalam satu request HTTP (target < 30 detik). Antrean
  background adalah pengembangan lanjutan, bukan kebutuhan fase ini.

## 7. Approaches

### A. Next.js full-stack (dipilih)

Satu codebase berisi halaman (upload, report, riwayat) dan API route server.
Parsing file, pemanggilan Gemini/Tavily, dan akses Postgres semuanya di server.
UI memakai Tailwind CSS + shadcn/ui; diagram skor dibuat SVG kustom; ORM Drizzle.

- Trade-off: paling sedikit bagian bergerak dan paling cepat untuk kebutuhan ini.
  Bukan Python, tetapi proyek training model memang akan berdiri sendiri dan cukup
  membaca data dari Postgres.

### B. React SPA + FastAPI

Frontend Vite/React, backend Python FastAPI + SQLAlchemy.

- Trade-off: Python lebih nyaman untuk data/ML, tetapi menambah dua service, CORS,
  dua deployment, dan dua set dependency tanpa manfaat langsung untuk fitur saat ini.

**Keputusan: A.** Alasan: seluruh kebutuhan (upload, parsing, AI, report, riwayat)
cocok untuk satu aplikasi Next.js; dataset training tetap dapat diekspor dari
Postgres kapan pun, independen dari stack web.

## 8. Rubrik dan perhitungan skor

Model memberi skor 0–100 per kategori beserta alasan dan bukti. Server memvalidasi,
meng-clamp ke 0–100, lalu menghitung skor akhir dari bobot di bawah. Model **tidak**
menentukan skor total.

### 8.1 Lapis global (selalu)

| Kode | Kategori | Bobot | Fokus |
| --- | --- | ---: | --- |
| G1 | ATS Compatibility & Formatting | 15 | Struktur yang terbaca ATS, heading, bullet, tanggal, kontak, tanpa elemen yang merusak parsing |
| G2 | Kontak & Ringkasan Profesional | 10 | Kontak lengkap, headline, ringkasan relevan dan ringkas |
| G3 | Pengalaman & Dampak | 25 | Action verbs, pencapaian terukur, cakupan tanggung jawab, progres karier |
| G4 | Skill & Keyword | 15 | Skill relevan, konsistensi istilah, hard/soft skill, tools |
| G5 | Pendidikan & Sertifikasi | 10 | Relevansi, kelengkapan, kredibilitas |
| G6 | Struktur, Kejelasan & Tata Bahasa | 15 | Keterbacaan, konsistensi format, tata bahasa, panjang |
| G7 | Profesionalisme Keseluruhan | 10 | Kesan profesional, tidak redundan, tidak ada klaim berlebihan |

`global_score = Σ (skor_kategori × bobot) / 100`, dibulatkan ke integer.

### 8.2 Lapis job-specific (hanya jika ada JD/posisi)

| Kode | Kategori | Bobot | Fokus |
| --- | --- | ---: | --- |
| J1 | Keyword & Skill Match | 30 | Hard skill, tools, sertifikasi yang diminta vs yang ada |
| J2 | Relevansi Pengalaman & Seniority | 30 | Domain, skala tanggung jawab, lama pengalaman, level jabatan |
| J3 | Keselarasan Pencapaian | 20 | Bukti dampak yang relevan dengan kebutuhan peran |
| J4 | Kesesuaian Pendidikan/Sertifikasi | 10 | Requirement minimum dan preferensi |
| J5 | Gap & Risiko Must-have | 10 | Kekurangan requirement kunci dan risikonya |

`job_score` dihitung dengan cara yang sama.

Sumber requirement untuk lapis job-specific:

- **JD diisi** → JD adalah sumber utama; keyword dan must-have diambil dari JD.
- **Hanya posisi target** → Tavily mencari ekspektasi pasar. Bila Tavily gagal,
  lapis job-specific tetap dihitung dari pengetahuan umum model tentang peran
  tersebut dan ditandai `inferred` di report; `mustHaveMissing` hanya diisi bila
  requirement benar-benar eksplisit di JD.
- **Tidak ada posisi maupun JD** → lapis job-specific dilewati; `overall = global`.
- **Data job-specific tidak valid dari model** → satu retry perbaikan; bila tetap
  tidak valid, analisis tetap selesai dengan lapis global saja dan report
  menampilkan catatan bahwa penilaian job-specific tidak tersedia.

Status lapis job-specific disimpan sebagai
`none | complete | inferred | unavailable`.

### 8.3 Skor total dan band

- Ada JD/posisi: `overall = round(0.6 × global_score + 0.4 × job_score)`
- Tanpa JD/posisi: `overall = global_score`

Band (berlaku untuk skor total dan warna diagram):

| Rentang | Band | Label |
| --- | --- | --- |
| 0–49 | red | "Perlu Perbaikan Besar" |
| 50–69 | yellow | "Cukup — Banyak Ruang Perbaikan" |
| 70–100 | green | "Kuat" |

Anjuran tetap muncul di semua band. Pada band hijau, tampilkan maksimal 5 anjuran
yang benar-benar ada; jangan memaksakan temuan.

### 8.4 Anjuran perbaikan

Maksimal 10 item, diurutkan berdasarkan prioritas (high → medium → low). Setiap
item berisi:

- kategori dan lapis (global/job)
- prioritas
- judul singkat
- penjelasan mengapa ini penting
- `evidence`: kutipan/bagian resume yang menjadi dasar (wajib; boleh "tidak ada"
  untuk temuan berupa hal yang hilang, mis. keyword yang tidak muncul)
- saran perbaikan konkret
- contoh kalimat/rewrite bila relevan

Untuk analisis job-specific, report juga menampilkan daftar **keyword cocok** dan
**keyword hilang** (dengan penanda must-have bila disebut eksplisit di JD).

## 9. Arsitektur

```
Browser
  │  upload file + JD (multipart)
  ▼
Next.js server (App Router)
  ├─ validasi + rate limit
  ├─ ekstraksi teks (pdf-parse / mammoth / word-extractor)
  ├─ Tavily (opsional, jika posisi target diisi)
  ├─ Gemini (structured JSON, server-side key)
  ├─ validasi Zod + hitung skor di server
  └─ simpan ke PostgreSQL (Drizzle)
  ▼
Report page (server component) + history
```

Komponen utama:

- `app/` — halaman: `/`, `/analysis/[id]`, `/history`, `/privacy`
- `app/api/` — route handler untuk analisis, riwayat, feedback, delete
- `lib/parsing/` — adapter per format file
- `lib/ai/` — prompt builder, Gemini client, schema, scoring
- `lib/db/` — schema Drizzle + query
- `lib/auth/` — cookie token anonim (buat, hash, baca)
- `components/` — score gauge, category bars, recommendation cards, upload form

## 10. Alur analisis

1. User memilih file dan (opsional) mengisi posisi target/JD, menyetujui notice
   pemrosesan/penyimpanan (dan opsional izin dataset), lalu klik "Analisis".
2. Server membuat/membaca cookie klien anonim, mengecek rate limit.
3. Validasi file: ekstensi + MIME + ukuran ≤ 10 MB.
4. Ekstraksi teks. Jika < 200 karakter → error "PDF kemungkinan hasil scan; OCR
   belum didukung".
5. Jika posisi target diisi → panggil Tavily (timeout 8 detik, gagal = lanjut
   tanpa konteks pasar).
6. Bangun prompt (rubrik + teks resume + JD/posisi + konteks pasar) dan panggil
   Gemini dengan structured output, temperature rendah, timeout 60 detik.
7. Validasi JSON dengan Zod. Jika invalid → satu kali retry perbaikan; jika tetap
   gagal → request gagal tanpa menyimpan resume.
8. Hitung skor di server; simpan `analyses` + `recommendations` dalam satu
   transaksi (hanya setelah hasil valid).
9. Client diarahkan ke `/analysis/[id]`.

Pada kegagalan, tidak ada row yang dibuat dan teks resume tidak disimpan; API
mengembalikan pesan aman yang bisa ditampilkan. User mengulang dari halaman upload.
"Analisis lagi" pada report juga kembali ke halaman upload dengan form kosong
(file tidak bisa diprefill oleh browser).

## 11. Model data (PostgreSQL)

```
clients
  id uuid pk
  token_hash text unique not null      -- HMAC-SHA256(token, pepper)
  created_at timestamptz
  last_seen_at timestamptz

analyses
  id uuid pk
  client_id uuid fk → clients (cascade)
  file_name text
  file_type text
  file_size int
  resume_text text                     -- hasil ekstraksi (PII)
  target_position text
  job_description text
  market_context text                  -- ringkasan hasil Tavily (opsional)
  job_layer_status text check (none|complete|inferred|unavailable)
  prompt_version text
  model text
  global_score int
  job_score int null
  overall_score int
  band text check (red|yellow|green)
  dataset_consent boolean not null default false
  consent_version text not null
  consented_at timestamptz not null
  result_json jsonb                    -- payload AI tervalidasi (rincian, keyword)
  created_at timestamptz default now()
  index (client_id, created_at desc)
  index (dataset_consent, created_at)  -- untuk ekspor dataset

recommendations
  id uuid pk
  analysis_id uuid fk → analyses (cascade)
  layer text check (global|job)
  category text
  priority text check (high|medium|low)
  title text
  detail text
  evidence text
  example text
  sort_order int

feedback
  id uuid pk
  analysis_id uuid fk → analyses (cascade)
  recommendation_id uuid null fk → recommendations (cascade)
  rating smallint null check (-1|1)
  comment text
  created_at timestamptz default now()
  unique (analysis_id, recommendation_id)   -- satu vote per anjuran, di-upsert
  check (rating is not null or comment is not null)
```

Catatan:

- Tidak ada row berstatus gagal; analisis hanya tersimpan setelah hasil AI valid.
  Ini juga mencegah teks resume tertinggal saat proses gagal.
- `result_json` menyimpan payload lengkap agar data mudah diekspor untuk training
  tanpa join berlebihan. Tidak ada endpoint publik untuk ekspor pada fase ini;
  cukup query SQL langsung dan filter `dataset_consent = true`.
- Komentar keseluruhan disimpan dengan `recommendation_id = null` dan
  `rating = null`; thumbs memakai `rating` dan di-upsert per anjuran.

## 12. API

| Method | Path | Fungsi |
| --- | --- | --- |
| POST | `/api/analyze` | Multipart: `file`, `targetPosition?`, `jobDescription?`, `datasetConsent` → `{ id }`; gagal = error tanpa id |
| GET | `/api/analyses` | Riwayat milik cookie ini (ringkas, urut terbaru) |
| GET | `/api/analyses/:id` | Detail lengkap; 404 jika bukan milik cookie ini |
| DELETE | `/api/analyses/:id` | Hapus analisis + rekomendasi + feedback (cascade) |
| POST | `/api/analyses/:id/feedback` | `{ recommendationId?, rating?, comment? }`; minimal salah satu terisi |

Semua route memvalidasi cookie klien. Vote thumbs bersifat mutable: mengirim ulang
rating untuk anjuran yang sama menimpa vote sebelumnya (upsert). Komentar keseluruhan
boleh tanpa rating. Report menampilkan vote yang sedang tersimpan. Respons error
memakai bentuk konsisten `{ error: { code, message } }` dengan pesan Bahasa Indonesia
yang bisa ditampilkan.

## 13. Halaman dan UX

Bahasa UI: Indonesia. Nada: profesional, ringkas, suportif — bukan menghakimi.

### `/` — Upload

- Hero singkat: "Nilai resume-mu sebelum dikirim."
- Drop zone + file picker (PDF/DOCX/DOC, maks 10 MB).
- Field opsional: "Posisi target" dan "Job description" (textarea, collapsible).
- Checkbox wajib: persetujuan pemrosesan resume oleh layanan AI dan penyimpanan
  di riwayat, dengan tautan ke `/privacy`.
- Checkbox opsional (default tidak dicentang): izin memakai analisis ini untuk
  peningkatan kualitas penilaian dan dataset training model di masa depan. Tanpa
  izin ini, analisis tetap tersimpan sebagai riwayat pribadi.
- Tombol "Analisis Resume"; state loading dengan pesan tahapan dan ekspektasi waktu.
- Tautan ke riwayat.

### `/analysis/[id]` — Report

- Kartu skor utama: gauge SVG besar 0–100, warna band, label band, dan teks
  "Skor Global X · Job-specific Y" bila ada JD.
- Rincian global: bar per kategori dengan skor dan alasan singkat.
- Bagian job-specific (jika ada): skor, bar kategori, chip keyword cocok/hilang,
  dan gap must-have. Jika status `inferred` atau `unavailable`, tampilkan catatan
  kecil yang menjelaskan bahwa penilaian berbasis pengetahuan umum atau tidak
  tersedia.
- Daftar anjuran perbaikan dengan prioritas, bukti, dan saran; tiap item punya
  thumbs up/down yang menampilkan vote tersimpan.
- Kotak feedback keseluruhan (opsional).
- Aksi: analisis lagi (kembali ke form kosong), hapus analisis (konfirmasi),
  kembali ke riwayat.

### `/history` — Riwayat

- Daftar analisis browser ini: tanggal, nama file, posisi target, skor + badge
  band, tautan ke report.
- Empty state dengan CTA upload.
- Hapus per item.

### `/privacy` — Notice

- Data apa yang disimpan, untuk apa, berapa lama, cara menghapus, dan bahwa data
  dapat dipakai untuk peningkatan penilaian/dataset model bila user memberi izin.
- Menyebut teks resume dikirim ke Gemini API dan posisi target dikirim ke Tavily
  (bila diisi).

### Prinsip visual

- Warna band sebagai aksen, bukan satu-satunya pembeda: selalu ada label teks/ikon.
- Gauge dan bar dibuat SVG/CSS kustom agar ringan dan konsisten.
- Kontras memenuhi WCAG AA; fokus keyboard terlihat; form punya label.
- Responsif dari mobile (satu kolom) hingga desktop.

## 14. Prompt dan output AI

- Model: `gemini-3.5-flash-lite` (dapat diubah lewat `GEMINI_MODEL` bila evaluasi
  golden set menunjukkan kualitas kurang).
- Structured output (`responseMimeType: application/json`, `responseSchema`),
  temperature 0.2.
- Prompt memuat: rubrik + bobot + skala tiap kategori, aturan bukti (tidak boleh
  mengarang), format bahasa, teks resume, JD/posisi (jika ada), konteks pasar
  (jika ada), dan instruksi output.
- Aturan penting: `mustHaveMissing` hanya boleh berasal dari requirement eksplisit
  JD; tanpa JD, keyword hilang bersifat saran, bukan "wajib".
- Skema output (ringkas):
  `{ categories: [{ code, score, reason, evidence }], jobCategories?: [...],
     jobLayerNote?: string,
     recommendations: [{ layer, category, priority, title, detail, evidence,
     example }], keywords?: { matched: [], missing: [], mustHaveMissing: [],
     source: "jd"|"market"|"inferred" }, resumeMeta: { language,
     yearsExperienceEstimate } }`
- Server memvalidasi kode kategori, menghitung skor berbobot, dan menolak
  rekomendasi tanpa `title`/`detail`.
- `prompt_version` disimpan per analisis untuk reproduksibilitas evaluasi.

## 15. Tavily (konteks pasar)

- Dipakai hanya bila user mengisi posisi target.
- Satu pencarian: `"<posisi>" job description required skills responsibilities 2026`,
  maksimal 5 hasil; ringkasan konten dibatasi ±4.000 karakter.
- Hasil masuk ke prompt sebagai "konteks pasar" untuk membantu menilai keyword dan
  ekspektasi peran ketika JD tidak diberikan.
- Timeout 8 detik; kegagalan atau key kosong tidak menggagalkan analisis.
- Tanpa cache pada fase ini (biaya rendah, kesederhanaan menang).

## 16. Privasi, keamanan, dan penyalahgunaan

- Kunci Gemini/Tavily hanya di server; tidak ada `NEXT_PUBLIC_` untuk rahasia.
- `.env*` masuk `.gitignore`; `.env.example` berisi placeholder.
- Cookie klien: token acak 32 byte, `httpOnly`, `sameSite=lax`, `secure` di
  produksi, umur 1 tahun. DB hanya menyimpan hash + pepper.
- Riwayat hanya dapat dibaca dengan cookie yang cocok.
- Rate limit: 10 analisis/jam per klien dan 20/jam per IP (in-memory; cukup untuk
  satu instance lokal).
- Ukuran upload dibatasi 10 MB; tipe file di-allowlist; nama file di-sanitasi.
- Teks resume tidak ditulis ke log. Error yang tampil ke user tidak memuat isi
  resume atau detail internal.
- Persetujuan dicatat per analisis: `consent_version`, `consented_at`, dan
  `dataset_consent`. Checkbox wajib = pemrosesan + riwayat; checkbox dataset
  terpisah dan opsional.
- Hanya analisis dengan `dataset_consent = true` yang boleh dipakai untuk dataset
  training.
- Halaman `/privacy` menjelaskan: teks resume dikirim ke Gemini API, posisi target
  dikirim ke Tavily (bila diisi), data disimpan sampai user menghapusnya, dan
  cara menghapus data.
- Tombol hapus analisis menghapus data terkait secara cascade.
- Tidak ada auto-purge pada fase ini; retensi = sampai user menghapus.
- Pesan ke user: jangan mengunggah dokumen dengan data sensitif yang tidak perlu
  (mis. nomor identitas).

## 17. Error handling

| Kondisi | Perilaku |
| --- | --- |
| Format tidak didukung / > 10 MB | 400 dengan pesan jelas, form tetap terisi |
| Text < 200 karakter (scan) | 422 "Resume tidak bisa dibaca; OCR belum didukung" |
| Gemini 429/5xx | Retry sekali dengan backoff; jika gagal → error tanpa menyimpan data, pesan "Layanan AI sedang sibuk" |
| JSON AI invalid | Satu retry perbaikan; jika gagal → error, tidak ada row yang disimpan |
| Data job-specific invalid | Degradasi ke lapis global; report diberi catatan |
| Tavily gagal/timeout | Lanjut tanpa konteks pasar, status job layer `inferred` (bila hanya posisi) |
| DB error | 500 generik; detail hanya di log server |
| Riwayat orang lain diakses | 404 (bukan 403) |

## 18. Testing dan evaluasi

- **Unit (Vitest):** perhitungan skor berbobot, mapping band, normalisasi keyword,
  schema Zod, prompt builder, parser dengan fixture PDF/DOCX kecil.
- **Integrasi:** route handler dengan Gemini/Tavily di-mock, database Postgres uji;
  verifikasi ownership cookie, cascade delete, feedback, dan analisis gagal tidak
  meninggalkan row.
- **E2E (Playwright):** upload fixture → report tampil dengan warna benar → riwayat
  memuat item → hapus. Gemini di-mock lewat test mode.
- **Golden set manual:** 5 resume sintetis (jelek, sedang, kuat; dengan/tanpa JD)
  dijalankan ke Gemini asli; catat skor, band, dan apakah anjuran berbasis bukti.
  Target: ≥ 4/5 band sesuai ekspektasi, tidak ada anjuran yang mengarang fakta.
- **Konsistensi:** analisis ulang resume yang sama → selisih skor total ≤ 5 poin.

## 19. Operasional lokal

- `docker compose up -d` untuk Postgres 16 (volume persisten; port 5432).
- `.env.local`: `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `TAVILY_API_KEY`, `CLIENT_TOKEN_PEPPER`.
- `npm run dev` → app di `http://localhost:3000`.
- `npm run db:migrate` untuk migrasi Drizzle.
- Skrip `npm run eval:resumes` (opsional) untuk menjalankan golden set.

## 20. Success criteria

1. Resume PDF dan DOCX nyata berhasil dianalisis end-to-end < 30 detik (lokal).
2. Report menampilkan skor total, dua lapis penilaian bila JD diisi, dan warna
   band yang benar sesuai ambang.
3. Anjuran selalu punya bukti; tidak ada fakta yang dikarang.
4. Riwayat bertahan setelah refresh dan hanya menampilkan milik browser tersebut;
   hapus benar-benar menghapus.
5. Feedback (thumbs dan komentar) tersimpan di Postgres.
6. API key tidak terlihat di bundle/network browser.
7. PDF scan dan file rusak memberi pesan yang jelas, bukan crash.

## 21. Yang diserahkan ke builder

- Menyetel prompt untuk `gemini-3.5-flash-lite` dan mengevaluasi kualitasnya.
- Menyempurnakan bobot rubrik bila evaluasi golden set menunjukkan bias.
- Detail visual (tipografi, spacing, komponen) mengikuti skill desain yang relevan.
- Angka rate limit, batas panjang teks, dan timeout boleh disesuaikan.
- Struktur file internal, nama komponen, dan strategi caching.
- Penulisan teks notice privasi, README, dan `.env.example`.
