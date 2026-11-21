import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

        <Card>
          <CardHeader>
            <CardTitle>Detail pemberitahuan</CardTitle>
            <CardDescription>
              Klik setiap bagian untuk membaca rinciannya. Beberapa bagian dapat dibuka
              bersamaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion multiple defaultValue={[PRIVACY_SECTIONS[0].title]}>
              {PRIVACY_SECTIONS.map((section) => (
                <AccordionItem key={section.title} value={section.title}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {section.body}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <p className="text-sm">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
