'use client';

import { useState } from 'react';

interface ConfirmButtonProps {
  onConfirm: () => Promise<void>;
  buttonText: string;
  confirmText?: string;
  cancelText?: string;
  buttonClassName?: string;
  confirmClassName?: string;
}

export default function ConfirmButton({
  onConfirm,
  buttonText,
  confirmText = 'Yes',
  cancelText = 'No',
  buttonClassName = 'px-4 py-2 text-sm font-semibold bg-[var(--bg-cream)] text-[var(--text-main)] rounded-[var(--radius-sm)] border border-[var(--text-sub)] hover:bg-white transition-colors',
  confirmClassName = 'px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-[var(--radius-sm)] border-2 border-[var(--text-sub)] hover:bg-red-700 disabled:opacity-50 transition-colors',
}: ConfirmButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
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
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={confirmClassName}
        >
          {loading ? '...' : confirmText}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {cancelText}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setShowConfirm(true)} className={buttonClassName}>
      {buttonText}
    </button>
  );
}
