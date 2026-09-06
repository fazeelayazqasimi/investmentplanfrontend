import { AlertCircle } from 'lucide-react';

export default function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="error-box">
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}
