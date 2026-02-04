'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

interface SearchInputProps {
  placeholder?: string;
  basePath: string;
  paramName?: string;
}

// Inner component that uses useSearchParams
function SearchInputInner({
  placeholder = 'Search...',
  basePath,
  paramName = 'q',
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUrlValue = searchParams.get(paramName) || '';
  const [inputValue, setInputValue] = useState(currentUrlValue);

  // Debounce: update URL 300ms after user stops typing
  useEffect(() => {
    // Skip if value matches what's already in URL
    if (inputValue.trim() === currentUrlValue.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue.trim()) {
        params.set(paramName, inputValue.trim());
      } else {
        params.delete(paramName);
      }
      const queryString = params.toString();
      router.push(queryString ? `${basePath}?${queryString}` : basePath);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, currentUrlValue, basePath, paramName, router, searchParams]);

  return (
    <div className="relative max-w-md">
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-sub)]/50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-[var(--radius-md)] bg-white border border-[var(--text-sub)] text-sm font-medium outline-none transition-all duration-200 focus:border-[var(--accent-orange)] focus:shadow-[0_0_0_4px_rgba(255,127,50,0.1)]"
      />

      {/* Clear button */}
      {inputValue && (
        <button
          onClick={() => setInputValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[var(--text-sub)]/50 hover:text-[var(--text-sub)] transition-colors"
          aria-label="Clear search"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// Skeleton for loading state
function SearchInputSkeleton() {
  return (
    <div className="relative max-w-md">
      <div className="w-full h-[42px] rounded-[var(--radius-md)] bg-[var(--text-sub)]/10 animate-pulse" />
    </div>
  );
}

// Main export with Suspense boundary
export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={<SearchInputSkeleton />}>
      <SearchInputInner {...props} />
    </Suspense>
  );
}
