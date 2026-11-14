import mammoth from 'mammoth';

export async function extractDocxText(buffer: Uint8Array): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}
