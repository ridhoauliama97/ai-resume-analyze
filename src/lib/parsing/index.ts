import { extractDocText } from './doc';
import { extractDocxText } from './docx';
import { extractPdfText } from './pdf';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MIN_RESUME_CHARS = 200;

export type ResumeExtension = 'pdf' | 'docx' | 'doc';

export type ResumeParseErrorCode = 'unsupported_type' | 'too_large' | 'empty' | 'corrupt';

export class ResumeParseError extends Error {
  readonly code: ResumeParseErrorCode;

  constructor(code: ResumeParseErrorCode, message: string) {
    super(message);
    this.name = 'ResumeParseError';
    this.code = code;
  }
}

const MIME_TO_EXTENSION: Record<string, ResumeExtension> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const MAGIC_BYTES: Record<ResumeExtension, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  docx: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
  doc: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // OLE2
};

function resolveExtension(fileName: string, mimeType?: string): ResumeExtension | null {
  const candidate = fileName.split('.').pop()?.toLowerCase();

  if (candidate === 'pdf' || candidate === 'docx' || candidate === 'doc') {
    return candidate;
  }

  if (mimeType && MIME_TO_EXTENSION[mimeType]) {
    return MIME_TO_EXTENSION[mimeType];
  }

  return null;
}

function hasMagicBytes(buffer: Uint8Array, extension: ResumeExtension): boolean {
  const magic = MAGIC_BYTES[extension];
  if (buffer.length < magic.length) {
    return false;
  }

  return magic.every((byte, index) => buffer[index] === byte);
}

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function parseResumeFile(file: {
  buffer: Uint8Array;
  fileName: string;
  mimeType?: string;
}): Promise<{ text: string; extension: ResumeExtension }> {
  const extension = resolveExtension(file.fileName, file.mimeType);

  if (!extension) {
    throw new ResumeParseError(
      'unsupported_type',
      'Format file tidak didukung. Unggah berkas PDF, DOCX, atau DOC.',
    );
  }

  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new ResumeParseError('too_large', 'Ukuran berkas melebihi batas 10 MB.');
  }

  if (!hasMagicBytes(file.buffer, extension)) {
    throw new ResumeParseError(
      'corrupt',
      'Berkas tidak valid atau rusak. Pastikan berkas benar-benar PDF/DOCX/DOC.',
    );
  }

  let raw: string;

  try {
    if (extension === 'pdf') {
      raw = await extractPdfText(file.buffer);
    } else if (extension === 'docx') {
      raw = await extractDocxText(file.buffer);
    } else {
      raw = await extractDocText(file.buffer);
    }
  } catch {
    throw new ResumeParseError(
      'corrupt',
      'Gagal membaca berkas. Pastikan berkas tidak rusak, terkunci, atau terenkripsi.',
    );
  }

  const text = normalizeText(raw);

  if (text.length < MIN_RESUME_CHARS) {
    throw new ResumeParseError(
      'empty',
      'Teks resume terlalu pendek. Berkas mungkin hasil scan — unggah PDF berbasis teks atau salin ulang isi resume.',
    );
  }

  return { text, extension };
}
