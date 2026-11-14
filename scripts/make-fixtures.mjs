import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const outDir = new URL('../tests/fixtures/', import.meta.url);

const resumeLines = [
  'Ahmad Pratama',
  'Frontend Engineer — Jakarta, Indonesia',
  'ahmad.pratama@example.com | +62 812-3456-7890 | linkedin.com/in/ahmadpratama',
  '',
  'RINGKASAN PROFESIONAL',
  'Frontend engineer dengan pengalaman 6 tahun membangun aplikasi web berskala besar',
  'menggunakan React, TypeScript, dan Next.js. Berpengalaman memimpin migrasi design',
  'system, meningkatkan performa aplikasi, dan membina engineer junior.',
  '',
  'PENGALAMAN KERJA',
  'Senior Frontend Engineer — Tokopedia (2021–sekarang)',
  '- Memimpin migrasi 40+ halaman ke Next.js App Router, menurunkan LCP dari 3,8 detik',
  '  menjadi 1,9 detik dan meningkatkan konversi checkout 12%.',
  '- Membangun design system internal yang dipakai 8 tim produk dengan 60+ komponen.',
  '- Menjadi mentor bagi 4 engineer junior melalui program mentoring mingguan.',
  '',
  'Frontend Engineer — Traveloka (2018–2021)',
  '- Mengembangkan alur pemesanan hotel dengan React dan TypeScript untuk 20 juta',
  '  pengguna aktif bulanan.',
  '- Menulis 500+ unit test dan integration test dengan Jest dan Testing Library.',
  '',
  'PENDIDIKAN',
  'S1 Teknik Informatika — Universitas Indonesia (2014–2018), IPK 3,72/4,00',
  '',
  'KEAHLIAN',
  'React, Next.js, TypeScript, Tailwind CSS, Node.js, PostgreSQL, Playwright, Vitest,',
  'aksesibilitas WCAG, optimasi performa web, Git, CI/CD.',
];

const shortLines = ['Ahmad Pratama', 'Frontend Engineer', 'Jakarta'];

async function makePdf(path, lines) {
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(path);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);
    doc.font('Helvetica').fontSize(11);
    for (const line of lines) {
      doc.text(line, { lineGap: 2 });
    }
    doc.end();
  });
}

async function makeDocx(path, lines) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: lines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Calibri', size: 22 })],
            }),
        ),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(path, buffer);
}

await mkdir(outDir, { recursive: true });

await makePdf(new URL('resume.pdf', outDir), resumeLines);
await makePdf(new URL('short.pdf', outDir), shortLines);
await makeDocx(new URL('resume.docx', outDir), resumeLines);
await writeFile(new URL('corrupt.pdf', outDir), '%PDF-1.4\nnot-a-real-pdf');

console.log('fixtures written to tests/fixtures/');
