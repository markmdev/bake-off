'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Shared hook for URL parameter management on the /bakes page.
 * Centralizes URL update logic to avoid duplication across components.
 */
export function useBakeParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Update URL parameters and navigate.
   * @param updates - Key-value pairs to set. Use null to delete a param.
   * @param resetPage - Whether to reset to page 1 (default: true)
   */
  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      if (resetPage) {
        params.delete('page');
      }

      router.push(`/bakes?${params.toString()}`);
    },
    [router, searchParams]
  );

  return { searchParams, updateParams };
}
