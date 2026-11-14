import type { AnalysisDetail } from '@/lib/db/queries';

export function buildImprovementPrompt(analysis: AnalysisDetail): string {
  const result = analysis.resultJson;
  const recommendations = analysis.recommendations.length > 0
    ? analysis.recommendations
    : result.recommendations;
  const keywords = result.keywords;

  const lines: string[] = [];

  lines.push('Anda adalah penulis resume profesional dan spesialis ATS.');
  lines.push(
    'Tugas Anda: tulis ulang resume di bawah ini agar lebih kuat, jujur, dan sesuai dengan posisi target, tanpa mengarang pengalaman, angka, skill, sertifikasi, atau pencapaian yang tidak ada di resume asli.',
  );
  lines.push('');
  lines.push(`Posisi target: ${analysis.targetPosition || 'tidak disebutkan'}`);
  if (analysis.jobDescription) {
    lines.push(`Job description: ${analysis.jobDescription}`);
  }
  lines.push(`Skor saat ini: ${analysis.overallScore}/100 (global ${analysis.globalScore}, job-specific ${analysis.jobScore ?? 'n/a'}).`);
  lines.push('');

  if (keywords) {
    if (keywords.missing.length > 0) {
      lines.push(`Keyword yang belum ada di resume: ${keywords.missing.join(', ')}.`);
    }
    if (keywords.mustHaveMissing.length > 0) {
      lines.push(`Requirement wajib yang belum terpenuhi: ${keywords.mustHaveMissing.join(', ')}.`);
    }
    if (keywords.matched.length > 0) {
      lines.push(`Keyword yang sudah cocok: ${keywords.matched.join(', ')}.`);
    }
    lines.push('');
  }

  if (recommendations.length > 0) {
    lines.push('Anjuran perbaikan (terapkan yang relevan):');
    for (const recommendation of recommendations) {
      lines.push(`- [${recommendation.priority}] ${recommendation.title}: ${recommendation.detail}`);
      if (recommendation.example) {
        lines.push(`  Contoh: ${recommendation.example}`);
      }
    }
    lines.push('');
  }

  lines.push('Aturan penulisan:');
  lines.push('- Gunakan action verb kuat dan pencapaian terukur (angka, persentase, skala) bila data tersedia di resume asli.');
  lines.push('- Pertahankan fakta: jangan menambah pengalaman, tools, sertifikasi, atau metrik yang tidak ada.');
  lines.push('- Susun dengan heading yang jelas (Ringkasan, Pengalaman, Keahlian, Pendidikan) dan bullet yang ringkas.');
  lines.push('- Sesuaikan keyword dengan posisi target secara natural, tanpa keyword stuffing.');
  lines.push('- Tulis dalam bahasa yang sama dengan resume asli.');
  lines.push('');
  lines.push('Resume asli:');
  lines.push('"""');
  lines.push(analysis.resumeText);
  lines.push('"""');
  lines.push('');
  lines.push('Kembalikan hanya resume yang sudah diperbaiki, tanpa penjelasan tambahan.');

  return lines.join('\n');
}
