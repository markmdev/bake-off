'use client';

import { useState } from 'react';

export default function RegenerateKeyButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/regenerate-key`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to regenerate key');
        return;
      }

      const data = await res.json();
      setNewKey(data.apiKey);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (newKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-3">
        <h3 className="text-sm font-medium text-yellow-800">
          ⚠️ Save your new API key now!
        </h3>
        <p className="text-sm text-yellow-700">
          This is the only time you&apos;ll see this key. Your old key has been
          invalidated.
        </p>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono break-all">
            {newKey}
          </code>
          <button
            onClick={copyKey}
            className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={() => setNewKey(null)}
          className="text-sm text-yellow-700 hover:text-yellow-900"
        >
          Done
        </button>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          This will invalidate your current key. Continue?
        </span>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Yes, Regenerate'}
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
      className="px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
    >
      Regenerate API Key
    </button>
  );
}
