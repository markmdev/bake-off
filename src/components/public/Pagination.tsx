'use client';

import Link from 'next/link';
import { useBakeParams } from '@/hooks/useBakeParams';

interface BasePaginationProps {
  currentPage: number;
  totalPages: number;
}

interface BakesPaginationProps extends BasePaginationProps {
  totalItems: number;
  pageSize: number;
  baseUrl?: never;
  preserveParams?: never;
}

interface GenericPaginationProps extends BasePaginationProps {
  baseUrl: string;
  preserveParams?: Record<string, string>;
  totalItems?: never;
  pageSize?: never;
}

type PaginationProps = BakesPaginationProps | GenericPaginationProps;

export function Pagination(props: PaginationProps) {
  const { currentPage, totalPages } = props;
  const { updateParams } = useBakeParams();

  if (totalPages <= 1) {
    return null;
  }

  const isGenericMode = 'baseUrl' in props && props.baseUrl !== undefined;

  const buildUrl = (page: number) => {
    if (!isGenericMode) return '';
    const params = new URLSearchParams();
    const preserveParams = props.preserveParams || {};
    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (page > 1) params.set('page', String(page));
    const queryString = params.toString();
    return queryString ? `${props.baseUrl}?${queryString}` : props.baseUrl;
  };

  const goToPage = (page: number) => {
    if (isGenericMode) return; // Links handle navigation
    // page=1 is default, so delete param for cleaner URL
    updateParams({ page: page === 1 ? null : String(page) }, false);
  };

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

  // Render a page button - either as Link (generic mode) or button (bakes mode)
  const renderPageButton = (page: number, children: React.ReactNode, disabled?: boolean, isActive?: boolean) => {
    const className = `${buttonBaseClass} ${
      disabled ? disabledClass : isActive ? activeClass : defaultClass
    }`;

    if (isGenericMode) {
      if (disabled) {
        return <span className={className}>{children}</span>;
      }
      return (
        <Link href={buildUrl(page)} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <button
        onClick={() => goToPage(page)}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
    );
  };

  // Calculate "Showing X-Y of Z" for bakes mode
  const showingText = !isGenericMode && props.totalItems !== undefined && props.pageSize !== undefined
    ? (() => {
        const startItem = (currentPage - 1) * props.pageSize + 1;
        const endItem = Math.min(currentPage * props.pageSize, props.totalItems);
        return `Showing ${startItem}-${endItem} of ${props.totalItems} bakes`;
      })()
    : `Page ${currentPage} of ${totalPages}`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[var(--text-sub)]/10">
      {/* Left: status text */}
      <p className="text-sm text-[var(--text-sub)]">
        {showingText}
      </p>

      {/* Right: Prev + page numbers + Next */}
      <div className="flex items-center gap-2">
        {renderPageButton(currentPage - 1, 'Prev', currentPage === 1)}

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

          return (
            <span key={page}>
              {renderPageButton(page, page, false, page === currentPage)}
            </span>
          );
        })}

        {renderPageButton(currentPage + 1, 'Next', currentPage === totalPages)}
      </div>
    </div>
  );
}
