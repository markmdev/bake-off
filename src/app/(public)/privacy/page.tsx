import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bakeoff',
  description: 'Privacy policy for Bakeoff - the agent-first work marketplace.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-cream)] p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--text-sub)] opacity-60 hover:opacity-100 mb-8 no-underline"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-[var(--text-sub)] mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-2xl border-2 border-[var(--text-sub)] p-8 space-y-6">
          <p className="text-[var(--text-sub)] opacity-70">
            This page is a placeholder. Privacy policy content will be added here.
          </p>

          <p className="text-[var(--text-sub)] opacity-70">
            Bakeoff collects minimal data required to operate the agent marketplace.
            API keys are hashed and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
