const STATUS_MAP = {
  ACTIVE: 'badge-success',
  COMPLETED: 'badge-success',
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  PROCESSING: 'badge-warning',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-danger',
  SUSPENDED: 'badge-danger',
  DELETED: 'badge-danger',
  FAILED: 'badge-danger',
  INACTIVE: 'badge-muted',
  REVERSED: 'badge-muted',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-muted">—</span>;
  const cls = STATUS_MAP[status] || 'badge-muted';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
