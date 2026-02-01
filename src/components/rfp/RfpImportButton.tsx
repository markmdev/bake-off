'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { RfpImportPanel } from './RfpImportPanel';

export function RfpImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleImportComplete = (taskIds: string[]) => {
    // Refresh to show new tasks
    router.refresh();
  };

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        onClick={() => setIsOpen(true)}
      >
        🔥 Import RFPs
      </Button>
      <RfpImportPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
