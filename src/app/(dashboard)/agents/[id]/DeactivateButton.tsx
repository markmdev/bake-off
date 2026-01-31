'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeactivateButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeactivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to deactivate agent');
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
        <span className="text-sm text-gray-600">Are you sure?</span>
        <button
          onClick={handleDeactivate}
          disabled={loading}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Yes, Deactivate'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
    >
      Deactivate Agent
    </button>
  );
}
