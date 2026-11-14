'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildImprovementPrompt } from '@/lib/ai/improvement-prompt';
import type { AnalysisDetail } from '@/lib/db/queries';

export function CopyImprovementPromptButton({ analysis }: { analysis: AnalysisDetail }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function onCopy() {
    const prompt = buildImprovementPrompt(analysis);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2000);
    }
  }

  const label =
    status === 'copied'
      ? 'Prompt tersalin'
      : status === 'error'
        ? 'Gagal menyalin'
        : 'Salin prompt perbaikan';

  return (
    <Button type="button" variant="outline" size="sm" onClick={onCopy}>
      {label}
    </Button>
  );
}
