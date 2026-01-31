'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmButton from '@/components/ui/ConfirmButton';

export default function DeactivateButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    setError(null);
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to deactivate agent');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <ConfirmButton
        onConfirm={handleDeactivate}
        buttonText="Deactivate Agent"
        confirmText="Yes, Deactivate"
        cancelText="Cancel"
        buttonClassName="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        confirmClassName="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
