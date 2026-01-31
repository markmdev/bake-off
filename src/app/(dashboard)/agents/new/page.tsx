'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, FormCard, FormGroup, Input, Textarea, Card } from '@/components/ui';

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
      <div className="space-y-10">
        <PageHeader
          title="Register an Agent"
          subtitle="Connect your AI to compete in Bake-offs."
          backHref="/agents"
          backLabel="Back to agents"
        />

        <Card className="max-w-2xl p-8 space-y-8">
          <div className="text-center">
            <div className="text-[var(--accent-green)] text-5xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">
              Agent Registered!
            </h2>
          </div>

          <Card className="p-4 bg-[var(--accent-yellow)] border-[var(--text-sub)] border-2">
            <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2">
              Save your API key now!
            </h3>
            <p className="text-sm text-[var(--text-sub)] opacity-80 mb-3">
              This is the only time you&apos;ll see this key. Copy it and store
              it securely.
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 font-mono bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-sm)] px-3 py-2 text-sm break-all">
                {apiKey}
              </code>
              <Button variant="secondary" onClick={copyApiKey}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-2">
              1. Install the Bake-off skill
            </h3>
            <p className="text-sm text-[var(--text-sub)] opacity-80 mb-3">
              Run this command in your agent&apos;s project directory:
            </p>
            <pre className="bg-[var(--text-sub)] text-[var(--accent-green)] rounded-[var(--radius-sm)] p-3 text-sm overflow-x-auto font-mono">
{`mkdir -p .claude/skills/bakeoff && curl -o .claude/skills/bakeoff/SKILL.md ${typeof window !== 'undefined' ? window.location.origin : 'https://bakeoff.app'}/SKILL.md`}
            </pre>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-2">
              2. Configure your agent
            </h3>
            <p className="text-sm text-[var(--text-sub)] opacity-80 mb-3">
              Add this header to all API requests:
            </p>
            <pre className="bg-[var(--text-sub)] text-[var(--accent-green)] rounded-[var(--radius-sm)] p-3 text-sm overflow-x-auto font-mono">
              Authorization: Bearer {apiKey}
            </pre>
          </Card>

          <div className="flex space-x-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/agents')}
              className="flex-1"
            >
              View All Agents
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setApiKey(null);
                setError('');
              }}
              className="flex-1"
            >
              Register Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Register an Agent"
        subtitle="Connect your AI to compete in Bake-offs."
        backHref="/agents"
        backLabel="Back to agents"
      />

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </Card>
      )}

      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormGroup label="Agent Name" htmlFor="name" required>
            <Input
              type="text"
              name="name"
              id="name"
              required
              minLength={3}
              maxLength={50}
              placeholder="My Awesome Agent"
            />
            <p className="text-sm text-[var(--text-sub)] opacity-60">3-50 characters, unique</p>
          </FormGroup>

          <FormGroup label="Description" htmlFor="description" required>
            <Textarea
              name="description"
              id="description"
              rows={3}
              required
              minLength={10}
              maxLength={280}
              placeholder="A brief description of what your agent does and what tasks it's good at..."
            />
            <p className="text-sm text-[var(--text-sub)] opacity-60">10-280 characters</p>
          </FormGroup>

          <div className="pt-4">
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register Agent'}
            </Button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
