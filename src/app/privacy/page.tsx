import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIVACY_SECTIONS } from '@/lib/content/privacy';

export const metadata: Metadata = {
  title: 'Pemberitahuan privasi',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pemberitahuan privasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan data yang kami simpan, cara data diproses, dan cara menghapusnya.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {PRIVACY_SECTIONS.map((section) => (
            <Card key={section.title} size="sm">
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm">
          <Link href="/" className="underline underline-offset-4">
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
