import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Analisis Resume AI",
    template: "%s · Analisis Resume AI",
  },
  description:
    "Nilai resume terhadap standar ATS dan posisi target, lengkap dengan saran perbaikan yang konkret.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
        >
          Lewati ke konten utama
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </div>
        <footer className="border-t">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
            <p>Hasil analisis bersifat saran, bukan jaminan lolos seleksi.</p>
            <Link href="/privacy" className="underline underline-offset-4">
              Pemberitahuan privasi
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
