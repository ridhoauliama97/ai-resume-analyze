import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Analisis Resume AI
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="flex items-center gap-4 text-sm">
            <li>
              <Link href="/" className="underline-offset-4 hover:underline">
                Beranda
              </Link>
            </li>
            <li>
              <Link href="/history" className="underline-offset-4 hover:underline">
                Riwayat
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="underline-offset-4 hover:underline">
                Privasi
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
