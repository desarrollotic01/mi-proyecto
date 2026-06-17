import { useState, useMemo, useEffect } from "react";

export function usePagination(items, pageSize = 100) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    startIndex: (currentPage - 1) * pageSize,
  };
}
