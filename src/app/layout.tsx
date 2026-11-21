import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { CopyrightYear } from "@/components/copyright-year";
import { GithubIcon } from "@/components/github-icon";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const roboto = localFont({
  src: [
    {
      path: "../../public/fonts/Roboto-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Roboto-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/Roboto-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Roboto-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Smart Resume Analyze",
    template: "%s · Smart Resume Analyze",
  },
  description:
    "Nilai resume terhadap standar ATS dan posisi target, lengkap dengan saran perbaikan yang konkret.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${roboto.variable} h-full antialiased`}>
      <body className={`${roboto.className} min-h-full flex flex-col`}>
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
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              &copy; <CopyrightYear /> Smart Resume Analyze v0.1.0. All rights
              reserved.
            </p>
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Pemberitahuan privasi
            </Link>
            <p>
              <a
                href="https://github.com/ridhoauliama97/ai-resume-analyze"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                title="GitHub repository"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <GithubIcon className="size-3.5" />
              </a>
            </p>
          </div>
        </footer>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
