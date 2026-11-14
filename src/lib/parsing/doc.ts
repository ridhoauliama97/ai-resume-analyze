import WordExtractor from 'word-extractor';

export async function extractDocText(buffer: Uint8Array): Promise<string> {
  const extractor = new WordExtractor();
  const document = await extractor.extract(Buffer.from(buffer));
  return document.getBody();
}
