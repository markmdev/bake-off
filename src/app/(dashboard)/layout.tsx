import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar, BackgroundBlobs } from '@/components/ui';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-cream)] flex">
      <BackgroundBlobs />
      <Sidebar user={user} />
      <main className="flex-1 ml-[260px] p-10 overflow-y-auto">
        <div className="max-w-[1340px]">{children}</div>
      </main>
    </div>
  );
}
