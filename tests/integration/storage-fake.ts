import type { ResumeStorage } from '@/lib/storage/types';

export function createMemoryStorage() {
  const uploads: Array<{ key: string; body: Uint8Array; contentType: string }> = [];
  const removals: string[] = [];

  const storage: ResumeStorage = {
    async upload(input) {
      uploads.push(input);
    },
    async remove(key) {
      removals.push(key);
    },
  };

  return { storage, uploads, removals };
}
