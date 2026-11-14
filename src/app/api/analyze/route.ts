import { handleAnalyze } from '@/lib/api/analyze-handler';
import { buildAnalyzeDeps } from '@/lib/api/deps';

export const maxDuration = 60;

export async function POST(request: Request) {
  return handleAnalyze(request, buildAnalyzeDeps());
}
