import { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function formatCell(value, type) {
  if (value === null || value === undefined) return '—';
  switch (type) {
    case 'currency': return fmt(value);
    case 'date': return fmtDate(value);
    case 'datetime': return fmtDateTime(value);
    case 'status': return <StatusBadge status={value} />;
    case 'percent': return `${value}%`;
    case 'email': return <span className="text-muted">{value}</span>;
    default: return String(value);
  }
}

export default function DataTable({
  columns,
  rows = [],
  loading = false,
  error = '',
  emptyMessage = 'No records found',
  page = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  totalItems = 0,
}) {
  const [currentPage, setCurrentPage] = useState(page);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    onPageChange?.(p);
  };

  if (loading) return <Spinner label="Loading data..." />;
  if (error) return <AlertCircle size={18} /> && <div className="error-box"><AlertCircle size={18} /> {error}</div>;

  return (
    <div className="table-card">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  <EmptyState title={emptyMessage} />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row._id || i}>
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.label}>
                      {col.render ? col.render(row) : formatCell(row[col.key], col.type)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(totalPages > 1 || rows.length > 0) && (
        <div className="pagination">
          <div className="pagination-info">
            <span>Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</span>
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => handlePageChange(1)} disabled={currentPage <= 1}>
              <ChevronsLeft size={14} />
            </button>
            <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              );
            })}
            <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
              <ChevronRight size={14} />
            </button>
            <button className="pagination-btn" onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages}>
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { fmt, fmtDate, fmtDateTime, StatusBadge };
