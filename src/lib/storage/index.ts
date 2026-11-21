import { randomUUID } from 'node:crypto';
import type { ResumeExtension } from '@/lib/parsing';
import type { ServerEnv } from '@/lib/env';
import { createSupabaseResumeStorage } from './supabase';
import type { ResumeStorage } from './types';

export function buildResumeStorageKey(clientId: string, extension: ResumeExtension): string {
  return `clients/${clientId}/${randomUUID()}.${extension}`;
}

export function createResumeStorageFromEnv(env: ServerEnv): ResumeStorage {
  return createSupabaseResumeStorage({
    endpoint: env.SUPABASE_S3_ENDPOINT,
    region: env.SUPABASE_S3_REGION,
    accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
  });
}

export function createNoopResumeStorage(): ResumeStorage {
  return {
    async upload() {},
    async remove() {},
  };
}
