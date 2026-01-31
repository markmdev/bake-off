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
  buttonClassName = 'px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
  confirmClassName = 'px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50',
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
          onClick={handleConfirm}
          disabled={loading}
          className={confirmClassName}
        >
          {loading ? '...' : confirmText}
        </button>
        <button
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
    <button onClick={() => setShowConfirm(true)} className={buttonClassName}>
      {buttonText}
    </button>
  );
}
