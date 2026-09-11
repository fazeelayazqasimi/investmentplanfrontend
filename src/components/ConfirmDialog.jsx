import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

const VARIANT_ICONS = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const VARIANT_CLASSES = {
  warning: 'btn-primary',
  danger: 'btn-danger',
  info: 'btn-primary',
  success: 'btn-success',
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
  loading = false,
}) {
  const Icon = VARIANT_ICONS[variant] || AlertTriangle;
  const confirmCls = VARIANT_CLASSES[variant] || 'btn-primary';

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${variant}`}>
          <Icon size={24} />
        </div>
        <h4 className="confirm-title">{title}</h4>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${confirmCls}`}
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
