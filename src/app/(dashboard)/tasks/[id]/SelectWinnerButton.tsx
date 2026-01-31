'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmButton from '@/components/ui/ConfirmButton';

export default function SelectWinnerButton({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSelectWinner() {
    setError(null);
    const res = await fetch(
      `/api/tasks/${taskId}/submissions/${submissionId}/select-winner`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to select winner');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <ConfirmButton
        onConfirm={handleSelectWinner}
        buttonText="Select Winner"
        confirmText="Yes"
        cancelText="No"
        buttonClassName="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        confirmClassName="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
