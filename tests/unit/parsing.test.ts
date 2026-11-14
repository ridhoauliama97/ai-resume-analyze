import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import {
  MAX_UPLOAD_BYTES,
  MIN_RESUME_CHARS,
  ResumeParseError,
  normalizeText,
  parseResumeFile,
} from '@/lib/parsing';

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(`../fixtures/${name}`, import.meta.url)));
}

async function expectParseError(
  promise: Promise<unknown>,
  code: ResumeParseError['code'],
): Promise<ResumeParseError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ResumeParseError);
    expect((error as ResumeParseError).code).toBe(code);
    return error as ResumeParseError;
  }

  throw new Error(`expected ResumeParseError with code ${code}`);
}

test('parses pdf fixture', async () => {
  const result = await parseResumeFile({
    buffer: await fixture('resume.pdf'),
    fileName: 'resume.pdf',
    mimeType: 'application/pdf',
  });

  expect(result.extension).toBe('pdf');
  expect(result.text).toContain('Ahmad Pratama');
  expect(result.text.length).toBeGreaterThanOrEqual(MIN_RESUME_CHARS);
});

test('parses docx fixture', async () => {
  const result = await parseResumeFile({
    buffer: await fixture('resume.docx'),
    fileName: 'resume.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  expect(result.extension).toBe('docx');
  expect(result.text).toContain('Ahmad Pratama');
  expect(result.text.length).toBeGreaterThanOrEqual(MIN_RESUME_CHARS);
});

test('rejects_short_text_as_empty', async () => {
  const error = await expectParseError(
    parseResumeFile({ buffer: await fixture('short.pdf'), fileName: 'short.pdf' }),
    'empty',
  );

  expect(error.message.toLowerCase()).toContain('scan');
});

test('rejects unsupported extension', async () => {
  await expectParseError(
    parseResumeFile({ buffer: new Uint8Array([1, 2, 3]), fileName: 'resume.txt' }),
    'unsupported_type',
  );
});

test('rejects file over 10 MB', async () => {
  await expectParseError(
    parseResumeFile({
      buffer: new Uint8Array(MAX_UPLOAD_BYTES + 1),
      fileName: 'resume.pdf',
    }),
    'too_large',
  );
});

test('rejects corrupt pdf', async () => {
  await expectParseError(
    parseResumeFile({ buffer: await fixture('corrupt.pdf'), fileName: 'corrupt.pdf' }),
    'corrupt',
  );
});

test('normalizes whitespace', () => {
  expect(normalizeText('A\r\nB\n\n\n\nC')).toBe('A\nB\n\nC');
});
