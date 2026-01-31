'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectWinnerButton({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSelectWinner() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/submissions/${submissionId}/select-winner`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to select winner');
        return;
      }

      router.refresh();
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Confirm?</span>
        <button
          onClick={handleSelectWinner}
          disabled={loading}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
    >
      Select Winner
    </button>
  );
}
