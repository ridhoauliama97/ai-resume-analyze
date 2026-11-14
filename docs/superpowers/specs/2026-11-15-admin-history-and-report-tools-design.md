# Design: Admin history, report download, and improvement prompt

Date: 2026-11-15

## Goal

- Riwayat seluruh analisis hanya dapat dilihat/dikelola admin melalui `/auth/admin`.
- Non-admin tidak melihat daftar riwayat; report tetap bisa dibuka ulang selama cookie sama.
- Report memiliki tombol unduh (cetak/save as PDF) dan tombol salin prompt perbaikan resume.

## Non-goals

- Tidak menambah autentikasi pengguna non-admin.
- Tidak membuat PDF server-side; unduhan memakai cetak browser.
- Tidak mengubah skema scoring atau alur analisis.

## Admin authentication

- Kredensial dari env: `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
- Sesi stateless: cookie `ra_admin` berisi payload `username:expiry` ditandatangani HMAC-SHA256 memakai `CLIENT_TOKEN_PEPPER`.
- Helper: `createAdminSession(username)`, `verifyAdminSession(cookie)`, `getCurrentAdmin()`.
- Route: `POST /api/auth/admin/login`, `POST /api/auth/admin/logout`, halaman `/auth/admin`.
- Proteksi server-side: halaman `/admin` dan `/admin/analyses/[id]` redirect ke `/auth/admin` bila sesi tidak valid.

## Admin dashboard

- `/admin`: tabel semua analisis (file, tanggal, posisi, skor, band, consent), tautan report, tombol hapus.
- `/admin/analyses/[id]`: report yang sama dengan mode admin (tanpa ownership check).
- API admin: `GET /api/admin/analyses`, `DELETE /api/admin/analyses/[id]`, `GET /api/admin/analyses/[id]`.
- Admin dapat menghapus analisis mana pun (cascade).

## Akses non-admin

- Header publik tidak menampilkan "Riwayat". Link "Admin" hanya tampil bila sesi admin aktif.
- `/history` redirect: admin → `/admin`; non-admin → `/`.
- `/analysis/[id]` tetap client-owned (cookie). Admin juga bisa membuka via `/admin/analyses/[id]`.

## Report tools

- Tombol "Unduh laporan" memanggil `window.print()` dengan CSS `@media print` yang menyembunyikan nav/footer dan menampilkan konten report.
- Tombol "Salin prompt perbaikan" membangun prompt dari data analisis (skor, gap, rekomendasi, keyword) dan menyalin ke clipboard, dengan fallback pesan jika clipboard tidak tersedia.

## Security

- Password dibandingkan dengan `timingSafeEqual`.
- Cookie admin `HttpOnly`, `SameSite=lax`, `Secure` di production, umur pendek (mis. 8 jam).
- Endpoint admin memverifikasi sesi di server; tanpa sesi → 401.
- Prompt yang disalin tidak mengandung data sensitif di luar hasil analisis.

## Testing

- Unit: `verifyAdminSession` valid/expired/tampered; pembangunan prompt salin.
- Integrasi: login sukses/gagal, endpoint admin tanpa sesi → 401, delete admin.
- E2E: login admin, lihat dashboard, hapus analisis; non-admin tidak melihat riwayat; tombol unduh/salin ada.
