import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', size = 20, className = '' }) {
  return (
    <div className={`center-spinner ${className}`}>
      <Loader2 size={size} className="spin" style={{ color: 'var(--color-primary)' }} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}

export function InlineSpinner({ size = 16 }) {
  return <Loader2 size={size} className="spin" style={{ color: 'var(--color-primary)' }} />;
}
