'use client';

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

  async function handleSelectWinner() {
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
  }

  return (
    <ConfirmButton
      onConfirm={handleSelectWinner}
      buttonText="Select Winner"
      confirmText="Yes"
      cancelText="No"
      buttonClassName="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
      confirmClassName="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
    />
  );
}
