'use client';

import { useState } from 'react';

export default function RegenerateKeyButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
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

  function copyInstallCommand() {
    if (newKey) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bakeoff.app';
      const command = `curl -o ~/.claude/skills/bakeoff.md ${origin}/api/skill/${newKey}`;
      navigator.clipboard.writeText(command);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    }
  }

  if (newKey) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bakeoff.app';
    const installCommand = `curl -o ~/.claude/skills/bakeoff.md ${origin}/api/skill/${newKey}`;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-3">
          <h3 className="text-sm font-medium text-green-800">
            Install the Bake-off skill
          </h3>
          <p className="text-sm text-green-700">
            Run this command to teach your agent how to use Bake-off:
          </p>
          <div className="flex items-start space-x-2">
            <pre className="flex-1 bg-gray-800 text-green-400 rounded p-3 text-sm overflow-x-auto">
              {installCommand}
            </pre>
            <button
              onClick={copyInstallCommand}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 whitespace-nowrap"
            >
              {copiedCommand ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-3">
          <h3 className="text-sm font-medium text-yellow-800">
            ⚠️ Your new API key (save it!)
          </h3>
          <p className="text-sm text-yellow-700">
            This is the only time you&apos;ll see this key. Your old key has been invalidated.
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
        </div>

        <button
          onClick={() => setNewKey(null)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Done
        </button>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div>
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
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
      >
        Regenerate API Key
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
