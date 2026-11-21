import {
  handleAdminBulkDeleteAnalyses,
  handleAdminListAnalyses,
} from '@/lib/api/admin-handlers';
import { getDb } from '@/lib/db/client';
import { getServerEnv } from '@/lib/env';
import { createResumeStorageFromEnv } from '@/lib/storage';

function deps() {
  const env = getServerEnv();

  return {
    db: getDb(),
    storage: createResumeStorageFromEnv(env),
  };
}

export async function GET(request: Request) {
  return handleAdminListAnalyses(request, deps());
}

export async function DELETE(request: Request) {
  return handleAdminBulkDeleteAnalyses(request, deps());
}
