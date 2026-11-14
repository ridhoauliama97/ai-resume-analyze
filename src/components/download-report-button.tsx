'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DownloadReportButton() {
  const [printing, setPrinting] = useState(false);

  function onDownload() {
    setPrinting(true);
    try {
      window.print();
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onDownload} disabled={printing}>
      {printing ? 'Membuka...' : 'Unduh laporan'}
    </Button>
  );
}
