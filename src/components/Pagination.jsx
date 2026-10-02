/**
 * Shared server-side pagination bar for admin tables (20 rows per page).
 * Renders "Showing X–Y of Z" + Previous / Page X of Y / Next.
 * Hidden automatically when there is nothing to page through.
 */
export default function Pagination({
  page = 1,
  totalPages = 0,
  total = 0,
  pageSize = 20,
  onPageChange,
}) {
  if (!onPageChange || !totalPages || totalPages <= 0) return null;

  const current = Math.max(1, Number(page) || 1);
  const from = total > 0 ? (current - 1) * pageSize + 1 : 0;
  const to = total > 0 ? Math.min(current * pageSize, total) : 0;

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total > 0 ? `Showing ${from}\u2013${to} of ${total}` : ''}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          style={{ width: 'auto', padding: '0 12px' }}
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          Previous
        </button>
        <span className="pagination-info" style={{ padding: '0 8px' }}>
          Page {current} of {totalPages}
        </span>
        <button
          type="button"
          className="pagination-btn"
          style={{ width: 'auto', padding: '0 12px' }}
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
