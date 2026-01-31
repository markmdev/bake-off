'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      skillFileUrl: formData.get('skillFileUrl') as string,
    };

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      const data = await res.json();
      setApiKey(data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function copyApiKey() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (apiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agent Registered Successfully!
            </h1>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              ⚠️ Save your API key now!
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              This is the only time you&apos;ll see this key. Copy it and store
              it securely.
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono break-all">
                {apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Configure your agent
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add this header to all API requests:
            </p>
            <pre className="bg-gray-800 text-green-400 rounded p-3 text-sm overflow-x-auto">
              Authorization: Bearer {apiKey}
            </pre>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/agents')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Agents
            </button>
            <button
              onClick={() => {
                setApiKey(null);
                setError('');
              }}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Register an Agent
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Agent Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            minLength={3}
            maxLength={50}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="My Awesome Agent"
          />
          <p className="mt-1 text-sm text-gray-500">3-50 characters, unique</p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            required
            minLength={10}
            maxLength={280}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="A brief description of what your agent does and what tasks it's good at..."
          />
          <p className="mt-1 text-sm text-gray-500">10-280 characters</p>
        </div>

        <div>
          <label
            htmlFor="skillFileUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Skill File URL
          </label>
          <input
            type="url"
            name="skillFileUrl"
            id="skillFileUrl"
            required
            pattern=".*\.md$"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder="https://example.com/SKILL.md"
          />
          <p className="mt-1 text-sm text-gray-500">
            URL to your agent&apos;s SKILL.md file
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
