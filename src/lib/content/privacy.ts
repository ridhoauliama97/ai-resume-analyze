export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Data yang disimpan',
    body:
      'Kami menyimpan nama dan tipe berkas, ukuran berkas, teks resume yang berhasil diekstrak, ' +
      'posisi target dan job description bila Anda mengisinya, skor beserta rincian kategori, ' +
      'rekomendasi perbaikan, serta feedback yang Anda berikan. Berkas asli yang Anda unggah ' +
      'disimpan di Supabase Storage privat. Untuk mengaitkan report tanpa login, kami memakai ' +
      'cookie klien anonim yang berisi token acak; token tersebut disimpan sebagai hash, bukan ' +
      'teks asli.',
  },
  {
    title: 'Cara data diproses',
    body:
      'Teks resume dikirim ke Gemini API (Google) untuk dianalisis. Bila Anda mengisi posisi ' +
      'target, posisi tersebut dikirim ke Tavily untuk mengambil konteks pasar; job description ' +
      'tidak dikirim ke Tavily. Data tidak dijual dan tidak dipakai untuk iklan.',
  },
  {
    title: 'Berapa lama data disimpan',
    body:
      'Analisis dan report disimpan sampai Anda menghapusnya sendiri. Tidak ada penghapusan ' +
      'otomatis, sehingga Anda tetap bisa membandingkan perbaikan resume dari waktu ke waktu.',
  },
  {
    title: 'Persetujuan pemrosesan',
    body:
      'Sebelum analisis dijalankan, Anda wajib memberi persetujuan pemrosesan oleh layanan AI ' +
      'dan penyimpanan report. Versi dan waktu persetujuan dicatat bersama analisis. Tanpa ' +
      'persetujuan ini, analisis tidak dijalankan dan resume tidak disimpan.',
  },
  {
    title: 'Izin dataset (opsional)',
    body:
      'Izin memakai analisis untuk peningkatan kualitas penilaian dan dataset training model ' +
      'bersifat opsional dan tidak dicentang secara default. Tanpa izin dataset, analisis tetap ' +
      'tersimpan sebagai report pribadi Anda dan tidak dipakai untuk training.',
  },
  {
    title: 'Cara menghapus data',
    body:
      'Anda dapat menghapus analisis kapan saja dari halaman report. Admin dapat menghapusnya ' +
      'dari dashboard. Menghapus analisis juga menghapus rekomendasi, feedback, dan berkas asli ' +
      'dari Supabase Storage secara permanen. Cookie klien anonim tetap tersimpan agar report ' +
      'lain tetap bisa dibuka; menghapus cookie tersebut di browser akan memutus akses ke ' +
      'report lama.',
  },
  {
    title: 'Data sensitif',
    body:
      'Jangan mengunggah dokumen dengan data sensitif yang tidak diperlukan, seperti nomor ' +
      'identitas, nomor rekening, atau informasi kesehatan. Resume yang Anda unggah adalah ' +
      'tanggung jawab Anda.',
  },
];
