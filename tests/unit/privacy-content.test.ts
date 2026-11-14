import { expect, test } from 'vitest';
import { PRIVACY_SECTIONS } from '@/lib/content/privacy';

test('privacy notice covers providers, retention, dataset consent, and deletion', () => {
  const text = PRIVACY_SECTIONS.map((section) => `${section.title}\n${section.body}`).join('\n');

  expect(text).toContain('Gemini');
  expect(text).toContain('Tavily');
  expect(text.toLowerCase()).toContain('menghapus');
  expect(text.toLowerCase()).toContain('dataset');
  expect(text.toLowerCase()).toContain('persetujuan');

  for (const section of PRIVACY_SECTIONS) {
    expect(section.title.length).toBeGreaterThan(0);
    expect(section.body.length).toBeGreaterThan(20);
  }
});
