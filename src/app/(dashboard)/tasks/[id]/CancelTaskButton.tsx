'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmButton from '@/components/ui/ConfirmButton';

export default function CancelTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    const res = await fetch(`/api/tasks/${taskId}/cancel`, {
      method: 'POST',
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to cancel task');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <ConfirmButton
        onConfirm={handleCancel}
        buttonText="Cancel Task"
        confirmText="Yes, Cancel"
        cancelText="No"
        buttonClassName="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        confirmClassName="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
