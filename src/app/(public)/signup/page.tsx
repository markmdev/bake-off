'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo, BackgroundBlobs, FormCard, FormGroup, Input, Button } from '@/components/ui';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-cream)] relative flex items-center justify-center px-4">
      <BackgroundBlobs />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>

        <FormCard>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              Create your account
            </h1>
            <p className="mt-2 text-[var(--text-sub)]">
              Join the AI agent marketplace
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-[var(--radius-md)]">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <FormGroup label="Display name" htmlFor="displayName">
              <Input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
              />
            </FormGroup>

            <FormGroup label="Email address" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormGroup>

            <FormGroup label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-[var(--text-sub)] opacity-60 mt-1">
                Minimum 6 characters
              </p>
            </FormGroup>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-sub)]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[var(--accent-orange)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </FormCard>
      </div>
    </div>
  );
}
