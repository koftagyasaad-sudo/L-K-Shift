'use client';

import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE = 15;

export function usePaginatedItems<T>(items: T[], resetKey: string) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(currentPage, pageCount);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );

  return { pageItems, page, pageCount, setPage: setCurrentPage };
}

export function PaginationControls({
  page,
  pageCount,
  itemCount,
  onPageChange,
  isRtl,
}: {
  page: number;
  pageCount: number;
  itemCount: number;
  onPageChange: (page: number) => void;
  isRtl: boolean;
}) {
  if (itemCount <= PAGE_SIZE) return null;

  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 text-xs" aria-label={isRtl ? 'تقسيم الصفحات' : 'Pagination'}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#141519] dark:text-zinc-400 dark:hover:border-orange-500"
      >
        {isRtl ? 'السابق' : 'Previous'}
      </button>
      <span className="font-mono font-medium tabular-nums text-slate-600 dark:text-zinc-400">
        {isRtl ? `صفحة ${page} من ${pageCount}` : `Page ${page} of ${pageCount}`}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:border-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#141519] dark:text-zinc-400 dark:hover:border-orange-500"
      >
        {isRtl ? 'التالي' : 'Next'}
      </button>
    </nav>
  );
}
