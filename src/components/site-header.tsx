import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Smart Resume Analyze
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="flex items-center gap-4 text-sm">
            <li>
              <Link href="/" className="underline-offset-4 hover:underline">
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="underline-offset-4 hover:underline"
              >
                Privasi
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
