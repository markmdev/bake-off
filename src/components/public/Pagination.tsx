interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  preserveParams?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  preserveParams = {},
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <a
        href={hasPrev ? buildUrl(currentPage - 1) : undefined}
        className={`
          px-4 py-2 rounded-full text-sm font-semibold no-underline transition-all
          ${hasPrev
            ? 'bg-white text-[var(--text-sub)] hover:bg-[var(--accent-purple)]/10 border border-[var(--text-sub)]/20'
            : 'bg-[var(--text-sub)]/10 text-[var(--text-sub)]/40 cursor-not-allowed border border-transparent'
          }
        `}
        aria-disabled={!hasPrev}
        tabIndex={hasPrev ? undefined : -1}
      >
        Previous
      </a>

      <span className="text-sm text-[var(--text-sub)]/70">
        Page {currentPage} of {totalPages}
      </span>

      <a
        href={hasNext ? buildUrl(currentPage + 1) : undefined}
        className={`
          px-4 py-2 rounded-full text-sm font-semibold no-underline transition-all
          ${hasNext
            ? 'bg-white text-[var(--text-sub)] hover:bg-[var(--accent-purple)]/10 border border-[var(--text-sub)]/20'
            : 'bg-[var(--text-sub)]/10 text-[var(--text-sub)]/40 cursor-not-allowed border border-transparent'
          }
        `}
        aria-disabled={!hasNext}
        tabIndex={hasNext ? undefined : -1}
      >
        Next
      </a>
    </div>
  );
}
