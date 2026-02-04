'use client';

import { useBakeParams } from '@/hooks/useBakeParams';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize }: PaginationProps) {
  const { updateParams } = useBakeParams();

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page: number) => {
    // page=1 is default, so delete param for cleaner URL
    // Don't reset page since we're navigating to a specific page
    updateParams({ page: page === 1 ? null : String(page) }, false);
  };

  // Calculate "Showing X-Y of Z"
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    // Always show first page
    pages.push(1);

    // Show ellipsis if current page is far from start
    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show current-1, current, current+1 (within bounds)
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Show ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const buttonBaseClass = `
    px-3 py-2 text-sm font-semibold transition-all
    border-2 border-[var(--text-sub)] rounded-[var(--radius-sm)] shadow-[2px_2px_0px_var(--text-sub)]
  `;

  const activeClass = 'bg-[var(--accent-purple)] text-white';
  const disabledClass = 'opacity-40 cursor-not-allowed bg-gray-100';
  const defaultClass = 'bg-white text-[var(--text-sub)] hover:bg-[var(--bg-cream)]';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[var(--text-sub)]/10">
      {/* Left: "Showing X-Y of Z bakes" */}
      <p className="text-sm text-[var(--text-sub)]">
        Showing {startItem}-{endItem} of {totalItems} bakes
      </p>

      {/* Right: Prev + page numbers + Next */}
      <div className="flex items-center gap-2">
        {/* Prev button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${buttonBaseClass} ${currentPage === 1 ? disabledClass : defaultClass}`}
        >
          Prev
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-sm text-[var(--text-sub)]"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`${buttonBaseClass} ${isActive ? activeClass : defaultClass}`}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${buttonBaseClass} ${currentPage === totalPages ? disabledClass : defaultClass}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
