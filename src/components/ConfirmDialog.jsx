import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'warning', loading = false }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon ${variant}`}>
            <AlertTriangle size={20} />
          </div>
          <h4>{title}</h4>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
