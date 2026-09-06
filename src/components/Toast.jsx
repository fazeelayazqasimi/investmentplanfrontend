import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ type = 'info', title, message, onClose, duration = 5000 }) {
  const Icon = ICONS[type] || ICONS.info;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose?.(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} className="toast-icon" style={{ color: `var(--color-${type === 'info' ? 'primary' : type})` }} />
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
